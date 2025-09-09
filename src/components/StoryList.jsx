import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStories, removeStory } from '../data/storyService';

export default function StoryList() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getStories();
        if (mounted) setStories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load stories', err);
        if (mounted) setStories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this story?')) return;
    setDeleting(id);
    try {
      await removeStory(id);
      setStories(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete story');
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <div className="center small">Loading stories…</div>;

  return (
    <div className="story-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Stories</h2>
        <Link to="/upload" className="action-button">+ New Story</Link>
      </div>

      {stories.length === 0 ? (
        <p className="small">No stories yet.</p>
      ) : (
        stories.map(story => (
          <article key={story.id} className="story-card">
            <h3><Link to={`/stories/${story.id}`}>{story.title}</Link></h3>
            <p>{story.excerpt}</p>
            <div>
              <Link className="action-button" to={`/edit/${story.id}`} style={{ marginRight: 8 }}>
                Edit
              </Link>
              <button
                className="action-button"
                onClick={() => handleDelete(story.id)}
                disabled={deleting === story.id}
                style={{ marginRight: 8 }}
                type="button"
              >
                {deleting === story.id ? 'Deleting…' : 'Delete'}
              </button>
              <Link className="action-button" to={`/stories/${story.id}`}>Read full story</Link>
            </div>
          </article>
        ))
      )}
    </div>
  );
}