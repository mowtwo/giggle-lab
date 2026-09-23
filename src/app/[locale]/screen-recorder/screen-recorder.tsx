"use client";

import { Button, Card, Cursor, Icon, Switch } from "animal-island-ui";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { LocaleSwitch } from "@/components/locale-switch";

import { openCapture, pickRecorderMime, screenCaptureSupport, SegmentRecorder } from "./capture";
import {
  RECORDING_SOURCE,
  captureCover,
  captureCoverFromVideo,
  concatFlvToMp4,
  transcodeSegmentToFlv,
} from "./compose";
import {
  createComposeQueue,
  dropCompose,
  enqueueCompose,
  finishCompose,
  hasPendingCompose,
  prioritizeCompose,
  type ComposeQueueState,
} from "./compose-queue";
import { buildRecordingZip } from "./export-zip";
import { FlvPreview } from "./flv-preview";
import {
  classifyProject,
  idsNeedingCompose,
  type ProjectHealth,
  type ProjectInspection,
} from "./project-health";
import { isProjectLocked, lockedProjectId } from "./recording-lock";
import {
  ffmpegUsesThreads,
  interruptFfmpeg,
  loadFfmpeg,
  setFfmpegProgressListener,
} from "./ffmpeg-runner";
import { ByteLimitError, formatBytes, readStorageEstimate } from "./limits";
import {
  diskOfferAvailable,
  enableDiskStore,
  rememberStorageDeclined,
  restoreStore,
  storageWasDeclined,
  type RecordingStore,
  type StoreSession,
} from "./storage";
import {
  segmentFileName,
  type ProjectManifest,
  type StorageTier,
} from "./types";

type Phase = "idle" | "recording" | "saving" | "ready";
type CaptureSupport = "unknown" | "ok" | "phone" | "missing" | "wasm";

