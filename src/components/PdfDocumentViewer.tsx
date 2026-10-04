"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Document, Page, pdfjs } from "react-pdf";
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

function initialWidth() {
  if (typeof window === "undefined") return 0;
  return Math.max(Math.floor(window.innerWidth - 16), 280);
}

function initialPixelRatio() {
  if (typeof window === "undefined") return 2;
  // Sharp enough for phones, low enough not to OOM Edge with many pages.
  return Math.min(window.devicePixelRatio || 1, 2);
}

function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const update = () => setCoarse(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return coarse;
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
  const [visible, setVisible] = useState(pageNumber <= 2);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className="flex w-full shrink-0 justify-center bg-white"
      style={{ width: "100%", height }}
    >
      {visible ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          devicePixelRatio={pixelRatio}
          renderTextLayer
          renderAnnotationLayer={false}
          loading={null}
        />
      ) : null}
    </div>
  );
});

function MobilePdfViewer({
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

  if (failed) {
    return (
      <div className={`flex w-full flex-col items-center gap-3 p-6 text-center ${className ?? ""}`}>
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
    );
  }

  return (
    <div
      className={`flex w-full flex-col ${className ?? ""}`}
      role="document"
      aria-label={title}
    >
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
    </div>
  );
}

export function PdfDocumentViewer(props: PdfDocumentViewerProps) {
  const isMobile = useIsCoarsePointer();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <p className={`p-6 text-center text-sm text-foreground/60 ${props.className ?? ""}`}>
        {props.loadingLabel}
      </p>
    );
  }

  // Desktop/native browsers get true vector PDF rendering.
  if (!isMobile) {
    return (
      <iframe
        title={props.title}
        src={props.file}
        className={`h-[calc(100dvh-3rem)] w-full flex-1 border-0 ${props.className ?? ""}`}
      />
    );
  }

  return <MobilePdfViewer {...props} />;
}
