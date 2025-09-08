import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStory, updateStory } from "../data/storyService";

export default function EditStory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getStory(id);
        if (!mounted) return;
        setTitle(data.title || "");
        setExcerpt(data.excerpt || "");
        setContent(data.content || "");
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load story");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { title: title.trim(), excerpt: excerpt.trim(), content };
    try {
      await updateStory(id, payload);
      navigate("/");
    } catch (err) {
      setError((err && (err.message || err.description)) || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="center small">Loading story…</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div className="edit-page">
      <h2>Edit Story</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Excerpt
            <input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Content
            <textarea
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}