"use client";

import { ChevronLeft, ChevronRight, ImageOff, X, ZoomIn } from "lucide-react";
import { useState } from "react";

/* ============================================================
   PackageImageGallery
   ------------------------------------------------------------
   Shows a row of up to 3 package photos as square thumbnails.
   Clicking any of them opens a full-screen lightbox with
   prev/next navigation — reusable anywhere a package/shipment
   card needs to show image1/image2/image3.
============================================================ */

interface PackageImageGalleryProps {
  images: Array<string | null | undefined>;
  // Shown as the lightbox title, e.g. the package code.
  label?: string;
}

const PackageImageGallery = ({ images, label }: PackageImageGalleryProps) => {
  const validImages = images.filter((src): src is string => Boolean(src));

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (validImages.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <ImageOff size={14} />
        No photos uploaded
      </div>
    );
  }

  const showPrev = () =>
    setOpenIndex((i) =>
      i === null ? null : (i - 1 + validImages.length) % validImages.length,
    );

  const showNext = () =>
    setOpenIndex((i) => (i === null ? null : (i + 1) % validImages.length));

  return (
    <>
      {/* ============================================================
          THUMBNAILS — always 3 equal square slots so the row stays
          tidy even when a package only has 1 or 2 photos.
      ============================================================ */}
      <div className="grid grid-cols-3 gap-2 max-w-[220px]">
        {validImages.map((src, idx) => (
          <button
            key={src + idx}
            type="button"
            onClick={() => setOpenIndex(idx)}
            className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
          >
            <img
              src={src}
              alt={`${label || "Package"} photo ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
              <ZoomIn
                size={16}
                className="text-white opacity-0 group-hover:opacity-100 transition"
              />
            </div>
          </button>
        ))}
      </div>

      {/* ============================================================
          LIGHTBOX
      ============================================================ */}
      {openIndex !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setOpenIndex(null)}
          />

          <div className="relative w-full max-w-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/80">
                {label ? `${label} · ` : ""}
                {openIndex + 1} / {validImages.length}
              </span>

              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* IMAGE */}
            <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[75vh]">
              <img
                src={validImages[openIndex]}
                alt={`${label || "Package"} photo ${openIndex + 1}`}
                className="max-w-full max-h-[75vh] object-contain"
              />

              {validImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* THUMBNAIL STRIP (only if more than 1 photo) */}
            {validImages.length > 1 && (
              <div className="flex gap-2 mt-3 justify-center">
                {validImages.map((src, idx) => (
                  <button
                    key={src + idx}
                    type="button"
                    onClick={() => setOpenIndex(idx)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                      idx === openIndex
                        ? "border-white"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PackageImageGallery;
