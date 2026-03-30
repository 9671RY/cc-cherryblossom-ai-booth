import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Share2, Download, Home } from 'lucide-react';

function Result() {
  const navigate = useNavigate();
  const { photoData } = useContext(AppContext);
  
  const [resultImg, setResultImg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!photoData.uploadId || !photoData.imageBase64) {
      navigate('/');
      return;
    }

    let isMounted = true;

    const runStep = async () => {
      try {
        const res = await fetch('/api/generate/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId: photoData.uploadId,
            imageBase64: photoData.imageBase64,
            mimeType: photoData.mimeType
          })
        });
        
        if (!res.ok) throw new Error("Image Generation Failed");
        const data = await res.json();
        
        if (!isMounted) return;
        setResultImg(`data:image/jpeg;base64,${data.result1Base64}`);
        setIsLoading(false);

      } catch (err) {
        console.error("Execution Error:", err);
        if (isMounted) {
          setError("이미지를 생성하는 데 실패했습니다. 앱 제한이나 모델 오류일 수 있습니다.");
          setIsLoading(false);
        }
      }
    };

    runStep();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  const handleShare = async () => {
    if (navigator.share && resultImg) {
      try {
        fetch(`/api/share/${photoData.uploadId}`, { method: 'POST' });
        const response = await fetch(resultImg);
        const blob = await response.blob();
        const file = new File([blob], `cherryblossom-waving.jpg`, { type: 'image/jpeg' });
        
        await navigator.share({
          title: '서초 양재천 벚꽃등축제',
          text: `내 어깨 위의 꽃등이를 확인해 보세요!`,
          files: [file]
        });
      } catch (error) {
        console.error('공유 실패:', error);
      }
    } else {
      alert("현재 모바일 환경이 아니거나 공유 기능을 지원하지 않습니다.");
      fetch(`/api/share/${photoData.uploadId}`, { method: 'POST' });
    }
  };

  const handleSave = () => {
    if (!resultImg) return;
    const link = document.createElement('a');
    link.href = resultImg;
    link.download = `꿀잼-꽃등이-합성.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" style={{ position: 'relative', padding: '20px 15px', overflowX: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', zIndex: 10 }}>
        <Home size={28} />
      </button>

      <h1 style={{ color: 'var(--primary)', marginBottom: '1rem', marginTop: '10px', textAlign: 'center', fontSize: '1.8rem', width: '100%' }}>
        짠! 꽃등이가<br/>놀러왔어요!
      </h1>

      {error ? (
        <div style={{ color: 'red', textAlign: 'center', margin: 'auto 0', padding: '15px', backgroundColor: '#ffebe9', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
          {error}
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', paddingBottom: '30px' }}>
          
          <div style={{ width: '100%', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', borderRadius: 'var(--border-radius)', overflow: 'hidden', backgroundColor: 'var(--gray-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px', marginBottom: '20px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', color: '#888', padding: '40px' }}>
                <div className="spinner" style={{ width: '50px', height: '50px' }}></div>
                <p style={{ fontSize: '1rem', textAlign: 'center', lineHeight: '1.4' }}>
                  AI가 사진 비율을 맞추고<br/>꽃등이를 앉히는 중입니다...
                </p>
              </div>
            ) : resultImg ? (
              <img src={resultImg} alt="결과" style={{ width: '100%', height: 'auto', display: 'block' }} />
            ) : null}
          </div>
          
          {/* 하단 모바일 최적화 버튼 50:50 정렬 */}
          <div style={{ display: 'flex', gap: '15px', width: '100%', marginTop: '5px' }}>
            <button 
              className="secondary" 
              onClick={handleSave} 
              disabled={isLoading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '15px 10px', fontSize: '1rem', fontWeight: 'bold' }}
            >
              <Download size={20} /> 저장하기
            </button>
            <button 
              className="primary" 
              onClick={handleShare} 
              disabled={isLoading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '15px 10px', fontSize: '1rem', fontWeight: 'bold' }}
            >
              <Share2 size={20} /> 공유하기
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default Result;
