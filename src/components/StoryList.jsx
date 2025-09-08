import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStories } from '../data/storyService';

export default function StoryList() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="center small">Loading stories…</div>;

  return (
    <div className="story-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Stories</h2>
        <Link to="/upload" className="read-more">+ New Story</Link>
      </div>

      {stories.length === 0 ? (
        <p className="small">No stories yet.</p>
      ) : (
        stories.map(story => (
          <article key={story.id} className="story-card">
            <h3><Link to={`/stories/${story.id}`}>{story.title}</Link></h3>
            <p>{story.excerpt}</p>
            <Link className="read-more" to={`/stories/${story.id}`}>Read full story →</Link>
          </article>
        ))
      )}
    </div>
  );
}