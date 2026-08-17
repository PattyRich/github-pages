import { useEffect, useState } from 'react';
import { apiUrl } from '../config';
import ImageLightbox from './ui/ImageLightbox';

const AUTOPLAY_DELAY_MS = 7000;

const FALLBACK_IMAGES = [
  `${import.meta.env.BASE_URL}board-min2.png`,
  `${import.meta.env.BASE_URL}create-min.png`,
];

interface ShowcaseResponse {
  images?: unknown;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function BingoCarousel() {
  const [images, setImages] = useState(FALLBACK_IMAGES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [usingFallback, setUsingFallback] = useState(true);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [autoplayStopped, setAutoplayStopped] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    const controller = new AbortController();

    async function loadShowcase() {
      try {
        const response = await fetch(apiUrl('showcase'), { signal: controller.signal });
        if (!response.ok) throw new Error(`Showcase request failed with ${response.status}`);
        const data = (await response.json()) as ShowcaseResponse;
        if (!Array.isArray(data.images)) return;
        const fetchedImages = data.images.filter(
          (image): image is string => typeof image === 'string' && image.length > 0
        );
        if (fetchedImages.length === 0) return;

        setImages(shuffled(fetchedImages));
        setActiveIndex(0);
        setUsingFallback(false);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    void loadShowcase();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (previewIndex === null) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handlePreviewKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewIndex(null);
        return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      event.preventDefault();
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      setAutoplayStopped(true);
      setPreviewIndex((current) => {
        if (current === null) return null;
        return (current + direction + images.length) % images.length;
      });
    };

    window.addEventListener('keydown', handlePreviewKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handlePreviewKeyDown, true);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [images.length, previewIndex]);

  useEffect(() => {
    if (
      images.length < 2 ||
      interactionPaused ||
      autoplayStopped ||
      !pageVisible ||
      previewIndex !== null ||
      reducedMotion
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, AUTOPLAY_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [
    activeIndex,
    autoplayStopped,
    images.length,
    interactionPaused,
    pageVisible,
    previewIndex,
    reducedMotion,
  ]);

  const showPrevious = () => {
    setAutoplayStopped(true);
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  const showNext = () => {
    setAutoplayStopped(true);
    setActiveIndex((current) => (current + 1) % images.length);
  };

  const showImage = (index: number) => {
    setAutoplayStopped(true);
    setActiveIndex(index);
  };

  const closePreview = () => setPreviewIndex(null);

  const cyclePreview = (direction: -1 | 1) => {
    setAutoplayStopped(true);
    setPreviewIndex((current) => {
      if (current === null) return null;
      return (current + direction + images.length) % images.length;
    });
  };

  const useFallbackImages = () => {
    if (usingFallback) return;
    setPreviewIndex(null);
    setImages(FALLBACK_IMAGES);
    setActiveIndex(0);
    setUsingFallback(true);
  };

  return (
    <div
      className="bingo-previews bingo-carousel"
      role="region"
      aria-label="Bingo highlights"
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false);
      }}
      onKeyDown={(event) => {
        if (previewIndex !== null) return;
        if (event.key === 'ArrowLeft') showPrevious();
        if (event.key === 'ArrowRight') showNext();
      }}
    >
      <p className="bingo-carousel-kicker">See others featured drops!</p>

      <div className="bingo-carousel-frame">
        <div
          className="bingo-carousel-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <button
              type="button"
              className="bingo-carousel-slide"
              aria-label="Enlarge featured drop"
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => setPreviewIndex(index)}
              key={image}
            >
              <img
                className="preview-img bingo-carousel-image"
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
                onError={useFallbackImages}
              />
            </button>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="bingo-carousel-controls">
          <button
            type="button"
            className="bingo-carousel-arrow"
            aria-label="Previous Bingo image"
            onClick={showPrevious}
          >
            &#8249;
          </button>

          <div className="bingo-carousel-dots" aria-label="Choose a Bingo image">
            {images.map((image, index) => (
              <button
                type="button"
                className={`bingo-carousel-dot${index === activeIndex ? ' is-active' : ''}`}
                aria-label={`Show Bingo image ${index + 1} of ${images.length}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => showImage(index)}
                key={image}
              />
            ))}
          </div>

          <button
            type="button"
            className="bingo-carousel-arrow"
            aria-label="Next Bingo image"
            onClick={showNext}
          >
            &#8250;
          </button>
        </div>
      )}

      <ImageLightbox
        images={images}
        index={previewIndex}
        onClose={closePreview}
        onCycle={cyclePreview}
        onImageError={useFallbackImages}
      />
    </div>
  );
}
