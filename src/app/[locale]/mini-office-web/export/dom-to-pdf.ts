import type { PdfExportOptions } from "../lib/types";

function getScale(quality: PdfExportOptions["quality"]) {
  if (quality === "archive") return 2.4;
  if (quality === "print") return 1.8;
  return 1.2;
}

function hasUnsupportedColorFunction(value: string) {
  return /\b(?:oklab|oklch|lab|lch|color)\(/i.test(value);
}

function copySafeColor(
  sourceStyle: CSSStyleDeclaration,
  targetStyle: CSSStyleDeclaration,
  property: "color" | "backgroundColor" | "borderColor" | "outlineColor",
  fallback: string,
) {
  const value = sourceStyle[property];
  targetStyle[property] = hasUnsupportedColorFunction(value) ? fallback : value;
}

function sanitizeForHtml2Canvas(sourceRoot: HTMLElement, clonedRoot: HTMLElement) {
  const sourceElements = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll("*"))];
  const clonedElements = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll("*"))];

  for (let index = 0; index < clonedElements.length; index += 1) {
    const source = sourceElements[index];
    const cloned = clonedElements[index];

    if (!(source instanceof HTMLElement) || !(cloned instanceof HTMLElement)) {
      continue;
    }

    const computed = window.getComputedStyle(source);
    const style = cloned.style;

    copySafeColor(computed, style, "color", "#473727");
    copySafeColor(computed, style, "backgroundColor", "transparent");
    copySafeColor(computed, style, "borderColor", "#d4c9b4");
    copySafeColor(computed, style, "outlineColor", "#d4c9b4");

    if (hasUnsupportedColorFunction(computed.boxShadow)) {
      style.boxShadow = "none";
    }
    if (hasUnsupportedColorFunction(computed.textShadow)) {
      style.textShadow = "none";
    }
    if (hasUnsupportedColorFunction(computed.backgroundImage)) {
      style.backgroundImage = "none";
    }
  }
}

export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions,
) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: getScale(options.quality),
    useCORS: true,
    logging: false,
    onclone: (_, clonedElement) => {
      sanitizeForHtml2Canvas(element, clonedElement as HTMLElement);
    },
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.94);
  const orientation =
    options.orientation === "auto"
      ? canvas.width > canvas.height
        ? "landscape"
        : "portrait"
      : options.orientation;
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: options.paper === "letter" ? "letter" : "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = options.marginMm;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const width = canvas.width * ratio;
  const height = canvas.height * ratio;
  pdf.addImage(
    imgData,
    "JPEG",
    (pageWidth - width) / 2,
    (pageHeight - height) / 2,
    width,
    height,
  );

  return pdf.output("blob");
}
