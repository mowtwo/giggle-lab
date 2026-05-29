# Mini Office Web Development Plan

## Goal

Build a browser-only `mini-office-web` tool that can preview and export PDF from
PDF, DOCX, XLSX, and PPTX files with high practical fidelity, strong mobile
ergonomics, and aggressive dynamic loading.

This is not expected to match Microsoft Office perfectly. The implementation
prioritizes local-only processing, predictable performance, graceful fallback,
and a modular architecture that can be expanded format by format.

## Technical Decisions

- App shell: small React client component; no heavy office libraries in the
  initial route bundle.
- UI: follow the existing Animal Crossing-inspired `animal-island-ui` language
  with warm borders, playful cards, and friendly controls, while keeping this
  tool denser and workbench-like rather than a decorative landing page.
- PDF preview: dynamic `pdfjs-dist`, canvas rendering, page virtualization
  hooks, original PDF pass-through export, and page-range export via `pdf-lib`.
- XLSX preview: dynamic `xlsx`, sheet metadata, formula cached values, virtual
  table rendering, and PDF export through `jspdf`.
- DOCX preview: dynamic `docx-preview` for fidelity, `mammoth` fallback for
  semantic HTML, DOM-to-PDF export through `html2canvas` + `jspdf`.
- PPTX preview: local OOXML ZIP parser using dynamic `jszip`, a basic slide
  renderer for text/image/background shapes, and DOM-to-PDF export.
- Export pipeline: common `exportPreviewToPdf` helper for DOM-based formats,
  plus specialized PDF/XLSX exporters.
- Performance: object URLs, ArrayBuffer reuse, lazy imports, paged rendering,
  scroll-container isolation, table row/window rendering, and mobile-first
  controls.

## Implementation Checklist

- [x] Research format constraints and select pragmatic frontend libraries.
- [x] Install dynamic office dependencies.
- [x] Create this plan and progress log.
- [x] Add localized app listing and route.
- [x] Build office shell: upload, detected file info, mode tabs, configuration.
- [x] Implement shared helpers: file detection, PDF export helpers, worker-like
  task state, status logging.
- [x] Implement PDF renderer and PDF export.
- [x] Implement XLSX renderer and PDF export.
- [x] Implement DOCX renderer and PDF export.
- [x] Implement PPTX basic OOXML renderer and PDF export.
- [x] Add mobile responsive layout and dense desktop controls.
- [ ] Run lint/build and fix regressions.
- [x] Smoke test with generated sample documents where feasible.

## Progress Log

### 2026-05-30

- Selected dependencies:
  - `pdfjs-dist`
  - `xlsx`
  - `docx-preview`
  - `mammoth`
  - `html2canvas`
  - `pdf-lib`
- Constraints recorded:
  - XLSX formulas can reliably display cached results from workbook files.
    Full recalculation would require a formula engine and license review.
  - PPTX is the weakest pure frontend format. Initial support will parse and
    render common text/image/background slides, not animations or full master
    inheritance.
  - DOCX PDF export via browser-rendered HTML is a practical fallback, but exact
    Word pagination is not guaranteed.

### 2026-05-30 Implementation Pass 1

- Added `mini-office-web` route and localized shelf listing.
- Added browser-only upload shell with drag/drop, file detection, export
  settings, status panel, and dynamic renderers.
- Added PDF renderer through `pdfjs-dist` and source PDF export/range copy
  through `pdf-lib`.
- Added XLSX renderer through `xlsx`, showing cached formula results and a
  capped virtual-style preview window.
- Added DOCX renderer through `docx-preview`, with `mammoth` fallback.
- Added PPTX lightweight OOXML renderer using `jszip` for common text shapes.
- Added common DOM-to-PDF export path through `html2canvas` + `jspdf`.
- Added compact Animal Crossing-inspired workbench styling and mobile layout.
- Passed `pnpm lint` and `pnpm build`.
- Smoke-tested generated PDF and XLSX files in Playwright. PDF renders a page;
  XLSX shows cached formula results.

### 2026-05-30 Fix Pass 1

- Fixed a PDF render loop caused by unstable inline `onReady` callbacks from the
  shell into dynamic renderers.
- Narrowed PDF renderer effect dependencies to the file buffer and render
  quality, avoiding full `OfficeFile` object identity churn.
- Reduced XLSX preview work from 220×36 full `sheet_to_json` conversion to an
  80×20 direct cell read window with dense parsing and no style parsing.

### 2026-05-30 Layout Pass

- Reworked `mini-office-web` into a document-viewer layout:
  - Empty state only shows feature introduction plus file picker.
  - Loaded state uses a compact sticky toolbar.
  - Export/settings controls are collapsed behind a settings button.
  - Main viewport is dedicated to document rendering.
  - Added zoom controls for PDF, XLSX, DOCX, and PPTX previews.
- Adjusted DOCX host styles to avoid nested constrained scrolling and preserve
  page-sized document layout better.

### 2026-05-30 Interaction Pass

- Added preview-level click handling:
  - Links open in a new tab.
  - Images open in an in-app dialog.
  - Videos open in an in-app dialog with controls.
- Added PDF link annotation overlays for URL annotations.
- Added XLSX hyperlink rendering for cells with hyperlink metadata.
- Added PPTX image extraction/rendering and basic text hyperlink support.
- Added html2canvas export sanitization for unsupported modern CSS color
  functions such as `oklab`.

### 2026-05-30 PPTX/PDF Fidelity Pass

- Fixed PPTX rendering for files whose visible slide content depends on
  `slideLayout` relationships:
  - Presentation slide order now comes from `ppt/presentation.xml`.
  - Slide dimensions use the actual `p:sldSz` values.
  - Layout images are rendered before slide-local content, fixing template
    background-dependent decks such as `sample-1.pptx`.
  - Slide number/date/footer placeholder noise is filtered.
- Improved PDF rendering for PDFs with non-embedded Chinese fonts:
  - Added public pdf.js CMap and standard font assets.
  - Added a visible text-layer fallback for CJK pages when canvas glyph drawing
    misses text.
  - Hid pdf.js internal `hiddenCanvasElement` so its font-measurement canvas
    does not appear in the lower-left corner.
