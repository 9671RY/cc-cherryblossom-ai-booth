import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Share2, Download, Home } from 'lucide-react';

function Result() {
  const navigate = useNavigate();
  const { photoData } = useContext(AppContext);
  const canvasRef = useRef(null);
  const [resultImg, setResultImg] = useState(null);
  const [isSynthesizing, setIsSynthesizing] = useState(true);

  useEffect(() => {
    if (!photoData.originalUrl || !photoData.coordinates) {
      // 데이터가 없으면 홈으로 (새로고침 방지)
      navigate('/');
      return;
    }

    const synthesizeImage = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const userImg = new Image();
      userImg.src = photoData.originalUrl;
      
      const mascotImg = new Image();
      // 사용할 마스코트 이미지 (jpg 혹은 png)
      mascotImg.src = '/꽃등이.jpg';

      await Promise.all([
        new Promise((resolve) => { userImg.onload = resolve; }),
        new Promise((resolve) => { mascotImg.onload = resolve; })
      ]);

      // 캔버스 크기를 원본 이미지에 맞춤
      canvas.width = userImg.width;
      canvas.height = userImg.height;

      // 원본 이미지 그리기
      ctx.drawImage(userImg, 0, 0);

      // 마스코트 합성 (Gemini가 반환한 x, y 좌표 및 스케일 조정)
      // 기준 크기를 원본사진 너비의 25% 정도로 잡는다고 가정
      const mascotScale = (userImg.width * 0.25) / mascotImg.width; 
      const mascotWidth = mascotImg.width * mascotScale;
      const mascotHeight = mascotImg.height * mascotScale;

      const { x, y } = photoData.coordinates;

      // 어깨 좌표를 중심으로 약간 위쪽에 캐릭터가 앉도록 오프셋 적용
      const targetX = x - (mascotWidth / 2);
      const targetY = y - (mascotHeight);

      // (선택사항) 투명도나 블렌딩 모드가 필요하다면: ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(mascotImg, targetX, targetY, mascotWidth, mascotHeight);

      // 결과 이미지를 Base64 혹은 Blob으로 추출
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setResultImg(dataUrl);

      // 합성 후 백엔드에 저장 (D1/R2)
      try {
        await fetch('/api/save-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId: photoData.uploadId,
            resultDataUrl: dataUrl
          })
        });
      } catch (err) {
        console.error("Result save error:", err);
      }

      setIsSynthesizing(false);
    };

    synthesizeImage();
  }, [photoData, navigate]);

  const handleShare = async () => {
    if (navigator.share && resultImg) {
      try {
        // 백엔드 통계용 호출
        fetch(`/api/share/${photoData.uploadId}`, { method: 'POST' });

        // 웹 공유 API
        const response = await fetch(resultImg);
        const blob = await response.blob();
        const file = new File([blob], 'cherryblossom.jpg', { type: 'image/jpeg' });
        
        await navigator.share({
          title: '서초 양재천 벚꽃등축제',
          text: '마스코트 꽃등이를 엎어왔어요!',
          files: [file]
        });
      } catch (error) {
        console.error('공유 실패:', error);
      }
    } else {
      alert("현재 브라우저에서는 공유 기능을 지원하지 않거나 이미지가 아직 준비되지 않았습니다.");
      // 백엔드 통계용 호출
      fetch(`/api/share/${photoData.uploadId}`, { method: 'POST' });
    }
  };

  const handleSave = () => {
    if (!resultImg) return;
    const link = document.createElement('a');
    link.href = resultImg;
    link.download = '꽃등이-엎어가기.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      {/* 홈 버튼 */}
      <button 
        onClick={() => navigate('/')}
        style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
      >
        <Home size={28} />
      </button>

      <h1 style={{ color: 'var(--primary)', marginBottom: '1.5rem', marginTop: '30px' }}>
        성공적으로<br/>엎어왔어요!
      </h1>
      
      <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto 2rem auto', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
        {/* 숨김 처리된 캔버스 */}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        
        {/* 실제 화면에 보여지는 결과 이미지 */}
        {isSynthesizing ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee' }}>
            마무리 작업 중...
          </div>
        ) : (
          <img src={resultImg} alt="결과" style={{ width: '100%', display: 'block' }} />
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '320px' }}>
        <button 
          className="secondary" 
          onClick={handleSave} 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Download size={20} />
          저장하기
        </button>
        <button 
          className="primary" 
          onClick={handleShare} 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Share2 size={20} />
          공유하기
        </button>
      </div>
    </div>
  );
}

export default Result;
