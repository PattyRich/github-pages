import Button from './Button';
import './ProofImageGrid.css';

export default function ProofImageGrid({
  images = [],
  inputRef,
  maxImages = 10,
  onUpload,
  onOpen,
  onRemove,
}) {
  return (
    <>
      <div className="proof-upload-row">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={onUpload}
          className="proof-upload-input"
          ref={inputRef}
        />
        {images.length < maxImages ? (
          <Button
            variant="secondary"
            className="proof-upload-btn"
            onClick={() => inputRef?.current?.click()}
          >
            Upload Proof Image
          </Button>
        ) : (
          <small className="proof-upload-limit">Max {maxImages} images reached</small>
        )}
      </div>

      {images.length > 0 && (
        <div className="proof-image-grid">
          {images.map((img, index) => (
            <div key={index} className="proof-image-tile">
              <button
                type="button"
                onClick={() => onOpen(index)}
                className="proof-image-open"
                title="Click to enlarge"
              >
                <img src={img} className="proof-image-thumb" alt="proof" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="proof-image-remove"
                title="Remove image"
                aria-label={`Remove proof image ${index + 1}`}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
