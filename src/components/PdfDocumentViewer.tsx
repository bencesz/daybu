"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
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

function initialPixelRatio() {
  if (typeof window === "undefined") return 2;
  // iPhone 16 is ~3x; match screen density for crisp canvases.
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
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
  const ref = useRef<HTMLDivElement>(null);
  // Keep a couple of pages warm so the first screen is immediate.
  const [shouldRender, setShouldRender] = useState(pageNumber <= 2);

  useEffect(() => {
    const node = ref.current;
    if (!node || shouldRender) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div
      ref={ref}
      className="flex w-full shrink-0 justify-center"
      style={{ width: "100%", height }}
    >
      {shouldRender ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          devicePixelRatio={pixelRatio}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={null}
        />
      ) : null}
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
  const [pixelRatio] = useState(initialPixelRatio);

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
