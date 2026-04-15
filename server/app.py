#!/usr/bin/env python3
# For cgi-bin debugging:
# import cgitb
# cgitb.enable()
# print("Content-Type: text/plain\n")

from flask import Flask, jsonify, request, abort, render_template, redirect, url_for
from flask_cors import CORS
import threading
import json
import os
import time
import uuid
import base64
import re
from datetime import datetime
from functools import wraps
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "mary")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "mary")

def _build_token(username, password):
    raw = f"{username}:{password}".encode("utf-8")
    return base64.b64encode(raw).decode("utf-8")

VALID_TOKEN = _build_token(ADMIN_USERNAME, ADMIN_PASSWORD)

def _verify_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return False
    token = auth_header[len("Bearer "):]
    return token == VALID_TOKEN

@app.before_request
def authenticate_api():
    if request.method == "OPTIONS" or not request.path.startswith("/api/"):
        return None
    if request.path == "/api/login":
        return None
    if not _verify_token():
        return jsonify({"error": "Unauthorized"}), 401

@app.route("/api/login", methods=["POST"])
def login():
    if not request.is_json:
        abort(400, description="Expected application/json")
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return jsonify({"token": VALID_TOKEN})
    return jsonify({"error": "Invalid credentials"}), 401

DATA_FILE = os.path.join(os.path.dirname(__file__), "stories.json")
CONTENT_DIR = os.path.join(os.path.dirname(__file__), "story_texts")
RENDERED_DIR = os.path.join(os.path.dirname(__file__), "../public/stories")
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../public/uploads")
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
LOCK_FILE = DATA_FILE + ".lock"
LOCK_MODE = os.environ.get("STORY_LOCK_MODE", "file").lower()

class FileLock:
    def __init__(self, path, poll_interval=0.05):
        self.path = path
        self.fd = None
        self.poll_interval = poll_interval

    def acquire(self):
        while self.fd is None:
            try:
                self.fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_RDWR)
                os.write(self.fd, str(os.getpid()).encode("utf-8"))
                os.fsync(self.fd)
            except FileExistsError:
                time.sleep(self.poll_interval)
            except OSError:
                time.sleep(self.poll_interval)
        return self

    def release(self):
        if self.fd is not None:
            try:
                os.close(self.fd)
            except OSError:
                pass
            self.fd = None
        try:
            os.unlink(self.path)
        except FileNotFoundError:
            pass
        except OSError:
            pass

    def __enter__(self):
        return self.acquire()

    def __exit__(self, exc_type, exc_value, traceback):
        self.release()


def make_lock(mode="thread"):
    if mode == "file":
        return FileLock(LOCK_FILE)
    return threading.Lock()

lock = make_lock(LOCK_MODE)

def _ensure_content_dir():
    try:
        os.makedirs(CONTENT_DIR, exist_ok=True)
        os.makedirs(RENDERED_DIR, exist_ok=True)  # ensure rendered dir exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    except Exception:
        pass

def _build_public_url(*parts):
    base_path = (os.environ.get("VITE_APP_BASE") or "/").strip()
    if not base_path.startswith("/"):
        base_path = "/" + base_path
    if not base_path.endswith("/"):
        base_path += "/"
    suffix = "/".join(part.strip("/") for part in parts if part)
    return base_path + suffix

def _make_upload_filename(original_name):
    safe_name = secure_filename(original_name or "image")
    stem, ext = os.path.splitext(safe_name)
    ext = ext.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        abort(400, description="Unsupported image type")
    clean_stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", stem).strip("-") or "image"
    return f"{clean_stem}-{uuid.uuid4().hex[:8]}{ext}"

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

