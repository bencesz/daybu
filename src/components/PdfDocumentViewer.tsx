"use client";

import { memo, useMemo, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type PdfDocumentViewerProps = {
  file: string;
  title: string;
  loadingLabel: string;
  errorLabel: string;
  className?: string;
  documentClassName?: string;
};

function initialWidth() {
  if (typeof window === "undefined") return 0;
  return Math.max(Math.floor(window.innerWidth - 16), 280);
}

const PdfPage = memo(function PdfPage({
  pageNumber,
  width,
  height,
  pixelRatio,
}: {
  pageNumber: number;
  width: number;
  height: number;
  pixelRatio: number;
}) {
  return (
    <div
      className="flex w-full shrink-0 justify-center"
      style={{ width: "100%", height }}
    >
      <Page
        pageNumber={pageNumber}
        width={width}
        devicePixelRatio={pixelRatio}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={null}
      />
    </div>
  );
});

export function PdfDocumentViewer({
  file,
  title,
  loadingLabel,
  errorLabel,
  className,
  documentClassName,
}: PdfDocumentViewerProps) {
  const [width] = useState(initialWidth);
  const [aspectRatio, setAspectRatio] = useState(1.414);
  const [numPages, setNumPages] = useState(0);
  const [failed, setFailed] = useState(false);
  const [pixelRatio] = useState(() =>
    typeof window === "undefined"
      ? 1
      : Math.min(window.devicePixelRatio || 1, 1.25),
  );

  const pageHeight = useMemo(
    () => (width > 0 ? Math.round(width * aspectRatio) : 0),
    [width, aspectRatio],
  );

  const onDocumentLoadSuccess = async (pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    setFailed(false);

    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      if (viewport.width > 0) {
        setAspectRatio(viewport.height / viewport.width);
      }
    } catch {
      // Keep default A4-ish aspect ratio.
    }
  };

  return (
    <div
      className={`flex w-full flex-col ${className ?? ""}`}
      role="document"
      aria-label={title}
    >
      {failed ? (
        <div className="flex w-full flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-foreground/70">{errorLabel}</p>
          <a
            href={file}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline underline-offset-4"
          >
            {file.split("/").pop()}
          </a>
        </div>
      ) : (
        <Document
          file={file}
          loading={
            <p className="p-6 text-center text-sm text-foreground/60">
              {loadingLabel}
            </p>
          }
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={() => setFailed(true)}
          error={
            <div className="flex w-full flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-foreground/70">{errorLabel}</p>
            </div>
          }
          className={`flex w-full flex-col items-center gap-2 ${documentClassName ?? ""}`}
        >
          {width > 0 &&
            pageHeight > 0 &&
            numPages > 0 &&
            Array.from({ length: numPages }, (_, index) => (
              <PdfPage
                key={index + 1}
                pageNumber={index + 1}
                width={width}
                height={pageHeight}
                pixelRatio={pixelRatio}
              />
            ))}
        </Document>
      )}
    </div>
  );
}
