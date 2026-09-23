import { ByteLimitError, resolveByteLimit } from "./limits";
import {
  emptyManifest,
  type ProjectManifest,
  type StorageTier,
} from "./types";

const MODE_KEY = "giggle-screen-recorder:mode";
const DECLINED_KEY = "giggle-screen-recorder:declined";
const DB_NAME = "giggle-screen-recorder";
const DB_VERSION = 1;
const HANDLE_KEY = "directory";
const RECORDINGS_DIR = "giggle-lab.mowtwo.com";

export type RecordingStore = {
  tier: StorageTier;
  limited: boolean;
  byteLimit: number | null;
  syncWrite: boolean;
  listProjects(): Promise<ProjectManifest[]>;
  createProject(title: string, mimeType: string): Promise<ProjectManifest>;
  saveManifest(project: ProjectManifest): Promise<void>;
  writeBytes(projectId: string, relPath: string, data: Blob): Promise<number>;
  readBytes(projectId: string, relPath: string): Promise<Blob>;
  deleteBytes(projectId: string, relPath: string): Promise<void>;
  deleteProject(projectId: string): Promise<void>;
};

export type StoreSession = {
  store: RecordingStore;
  tier: StorageTier;
  limited: boolean;
  byteLimit: number | null;
  syncWrite: boolean;
  persisted: boolean;
};

type PermissionHandle = FileSystemDirectoryHandle & {
  queryPermission?: (descriptor: {
    mode: "readwrite";
  }) => Promise<PermissionState>;
  requestPermission?: (descriptor: {
    mode: "readwrite";
  }) => Promise<PermissionState>;
};

type PickerWindow = Window & {
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: "read" | "readwrite";
    startIn?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";
  }) => Promise<FileSystemDirectoryHandle>;
};

export function diskOfferAvailable() {
  const picker = (window as PickerWindow).showDirectoryPicker;
  return Boolean(picker || navigator.storage?.getDirectory);
}

export function storageWasDeclined() {
  return localStorage.getItem(DECLINED_KEY) === "1";
}

function markStorageDeclined() {
  localStorage.setItem(DECLINED_KEY, "1");
}

function clearStorageDeclined() {
  localStorage.removeItem(DECLINED_KEY);
}

export function rememberStorageDeclined() {
  markStorageDeclined();
}

export async function restoreStore(): Promise<StoreSession> {
  const mode = localStorage.getItem(MODE_KEY);
  if (mode === "directory") {
    const handle = await loadDirectoryHandle();
    if (handle) {
      const permission = await (handle as PermissionHandle).queryPermission?.({
        mode: "readwrite",
      });
      if (permission === "granted") {
        const probe = await canWrite(handle);
        if (probe.ok) return diskSession(handle, "directory", probe.sync, true);
      }
    }
  }
  if (mode === "opfs") {
    try {
      return await openOpfs();
    } catch {
      localStorage.removeItem(MODE_KEY);
    }
  }
  return openLimitedStore();
}

export async function enableDiskStore(): Promise<StoreSession> {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (picker) {
    let handle: FileSystemDirectoryHandle;
    try {
      handle = await picker({
        id: "giggle-screen-recorder",
        mode: "readwrite",
        startIn: "videos",
      });
    } catch (error) {
      if (isAbort(error)) throw error;
      throw error;
    }
    const permission = await (handle as PermissionHandle).requestPermission?.({
      mode: "readwrite",
    });
    if (permission && permission !== "granted") {
      throw new Error("denied");
    }
    const probe = await canWrite(handle);
    if (probe.ok) {
      await saveDirectoryHandle(handle);
      localStorage.setItem(MODE_KEY, "directory");
      clearStorageDeclined();
      return diskSession(handle, "directory", probe.sync, true);
    }
  }
  return openOpfs();
}

async function openOpfs(): Promise<StoreSession> {
  if (!navigator.storage?.getDirectory) throw new Error("unsupported");
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle("giggle-screen-recorder", {
    create: true,
  });
  const probe = await canWrite(dir);
  if (!probe.ok) throw new Error("unsupported");
  let persisted = false;
  try {
    persisted = (await navigator.storage.persist?.()) ?? false;
  } catch {
    persisted = false;
  }
  localStorage.setItem(MODE_KEY, "opfs");
  clearStorageDeclined();
  return diskSession(dir, "opfs", probe.sync, persisted);
}