def generate_published_pages(stories):
    """
    Remove existing rendered HTML files and render one HTML page per published story
    using templates/story_template.html. Expects stories to include 'content', 'title', 'date', 'id' and 'published'.
    """
    _ensure_content_dir()
    # clean existing rendered html files
    try:
        for fname in os.listdir(RENDERED_DIR):
            if fname.endswith(".html"):
                try:
                    os.remove(os.path.join(RENDERED_DIR, fname))
                except Exception:
                    pass
    except FileNotFoundError:
        os.makedirs(RENDERED_DIR, exist_ok=True)
    # render each published story
    for s in stories:
        pub = s.get("published")
        # treat explicit false/"false" as not published; everything else -> published
        if pub is False or (isinstance(pub, str) and pub.lower() == "false"):
            continue

        content = _read_content_file(s.get("content_file"))
        title = s.get("title", "")
        date = s.get("date", "")
        rendered = render_template("story_template.html", title=title, date=date, content=content)
        out_path = os.path.join(RENDERED_DIR, f"{s.get('id')}.html")
        try:
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(rendered)
        except Exception:
            pass

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
        # ensure field remains if present, otherwise give it a default
        story["date"] = story.get("date", "")
        story["published"] = story.get("published", True)
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
        # ensure key exists (default string if missing)
        if "date" not in meta:
            meta["date"] = s.get("date", "")
        if "published" not in meta:
            meta["published"] = s.get("published", True)
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

    # regenerate published HTML pages from the provided stories (uses in-memory content)
    try:
        generate_published_pages(stories)
        generate_index_page(stories)
    except Exception:
        pass

# add index generator below the published pages generator
def generate_index_page(stories):
    """
    Render a single index/listing page from templates/story_list_template.html
    and write it into the RENDERED_DIR as index.html.
    """
    _ensure_content_dir()

    # Loop through stories to reformat dates before rendering
    for story in stories:
        # Check if the story has a date to process
        if 'date' in story and story['date']:
            try:
                # Parse the date from YYYY-MM-DD format
                date_obj = datetime.strptime(story['date'], '%Y-%m-%d')
                # Format it into "Month day, year" and update the story
                story['date'] = date_obj.strftime('%B %d, %Y')
            except (ValueError, TypeError):
                # If date format is invalid or not a string, leave it as is.
                # print(f"Warning: Could not parse date for story '{story.get('title', 'Unknown')}'.")
                pass    
    try:
        # Render the template with the full stories list 
        rendered = render_template("story_list_template.html", stories=stories)
        out_path = os.path.join(RENDERED_DIR, "prev_posts.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(rendered)
    except Exception:
        # no-op on failure
        pass

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
    published = data.get("published")

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
        "published": published,
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
    published = data.get("published")

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
        story["published"] = published
        # keep story["content"] for response
        story["content"] = content

        # print(f"update_story: here4 {jsonify(story)}")

        save_stories(stories)

    return jsonify(story)

@app.route("/api/images", methods=["POST"])
def upload_image():
    image = request.files.get("image")
    if image is None or not image.filename:
        return jsonify({"error": "Missing image file"}), 400

    filename = _make_upload_filename(image.filename)
    _ensure_content_dir()
    destination = os.path.join(UPLOAD_DIR, filename)

    try:
        image.save(destination)
    except Exception:
        abort(500, description="Failed to save image")

    url = _build_public_url("uploads", filename)
    return jsonify({
        "filename": filename,
        "url": url,
        "html": f'<img src="{url}" alt="" />'
    }), 201

@app.route("/api/images", methods=["GET"])
def list_images():
    _ensure_content_dir()

    try:
        filenames = os.listdir(UPLOAD_DIR)
    except FileNotFoundError:
        filenames = []

    image_entries = []
    for filename in filenames:
        path = os.path.join(UPLOAD_DIR, filename)
        if not os.path.isfile(path):
            continue

        _, ext = os.path.splitext(filename)
        if ext.lower() not in ALLOWED_IMAGE_EXTENSIONS:
            continue

        try:
            modified_time = os.path.getmtime(path)
        except OSError:
            modified_time = 0

        image_entries.append((modified_time, filename))

    image_entries.sort(key=lambda entry: entry[0], reverse=True)

    images = []
    for _, filename in image_entries:
        path = os.path.join(UPLOAD_DIR, filename)

        images.append({
            "filename": filename,
            "url": _build_public_url("uploads", filename)
        })

    return jsonify(images)

@app.route("/edit/<story_id>")
def edit_page(story_id):
    return render_template("edit.html", story_id=story_id)

@app.route('/test')
def test():
    return "hello <b>world</b>"

def is_cgi():
    """
    Detect if running under CGI (HostGator cgi-bin or similar).
    """
    return "GATEWAY_INTERFACE" in os.environ

if __name__ == "__main__":
    if is_cgi():
        # Running under Apache CGI (HostGator shared hosting)
        from wsgiref.handlers import CGIHandler
        CGIHandler().run(app)
    else:
        # Running locally (development mode), default port 4000 to match client examples
        app.run(host="0.0.0.0", port=4000, debug=True)
