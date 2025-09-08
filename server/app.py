from flask import Flask, jsonify, request, abort
from flask_cors import CORS
import threading
import json
import os
import uuid

app = Flask(__name__)
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), "stories.json")
lock = threading.Lock()

def load_stories():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_stories(stories):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(stories, f, ensure_ascii=False, indent=2)

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

    if not title or not content:
        abort(400, description="Missing required fields: title and content")

    new_story = {
        "id": uuid.uuid4().hex,
        "title": title,
        "excerpt": excerpt or (content[:140] + ("…" if len(content) > 140 else "")),
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
        filtered = [s for s in stories if s.get("id") != story_id]
        if len(filtered) == len(stories):
            abort(404, description="Story not found")
        save_stories(filtered)
    return "", 204

if __name__ == "__main__":
    # default port 4000 to match client examples
    app.run(host="0.0.0.0", port=4000, debug=True)