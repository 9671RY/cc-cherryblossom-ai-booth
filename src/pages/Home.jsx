import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ gap: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', lineHeight: '1.5' }}>
          <span style={{ color: '#222' }}>2026 서초 양재천</span><br/>
          <span style={{ color: 'var(--primary)' }}>벚꽃등 축제</span><br/>
          <span style={{ color: '#222' }}>마스코트 꽃등이</span>
        </h1>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '500' }}>
          우리 축제 마스코트 꽃등이 업어가세요
        </h2>
      </div>

      <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <img 
          src="/꽃등이.jpg" 
          alt="꽃등이 캐릭터" 
          style={{ width: '100%', borderRadius: 'var(--border-radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} 
        />
      </div>

      <div style={{ width: '100%', marginTop: 'auto' }}>
        <button className="primary" onClick={() => navigate('/upload')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Sparkles size={20} />
          꽃등이 업어가기
        </button>
        
        <p className="notice">
          본 프로그램 이용 시 마케팅 활용 및 개인정보 수집에 동의하게 되며,<br/>데이터는 4월 30일 이후 파기됩니다.
        </p>
      </div>
    </div>
  );
}

export default Home;
