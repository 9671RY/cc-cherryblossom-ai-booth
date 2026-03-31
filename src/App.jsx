import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Loading from './pages/Loading';
import Result from './pages/Result';
import Admin from './pages/Admin';

export const AppContext = React.createContext(null);

function App() {
  const [photoData, setPhotoData] = useState({
    originalFile: null,
    originalUrl: null,
    uploadId: null,
    coordinates: null, // {x, y, side}
    textPrompt: '',
    mascotName: '꽃등이',
    providerName: null,
    providerPhone: null
  });

  return (
    <AppContext.Provider value={{ photoData, setPhotoData }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/result" element={<Result />} />
          <Route path="/admin-secret" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