export function ScreenRecorder() {
  const t = useTranslations("ScreenRecorder");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [session, setSession] = useState<StoreSession | null>(null);
  const [projects, setProjects] = useState<ProjectManifest[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [composeQueue, setComposeQueue] = useState<ComposeQueueState>(createComposeQueue);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());
  const [health, setHealth] = useState<Record<string, ProjectHealth>>({});
  const [flvUrls, setFlvUrls] = useState<string[]>([]);
  const [flvIndex, setFlvIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [mic, setMic] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [usedBytes, setUsedBytes] = useState(0);
  const [flvCount, setFlvCount] = useState(0);
  const [capturedCount, setCapturedCount] = useState(0);
  const [composeProgress, setComposeProgress] = useState<{ id: string; ratio: number } | null>(null);
  const [coverActiveId, setCoverActiveId] = useState<string | null>(null);
  const [coverFailedIds, setCoverFailedIds] = useState<Set<string>>(new Set());
  const [coverEpoch, setCoverEpoch] = useState(0);
  const [coverPriorityId, setCoverPriorityId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [support, setSupport] = useState<CaptureSupport>("unknown");
  const [declined, setDeclined] = useState(false);
  const [originUsage, setOriginUsage] = useState<{
    usage: number | null;
    quota: number | null;
  }>({ usage: null, quota: null });
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureStop = useRef<(() => void) | null>(null);
  const recorderRef = useRef<SegmentRecorder | null>(null);
  const storeRef = useRef<RecordingStore | null>(null);
  const sessionRef = useRef<StoreSession | null>(null);
  const manifestRef = useRef<ProjectManifest | null>(null);
  const saveChain = useRef(Promise.resolve());
  const pending = useRef(0);
  const stopRequested = useRef(false);
  const finalizeOnce = useRef(false);
  const usedRef = useRef(0);
  const previewRef = useRef<string | null>(null);
  const coverBusy = useRef(false);
  const coverPriorityRef = useRef<string | null>(null);
  const composeQueueRef = useRef(composeQueue);
  const pumping = useRef(false);
  const pumpRef = useRef<() => Promise<void>>(async () => undefined);
  const projectsRef = useRef(projects);
  const phaseRef = useRef(phase);
  const recordingIdRef = useRef<string | null>(null);
  const brokenIdsRef = useRef(brokenIds);
  const composingId = useRef<string | null>(null);
  useEffect(() => {
    composeQueueRef.current = composeQueue;
    projectsRef.current = projects;
    phaseRef.current = phase;
    recordingIdRef.current = recordingId;
    brokenIdsRef.current = brokenIds;
  });

  const refreshProjects = useCallback(async (store: RecordingStore) => {
    setProjects(await store.listProjects());
  }, []);

  const applySession = useCallback(
    (next: StoreSession) => {
      storeRef.current = next.store;
      sessionRef.current = next;
      setSession(next);
      void refreshProjects(next.store);
      void readStorageEstimate().then(setOriginUsage);
    },
    [refreshProjects],
  );

  useEffect(() => {
    // Device APIs are only available after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupport(screenCaptureSupport());
  }, []);

  useEffect(() => {
    if (support !== "ok") return;
    if (window.crossOriginIsolated) return;
    const key = "screen-recorder:isolation-reload";
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }, [support]);

  useEffect(() => {
    if (support !== "ok") return;
    let cancelled = false;
    void restoreStore().then((next) => {
      if (!cancelled) {
        applySession(next);
        setDeclined(storageWasDeclined());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [applySession, support]);

  useEffect(() => {
    if (phase !== "recording") return;
    const started = performance.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((performance.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    let cancelled = false;
    const created: string[] = [];
    void (async () => {
      const next: Record<string, string> = {};
      for (const project of projects) {
        if (!project.coverBytes) continue;
        try {
          const blob = await store.readBytes(project.id, "cover.jpg");
          const url = URL.createObjectURL(blob);
          created.push(url);
          next[project.id] = url;
        } catch {
          // The cover file can lag behind the manifest.
        }
      }
      if (cancelled) {
        created.forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      setCovers((previous) => {
        for (const url of Object.values(previous)) URL.revokeObjectURL(url);
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [projects]);

  const coverCandidate = (item: ProjectManifest) =>
    !item.coverBytes &&
    !coverFailedIds.has(item.id) &&
    !brokenIds.has(item.id) &&
    (health[item.id] === "needs-compose" || health[item.id] === "ready");
  const priorityCover = coverPriorityId
    ? projects.find((item) => item.id === coverPriorityId && coverCandidate(item))
    : undefined;
  const coverTargetId =
    support !== "ok" || phase === "recording" || phase === "saving"
      ? null
      : priorityCover
        ? priorityCover.id
        : composeQueue.current
          ? null
          : (projects.find(coverCandidate)?.id ?? null);

  useEffect(() => {
    if (!coverTargetId || coverBusy.current) return;
    const store = storeRef.current;
    const project = projectsRef.current.find((item) => item.id === coverTargetId);
    if (!store || !project) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || coverBusy.current) return;
      coverBusy.current = true;
      void (async () => {
        let saved = false;
        try {
          if (brokenIdsRef.current.has(project.id)) return;
          const part = [...project.flvParts].sort((a, b) => a.index - b.index)[0];
          const mp4 = project.outputMp4Bytes ? "output/recording.mp4" : null;
          const flv = part ? `flv/${part.name}` : null;
          if (!mp4 && !flv) throw new Error("no-source");
          const media = await store.readBytes(project.id, mp4 ?? flv ?? "");
          if (cancelled || brokenIdsRef.current.has(project.id)) return;
          setCoverActiveId(project.id);
          const blob = mp4
            ? await captureCoverFromVideo(media).catch(async (error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") throw error;
                const jpeg = await captureCoverWithTimeout(media, "mp4");
                return new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" });
              })
            : new Blob(
                [new Uint8Array(await captureCoverWithTimeout(media, "flv"))],
                { type: "image/jpeg" },
              );
          if (cancelled || brokenIdsRef.current.has(project.id)) return;
          await store.writeBytes(project.id, "cover.jpg", blob);
          const latest = (await store.listProjects()).find((item) => item.id === project.id);
          if (!latest) return;
          await store.saveManifest({ ...latest, coverBytes: blob.size });
          saved = true;
          await refreshProjects(store);
        } catch (error) {
          const aborted = error instanceof DOMException && error.name === "AbortError";
          if (!aborted) {
            setCoverFailedIds((current) => new Set(current).add(project.id));
          }
        } finally {
          coverBusy.current = false;
          setCoverActiveId((current) => (current === project.id ? null : current));
          if (coverPriorityRef.current === project.id) {
            coverPriorityRef.current = null;
            setCoverPriorityId(null);
          }
          if (!saved) setCoverEpoch((epoch) => epoch + 1);
          void pumpRef.current();
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [coverEpoch, coverTargetId, refreshProjects]);

  useEffect(() => {
    if (support !== "ok") return;
    const store = storeRef.current;
    if (!store) return;
    let cancelled = false;
    void (async () => {
      const inspected = new Map<string, ProjectInspection>();
      const broken = new Set<string>();
      const nextHealth: Record<string, ProjectHealth> = {};
      const liveId = lockedProjectId(phaseRef.current, recordingIdRef.current);
      for (const project of projects) {
        if (project.id === liveId) continue;
        let readableFlvCount = 0;
        for (const part of project.flvParts) {
          try {
            const blob = await store.readBytes(project.id, `flv/${part.name}`);
            if (blob.size > 0 && blob.size === part.bytes) readableFlvCount += 1;
          } catch {
            // A listed FLV that cannot be read does not count.
          }
        }
        let mp4Readable = false;
        if (project.outputMp4Bytes) {
          try {
            const blob = await store.readBytes(project.id, "output/recording.mp4");
            mp4Readable = blob.size > 0 && blob.size === project.outputMp4Bytes;
          } catch {
            mp4Readable = false;
          }
        }
        const found = { readableFlvCount, mp4Readable };
        inspected.set(project.id, found);
        const status = classifyProject(project, readableFlvCount, mp4Readable);
        nextHealth[project.id] = status;
        if (status === "broken") broken.add(project.id);
      }
      if (cancelled) return;
      brokenIdsRef.current = broken;
      setBrokenIds(broken);
      setHealth(nextHealth);
      const pending = idsNeedingCompose(
        projects.filter((project) => project.id !== liveId),
        (id) => inspected.get(id) ?? { readableFlvCount: 0, mp4Readable: false },
      );
      const previous = composeQueueRef.current.current;
      const blocked = new Set(broken);
      if (liveId) blocked.add(liveId);
      const next = enqueueCompose(dropCompose(composeQueueRef.current, blocked), pending);
      if (next !== composeQueueRef.current) {
        composeQueueRef.current = next;
        setComposeQueue(next);
      }
      if (previous && broken.has(previous) && composingId.current === previous) interruptFfmpeg();
      if (composeQueueRef.current.current && phaseRef.current !== "recording") {
        void pumpRef.current();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projects, recordingId, support]);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!hasPendingCompose(composeQueueRef.current) && phaseRef.current !== "saving") return;
      event.preventDefault();
      event.returnValue = t("leaveWhileComposing");
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [t]);

  const setPreview = (url: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    const video = videoRef.current;
    if (video && phase !== "recording") {
      video.src = url ?? "";
    }
  };

  const commitManifest = (
    mutate: (current: ProjectManifest) => ProjectManifest,
  ) => {
    const store = storeRef.current;
    saveChain.current = saveChain.current.then(async () => {
      const current = manifestRef.current;
      if (!current || !store) return;
      const next = mutate(current);
      manifestRef.current = next;
      await store.saveManifest(next);
      setFlvCount(next.flvParts.length);
    });
    return saveChain.current;
  };

  const home = () => {
    window.location.assign(locale === "en" ? "/en" : "/");
  };

  const enableDisk = async () => {
    setError(null);
    setBusy(true);
    try {
      applySession(await enableDiskStore());
      setDeclined(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        rememberStorageDeclined();
        setDeclined(true);
        return;
      }
      rememberStorageDeclined();
      setDeclined(true);
      setError(err instanceof Error && err.message === "denied" ? t("denied") : t("enableFailed"));
    } finally {
      setBusy(false);
    }
  };

  const finalize = async () => {
    if (finalizeOnce.current) return;
    finalizeOnce.current = true;
    const store = storeRef.current;
    const manifest = manifestRef.current;
    if (!store || !manifest) {
      recordingIdRef.current = null;
      setRecordingId(null);
      setPhase("idle");
      return;
    }
    setPhase("saving");
    setStatus(t("saving"));
    try {
      await saveChain.current;
      recordingIdRef.current = null;
      setRecordingId(null);
      setPhase("ready");
      await refreshProjects(store);
      if (manifest.flvParts.length === 0) {
        setError(t("projectBroken"));
      } else {
        setStatus(t("projectNeedsCompose"));
      }
    } catch (err) {
      recordingIdRef.current = null;
      setRecordingId(null);
      setError(err instanceof Error ? err.message : t("composeFailed"));
      setPhase("ready");
    }
  };

  const onSegment = (index: number, blob: Blob) => {
    const store = storeRef.current;
    const manifest = manifestRef.current;
    if (!store || !manifest) return;
    pending.current += 1;
    setCapturedCount((count) => count + 1);
    void (async () => {
      try {
        setStatus(t("transcoding"));
        const flv = await transcodeSegmentToFlv(blob);
        const flvName = segmentFileName(index, "flv");
        const flvBlob = new Blob([flv.buffer as ArrayBuffer], { type: "video/x-flv" });
        const limit = sessionRef.current?.byteLimit;
        if (
          sessionRef.current?.limited &&
          limit !== null &&
          limit !== undefined &&
          usedRef.current + flvBlob.size > limit
        ) {
          stopRequested.current = true;
          recorderRef.current?.stop();
          setError(t("limitHit", { limit: formatBytes(limit) }));
          return;
        }
        const flvBytes = await store.writeBytes(
          manifest.id,
          `flv/${flvName}`,
          flvBlob,
        );
        usedRef.current += flvBytes;
        setUsedBytes(usedRef.current);
        await commitManifest((current) => ({
          ...current,
          flvParts: [...current.flvParts, { index, name: flvName, bytes: flvBytes }],
        }));
        setThreads(ffmpegUsesThreads());
      } catch (err) {
        if (err instanceof ByteLimitError) {
          setError(t("limitHit", { limit: formatBytes(err.limit) }));
          stopRequested.current = true;
          recorderRef.current?.stop();
        } else {
          setError(err instanceof Error ? err.message : t("composeFailed"));
        }
      } finally {
        pending.current -= 1;
        if (stopRequested.current && pending.current === 0) void finalize();
      }
    })();
  };

  const start = async () => {
    if (screenCaptureSupport() !== "ok") return;
    if (!storeRef.current || phase === "recording") return;
    setError(null);
    setPreview(null);
    setPreviewTitle(null);
    if (
      sessionRef.current?.limited &&
      diskOfferAvailable() &&
      !storageWasDeclined()
    ) {
      try {
        applySession(await enableDiskStore());
        setDeclined(false);
      } catch (err) {
        rememberStorageDeclined();
        setDeclined(true);
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(
            err instanceof Error && err.message === "denied"
              ? t("denied")
              : t("storageSkipped"),
          );
        }
      }
    }
    const store = storeRef.current;
    if (!store) return;
    setBusy(true);
    setStatus(t("ffmpegLoading"));
    try {
      await loadFfmpeg();
    } catch {
      setSupport("wasm");
      setPhase("idle");
      setBusy(false);
      return;
    }
    try {
      setThreads(ffmpegUsesThreads());
      const capture = await openCapture(mic);
      captureStop.current = capture.stop;
      const mimeType = pickRecorderMime();
      const project = await store.createProject(
        t("projectTitle", { time: new Date().toLocaleString() }),
        mimeType || "video/webm",
      );
      manifestRef.current = project;
      usedRef.current = 0;
      pending.current = 0;
      stopRequested.current = false;
      finalizeOnce.current = false;
      setUsedBytes(0);
      setFlvCount(0);
      setCapturedCount(0);
      setElapsed(0);
      const video = videoRef.current;
      if (video) video.srcObject = capture.stream;
      const recorder = new SegmentRecorder(capture.stream, mimeType, onSegment);
      recorderRef.current = recorder;
      capture.stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        stop();
      });
      recorder.start();
      recordingIdRef.current = project.id;
      setRecordingId(project.id);
      setPhase("recording");
      setStatus(t("recording"));
      await refreshProjects(store);
    } catch (err) {
      captureStop.current?.();
      captureStop.current = null;
      recordingIdRef.current = null;
      setRecordingId(null);
      setError(err instanceof Error ? err.message : t("captureFailed"));
      setPhase("idle");
    } finally {
      setBusy(false);
    }
  };

  const stop = () => {
    if (stopRequested.current && phase !== "recording") return;
    stopRequested.current = true;
    recorderRef.current?.stop();
    captureStop.current?.();
    captureStop.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setPhase("saving");
    setStatus(t("saving"));
    if (pending.current === 0) void finalize();
  };

  const downloadMp4 = async (project: ProjectManifest) => {
    if (isProjectLocked(phaseRef.current, recordingIdRef.current, project.id)) return;
    const store = storeRef.current;
    if (!store || !project.outputMp4Bytes) return;
    const blob = await store.readBytes(project.id, "output/recording.mp4");
    downloadBlob(blob, `${project.title}.mp4`);
  };

  const exportZip = async (project: ProjectManifest) => {
    if (isProjectLocked(phaseRef.current, recordingIdRef.current, project.id)) return;
    const store = storeRef.current;
    if (!store || project.flvParts.length === 0) return;
    setBusy(true);
    setError(null);
    setStatus(t("exportingZip"));
    try {
      const blob = await buildRecordingZip(store, project);
      downloadBlob(blob, `${project.title}.zip`);
      setStatus(t("zipReady"));
    } catch (err) {
      setError(err instanceof Error && err.message === "no-flv" ? t("zipEmpty") : t("zipFailed"));
    } finally {
      setBusy(false);
    }
  };

  const markBroken = useCallback((projectId: string) => {
    const broken = new Set(brokenIdsRef.current);
    broken.add(projectId);
    brokenIdsRef.current = broken;
    setBrokenIds(broken);
    setHealth((current) => ({ ...current, [projectId]: "broken" }));
    const wasComposing = composingId.current === projectId;
    const next = dropCompose(composeQueueRef.current, broken);
    if (next !== composeQueueRef.current) {
      composeQueueRef.current = next;
      setComposeQueue(next);
    }
    if (wasComposing) interruptFfmpeg();
    if (!pumping.current && composeQueueRef.current.current && phaseRef.current !== "recording") {
      void pumpRef.current();
    }
  }, []);

  const damageProject = useCallback(async (project: ProjectManifest) => {
    if (isProjectLocked(phaseRef.current, recordingIdRef.current, project.id)) return;
    const store = storeRef.current;
    if (store && !project.damaged) {
      try {
        await store.saveManifest({ ...project, damaged: true, updatedAt: Date.now() });
        await refreshProjects(store);
      } catch {
        // This session still treats the project as unusable.
      }
    }
    markBroken(project.id);
  }, [markBroken, refreshProjects]);

  const openProject = async (project: ProjectManifest) => {
    if (isProjectLocked(phaseRef.current, recordingIdRef.current, project.id)) return;
    const store = storeRef.current;
    setPreviewTitle(project.title);
    if (!store || brokenIds.has(project.id)) {
      setError(t("projectBroken"));
      return;
    }
    if (project.flvParts.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const part of [...project.flvParts].sort((a, b) => a.index - b.index)) {
        try {
          const blob = await store.readBytes(project.id, `flv/${part.name}`);
          if (blob.size > 0 && blob.size === part.bytes) urls.push(URL.createObjectURL(blob));
        } catch {
          // A listed FLV that cannot be read makes the whole project unusable.
        }
      }
      if (urls.length !== project.flvParts.length) {
        urls.forEach((url) => URL.revokeObjectURL(url));
        await damageProject(project);
        setError(t("projectBroken"));
        return;
      }
      setFlvUrls((previous) => {
        previous.forEach((url) => URL.revokeObjectURL(url));
        return urls;
      });
      setFlvIndex(0);
    } finally {
      setBusy(false);
    }
  };

  const focusCompose = (projectId: string) => {
    if (isProjectLocked(phaseRef.current, recordingIdRef.current, projectId)) return;
    if (brokenIds.has(projectId) || health[projectId] !== "needs-compose") return;
    const next = prioritizeCompose(composeQueueRef.current, projectId);
    if (next === composeQueueRef.current) return;
    composeQueueRef.current = next;
    setComposeQueue(next);
    interruptFfmpeg();
    void pumpRef.current();
  };

  const focusCover = (projectId: string) => {
    if (isProjectLocked(phaseRef.current, recordingIdRef.current, projectId)) return;
    if (brokenIds.has(projectId)) return;
    const project = projects.find((item) => item.id === projectId);
    if (!project || project.coverBytes) return;
    if (health[projectId] !== "needs-compose" && health[projectId] !== "ready") return;
    setCoverFailedIds((current) => {
      if (!current.has(projectId)) return current;
      const next = new Set(current);
      next.delete(projectId);
      return next;
    });
    coverPriorityRef.current = projectId;
    setCoverPriorityId(projectId);
    interruptFfmpeg();
    setCoverEpoch((epoch) => epoch + 1);
  };

  useEffect(() => {
    pumpRef.current = async () => {
    if (pumping.current) return;
    pumping.current = true;
    try {
      while (composeQueueRef.current.current && phaseRef.current !== "recording" && !coverPriorityRef.current) {
        const generation = composeQueueRef.current.generation;
        const id = composeQueueRef.current.current;
        if (isProjectLocked(phaseRef.current, recordingIdRef.current, id)) {
          const skipped = dropCompose(composeQueueRef.current, new Set([id]));
          composeQueueRef.current = skipped;
          setComposeQueue(skipped);
          continue;
        }
        if (brokenIdsRef.current.has(id)) {
          const skipped = dropCompose(composeQueueRef.current, new Set([id]));
          composeQueueRef.current = skipped;
          setComposeQueue(skipped);
          continue;
        }
        const store = storeRef.current;
        const project = projectsRef.current.find((item) => item.id === id);
        try {
          if (!store || !project || project.damaged) {
            if (project) await damageProject(project);
            else {
              const skipped = finishCompose(composeQueueRef.current, generation);
              composeQueueRef.current = skipped;
              setComposeQueue(skipped);
            }
            continue;
          }
          const parts: Uint8Array[] = [];
          let flvMatches = true;
          for (const part of [...project.flvParts].sort((a, b) => a.index - b.index)) {
            try {
              const blob = await store.readBytes(project.id, `flv/${part.name}`);
              if (blob.size <= 0 || blob.size !== part.bytes) {
                flvMatches = false;
                break;
              }
              parts.push(new Uint8Array(await blob.arrayBuffer()));
            } catch {
              flvMatches = false;
              break;
            }
          }
          if (!flvMatches || parts.length !== project.flvParts.length) {
            await damageProject(project);
            continue;
          }
          if (
            brokenIdsRef.current.has(id) ||
            composeQueueRef.current.generation !== generation ||
            composeQueueRef.current.current !== id
          ) {
            continue;
          }
          setStatus(t("projectComposing", { title: project.title }));
          setComposeProgress({ id, ratio: 0 });
          let progressAt = 0;
          setFfmpegProgressListener((ratio) => {
            const now = performance.now();
            if (ratio < 1 && now - progressAt < 200) return;
            progressAt = now;
            setComposeProgress({ id, ratio });
          });
          composingId.current = id;
          const mp4 = await concatFlvToMp4(parts);
          if (composingId.current === id) composingId.current = null;
          setFfmpegProgressListener(null);
          if (
            brokenIdsRef.current.has(id) ||
            composeQueueRef.current.generation !== generation ||
            composeQueueRef.current.current !== id
          ) {
            continue;
          }
          const mp4Blob = new Blob([mp4.buffer as ArrayBuffer], { type: "video/mp4" });
          await store.writeBytes(project.id, "output/recording.mp4", mp4Blob);
          const latest = (await store.listProjects()).find((item) => item.id === id) ?? project;
          await store.saveManifest({
            ...latest,
            outputMp4Bytes: mp4Blob.size,
            damaged: false,
            source: { ...RECORDING_SOURCE },
          });
          await refreshProjects(store);
          setThreads(ffmpegUsesThreads());
          const done = finishCompose(composeQueueRef.current, generation);
          composeQueueRef.current = done;
          setComposeQueue(done);
          setComposeProgress(null);
          if (!composeQueueRef.current.current) setStatus(t("ready"));
        } catch (error) {
          if (composingId.current === id) composingId.current = null;
          setFfmpegProgressListener(null);
          setComposeProgress(null);
          if (error instanceof DOMException && error.name === "AbortError") continue;
          if (project) await damageProject(project);
          setError(error instanceof Error ? error.message : t("composeFailed"));
        }
      }
    } finally {
      pumping.current = false;
    }
  };
  }, [damageProject, refreshProjects, t]);

  const removeProject = async (project: ProjectManifest) => {
    if (isProjectLocked(phaseRef.current, recordingIdRef.current, project.id)) return;
    const store = storeRef.current;
    if (!store) return;
    await store.deleteProject(project.id);
    await refreshProjects(store);
  };

  const tierLabel = (tier: StorageTier) => {
    if (tier === "directory") return t("tierDirectory");
    if (tier === "opfs") return t("tierOpfs");
    if (tier === "indexeddb") return t("tierIndexedDb");
    return t("tierMemory");
  };

  return (
    <Cursor>
      <main className="min-h-svh px-5 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Button type="default" onClick={home}>
            {tCommon("backToShelf")}
          </Button>
          <LocaleSwitch />
        </div>
        {error ? (
          <div
            role="alert"
            className="mx-auto mt-4 flex max-w-6xl items-start justify-between gap-4 rounded-2xl bg-[#9d3a2f] px-4 py-3 text-base font-black text-white"
          >
            <p>{error}</p>
            <button type="button" className="cursor-pointer underline" onClick={() => setError(null)}>
              {t("dismissError")}
            </button>
          </div>
        ) : null}
        {brokenIds.size > 0 ? (
          <div
            role="alert"
            className="mx-auto mt-4 max-w-6xl rounded-2xl bg-[#fff4e8] px-4 py-3 text-sm font-bold leading-6 text-[#9d3a2f]"
          >
            <p className="font-black">{t("brokenBanner")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {projects.filter((project) => brokenIds.has(project.id) && !isProjectLocked(phase, recordingId, project.id)).map((project) => (
                <Button key={project.id} type="default" onClick={() => void removeProject(project)}>
                  {t("deleteBroken", { title: project.title })}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <section className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
          {support !== "ok" ? (
            <Card type="default" color="app-red" className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <Icon name="icon-camera" size={64} bounce />
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-[#9d3a2f]">
                    {t("tag")}
                  </p>
                  <h1 className="text-3xl font-black text-[#794f27]">{t("title")}</h1>
                </div>
              </div>
              <p className="text-sm font-bold leading-6 text-[#9d3a2f]">
                {support === "unknown"
                  ? t("checking")
                  : support === "phone"
                    ? t("phoneBody")
                    : support === "wasm"
                      ? t("wasmBody")
                      : t("missingApi")}
              </p>
            </Card>
          ) : (
          <Card type="default" color="app-red" className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              <Icon name="icon-camera" size={64} bounce />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.12em] text-[#9d3a2f]">
                  {t("tag")}
                </p>
                <h1 className="text-3xl font-black text-[#794f27]">{t("title")}</h1>
              </div>
            </div>
            <p className="text-sm font-bold leading-6 text-[#725d42]">{t("description")}</p>
            {session ? (
              <div className="space-y-2 rounded-xl bg-[#fffdf2] p-3 text-sm font-bold leading-6 text-[#725d42]">
                <p className="font-black text-[#794f27]">
                  {t("storageLabel")}: {tierLabel(session.tier)}
                  {session.syncWrite ? ` · ${t("syncWrite")}` : ""}
                </p>
                <p>{t("privacyNeverUpload")}</p>
                <p>{t(privacyKey(session.tier))}</p>
                <p>
                  {t("storedBytes", {
                    size: formatBytes(
                      phase === "recording" || phase === "saving"
                        ? storedBytes(projects) + usedBytes
                        : storedBytes(projects),
                    ),
                  })}
                </p>
                {originUsage.quota !== null && originUsage.usage !== null ? (
                  <p>
                    {t("originUsage", {
                      usage: formatBytes(originUsage.usage),
                      quota: formatBytes(originUsage.quota),
                    })}
                  </p>
                ) : null}
              </div>
            ) : null}
            <p className="text-sm font-bold text-[#725d42]">
              {threads === null
                ? t("ffmpegPending")
                : threads
                  ? t("ffmpegMulti")
                  : t("ffmpegSingle")}
            </p>
            {session?.limited ? (
              <p className="rounded-xl bg-[#fff4e8] p-3 text-sm font-bold leading-6 text-[#9d3a2f]">
                {t("limitedBody", {
                  limit: formatBytes(session.byteLimit ?? 0),
                })}{" "}
                {t("oneFile")}
              </p>
            ) : null}
            {session?.limited && declined && diskOfferAvailable() ? (
              <div className="space-y-2">
                <p className="text-sm font-bold leading-6 text-[#9d3a2f]">{t("declinedBody")}</p>
                <Button type="dashed" onClick={() => void enableDisk()} disabled={busy || phase === "recording" || phase === "saving"}>
                  {t("reopenStorage")}
                </Button>
              </div>
            ) : null}
            {session && !session.persisted && session.tier === "opfs" ? (
              <p className="text-sm font-bold text-[#9d3a2f]">{t("persistWarning")}</p>
            ) : null}
            {session?.tier === "memory" ? (
              <p className="text-sm font-bold text-[#9d3a2f]">{t("memoryWarning")}</p>
            ) : null}
            <label className="flex items-center gap-2 text-sm font-black text-[#7a6141]">
              <Switch size="small" checked={mic} onChange={setMic} />
              {t("mic")}
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="primary"
                onClick={() => void start()}
                disabled={phase === "recording" || phase === "saving" || busy || !session}
              >
                {t("start")}
              </Button>
              <Button type="default" onClick={stop} disabled={phase !== "recording"}>
                {t("stop")}
              </Button>
            </div>
            <p className="text-sm font-bold text-[#725d42]">
              {status || t("idle")} · {formatClock(elapsed)} · {formatBytes(usedBytes)} · {phase === "recording" || phase === "saving"
                ? t("flvProgress", { done: flvCount, total: capturedCount })
                : t("flvCount", { count: flvCount })}
            </p>
          </Card>
          )}

          {support === "ok" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-black text-[#794f27]">
                {phase === "recording"
                  ? t("previewLive")
                  : previewTitle
                    ? t("previewing", { title: previewTitle })
                    : t("previewEmpty")}
              </p>
              {flvUrls.length > 1 ? (
                <p className="text-xs font-bold text-[#9f927d]">
                  {t("previewPart", { index: flvIndex + 1, total: flvUrls.length })}
                </p>
              ) : null}
              {phase === "recording" || flvUrls.length === 0 ? (
                <video
                  ref={videoRef}
                  className="aspect-video w-full rounded-2xl bg-black object-contain"
                  autoPlay
                  muted
                  playsInline
                  controls={phase !== "recording"}
                />
              ) : (
                <FlvPreview
                  url={flvUrls[flvIndex] ?? flvUrls[0]}
                  onEnded={() => {
                    setFlvIndex((current) =>
                      current + 1 < flvUrls.length ? current + 1 : current,
                    );
                  }}
                  onError={(message) => setError(message)}
                />
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-black text-[#794f27]">{t("projects")}</p>
                <p className="text-xs font-bold text-[#9f927d]">{t("projectsHint")}</p>
              </div>
              {projects.length === 0 ? (
                <p className="text-sm font-bold text-[#725d42]">{t("emptyProjects")}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {projects.map((project) => {
                    const locked = isProjectLocked(phase, recordingId, project.id);
                    const saving = locked && phase === "saving";
                    return (
                    <article
                      key={project.id}
                      className="overflow-hidden rounded-2xl bg-[#fffdf2] shadow-[0_3px_0_rgba(122,97,65,0.16)]"
                    >
                      <button
                        type="button"
                        className={`block w-full text-left ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
                        disabled={locked}
                        onClick={() => void openProject(project)}
                      >
                        <div className="relative aspect-video bg-[#24180f]">
                          {covers[project.id] && !locked ? (
                            // Blob covers are local files, not remote images.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={covers[project.id]}
                              alt={project.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full place-items-center px-4 text-center text-xs font-bold text-[#f3ead2]">
                              {saving
                                ? t("projectSaving")
                                : locked
                                  ? t("projectRecording")
                                  : brokenIds.has(project.id)
                                    ? t("projectBroken")
                                    : coverActiveId === project.id
                                      ? t("coverShooting")
                                      : coverFailedIds.has(project.id)
                                        ? t("coverFailed")
                                        : health[project.id] === "needs-compose" || health[project.id] === "ready"
                                          ? t("coverPending")
                                          : t("projectChecking")}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 p-3">
                          <p className="font-black text-[#794f27]">{project.title}</p>
                          <p className="text-xs font-black text-[#9d3a2f]">
                            {describeProject(
                              project,
                              composeQueue,
                              brokenIds.has(project.id),
                              saving ? "saving" : locked ? "recording" : null,
                              t,
                            )}
                          </p>
                          <p className="text-xs font-bold text-[#9f927d]">
                            {new Date(project.createdAt).toLocaleString()} · {locked
                              ? t("flvProgress", { done: project.flvParts.length, total: capturedCount })
                              : t("flvCount", { count: project.flvParts.length })} · {formatBytes(project.outputMp4Bytes ?? 0)}
                          </p>
                        </div>
                      </button>
                      <div className="flex flex-wrap gap-2 px-3 pb-3">
                        <Button
                          type="default"
                          disabled={locked || brokenIds.has(project.id) || !project.outputMp4Bytes}
                          onClick={() => void downloadMp4(project)}
                        >
                          {t("downloadMp4")}
                        </Button>
                        {composeQueue.current === project.id ? (
                          <div className="min-w-36 flex-1 space-y-1">
                            <p className="text-xs font-black text-[#9d3a2f]">
                              {t("composeProgress", {
                                percent: Math.round((composeProgress?.id === project.id ? composeProgress.ratio : 0) * 100),
                              })}
                            </p>
                            <div className="h-2 overflow-hidden rounded-full bg-[#f3ead2]">
                              <div
                                className="h-full bg-[#9d3a2f]"
                                style={{
                                  width: `${Math.round((composeProgress?.id === project.id ? composeProgress.ratio : 0) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : health[project.id] === "needs-compose" && !locked ? (
                          <Button type="default" onClick={() => focusCompose(project.id)}>
                            {t("prioritizeCompose")}
                          </Button>
                        ) : null}
                        {!project.coverBytes &&
                        !locked &&
                        !brokenIds.has(project.id) &&
                        coverActiveId !== project.id &&
                        (health[project.id] === "needs-compose" || health[project.id] === "ready") ? (
                          <Button type="default" onClick={() => focusCover(project.id)}>
                            {t("prioritizeCover")}
                          </Button>
                        ) : null}
                        <Button
                          type="dashed"
                          disabled={locked || brokenIds.has(project.id) || project.flvParts.length === 0 || busy}
                          onClick={() => void exportZip(project)}
                        >
                          {t("exportZip")}
                        </Button>
                        <Button type="dashed" disabled={locked} onClick={() => void removeProject(project)}>
                          {t("deleteProject")}
                        </Button>
                      </div>
                    </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          ) : null}
        </section>
      </main>
    </Cursor>
  );
}

const COVER_TIMEOUT_MS = 25_000;

function captureCoverWithTimeout(media: Blob, extension: "flv" | "mp4") {
  return new Promise<Uint8Array>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      interruptFfmpeg();
      reject(new Error("cover-timeout"));
    }, COVER_TIMEOUT_MS);
    captureCover(media, extension).then(
      (value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function projectStatusText(
  project: ProjectManifest,
  queue: ComposeQueueState,
  broken: boolean,
  lock: "recording" | "saving" | null,
) {
  if (lock === "recording") return "recording" as const;
  if (lock === "saving") return "saving" as const;
  if (broken) return "broken" as const;
  if (queue.current === project.id) return "composing" as const;
  const place = queue.waiting.indexOf(project.id);
  if (place >= 0) return "queued" as const;
  if (!project.outputMp4Bytes && project.flvParts.length > 0) return "needs" as const;
  return "ready" as const;
}

function describeProject(
  project: ProjectManifest,
  queue: ComposeQueueState,
  broken: boolean,
  lock: "recording" | "saving" | null,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  const status = projectStatusText(project, queue, broken, lock);
  if (status === "recording") return t("projectRecording");
  if (status === "saving") return t("projectSaving");
  if (status === "broken") return t("projectBroken");
  if (status === "composing") return t("projectComposing", { title: project.title });
  if (status === "queued") {
    return t("projectQueued", { place: queue.waiting.indexOf(project.id) + 1 });
  }
  if (status === "needs") return t("projectNeedsCompose");
  return t("projectReady");
}

function storedBytes(projects: ProjectManifest[]) {
  return projects.reduce((sum, project) => {
    const flv = project.flvParts.reduce((partSum, part) => partSum + part.bytes, 0);
    return sum + flv + (project.outputMp4Bytes ?? 0);
  }, 0);
}

function privacyKey(tier: StorageTier) {
  if (tier === "directory") return "privacyDirectory" as const;
  if (tier === "opfs") return "privacyOpfs" as const;
  if (tier === "indexeddb") return "privacyIndexedDb" as const;
  return "privacyMemory" as const;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
