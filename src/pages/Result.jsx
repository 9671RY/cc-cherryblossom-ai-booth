import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Share2, Download, Home } from 'lucide-react';

const ResultCard = ({ title, imgData, isLoading, stepName, activeText, onSave, onShare }) => (
  <div style={{ width: '100%', maxWidth: '350px', margin: '0 auto 3rem auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
    <h3 style={{ color: 'var(--primary)', textAlign: 'center', fontSize: '1.2rem' }}>{title}</h3>
    <div style={{ width: '100%', aspectRatio: '1/1', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', borderRadius: 'var(--border-radius)', overflow: 'hidden', backgroundColor: 'var(--gray-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', color: '#888' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ fontSize: '0.9rem' }}>{activeText}</p>
        </div>
      ) : imgData ? (
        <img src={imgData} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ color: '#ccc', fontSize: '0.9rem' }}>대기 중...</div>
      )}
    </div>
    
    {imgData && (
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="secondary" onClick={() => onSave(imgData, stepName)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem', padding: '10px' }}>
          <Download size={18} /> 저장
        </button>
        <button className="primary" onClick={() => onShare(imgData, stepName)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem', padding: '10px' }}>
          <Share2 size={18} /> 공유
        </button>
      </div>
    )}
  </div>
);

function Result() {
  const navigate = useNavigate();
  const { photoData } = useContext(AppContext);
  
  const [images, setImages] = useState({
    step1: null,
    step2: null,
    step3: null
  });
  
  const [loading, setLoading] = useState({
    step1: true,
    step2: false,
    step3: false
  });
  
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!photoData.uploadId || !photoData.imageBase64) {
      navigate('/');
      return;
    }

    let isMounted = true;

    const runSteps = async () => {
      try {
        // --- Step 1 ---
        const res1 = await fetch('/api/generate/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId: photoData.uploadId,
            imageBase64: photoData.imageBase64,
            mimeType: photoData.mimeType
          })
        });
        if (!res1.ok) throw new Error("Step 1 Failed");
        const data1 = await res1.json();
        const img1Base64 = data1.result1Base64;
        
        if (!isMounted) return;
        setImages(prev => ({ ...prev, step1: `data:image/jpeg;base64,${img1Base64}` }));
        setLoading(prev => ({ ...prev, step1: false, step2: true }));

        // --- Step 2 ---
        const res2 = await fetch('/api/generate/step2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId: photoData.uploadId,
            imageBase64: img1Base64,
            mimeType: "image/jpeg"
          })
        });
        if (!res2.ok) throw new Error("Step 2 Failed");
        const data2 = await res2.json();
        const img2Base64 = data2.result2Base64;
        
        if (!isMounted) return;
        setImages(prev => ({ ...prev, step2: `data:image/jpeg;base64,${img2Base64}` }));
        setLoading(prev => ({ ...prev, step2: false, step3: true }));

        // --- Step 3 ---
        const res3 = await fetch('/api/generate/step3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId: photoData.uploadId,
            imageBase64: img2Base64,
            mimeType: "image/jpeg"
          })
        });
        if (!res3.ok) throw new Error("Step 3 Failed");
        const data3 = await res3.json();
        const img3Base64 = data3.result3Base64;
        
        if (!isMounted) return;
        setImages(prev => ({ ...prev, step3: `data:image/jpeg;base64,${img3Base64}` }));
        setLoading(prev => ({ ...prev, step3: false }));

      } catch (err) {
        console.error("Step Execution Error:", err);
        if (isMounted) {
          setError("이미지 생성 중 문제가 발생했습니다.");
          setLoading({ step1: false, step2: false, step3: false });
        }
      }
    };

    runSteps();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async (imgDataUrl, stepName) => {
    if (navigator.share && imgDataUrl) {
      try {
        fetch(`/api/share/${photoData.uploadId}`, { method: 'POST' });
        const response = await fetch(imgDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `cherryblossom-${stepName}.jpg`, { type: 'image/jpeg' });
        
        await navigator.share({
          title: '서초 양재천 벚꽃등축제',
          text: `마스코트 꽃등이 AI 변신!`,
          files: [file]
        });
      } catch (error) {
        console.error('공유 실패:', error);
      }
    } else {
      alert("현재 환경에서는 기본 공유를 지원하지 않거나 파일이 비었습니다.");
      fetch(`/api/share/${photoData.uploadId}`, { method: 'POST' });
    }
  };

  const handleSave = (imgDataUrl, stepName) => {
    if (!imgDataUrl) return;
    const link = document.createElement('a');
    link.href = imgDataUrl;
    link.download = `꽃등이-${stepName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" style={{ position: 'relative', padding: '20px 0 60px 0', overflowX: 'hidden' }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', zIndex: 10 }}>
        <Home size={28} />
      </button>

      <h1 style={{ color: 'var(--primary)', marginBottom: '1rem', marginTop: '10px', textAlign: 'center', fontSize: '1.8rem' }}>
        AI 벚꽃등 변신<br/>결과물
      </h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666', fontSize: '0.9rem' }}>아래로 스크롤하여 3단계 변신을 확인하세요!</p>

      {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '20px', padding: '10px', backgroundColor: '#ffebe9', borderRadius: '8px' }}>{error}</div>}

      <ResultCard 
        title="1. 실사 합성 (원본 Redraw)" 
        imgData={images.step1} 
        isLoading={loading.step1} 
        stepName="step1"
        activeText="꽃등이가 어깨에 올라타는 중..."
        onSave={handleSave}
        onShare={handleShare}
      />

      <ResultCard 
        title="2. 컬러링 북 아트" 
        imgData={images.step2} 
        isLoading={loading.step2} 
        stepName="step2"
        activeText="아이들이 좋아하는 선화로 바꾸는 중..."
        onSave={handleSave}
        onShare={handleShare}
      />

      <ResultCard 
        title="3. 윤곽선 없는 수채화" 
        imgData={images.step3} 
        isLoading={loading.step3} 
        stepName="step3"
        activeText="수채화 물감을 조심스럽게 칠하는 중..."
        onSave={handleSave}
        onShare={handleShare}
      />
    </div>
  );
}

export default Result;
