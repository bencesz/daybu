"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type PdfDocumentViewerProps = {
  file: string;
  title: string;
  loadingLabel: string;
  errorLabel: string;
  className?: string;
  documentClassName?: string;
};

function LazyPage({
  pageNumber,
  width,
  pixelRatio,
}: {
  pageNumber: number;
  width: number;
  pixelRatio: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
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
      { rootMargin: "150% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRender]);

  const placeholderHeight = Math.round(width * 1.414);

  return (
    <div
      ref={ref}
      className="flex w-full justify-center"
      style={{ minHeight: width > 0 ? placeholderHeight : 480 }}
    >
      {shouldRender && width > 0 ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          devicePixelRatio={pixelRatio}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="shadow-sm"
        />
      ) : null}
    </div>
  );
}

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
  const [pixelRatio, setPixelRatio] = useState(1);

  useEffect(() => {
    setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => {
      // Leave a little horizontal padding room on narrow screens.
      setWidth(Math.max(Math.floor(node.clientWidth) - 8, 280));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex w-full ${className ?? ""}`}
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
          onLoadSuccess={({ numPages: nextNumPages }) => {
            setNumPages(nextNumPages);
            setFailed(false);
          }}
          onLoadError={() => setFailed(true)}
          error={
            <div className="flex w-full flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-foreground/70">{errorLabel}</p>
            </div>
          }
          className={`flex w-full flex-col items-center gap-3 ${documentClassName ?? ""}`}
        >
          {width > 0 &&
            Array.from({ length: numPages }, (_, index) => (
              <LazyPage
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={width}
                pixelRatio={pixelRatio}
              />
            ))}
        </Document>
      )}
    </div>
  );
}
