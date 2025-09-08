import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStory } from '../data/storyService';
import DOMPurify from "dompurify";
export default function StoryDetail() {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await getStory(id);
        if (mounted) setStory(s);
      } catch (err) {
        console.error('getStory failed', err);
        if (mounted) setError('Failed to load story.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="center small">Loading…</div>;
  if (error) return (
    <div>
      <p className="small">{error}</p>
      <p><Link to="/">Back to list</Link></p>
    </div>
  );
  if (!story) return (
    <div>
      <p>Story not found.</p>
      <p><Link to="/">Back to list</Link></p>
    </div>
  );

  return (
    <article className="story-detail">
      <h2>{story.title}</h2>
      <div className="content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(story.content) }} />
      <p><Link to="/">← Back to stories</Link></p>
    </article>
  );
}