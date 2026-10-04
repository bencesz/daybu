"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type PdfDocumentViewerProps = {
  file: string;
  title: string;
  loadingLabel: string;
  errorLabel: string;
  className?: string;
  documentClassName?: string;
  previousLabel?: string;
  nextLabel?: string;
  pageLabel?: string;
};

function DesktopPdf({ file, title }: { file: string; title: string }) {
  return (
    <iframe
      title={title}
      src={file}
      className="h-[calc(100dvh-3rem)] w-full flex-1 border-0"
    />
  );
}

function MobilePdf({
  file,
  title,
  loadingLabel,
  errorLabel,
  previousLabel,
  nextLabel,
  pageLabel,
}: {
  file: string;
  title: string;
  loadingLabel: string;
  errorLabel: string;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const update = () => {
      setWidth(Math.max(Math.floor(window.innerWidth) - 16, 280));
    };
    update();
    window.addEventListener("orientationchange", update);
    return () => window.removeEventListener("orientationchange", update);
  }, []);

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-sm text-foreground/70">{errorLabel}</p>
        <a
          href={file}
          className="text-sm font-medium underline underline-offset-4"
        >
          {file.split("/").pop()}
        </a>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col" aria-label={title}>
      <div className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-2 text-sm dark:border-white/15">
        <button
          type="button"
          className="rounded px-3 py-2 disabled:opacity-30"
          onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
          disabled={pageNumber <= 1}
        >
          {previousLabel}
        </button>
        <span className="tabular-nums text-foreground/70">
          {pageLabel
            .replace("{current}", String(pageNumber))
            .replace("{total}", String(numPages || "…"))}
        </span>
        <button
          type="button"
          className="rounded px-3 py-2 disabled:opacity-30"
          onClick={() =>
            setPageNumber((page) =>
              numPages ? Math.min(numPages, page + 1) : page,
            )
          }
          disabled={!numPages || pageNumber >= numPages}
        >
          {nextLabel}
        </button>
      </div>

      <div className="flex min-h-[70dvh] w-full justify-center overflow-x-hidden bg-black/[.03] px-2 py-3 dark:bg-white/[.04]">
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
        >
          {width > 0 ? (
            <Page
              pageNumber={pageNumber}
              width={width}
              devicePixelRatio={Math.min(
                typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
                1.5,
              )}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={null}
            />
          ) : null}
        </Document>
      </div>
    </div>
  );
}

export function PdfDocumentViewer({
  file,
  title,
  loadingLabel,
  errorLabel,
  className,
  previousLabel = "Previous",
  nextLabel = "Next",
  pageLabel = "{current} / {total}",
}: PdfDocumentViewerProps) {
  const [mode, setMode] = useState<"mobile" | "desktop" | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const update = () => setMode(media.matches ? "mobile" : "desktop");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (!mode) {
    return (
      <p className={`p-6 text-center text-sm text-foreground/60 ${className ?? ""}`}>
        {loadingLabel}
      </p>
    );
  }

  return (
    <div className={`w-full ${className ?? ""}`}>
      {mode === "desktop" ? (
        <DesktopPdf file={file} title={title} />
      ) : (
        <MobilePdf
          file={file}
          title={title}
          loadingLabel={loadingLabel}
          errorLabel={errorLabel}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
          pageLabel={pageLabel}
        />
      )}
    </div>
  );
}
