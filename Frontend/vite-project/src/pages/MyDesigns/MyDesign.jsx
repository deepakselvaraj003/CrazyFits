import { useEffect, useState } from "react";
import { getMyDesigns } from "../../services/designService";
import { toast } from "react-hot-toast";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import AuthenticatedImage from "../../components/AuthenticatedImage/AuthenticatedImage";
import { downloadAuthenticatedImage } from "../../components/AuthenticatedImage/privateImageLoader";

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  pending: "Pending",
  contacted: "Contacted",
  order_confirmed: "Order Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_BADGE_CLASSES = {
  pending: "bg-warning/15 text-warning border-warning/30",
  contacted: "bg-primary/15 text-primary border-primary/20",
  order_confirmed: "bg-success/15 text-success border-success/30",
  completed: "bg-surface text-dark border-border",
  cancelled: "bg-danger/15 text-danger border-danger/30",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function downloadImage(url, filename) {
  if (!url) return;

  try {
    await downloadAuthenticatedImage(url, filename);
  } catch (_) {
    toast.error("Download failed. Please try again.");
  }
}


// ── Design Card ────────────────────────────────────────────────────────────────

function DesignCard({ design, openPreview }) {
  const statusKey = design.request_status || "pending";
  const previewImage =
    design.front_preview_image_url ||
    design.back_preview_image_url ||
    design.gallery_image_url;

  function handleDownload() {
    downloadImage(design.front_preview_image_url, `${design.design_name}-front.png`);
    downloadImage(design.back_preview_image_url, `${design.design_name}-back.png`);
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-surface shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative overflow-hidden aspect-[3/2] bg-background">
        {previewImage ? (
          <AuthenticatedImage
            src={previewImage}
            alt={design.design_name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-border/10 text-secondary">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-secondary">
              <path
                d="M8 16 L20 8 L32 12 L44 8 L56 16 L52 44 L32 56 L12 44 Z"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
              />
              <circle cx="32" cy="30" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span className="text-sm font-medium">No preview available</span>
          </div>
        )}

        <span
          className={`absolute right-4 top-4 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            STATUS_BADGE_CLASSES[statusKey] || STATUS_BADGE_CLASSES.pending
          }`}
        >
          {STATUS_LABEL[statusKey] || statusKey}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-1">
          <h3 className="truncate text-lg font-semibold leading-tight text-dark font-heading" title={design.design_name}>
            {design.design_name}
          </h3>
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-secondary">
            {design.design_type === "gallery" ? "Gallery Design" : "Custom Design"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-secondary">
          <div className="grid gap-2 text-xs uppercase tracking-[0.08em] text-secondary/70 sm:grid-cols-3">
            <div className="space-y-1">
              <p>Request ID</p>
              <p className="font-semibold text-dark truncate">{design.request_number || "—"}</p>
            </div>
            <div className="space-y-1">
              <p>Quantity</p>
              <p className="font-semibold text-dark">{design.quantity ? `${design.quantity} pcs` : "—"}</p>
            </div>
            <div className="space-y-1">
              <p>Submitted</p>
              <p className="font-semibold text-dark">{formatDate(design.created_at)}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => previewImage && openPreview(design)}
            disabled={!previewImage}
          >
            View
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            onClick={handleDownload}
            disabled={!previewImage}
          >
            Download
          </Button>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-surface shadow-sm">
      <div className="h-56 bg-border/30" />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-3">
          <div className="h-6 w-2/3 rounded-full bg-border/30" />
          <div className="h-4 w-1/2 rounded-full bg-border/30" />
        </div>
        <div className="space-y-3">
          <div className="h-4 rounded-full bg-border/30" />
          <div className="h-4 rounded-full bg-border/30" />
          <div className="h-4 w-3/4 rounded-full bg-border/30" />
        </div>
        <div className="mt-auto flex gap-3">
          <div className="h-11 flex-1 rounded-[18px] bg-border/30" />
          <div className="h-11 flex-1 rounded-[18px] bg-border/30" />
        </div>
      </div>
    </article>
  );
}

// ── My Designs Page ────────────────────────────────────────────────────────────

function MyDesign() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewDesign, setPreviewDesign] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewLoadError, setPreviewLoadError] = useState(false);
  const [loadedImages, setLoadedImages] = useState(0);

  const openPreview = (design) => {
    setLoadedImages(0);
    setPreviewLoadError(false);
    const imageCount =
      Number(!!design.front_preview_image_url) +
      Number(!!design.back_preview_image_url);

    setPreviewLoading(imageCount > 0);
    setPreviewDesign(design);
    setPreviewOpen(true);
  };

  const handleImageLoaded = () => {
    setLoadedImages((prev) => {
      const total =
        Number(!!previewDesign.front_preview_image_url) +
        Number(!!previewDesign.back_preview_image_url);

      const next = prev + 1;

      if (next >= total) {
        setPreviewLoading(false);
      }

      return next;
    });
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewDesign(null);
    setPreviewLoading(false);
    setPreviewLoadError(false);
    setLoadedImages(0);
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  async function loadDesigns() {
    try {
      setLoading(true);
      setError(null);

      const res = await getMyDesigns();

      // res.data = { success: true, data: [...] }
      const data = res?.data?.data;

      if (Array.isArray(data)) {
        setDesigns(data);
      } else {
        // fallback — maybe API returned designs directly
        setDesigns([]);
        toast.warning("Unexpected response from the designs service.");
      }
    } catch (_) {
      toast.error("Failed to load your designs. Please try again.");
      setError(
        _?.response?.data?.message ||
          "Failed to load your designs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const previewItems = previewDesign
    ? [
        ...(previewDesign.front_preview_image_url
          ? [{ label: "Front View", url: previewDesign.front_preview_image_url }]
          : []),
        ...(previewDesign.back_preview_image_url
          ? [{ label: "Back View", url: previewDesign.back_preview_image_url }]
          : []),
      ]
    : [];

  const handlePreviewImageError = (url, error) => {
    console.error("Preview image failed to load:", url, error);
    if (!previewLoadError) {
      setPreviewLoadError(true);
      toast.error("Some preview images failed to load.");
    }
    setPreviewLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-dark font-body tracking-normal">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-border bg-dark/95 p-6 shadow-lg shadow-black/10 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="space-y-2 text-surface">
            <h1 className="text-3xl font-bold tracking-tight text-surface sm:text-4xl lg:text-5xl">
              My Designs
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-surface/75 sm:text-base">
              All your submitted custom T-shirt designs — track status, view previews, and download files.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Stats bar */}
        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex min-h-[110px] flex-col justify-between rounded-[22px] border border-border bg-surface p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-secondary">{designs.length === 1 ? "Design" : "Designs"} Submitted</p>
              <p className="mt-3 text-3xl font-semibold text-dark">{designs.length}</p>
            </div>
            <div className="flex min-h-[110px] flex-col justify-between rounded-[22px] border border-border bg-surface p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-secondary">Completed</p>
              <p className="mt-3 text-3xl font-semibold text-dark">{designs.filter((d) => d.request_status === "completed").length}</p>
            </div>
            <div className="flex min-h-[110px] flex-col justify-between rounded-[22px] border border-border bg-surface p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-secondary">Pending</p>
              <p className="mt-3 text-3xl font-semibold text-dark">{designs.filter((d) => d.request_status === "pending").length}</p>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-[28px] border border-border bg-surface p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/10 text-danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <circle cx="12" cy="16" r="0.5" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-dark">Something went wrong</h2>
            <p className="mt-3 text-sm leading-7 text-secondary">{error}</p>
            <div className="mt-8 flex justify-center">
              <Button type="button" variant="primary" onClick={loadDesigns}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && designs.length === 0 && (
          <div className="rounded-[28px] border border-border bg-surface p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-dark">No designs yet</h2>
            <p className="mt-3 text-sm leading-7 text-secondary">
              Designs you submit from the Design Studio will appear here. Start creating your custom T-shirt!
            </p>
            <div className="mt-8 flex justify-center">
              <a href="/design" className="inline-flex items-center justify-center rounded-[18px] bg-primary px-6 py-3 text-sm font-semibold text-surface shadow-sm transition hover:bg-primary-hover">
                Go to Design Studio
              </a>
            </div>
          </div>
        )}

        {/* Designs grid */}
        {!loading && !error && designs.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {designs.map((design) => (
              <DesignCard key={`${design.design_type}-${design.id}`} design={design} openPreview={openPreview} />
            ))}
          </div>
        )}
      </main>
      {previewOpen && previewDesign && (
        <Modal isOpen={previewOpen} onClose={closePreview} title={previewDesign.design_name}>
          <div className="space-y-6">
{previewLoading && (
  <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-[24px] border border-border bg-background p-10 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
    <p className="text-sm font-medium text-secondary">Loading images...</p>
  </div>
)}

{previewItems.length > 0 && (
  <div className={`grid gap-5 lg:grid-cols-2 ${previewLoading ? "hidden" : ""}`}>
    {previewItems.map((item) => (
      <div
        key={item.label}
        className="rounded-[24px] border border-border bg-surface p-4 shadow-sm"
      >
        <AuthenticatedImage
          src={item.url}
          alt={item.label}
          onLoad={handleImageLoaded}
          onError={(e) => handlePreviewImageError(item.url, e)}
          className="h-full w-full object-cover"
        />
      </div>
    ))}
  </div>
)}

{!previewLoading && previewItems.length === 0 && (
  <div className="rounded-[24px] border border-border bg-background p-10 text-center text-secondary">
    <p className="text-base font-semibold text-dark">No preview images available for this design.</p>
    <p className="mt-2 text-sm">Please check the design submission or refresh the page.</p>
  </div>
)}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="primary"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (previewDesign.front_preview_image_url) {
                    downloadImage(previewDesign.front_preview_image_url, `${previewDesign.design_name}-front.png`);
                  }
                  if (previewDesign.back_preview_image_url) {
                    downloadImage(previewDesign.back_preview_image_url, `${previewDesign.design_name}-back.png`);
                  }
                }}
                disabled={previewItems.length === 0}
              >
                Download Both
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default MyDesign;