async function openLimitedStore(): Promise<StoreSession> {
  const byteLimit = await resolveByteLimit();
  try {
    const bucket = await openIdbBucket();
    return {
      store: new BlobStore("indexeddb", byteLimit, bucket),
      tier: "indexeddb",
      limited: true,
      byteLimit,
      syncWrite: false,
      persisted: true,
    };
  } catch {
    return {
      store: new BlobStore("memory", byteLimit, new MemoryBucket()),
      tier: "memory",
      limited: true,
      byteLimit,
      syncWrite: false,
      persisted: false,
    };
  }
}

function diskSession(
  root: FileSystemDirectoryHandle,
  tier: "directory" | "opfs",
  syncWrite: boolean,
  persisted: boolean,
): StoreSession {
  return {
    store: new DiskStore(root, tier, syncWrite),
    tier,
    limited: false,
    byteLimit: null,
    syncWrite,
    persisted,
  };
}

class DiskStore implements RecordingStore {
  limited = false;
  byteLimit = null;

  constructor(
    private readonly root: FileSystemDirectoryHandle,
    readonly tier: "directory" | "opfs",
    readonly syncWrite: boolean,
  ) {}

  async listProjects() {
    const projects = await this.projectsDir(false);
    if (!projects) return [];
    const manifests: ProjectManifest[] = [];
    for await (const { handle } of directoryEntries(projects)) {
      if (handle.kind !== "directory") continue;
      const manifest = await this.readManifest(handle.name);
      if (manifest) manifests.push(manifest);
    }
    return manifests.sort((a, b) => b.createdAt - a.createdAt);
  }

  async createProject(title: string, mimeType: string) {
    const project = emptyManifest(crypto.randomUUID(), title, mimeType);
    await this.saveManifest(project);
    return project;
  }

  async saveManifest(project: ProjectManifest) {
    const next = { ...project, updatedAt: Date.now() };
    await this.writeBytes(
      next.id,
      "manifest.json",
      new Blob([JSON.stringify(next)], { type: "application/json" }),
    );
  }

  async writeBytes(projectId: string, relPath: string, data: Blob) {
    const file = await this.fileHandle(projectId, relPath, true);
    await writeHandle(file, data, this.syncWrite);
    return data.size;
  }

  async readBytes(projectId: string, relPath: string) {
    const file = await this.fileHandle(projectId, relPath, false);
    const blob = await file.getFile();
    return blob;
  }

  async deleteBytes(projectId: string, relPath: string) {
    try {
      const projects = await this.root.getDirectoryHandle(RECORDINGS_DIR);
      let dir = await projects.getDirectoryHandle(projectId);
      const parts = relPath.split("/").filter(Boolean);
      const fileName = parts.pop();
      if (!fileName) return;
      for (const part of parts) {
        dir = await dir.getDirectoryHandle(part);
      }
      await dir.removeEntry(fileName);
    } catch {
      // The intermediate file may already be gone.
    }
  }

  async deleteProject(projectId: string) {
    const projects = await this.projectsDir(false);
    if (!projects) return;
    await projects.removeEntry(projectId, { recursive: true });
  }

  private async readManifest(projectId: string) {
    try {
      const blob = await this.readBytes(projectId, "manifest.json");
      return JSON.parse(await blob.text()) as ProjectManifest;
    } catch {
      return null;
    }
  }

  private async projectsDir(create: boolean) {
    try {
      return await this.root.getDirectoryHandle(RECORDINGS_DIR, { create });
    } catch {
      return null;
    }
  }

  private async fileHandle(
    projectId: string,
    relPath: string,
    create: boolean,
  ) {
    const projects = await this.root.getDirectoryHandle(RECORDINGS_DIR, { create });
    let dir = await projects.getDirectoryHandle(projectId, { create });
    const parts = relPath.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) throw new Error("Missing file name");
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part, { create });
    }
    return dir.getFileHandle(fileName, { create });
  }
}

