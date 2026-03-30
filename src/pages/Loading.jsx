import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';

function Loading() {
  const navigate = useNavigate();
  const { photoData, setPhotoData } = useContext(AppContext);
  const [loadingText, setLoadingText] = useState("잠시만 기다려 주세요...");
  const [error, setError] = useState(null);

  useEffect(() => {
    // 텍스트 전환 애니메이션 처리
    const textInterval = setInterval(() => {
      setLoadingText(prev => 
        prev === "잠시만 기다려 주세요..." ? "꽃등이가 달려오고 있어요!" : "잠시만 기다려 주세요..."
      );
    }, 3000);

    const processImage = async () => {
      if (!photoData.textPrompt) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: photoData.textPrompt }),
        });

        if (!response.ok) {
          throw new Error('API 호출에 실패했습니다.');
        }

        const data = await response.json();

        setPhotoData(prev => ({
          ...prev,
          uploadId: data.uploadId,
          originalUrl: data.originalUrl
        }));
        navigate('/result');

      } catch (err) {
        console.error(err);
        setError("데이터를 처리하는 중 문제가 발생했습니다.");
      }
    };

    processImage();

    return () => clearInterval(textInterval);
  }, [photoData.textPrompt, navigate, setPhotoData]);

  if (error) {
    return (
      <div className="page-container">
        <h2 style={{ color: 'red', marginBottom: '2rem' }}>오류 발생</h2>
        <p style={{ marginBottom: '2rem' }}>{error}</p>
        <button className="secondary" onClick={() => navigate('/upload')}>다시 시도하기</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="loader-container">
        <div className="spinner"></div>
        <img 
          src="/꽃등이.jpg" 
          alt="loading mascot" 
          style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
          className="spinner-icon" 
        />
      </div>
      <p className="fade-text" style={{ marginTop: '20px' }}>
        {loadingText}
      </p>
    </div>
  );
}

export default Loading;
