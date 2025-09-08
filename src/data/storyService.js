import defaultStories from './stories';

const STORAGE_KEY = 'author_web_stories_cache';
const API_BASE = process.env.REACT_APP_API_BASE || ''; // e.g. set to 'http://localhost:4000' if needed

async function fetchJson(path, options) {
  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

function loadFromCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStories));
      return [...defaultStories];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read stories from cache', e);
    return [...defaultStories];
  }
}

function saveToCache(stories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch (e) {
    console.error('Failed to save stories to cache', e);
  }
}

// Public API: these functions talk to the server and fall back to local cache if server is unavailable.

export async function getStories() {
  try {
    const data = await fetchJson('/stories', { method: 'GET' });
    // keep a local cache for offline/fallback
    saveToCache(data);
    return data;
  } catch (e) {
    console.warn('getStories: server fetch failed, falling back to cache', e);
    return loadFromCache();
  }
}

export async function getStory(id) {
  try {
    const data = await fetchJson(`/stories/${encodeURIComponent(id)}`, { method: 'GET' });
    return data;
  } catch (e) {
    console.warn(`getStory(${id}): server fetch failed, falling back to cache`, e);
    return loadFromCache().find(s => s.id === id) || null;
  }
}

export async function addStory({ title, excerpt, content }) {
  const body = { title, excerpt, content };
  try {
    const created = await fetchJson('/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // update cache
    const cache = loadFromCache();
    cache.unshift(created);
    saveToCache(cache);
    return created;
  } catch (e) {
    console.warn('addStory: server save failed, saving to cache', e);
    // fallback: create locally with timestamp id
    const id = String(Date.now());
    const story = { id, title, excerpt, content };
    const cache = loadFromCache();
    cache.unshift(story);
    saveToCache(cache);
    return story;
  }
}

export async function removeStory(id) {
  try {
    await fetchJson(`/stories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    // update cache
    const cache = loadFromCache().filter(s => s.id !== id);
    saveToCache(cache);
  } catch (e) {
    console.warn(`removeStory(${id}): server delete failed, removing from cache`, e);
    const cache = loadFromCache().filter(s => s.id !== id);
    saveToCache(cache);
  }
}