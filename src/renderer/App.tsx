import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/AppLayout';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import ReviewPage from './pages/ReviewPage';
import TodayPage from './pages/TodayPage';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
