import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { uploadImage } from "../data/imageService";

export default function UploadImage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  function handleFileSelect(nextFile) {
    setFile(nextFile || null);
    setError(null);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragActive(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);

    const nextFile = event.dataTransfer?.files?.[0] || null;
    if (!nextFile) {
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      setError("Please drop an image file.");
      return;
    }

    handleFileSelect(nextFile);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError("Choose an image to upload.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploaded = await uploadImage(file);
      setResult(uploaded);
    } catch (err) {
      setResult(null);
      setError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  }

  const dropZoneClassName = [
    "drop-zone",
    dragActive ? "active" : "",
    file ? "ready" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="upload-page">
      <h2>Upload an Image</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <p>
          <Link to="/images">View uploaded images</Link>
        </p>
        <div>
          <label>
            <div>Image File</div>
            <div
              className={dropZoneClassName}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFilePicker}
            >
              <div className="drop-zone-icon" aria-hidden="true">
                {file ? "✓" : "⬆"}
              </div>
              <p className="drop-zone-title">
                {file ? "Image ready to upload" : "Drag and drop an image here"}
              </p>
              <p className="drop-zone-text">
                {file
                  ? "Your image has been added. Click the Upload Image button below to finish."
                  : "Drop it here or use the file picker below."}
              </p>
              <button className="action-button" type="button" disabled={uploading}>
                {file ? "Choose a Different Image" : "Choose Image"}
              </button>
              <input
                ref={fileInputRef}
                className="sr-only-input"
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                onChange={(event) => handleFileSelect(event.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>
          </label>
        </div>

        {file && (
          <p className="small">
            Selected: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}

        {error && <p className="small" style={{ color: "crimson" }}>{error}</p>}

        <div style={{ marginTop: 12 }}>
          <button
            className={`action-button${file && !uploading ? " ready-button" : ""}`}
            type="submit"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : file ? "✓ Click to Upload Image" : "Upload Image"}
          </button>
          <Link to="/images" style={{ marginLeft: 12 }}>Back to images</Link>
        </div>
      </form>

      {result && (
        <div className="story-card" style={{ marginTop: 16 }}>
          <h3>Upload Complete</h3>
          <p className="small">Use this image URL in the editor:</p>
          <p>
            <code>{result.url}</code>
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button className="action-button" type="button" onClick={() => copyText(result.url)}>
              Copy URL
            </button>
            <button className="action-button" type="button" onClick={() => copyText(result.html)}>
              Copy HTML
            </button>
          </div>
          <img
            src={result.url}
            alt={result.filename}
            style={{ maxWidth: "100%", borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }}
          />
        </div>
      )}
    </div>
  );
}
