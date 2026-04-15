import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getImages } from "../data/imageService";

export default function ImageList() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getImages();
        if (mounted) {
          setImages(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load images");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function copyUrl(url) {
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  }

  if (loading) {
    return <div className="center small">Loading images...</div>;
  }

  if (error) {
    return <div className="center small" style={{ color: "crimson" }}>{error}</div>;
  }

  return (
    <div className="story-list">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <h2>Images</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/image_upload" className="action-button">Upload Image</Link>
          <Link to="/" className="action-button">Back to stories</Link>
        </div>
      </div>

      {images.length === 0 ? (
        <p className="small">No images uploaded yet.</p>
      ) : (
        images.map((image) => (
          <article key={image.filename} className="story-card">
            <h3>{image.filename}</h3>
            <div className="image-preview-wrap">
              <img className="image-preview" src={image.url} alt={image.filename} />
            </div>
            <p className="small">
              <code>{image.url}</code>
            </p>
            <button className="action-button" type="button" onClick={() => copyUrl(image.url)}>
              Copy URL
            </button>
          </article>
        ))
      )}
    </div>
  );
}
