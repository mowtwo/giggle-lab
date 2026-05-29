"use client";

import { useEffect, useState } from "react";

import type { OfficeFile, PdfExportOptions } from "../lib/types";

type SlideShape = {
  kind: "text" | "image" | "rect";
  text?: string;
  src?: string;
  href?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  fontSize?: number;
  isBackground?: boolean;
};

type Slide = {
  id: string;
  shapes: SlideShape[];
};

type SlideDeck = {
  slides: Slide[];
  width: number;
  height: number;
};

type Relationship = {
  target: string;
  type: string;
};

function parseXml(xml: string) {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function normalizeZipPath(path: string) {
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.join("/");
}

function resolveTarget(ownerPath: string, target: string) {
  if (/^[a-z]+:/i.test(target)) return target;
  if (target.startsWith("/")) return normalizeZipPath(target.slice(1));
  const directory = ownerPath.slice(0, ownerPath.lastIndexOf("/"));
  return normalizeZipPath(`${directory}/${target}`);
}

function emuToPercent(value: string | null, fallback: number, max: number) {
  if (!value) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, (number / max) * 100));
}

function readText(node: Element) {
  return Array.from(node.getElementsByTagName("a:r"))
    .flatMap((run) => Array.from(run.getElementsByTagName("a:t")))
    .map((item) => item.textContent ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function readTransform(node: Element, width: number, height: number) {
  const xfrm = node.getElementsByTagName("a:xfrm")[0];
  const off = xfrm?.getElementsByTagName("a:off")[0];
  const ext = xfrm?.getElementsByTagName("a:ext")[0];

  return {
    x: emuToPercent(off?.getAttribute("x") ?? null, 8, width),
    y: emuToPercent(off?.getAttribute("y") ?? null, 8, height),
    w: emuToPercent(ext?.getAttribute("cx") ?? null, 65, width),
    h: emuToPercent(ext?.getAttribute("cy") ?? null, 18, height),
  };
}

function isPlaceholderNoise(shape: Element, text: string) {
  const placeholder = shape.getElementsByTagName("p:ph")[0];
  const type = placeholder?.getAttribute("type");
  return (
    !text ||
    text === "‹#›" ||
    text === "<#>" ||
    type === "sldNum" ||
    type === "dt" ||
    type === "ftr"
  );
}

function readFontSize(shape: Element) {
  const size = shape.getElementsByTagName("a:rPr")[0]?.getAttribute("sz");
  const number = size ? Number(size) : NaN;
  return Number.isFinite(number) ? Math.max(10, Math.min(96, number / 100)) : undefined;
}

function mediaMime(path: string) {
  if (/\.jpe?g$/i.test(path)) return "image/jpeg";
  if (/\.gif$/i.test(path)) return "image/gif";
  if (/\.webp$/i.test(path)) return "image/webp";
  return "image/png";
}

async function readRelationships(
  zip: { file(path: string): { async(type: "text"): Promise<string> } | null },
  ownerPath: string,
) {
  const directory = ownerPath.slice(0, ownerPath.lastIndexOf("/"));
  const basename = ownerPath.slice(ownerPath.lastIndexOf("/") + 1);
  const relsFile = `${directory}/_rels/${basename}.rels`;
  const xml = await zip.file(relsFile)?.async("text");
  const relationships = new Map<string, Relationship>();
  if (!xml) return relationships;

  const doc = parseXml(xml);
  for (const rel of Array.from(doc.getElementsByTagName("Relationship"))) {
    const id = rel.getAttribute("Id");
    const target = rel.getAttribute("Target");
    const type = rel.getAttribute("Type") ?? "";
    if (!id || !target) continue;
    relationships.set(id, { target: resolveTarget(ownerPath, target), type });
  }
  return relationships;
}

async function fileToDataUrl(
  zip: { file(path: string): { async(type: "base64"): Promise<string> } | null },
  target: string,
) {
  const file = zip.file(target);
  if (!file) return undefined;
  const base64 = await file.async("base64");
  return `data:${mediaMime(target)};base64,${base64}`;
}

async function parseShapeTree(
  zip: {
    file(path: string):
      | { async(type: "base64"): Promise<string>; async(type: "text"): Promise<string> }
      | null;
  },
  doc: Document,
  relationships: Map<string, Relationship>,
  deck: Pick<SlideDeck, "width" | "height">,
  inherited: boolean,
) {
  const shapes: SlideShape[] = [];
  const spTree = doc.getElementsByTagName("p:spTree")[0] ?? doc.documentElement;

  for (const pic of Array.from(spTree.getElementsByTagName("p:pic"))) {
    const transform = readTransform(pic, deck.width, deck.height);
    const blip = pic.getElementsByTagName("a:blip")[0];
    const embedId =
      blip?.getAttribute("r:embed") ?? blip?.getAttribute("embed") ?? undefined;
    const target = embedId ? relationships.get(embedId)?.target : undefined;
    const src = target ? await fileToDataUrl(zip, target) : undefined;
    if (!src) continue;
    shapes.push({
      kind: "image",
      src,
      ...transform,
      isBackground: inherited && transform.w > 95 && transform.h > 95,
    });
  }

  for (const shape of Array.from(spTree.getElementsByTagName("p:sp"))) {
    const text = readText(shape);
    if (isPlaceholderNoise(shape, text)) continue;

    const transform = readTransform(shape, deck.width, deck.height);
    const fill = shape.getElementsByTagName("a:srgbClr")[0]?.getAttribute("val");
    const hlink = shape.getElementsByTagName("a:hlinkClick")[0];
    const hlinkId =
      hlink?.getAttribute("r:id") ?? hlink?.getAttribute("id") ?? undefined;
    const href = hlinkId ? relationships.get(hlinkId)?.target : undefined;

    shapes.push({
      kind: "text",
      text,
      href,
      ...transform,
      fill: fill ? `#${fill}` : undefined,
      fontSize: readFontSize(shape),
    });
  }

  return shapes;
}

async function readPresentationOrder(
  zip: { file(path: string): { async(type: "text"): Promise<string> } | null; files: Record<string, unknown> },
) {
  const presentationXml = await zip.file("ppt/presentation.xml")?.async("text");
  const fallback = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const ai = Number(a.match(/slide(\d+)/)?.[1] ?? 0);
      const bi = Number(b.match(/slide(\d+)/)?.[1] ?? 0);
      return ai - bi;
    });

  if (!presentationXml) {
    return { slideFiles: fallback, width: 9144000, height: 5143500 };
  }

  const presentation = parseXml(presentationXml);
  const size = presentation.getElementsByTagName("p:sldSz")[0];
  const width = Number(size?.getAttribute("cx")) || 9144000;
  const height = Number(size?.getAttribute("cy")) || 5143500;
  const relationships = await readRelationships(zip, "ppt/presentation.xml");
  const slideFiles = Array.from(presentation.getElementsByTagName("p:sldId"))
    .map((slide) => slide.getAttribute("r:id"))
    .map((id) => (id ? relationships.get(id)?.target : undefined))
    .filter((target): target is string => Boolean(target));

  return { slideFiles: slideFiles.length ? slideFiles : fallback, width, height };
}