type BlobBucket = {
  list(): Promise<ProjectManifest[]>;
  put(project: ProjectManifest): Promise<void>;
  putFile(key: string, blob: Blob): Promise<void>;
  getFile(key: string): Promise<Blob>;
  deleteFile(key: string): Promise<void>;
  deleteProject(projectId: string): Promise<void>;
};

class BlobStore implements RecordingStore {
  syncWrite = false;

  constructor(
    readonly tier: "indexeddb" | "memory",
    readonly byteLimit: number | null,
    private readonly bucket: BlobBucket,
  ) {}

  get limited() {
    return true;
  }

  async listProjects() {
    return (await this.bucket.list()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async createProject(title: string, mimeType: string) {
    for (const project of await this.bucket.list()) {
      await this.bucket.deleteProject(project.id);
    }
    const project = emptyManifest(crypto.randomUUID(), title, mimeType);
    await this.bucket.put(project);
    return project;
  }

  async saveManifest(project: ProjectManifest) {
    await this.bucket.put({ ...project, updatedAt: Date.now() });
  }

  async writeBytes(projectId: string, relPath: string, data: Blob) {
    if (relPath.startsWith("flv/") && this.byteLimit !== null) {
      const projects = await this.bucket.list();
      const project = projects.find((item) => item.id === projectId);
      const used = project?.flvParts.reduce((sum, part) => sum + part.bytes, 0) ?? 0;
      if (used + data.size > this.byteLimit) {
        throw new ByteLimitError(this.byteLimit);
      }
    }
    await this.bucket.putFile(`${projectId}/${relPath}`, data);
    return data.size;
  }

  async readBytes(projectId: string, relPath: string) {
    return this.bucket.getFile(`${projectId}/${relPath}`);
  }

  async deleteBytes(projectId: string, relPath: string) {
    await this.bucket.deleteFile(`${projectId}/${relPath}`);
  }

  async deleteProject(projectId: string) {
    await this.bucket.deleteProject(projectId);
  }
}

class MemoryBucket implements BlobBucket {
  private readonly projects = new Map<string, ProjectManifest>();
  private readonly files = new Map<string, Blob>();

  async list() {
    return [...this.projects.values()];
  }

  async put(project: ProjectManifest) {
    this.projects.set(project.id, project);
  }

  async putFile(key: string, blob: Blob) {
    this.files.set(key, blob);
  }

  async getFile(key: string) {
    const blob = this.files.get(key);
    if (!blob) throw new Error("Missing file");
    return blob;
  }

  async deleteFile(key: string) {
    this.files.delete(key);
  }

  async deleteProject(projectId: string) {
    this.projects.delete(projectId);
    for (const key of this.files.keys()) {
      if (key.startsWith(`${projectId}/`)) this.files.delete(key);
    }
  }
}

class IdbBucket implements BlobBucket {
  constructor(private readonly db: IDBDatabase) {}

  list() {
    return idbRequest<ProjectManifest[]>(
      this.db.transaction("projects", "readonly").objectStore("projects").getAll(),
    );
  }

  put(project: ProjectManifest) {
    return idbRequest(
      this.db
        .transaction("projects", "readwrite")
        .objectStore("projects")
        .put(project, project.id),
    ).then(() => undefined);
  }

  putFile(key: string, blob: Blob) {
    return idbRequest(
      this.db.transaction("files", "readwrite").objectStore("files").put(blob, key),
    ).then(() => undefined);
  }

  async getFile(key: string) {
    const blob = await idbRequest<Blob | undefined>(
      this.db.transaction("files", "readonly").objectStore("files").get(key),
    );
    if (!blob) throw new Error("Missing file");
    return blob;
  }

  async deleteFile(key: string) {
    await idbRequest(
      this.db.transaction("files", "readwrite").objectStore("files").delete(key),
    );
  }

  async deleteProject(projectId: string) {
    await idbRequest(
      this.db
        .transaction("projects", "readwrite")
        .objectStore("projects")
        .delete(projectId),
    );
    const keys = await idbRequest<IDBValidKey[]>(
      this.db.transaction("files", "readonly").objectStore("files").getAllKeys(),
    );
    const tx = this.db.transaction("files", "readwrite");
    for (const key of keys) {
      if (String(key).startsWith(`${projectId}/`)) tx.objectStore("files").delete(key);
    }
    await transactionDone(tx);
  }
}

function openIdbBucket() {
  return new Promise<IdbBucket>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects");
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files");
      if (!db.objectStoreNames.contains("handles")) db.createObjectStore("handles");
    };
    request.onsuccess = () => resolve(new IdbBucket(request.result));
    request.onerror = () => reject(request.error ?? new Error("IndexedDB failed"));
  });
}

