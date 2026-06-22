"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxPhoto {
  src: string;
  alt?: string;
}

interface Props {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoTo?: (i: number) => void;
}

export function PhotoLightbox({ photos, index, onClose, onPrev, onNext, onGoTo }: Props) {
  const total = photos.length;
  const current = photos[index];

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   onPrev();
      if (e.key === "ArrowRight")  onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 transition-colors"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      {total > 1 && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm tabular-nums">
          {index + 1} / {total}
        </span>
      )}

      {/* Prev */}
      {total > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 rounded-full bg-white/10 hover:bg-white/20 text-white p-3 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <div
        className="relative w-[85vw] h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={current.src}
          alt={current.alt ?? `Foto ${index + 1}`}
          fill
          className="rounded-lg object-contain shadow-2xl"
          priority
        />
      </div>

      {/* Next */}
      {total > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 rounded-full bg-white/10 hover:bg-white/20 text-white p-3 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 rounded-xl bg-black/40"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((p, i) => (
            <button
              type="button"
              key={i}
              onClick={() => {
                if (onGoTo) { onGoTo(i); return; }
                if (i < index) onPrev();
                else if (i > index) onNext();
              }}
              className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-all ${
                i === index ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-90"
              }`}
            >
              <Image
                src={p.src}
                alt={`Miniatura ${i + 1}`}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
