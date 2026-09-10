import { memo } from "react";

function GalleryCard({ design, onQuote, onPreview }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-surface shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <button
        type="button"
        onClick={() => onPreview(design)}
        aria-label={`Preview ${design.design_name}`}
        className="relative overflow-hidden bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-background">
          <img
            src={design.front_image_url}
            alt={design.design_name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-dark/50 to-transparent px-4 py-3 opacity-100 transition duration-300">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-surface">
            Tap to view
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold leading-7 tracking-tight text-dark font-heading">
            {design.design_name}
          </h3>
          <p className="line-clamp-4 text-sm leading-6 text-secondary">
            {design.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onQuote(design)}
          className="mt-auto inline-flex w-full items-center justify-center rounded-[18px] bg-primary px-5 py-3 text-sm font-semibold text-surface transition duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Get Quote
        </button>
      </div>
    </article>
  );
}

export default memo(GalleryCard);
