import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StoryList from "./components/StoryList";
import StoryDetail from "./components/StoryDetail";
import UploadStory from "./components/UploadStory";
import EditStory from "./components/EditStory";
import Login from "./components/Login";
import UploadImage from "./components/UploadImage";
import ImageList from "./components/ImageList";
import { isLoggedIn } from "./auth";

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><StoryList /></ProtectedRoute>} />
      <Route path="/stories/:id" element={<ProtectedRoute><StoryDetail /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><UploadStory /></ProtectedRoute>} />
      <Route path="/images" element={<ProtectedRoute><ImageList /></ProtectedRoute>} />
      <Route path="/image_upload" element={<ProtectedRoute><UploadImage /></ProtectedRoute>} />
      <Route path="/edit/:id" element={<ProtectedRoute><EditStory /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
