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
      if (!photoData.originalFile) {
        navigate('/');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('image', photoData.originalFile);

        const response = await fetch('/api/process', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('API 호출에 실패했습니다.');
        }

        const data = await response.json();
        
        // Context 업데이트 후 바로 Result로 이동
        setPhotoData(prev => ({
          ...prev,
          uploadId: data.uploadId,
          coordinates: { x: data.x, y: data.y, side: data.side }
        }));
        
        navigate('/result');

      } catch (err) {
        console.error(err);
        setError("이미지를 처리하는 중 문제가 발생했습니다.");
      }
    };

    processImage();

    return () => clearInterval(textInterval);
  }, [photoData.originalFile, navigate, setPhotoData]);

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
