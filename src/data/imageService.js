import { getAuthHeaders } from "../auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function parseJson(res) {
  return res.json().catch(() => ({}));
}

export async function getImages() {
  const res = await fetch(`${API_BASE}/api/images`, {
    method: "GET",
    headers: { ...getAuthHeaders() },
  });

  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(body.error || "Failed to load images");
  }
  return Array.isArray(body) ? body : [];
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE}/api/images`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
  });

  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(body.error || "Image upload failed");
  }
  return body;
}
