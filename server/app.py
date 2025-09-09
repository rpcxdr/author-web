from flask import Flask, jsonify, request, abort, render_template, redirect, url_for
from flask_cors import CORS
import threading
import json
import os
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), "stories.json")
CONTENT_DIR = os.path.join(os.path.dirname(__file__), "story_texts")
lock = threading.Lock()

def _ensure_content_dir():
    try:
        os.makedirs(CONTENT_DIR, exist_ok=True)
    except Exception:
        pass

def _write_content_file(filename, text):
    _ensure_content_dir()
    path = os.path.join(CONTENT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

def _read_content_file(filename):
    path = os.path.join(CONTENT_DIR, filename)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return ""

def load_stories():
    """
    Loads metadata from stories.json and attaches 'content' for each story by
    reading the separate content file referenced by 'content_file'. If an entry
    has inline 'content' but no 'content_file' we migrate it to a new file and
    update metadata on disk.
    """
    if not os.path.exists(DATA_FILE):
        return []

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
    except Exception:
        return []

    changed = False
    stories = []
    for s in raw:
        story = dict(s)  # copy
        # ensure date field remains if present, otherwise set empty string
        story["date"] = story.get("date", "")
        content = ""
        content_file = story.get("content_file")
        if content_file:
            content = _read_content_file(content_file)
        story["content"] = content
        stories.append(story)

    return stories

def save_stories(stories):
    """
    Persists story metadata to stories.json. Excludes the in-memory 'content'
    field; ensures 'content_file' is present when possible.
    """
    to_save = []
    for s in stories:
        meta = {k: v for k, v in s.items() if k != "content"}
        # ensure date key exists (empty string if missing)
        if "date" not in meta:
            meta["date"] = s.get("date", "")
        if "content_file" not in meta and "content" in s:
            try:
                fname = s.get("id", uuid.uuid4().hex) + ".txt"
                _write_content_file(fname, s["content"])
                meta["content_file"] = fname
            except Exception:
                pass
        to_save.append(meta)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(to_save, f, ensure_ascii=False, indent=2)

@app.route("/api/stories", methods=["GET"])
def list_stories():
    with lock:
        stories = load_stories()
    return jsonify(stories)

@app.route("/api/stories/<story_id>", methods=["GET"])
def get_story(story_id):
    with lock:
        stories = load_stories()
    story = next((s for s in stories if s.get("id") == story_id), None)
    if not story:
        abort(404, description="Story not found")
    return jsonify(story)

@app.route("/api/stories", methods=["POST"])
def create_story():
    if not request.is_json:
        abort(400, description="Expected application/json")
    data = request.get_json()
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    excerpt = (data.get("excerpt") or "").strip()
    date = (data.get("date") or "").strip()

    if not title or not content:
        abort(400, description="Missing required fields: title and content")

    new_id = uuid.uuid4().hex
    filename = new_id + ".txt"

    try:
        _write_content_file(filename, content)
    except Exception:
        abort(500, description="Failed to write story content file")

    new_story = {
        "id": new_id,
        "title": title,
        "excerpt": excerpt or (content[:140] + ("…" if len(content) > 140 else "")),
        "content_file": filename,
        "date": date or datetime.utcnow().date().isoformat(),
        "content": content
    }

    with lock:
        stories = load_stories()
        stories.insert(0, new_story)
        save_stories(stories)

    return jsonify(new_story), 201

@app.route("/api/stories/<story_id>", methods=["DELETE"])
def delete_story(story_id):
    with lock:
        stories = load_stories()
        target = next((s for s in stories if s.get("id") == story_id), None)
        if not target:
            abort(404, description="Story not found")
        filtered = [s for s in stories if s.get("id") != story_id]
        # attempt to remove associated content file
        content_file = target.get("content_file")
        if content_file:
            try:
                path = os.path.join(CONTENT_DIR, content_file)
                if os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
        save_stories(filtered)
    return "", 204

@app.route("/api/stories/<story_id>", methods=["PUT"])
def update_story(story_id):
    if not request.is_json:
        abort(400, description="Expected application/json")
    data = request.get_json()
    title = (data.get("title") or "").strip()
    content = data.get("content") or ""
    excerpt = (data.get("excerpt") or "").strip()
    date = (data.get("date") or "").strip()

    if not title or not content:
        abort(400, description="Missing required fields: title and content")

    with lock:
        stories = load_stories()
        story = next((s for s in stories if s.get("id") == story_id), None)
        if not story:
            abort(404, description="Story not found")
        # update content file if present
        content_file = story.get("content_file")
        if content_file:
            try:
                _write_content_file(content_file, content)
            except Exception:
                abort(500, description="Failed to write content file")
        # update metadata
        story["title"] = title
        story["excerpt"] = excerpt or (content[:140] + ("…" if len(content) > 140 else ""))
        story["date"] = date or story.get("date", datetime.utcnow().date().isoformat())
        # keep story["content"] for response
        story["content"] = content
        save_stories(stories)

    return jsonify(story)

@app.route("/edit/<story_id>")
def edit_page(story_id):
    return render_template("edit.html", story_id=story_id)

if __name__ == "__main__":
    # default port 4000 to match client examples
    app.run(host="0.0.0.0", port=4000, debug=True)