import { createPortal } from 'react-dom';
import './ImageLightbox.css';

export default function ImageLightbox({ images = [], index, onClose, onCycle }) {
  if (index === null || index === undefined || images.length === 0) return null;

  const image = images[index];
  const hasMultiple = images.length > 1;

  const lightbox = (
    <div className="image-lightbox" onClick={onClose}>
      <div className="image-lightbox-stage" onClick={(e) => e.stopPropagation()}>
        {hasMultiple && (
          <button
            type="button"
            className="image-lightbox-nav image-lightbox-nav--prev"
            onClick={() => onCycle(-1)}
            aria-label="Previous image"
          >
            &#8249;
          </button>
        )}
        <img src={image} className="image-lightbox-img" alt="Proof enlarged" />
        {hasMultiple && (
          <button
            type="button"
            className="image-lightbox-nav image-lightbox-nav--next"
            onClick={() => onCycle(1)}
            aria-label="Next image"
          >
            &#8250;
          </button>
        )}
      </div>
      <div className="image-lightbox-meta" onClick={(e) => e.stopPropagation()}>
        <span>
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          className="image-lightbox-close"
          onClick={onClose}
          aria-label="Close image preview"
        >
          x
        </button>
      </div>
    </div>
  );

  return createPortal(lightbox, document.body);
}
