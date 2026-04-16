import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStory, updateStory } from "../data/storyService";
import { getImages } from "../data/imageService";
import CKEditorDemo from "./Editor";
import ImageUploader from "./ImageUploader";

export default function EditStory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [date, setDate] = useState("");
  const [published, setPublished] = useState(true);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
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
        const data = await getStory(id);
        if (!mounted) return;
        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");
        setDate(data.date || "");
        setPublished(data.published === false || data.published === "false" ? false : true);
        setContent(data.content || "");
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load story");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    loadImages(mounted);
    return () => { mounted = false; };
  }, []);

  async function loadImages(mounted = true) {
    try {
      const data = await getImages();
      if (mounted) {
        setImages(Array.isArray(data) ? data : []);
        setImageStatus("");
      }
    } catch (err) {
      if (mounted) {
        setImageStatus(err.message || "Failed to load images");
      }
    } finally {
      if (mounted) {
        setImagesLoading(false);
      }
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
    setImagesLoading(true);
    setImageStatus("Upload complete. Click any image below to copy its URL.");
    await loadImages(true);

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

    const trimmedDate = (date || "").trim();
    if (!trimmedDate) {
      setError("Date is required");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      content,
      date: trimmedDate,
      published
    };

    try {
      await updateStory(id, payload);
      navigate("/");
    } catch (err) {
      setError((err && (err.message || err.description)) || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="center small">Loading story...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div className="edit-page">
      <h2>Edit Story</h2>
      <form onSubmit={handleSubmit}>
        <p>
          <label>
            <div>Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
        </p>
        <p>
          <label>
            <div>Subtitle</div>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
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
              required
              placeholder="YYYY-MM-DD or free-form"
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
                  <span className="image-url-indicator" aria-hidden="true">{imageUploaderOpen ? "v" : ">"}</span>
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
                  <span className="image-url-indicator" aria-hidden="true">{imagePickerOpen ? "v" : ">"}</span>
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
          <label>
            Content
          </label>
          <CKEditorDemo
            value={content}
            onChange={(val) => setContent(val)}
          />
        </p>
        <div>
          <button className="action-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="action-button" type="button" onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