async function parsePptx(buffer: ArrayBuffer) {
  const [{ default: JSZip }] = await Promise.all([import("jszip")]);
  const zip = await JSZip.loadAsync(buffer.slice(0));
  const { slideFiles, width, height } = await readPresentationOrder(zip);
  const slides: Slide[] = [];

  for (const slideFile of slideFiles.slice(0, 40)) {
    const xml = await zip.file(slideFile)?.async("text");
    if (!xml) continue;
    const relationships = await readRelationships(zip, slideFile);
    const doc = parseXml(xml);
    const layoutPath = Array.from(relationships.values()).find((relationship) =>
      relationship.type.endsWith("/slideLayout"),
    )?.target;
    let layoutShapes: SlideShape[] = [];
    if (layoutPath) {
      const layoutXml = await zip.file(layoutPath)?.async("text");
      if (layoutXml) {
        layoutShapes = await parseShapeTree(
          zip,
          parseXml(layoutXml),
          await readRelationships(zip, layoutPath),
          { width, height },
          true,
        );
      }
    }
    const slideShapes = await parseShapeTree(
      zip,
      doc,
      relationships,
      { width, height },
      false,
    );

    slides.push({ id: slideFile, shapes: [...layoutShapes, ...slideShapes] });
  }

  return { slides, width, height };
}

