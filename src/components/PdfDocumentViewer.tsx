"use client";

import { memo, useEffect, useRef, useState } from "react";
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
      style={{
        width,
        height,
        contentVisibility: "auto",
        containIntrinsicSize: `${width}px ${height}px`,
      }}
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
  const containerRef = useRef<HTMLDivElement>(null);
  const measuredRef = useRef(false);
  const [width, setWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [failed, setFailed] = useState(false);
  const [pixelRatio] = useState(() =>
    typeof window === "undefined"
      ? 1
      : Math.min(window.devicePixelRatio || 1, 1.25),
  );

  useEffect(() => {
    if (measuredRef.current) return;
    const node = containerRef.current;
    const next = Math.max(
      Math.floor((node?.clientWidth || window.innerWidth) - 8),
      280,
    );
    measuredRef.current = true;
    setWidth(next);
  }, []);

  const onDocumentLoadSuccess = async (pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    setFailed(false);

    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      setPageHeight(Math.round(width * (viewport.height / viewport.width)));
    } catch {
      setPageHeight(Math.round(width * 1.414));
    }
  };

  return (
    <div
      ref={containerRef}
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
