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
    if (!photoData.uploadId) {
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
            prompt: photoData.textPrompt
          })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Image Generation Failed");
        }
        
        const data = await res.json();
        
        if (!isMounted) return;
        setResultImg(`data:image/jpeg;base64,${data.result1Base64}`);
        setIsLoading(false);

      } catch (err) {
        console.error("Execution Error:", err);
        if (isMounted) {
          setError(`서버 에러가 발생했습니다: ${err.message}. API 키 권한(403)이나 한도(429) 문제일 수 있습니다.`);
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
        const mascotStr = photoData.mascotName || '꽃등이';
        const file = new File([blob], `cherryblossom-${mascotStr}.jpg`, { type: 'image/jpeg' });
        
        await navigator.share({
          title: '서초 양재 벚꽃등축제',
          text: `올해 벚꽃축제는 서초문화원 양재벚꽃축제다.\n볼거리 먹거리 놀거리 최고 #서초문화원 #주식회사문화콘텐츠 #서초양재벚꽃등축제 #${mascotStr} #귀엽 #애니모먼트 #ai`,
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
    link.download = `꿀잼-${photoData.mascotName || '꽃등이'}-합성.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" style={{ position: 'relative', padding: '20px 15px', overflowX: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', zIndex: 10 }}>
        <Home size={28} />
      </button>

      <h1 style={{ color: 'var(--primary)', marginBottom: '1rem', marginTop: '10px', textAlign: 'center', fontSize: '1.25rem', width: '100%', fontWeight: '500' }}>
        축제를 함께 해주셔서 감사합니다 🌸
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
                  문화콘텐츠 스태프들이<br/>{photoData.mascotName || '꽃등이'}(을)를 불러오고 있어요
                </p>
              </div>
            ) : resultImg ? (
              <img src={resultImg} alt="결과" style={{ width: '100%', height: 'auto', display: 'block' }} />
            ) : null}
          </div>
          
          {/* 해시태그 복사 영역 */}
          <div 
            style={{ 
              fontSize: '0.75rem', 
              color: '#666', 
              textAlign: 'center', 
              marginBottom: '10px', 
              padding: '8px', 
              backgroundColor: '#f1f1f1', 
              borderRadius: '4px', 
              cursor: 'pointer',
              lineHeight: '1.4'
            }}
            onClick={() => {
              navigator.clipboard.writeText(`#서초문화원 #주식회사문화콘텐츠 #서초양재벚꽃등축제 #${photoData.mascotName || '꽃등이'} #귀엽 #애니모먼트 #ai`);
              alert("해시태그가 복사되었습니다!");
            }}
          >
            #서초문화원 #주식회사문화콘텐츠 #서초양재벚꽃등축제<br/>#{photoData.mascotName || '꽃등이'} #귀엽 #애니모먼트 #ai<br/>
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>(클릭하여 복사)</span>
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
