import React from "react";
import { Routes, Route } from "react-router-dom";
import StoryList from "./components/StoryList";
import StoryDetail from "./components/StoryDetail";
import UploadStory from "./components/UploadStory";
import EditStory from "./components/EditStory";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StoryList />} />
      <Route path="/stories/:id" element={<StoryDetail />} />
      <Route path="/upload" element={<UploadStory />} />
      <Route path="/edit/:id" element={<EditStory />} />
    </Routes>
  );
}