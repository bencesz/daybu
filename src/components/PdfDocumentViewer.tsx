"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type PdfDocumentViewerProps = {
  file: string;
  title: string;
  loadingLabel: string;
  errorLabel: string;
  className?: string;
  documentClassName?: string;
};

export function PdfDocumentViewer({
  file,
  title,
  loadingLabel,
  errorLabel,
  className,
  documentClassName,
}: PdfDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => {
      setWidth(Math.floor(node.clientWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full flex ${className}`}
      role="document"
      aria-label={title}
    >
      {failed ? (
        <p className="text-center text-sm text-foreground/70">{errorLabel}</p>
      ) : (
        <Document
          file={file}
          loading={
            <p className="p-6 text-center text-sm text-foreground/60">
              {loadingLabel}
            </p>
          }
          onLoadSuccess={({ numPages: nextNumPages }) => {
            setNumPages(nextNumPages);
            setFailed(false);
          }}
          onLoadError={() => setFailed(true)}
          className={`flex flex-col items-center gap-3 ${documentClassName}`}
        >
          {width > 0 &&
            Array.from({ length: numPages }, (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={width}
                renderTextLayer
                renderAnnotationLayer
                className="shadow-sm"
              />
            ))}
        </Document>
      )}
    </div>
  );
}
