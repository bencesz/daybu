"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

function measureWidth(node: HTMLElement | null) {
  const raw = node?.clientWidth || window.innerWidth;
  return Math.max(Math.floor(raw) - 8, 280);
}

function LazyPage({
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
  const [shouldRender, setShouldRender] = useState(pageNumber <= 1);

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
      { rootMargin: "200% 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div
      ref={ref}
      className="flex w-full shrink-0 justify-center overflow-hidden"
      style={{ width, height }}
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
  const widthRef = useRef(0);
  const scrollYRef = useRef(0);
  const [width, setWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [failed, setFailed] = useState(false);
  const [pixelRatio] = useState(() =>
    typeof window === "undefined"
      ? 1
      : Math.min(window.devicePixelRatio || 1, 1.5),
  );

  useEffect(() => {
    const node = containerRef.current;
    const applyWidth = () => {
      const next = measureWidth(node);
      // Ignore tiny width jitter from mobile browser chrome show/hide.
      if (
        widthRef.current > 0 &&
        Math.abs(next - widthRef.current) < Math.max(48, widthRef.current * 0.12)
      ) {
        return;
      }
      scrollYRef.current = window.scrollY;
      widthRef.current = next;
      setWidth(next);
    };

    applyWidth();

    const onOrientation = () => {
      window.setTimeout(applyWidth, 250);
    };

    window.addEventListener("orientationchange", onOrientation);
    // Only react to real viewport width changes (e.g. rotation / split screen),
    // not vertical URL-bar resizing.
    window.addEventListener("resize", applyWidth);

    return () => {
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("resize", applyWidth);
    };
  }, []);

  useLayoutEffect(() => {
    if (scrollYRef.current > 0) {
      window.scrollTo(0, scrollYRef.current);
    }
  }, [width, pageHeight]);

  const onDocumentLoadSuccess = async (pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    setFailed(false);

    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const aspect = viewport.height / viewport.width;
      const nextHeight = Math.round(widthRef.current * aspect);
      setPageHeight(nextHeight);
    } catch {
      setPageHeight(Math.round(widthRef.current * 1.414));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex w-full flex-col ${className ?? ""}`}
      role="document"
      aria-label={title}
      style={{ overflowAnchor: "none" }}
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
              <LazyPage
                key={`page_${index + 1}`}
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
