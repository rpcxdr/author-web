import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addStory } from '../data/storyService';
import CKEditorDemo from "./Editor";

export default function UploadStory() {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSaving(true);
    try {
      const newStory = await addStory({
        title: title.trim(),
        excerpt: excerpt.trim() || content.trim().slice(0, 140),
        content: content.trim()
      });
      navigate(`/stories/${newStory.id}`);
    } catch (err) {
      console.error('addStory failed', err);
      setError('Failed to publish story. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="upload-page">
      <h2>Upload a New Story</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div>
          <label>
            <div>Title</div>
            <input value={title} onChange={e => setTitle(e.target.value)} required disabled={saving} />
          </label>
        </div>
        <div>
          <label>
            <div>Excerpt (optional)</div>
            <textarea 
              value={excerpt} onChange={e => setExcerpt(e.target.value)} 
              rows={2} disabled={saving} 
            />
          </label>
        </div>
        <div>
        <label>
          <div>Content</div> 
          <CKEditorDemo 
            value={content} 
            onChange={(val) => setContent(val)}
          ></CKEditorDemo>
          </label>
        </div>
        {error && <p className="small" style={{ color: 'crimson' }}>{error}</p>}

        <div style={{ marginTop: 12 }}>
          <button
            className="action-button" 
            type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add New Story'}
          </button>
          <Link to="/" style={{ marginLeft: 12 }}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}