function idbRequest<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

async function saveDirectoryHandle(handle: FileSystemDirectoryHandle) {
  const db = await openHandleDb();
  await idbRequest(
    db.transaction("handles", "readwrite").objectStore("handles").put(handle, HANDLE_KEY),
  );
}

async function loadDirectoryHandle() {
  try {
    const db = await openHandleDb();
    return await idbRequest<FileSystemDirectoryHandle | undefined>(
      db.transaction("handles", "readonly").objectStore("handles").get(HANDLE_KEY),
    );
  } catch {
    return undefined;
  }
}

function openHandleDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects");
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files");
      if (!db.objectStoreNames.contains("handles")) db.createObjectStore("handles");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB failed"));
  });
}

async function canWrite(root: FileSystemDirectoryHandle) {
  try {
    const handle = await root.getFileHandle(".probe", { create: true });
    const sync = "createSyncAccessHandle" in handle;
    if ("createWritable" in handle) {
      const writable = await handle.createWritable();
      await writable.write(new Blob(["ok"]));
      await writable.close();
    } else if (sync) {
      await writeWithSyncHandle(handle, new TextEncoder().encode("ok"));
    } else {
      return { ok: false, sync: false };
    }
    await root.removeEntry(".probe");
    return { ok: true, sync };
  } catch {
    return { ok: false, sync: false };
  }
}

async function writeHandle(
  handle: FileSystemFileHandle,
  data: Blob,
  allowSync: boolean,
) {
  if ("createWritable" in handle) {
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
    return;
  }
  if (allowSync && "createSyncAccessHandle" in handle) {
    await writeWithSyncHandle(handle, new Uint8Array(await data.arrayBuffer()));
    return;
  }
  throw new Error("unsupported");
}

function writeWithSyncHandle(handle: FileSystemFileHandle, bytes: Uint8Array) {
  const source = `
    self.onmessage = async (event) => {
      try {
        const access = await event.data.handle.createSyncAccessHandle();
        const payload = new Uint8Array(event.data.bytes);
        access.truncate(payload.byteLength);
        try {
          access.write(payload, { at: 0 });
        } catch {
          access.write(payload, 0);
        }
        access.flush();
        access.close();
        self.postMessage({ ok: true });
      } catch (error) {
        self.postMessage({ ok: false, message: String(error) });
      }
    };
  `;
  const worker = new Worker(URL.createObjectURL(new Blob([source], { type: "text/javascript" })));
  const copy = bytes.slice();
  return new Promise<void>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<{ ok: boolean; message?: string }>) => {
      worker.terminate();
      if (event.data.ok) resolve();
      else reject(new Error(event.data.message ?? "sync write failed"));
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error("sync write failed"));
    };
    worker.postMessage({ handle, bytes: copy }, [copy.buffer]);
  });
}

async function* directoryEntries(dir: FileSystemDirectoryHandle) {
  const iterable = dir as FileSystemDirectoryHandle & {
    entries?: () => AsyncIterable<[string, FileSystemHandle]>;
    values?: () => AsyncIterable<FileSystemHandle>;
  };
  if (iterable.entries) {
    for await (const [name, handle] of iterable.entries()) {
      yield { name, handle };
    }
    return;
  }
  if (iterable.values) {
    for await (const handle of iterable.values()) {
      yield { name: handle.name, handle };
    }
  }
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