export function PptxRenderer({
  officeFile,
  options,
  zoom,
  onReady,
}: {
  officeFile: OfficeFile;
  options: PdfExportOptions;
  zoom: number;
  onReady: (info: string) => void;
}) {
  const [deck, setDeck] = useState<SlideDeck>({ slides: [], width: 16, height: 9 });

  useEffect(() => {
    let cancelled = false;

    parsePptx(officeFile.buffer)
      .then((parsed) => {
        if (cancelled) return;
        setDeck(parsed);
        onReady(
          `${parsed.slides.length} PPTX slides parsed with slide layout backgrounds`,
        );
      })
      .catch((error) => {
        if (!cancelled) onReady(error instanceof Error ? error.message : "PPTX parse failed");
      });

    return () => {
      cancelled = true;
    };
  }, [officeFile.buffer, onReady]);

  return (
    <div className="grid gap-4">
      <p className="rounded-lg border-2 border-[#d4c9b4] bg-white/80 p-3 text-sm font-bold text-[#725d42]">
        PPTX preview is a lightweight OOXML renderer. It favors speed and local
        PDF export over full PowerPoint fidelity. Export quality: {options.quality}.
      </p>
      {deck.slides.map((slide, index) => (
        <div
          key={slide.id}
          className="mx-auto grid w-full max-w-4xl gap-2"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          <div
            className="relative overflow-hidden rounded-lg border-4 border-[#794f27] bg-white shadow-[0_3px_0_rgba(122,97,65,0.15)]"
            style={{ aspectRatio: `${deck.width} / ${deck.height}` }}
          >
            {slide.shapes.length === 0 ? (
              <p className="grid h-full place-items-center p-6 text-center text-lg font-black text-[#8a7b66]">
                Slide {index + 1}
              </p>
            ) : null}
            {slide.shapes.map((shape, shapeIndex) => (
              shape.kind === "image" && shape.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={shapeIndex}
                  src={shape.src}
                  alt={`Slide ${index + 1} image ${shapeIndex + 1}`}
                  className="absolute"
                  style={{
                    left: `${shape.x}%`,
                    top: `${shape.y}%`,
                    width: `${shape.w}%`,
                    height: `${shape.h}%`,
                    objectFit: shape.isBackground ? "fill" : "contain",
                  }}
                />
              ) : (
              <div
                key={shapeIndex}
                className="absolute overflow-hidden p-1 font-bold leading-snug text-[#473727]"
                style={{
                  left: `${shape.x}%`,
                  top: `${shape.y}%`,
                  width: `${shape.w}%`,
                  height: `${shape.h}%`,
                  color: shape.fill,
                  fontSize: shape.fontSize ? `${shape.fontSize}px` : undefined,
                }}
              >
                {shape.href ? (
                  <a
                    href={shape.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#087d76] underline decoration-2 underline-offset-2"
                  >
                    {shape.text}
                  </a>
                ) : (
                  shape.text
                )}
              </div>
              )
            ))}
          </div>
          <p className="text-center text-xs font-black text-[#8a7b66]">
            Slide {index + 1}
          </p>
        </div>
      ))}
    </div>
  );
}
