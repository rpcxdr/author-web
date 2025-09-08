import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import StoryList from './components/StoryList';
import StoryDetail from './components/StoryDetail';
import UploadStory from './components/UploadStory';

export default function App() {
  console.log(process.env.REACT_APP_API_BASE)
  return (
    <div className="app">
      <header>
        <h1><Link to="/">Author Stories</Link></h1>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<StoryList />} />
          <Route path="/stories/:id" element={<StoryDetail />} />
          <Route path="/upload" element={<UploadStory />} />
        </Routes>
      </main>
    </div>
  );
}