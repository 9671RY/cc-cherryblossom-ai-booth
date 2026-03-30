import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Sparkles } from 'lucide-react';

function Upload() {
  const navigate = useNavigate();
  const { setPhotoData } = useContext(AppContext);
  const [inputText, setInputText] = useState('');

  const handleSubmit = () => {
    if (!inputText.trim()) {
      alert('원하는 이미지의 모습을 텍스트로 적어주세요!');
      return;
    }
    
    setPhotoData(prev => ({
      ...prev,
      originalFile: null,
      originalUrl: null,
      uploadId: null,
      coordinates: null,
      textPrompt: inputText.trim()
    }));
    
    navigate('/loading');
  };

  return (
    <div className="page-container" style={{ padding: '20px 15px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '1.5rem', marginTop: '1rem', fontSize: '1.8rem', textAlign: 'center' }}>어떤 벚꽃등이 그림을 그릴까요?</h1>
      
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '320px', 
          backgroundColor: 'var(--gray-bg)', 
          borderRadius: 'var(--border-radius)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <Sparkles size={48} style={{ marginBottom: '16px', color: 'var(--primary)' }} />
        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', textAlign: 'center', marginBottom: '15px' }}>
          단어장이나 문장을 자유롭게 적어보세요.<br/>AI가 예쁜 벚꽃 캐릭터 그림을 만들어줍니다!
        </p>
        
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="예: 벚꽃 나무 아래에서 도시락을 먹는 귀여운 꽃등이 캐릭터"
          style={{
            width: '100%',
            height: '100px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            resize: 'none',
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <button 
        className="primary" 
        onClick={handleSubmit}
        style={{ padding: '15px 20px', width: '100%', maxWidth: '320px', fontSize: '1.05rem', fontWeight: 'bold' }}
      >
        그림 생성 시작
      </button>

      <button 
        className="secondary" 
        style={{ marginTop: '1rem', border: 'none', color: '#888', width: '100%', maxWidth: '320px', padding: '10px' }}
        onClick={() => navigate('/')}
      >
        뒤로 가기
      </button>
    </div>
  );
}

export default Upload;
