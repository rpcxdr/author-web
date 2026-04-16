import React from "react";
import { Link } from "react-router-dom";
import ImageUploader from "./ImageUploader";

export default function UploadImage() {
  return (
    <div className="upload-page">
      <h2>Upload an Image</h2>
      <p>
        <Link to="/images">View uploaded images</Link>
      </p>
      <ImageUploader title={null} />
      <p style={{ marginTop: 12 }}>
        <Link to="/images">Back to images</Link>
      </p>
    </div>
  );
}
