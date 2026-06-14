import React, { useEffect, useState } from "react";
import CKEditorDemo from "./Editor";
import ImageUploader from "./ImageUploader";
import { getImages } from "../data/imageService";

export default function StoryEditor({
  heading,
  pageClassName,
  formClassName,
  initialValues,
  requireDate = false,
  submitLabel,
  submitBusyLabel = "Saving...",
  cancelLabel = "Cancel",
  onCancel,
  onSubmit,
}) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [subtitle, setSubtitle] = useState(initialValues?.subtitle || "");
  const [date, setDate] = useState(initialValues?.date || "");
  const [published, setPublished] = useState(
    initialValues?.published === false || initialValues?.published === "false" ? false : true
  );
  const [content, setContent] = useState(initialValues?.content || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imageStatus, setImageStatus] = useState("");
  const [imageUploaderOpen, setImageUploaderOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getImages();
        if (mounted) {
          setImages(Array.isArray(data) ? data : []);
          setImageStatus("");
        }
      } catch (err) {
        if (mounted) {
          setImageStatus(err?.message || "Failed to load images");
        }
      } finally {
        if (mounted) {
          setImagesLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function reloadImages() {
    setImagesLoading(true);
    try {
      const data = await getImages();
      setImages(Array.isArray(data) ? data : []);
      setImageStatus("");
    } catch (err) {
      setImageStatus(err?.message || "Failed to load images");
    } finally {
      setImagesLoading(false);
    }
  }

  async function handleImageClick(url) {
    try {
      await navigator.clipboard.writeText(url);
      setImageStatus("Image URL copied to clipboard.");
    } catch (err) {
      console.error("Failed to copy image URL", err);
      setImageStatus("Could not copy the image URL.");
    }
  }

  async function handleImageUploadComplete(uploaded) {
    setImageStatus("Upload complete. Click any image below to copy its URL.");
    await reloadImages();

    try {
      await navigator.clipboard.writeText(uploaded.url);
      setImageStatus("Upload complete. Image URL copied to clipboard.");
    } catch (err) {
      console.error("Failed to copy uploaded image URL", err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = (title || "").trim();
    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }

    const trimmedDate = (date || "").trim();
    if (requireDate && !trimmedDate) {
      setError("Date is required");
      return;
    }

    const trimmedContent = (content || "").trim();
    if (!trimmedContent) {
      setError("Content is required");
      return;
    }

    setSaving(true);

    const payload = {
      title: trimmedTitle,
      subtitle: (subtitle || "").trim(),
      content,
      date: trimmedDate,
      published,
    };

    try {
      await onSubmit?.(payload);
    } catch (err) {
      setError((err && (err.message || err.description)) || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={pageClassName}>
      {heading ? <h2>{heading}</h2> : null}
      <form onSubmit={handleSubmit} className={formClassName}>
        <p>
          <label>
            <div>Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={saving}
            />
          </label>
        </p>
        <p>
          <label>
            <div>Subtitle</div>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              disabled={saving}
            />
          </label>
        </p>
        <p>
          <label>
            <div>Date</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required={requireDate}
              placeholder="YYYY-MM-DD"
              disabled={saving}
            />
          </label>
        </p>
        <p>
          <label>
            <div>Published</div>
            <input
              type="checkbox"
              checked={!!published}
              onChange={(e) => setPublished(e.target.checked)}
              disabled={saving}
            />{" "}
            <small className="small">checked = published</small>
          </label>
        </p>

        <div>
          <div>Get an image URL</div>
          <div className="edit-image-tools">
            <div className="story-card edit-image-tool">
              <details
                className="image-url-picker"
                open={imageUploaderOpen}
                onToggle={(event) => setImageUploaderOpen(event.currentTarget.open)}
              >
                <summary className="action-button image-url-summary">
                  <span className="image-url-indicator" aria-hidden="true">
                    {imageUploaderOpen ? "v" : ">"}
                  </span>
                  <span>{imageUploaderOpen ? "Hide Upload Panel" : "Upload a New Image"}</span>
                </summary>
                <div className="image-url-picker-panel">
                  <ImageUploader
                    title={null}
                    description="Add an image here, then 'Insert image via URL' in the editor."
                    onUploadComplete={handleImageUploadComplete}
                  />
                </div>
              </details>
            </div>
            <div className="story-card edit-image-tool">
              <details
                className="image-url-picker"
                open={imagePickerOpen}
                onToggle={(event) => setImagePickerOpen(event.currentTarget.open)}
              >
                <summary className="action-button image-url-summary">
                  <span className="image-url-indicator" aria-hidden="true">
                    {imagePickerOpen ? "v" : ">"}
                  </span>
                  <span>{imagePickerOpen ? "Hide Image List" : "Open Image List"}</span>
                </summary>
                <div className="image-url-picker-panel">
                  {imagesLoading ? (
                    <p className="small">Loading images...</p>
                  ) : images.length === 0 ? (
                    <p className="small">No uploaded images yet.</p>
                  ) : (
                    <div className="image-url-grid">
                      {images.map((image) => (
                        <button
                          key={image.filename}
                          className="image-url-item"
                          type="button"
                          onClick={() => handleImageClick(image.url)}
                          title={`Copy ${image.filename}`}
                        >
                          <img src={image.url} alt={image.filename} className="image-url-thumb" />
                          <span className="image-url-name">{image.filename}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {imageStatus && <p className="small">{imageStatus}</p>}
                </div>
              </details>
            </div>
          </div>
        </div>

        <p>
          <label>Content</label>
          <CKEditorDemo value={content} onChange={(val) => setContent(val)} />
        </p>

        {error && <p className="small" style={{ color: "crimson" }}>{error}</p>}

        <div>
          <button className="action-button" type="submit" disabled={saving}>
            {saving ? submitBusyLabel : submitLabel}
          </button>
          <button
            className="action-button"
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{ marginLeft: 8 }}
          >
            {cancelLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

