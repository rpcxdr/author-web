import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStory, updateStory } from "../data/storyService";
import CKEditorDemo from "./Editor";

export default function EditStory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [date, setDate] = useState("");
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
        setDate(data.date || "");
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

    const payload = { title: title.trim(), excerpt: excerpt.trim(), content, date: (date || "").trim() };
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
            <div>Excerpt</div>

            <textarea 
              value={excerpt} 
              onChange={e => setExcerpt(e.target.value)} 
              rows={2} />
          </label>
        </p>
        <p>
          <label>
            <div>Date</div>
            <input value={date} onChange={e => setDate(e.target.value)} placeholder="YYYY-MM-DD or free-form" />
          </label>
        </p>
        <p>
          <label>
            Content
            <CKEditorDemo 
              value={content} 
              onChange={(val) => setContent(val)}
            ></CKEditorDemo>
          </label>
        </p>
        <div>
          <button class="action-button" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button class="action-button" type="button" onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
