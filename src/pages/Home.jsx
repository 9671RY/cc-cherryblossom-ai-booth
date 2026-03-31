import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Sparkles } from 'lucide-react';

function Home() {
  const navigate = useNavigate();
  const { photoData, setPhotoData } = useContext(AppContext);

  const [inputName, setInputName] = useState('');
  const [step, setStep] = useState('main'); // 'main', 'modal', 'form'
  
  const [providerName, setProviderName] = useState('');
  const [phone1, setPhone1] = useState('010');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');

  const handlePropose = () => {
    if (!inputName.trim()) {
      alert('마스코트 이름을 입력해주세요!');
      return;
    }
    setStep('modal');
  };

  const handleGift = () => {
    if (window.confirm(`다음 축제 때 '${inputName}' 이/가 이름으로 사용될 시 출처를 표기하지 않아도 되는 것으로 간주됩니다.\n진행하시겠습니까?`)) {
      setPhotoData(prev => ({ ...prev, mascotName: inputName, providerName: null, providerPhone: null }));
      navigate('/upload');
    }
  };

  const handleGoForm = () => {
    setStep('form');
  };

  const handleSaveForm = () => {
    if (!providerName.trim() && !phone2.trim() && !phone3.trim()) {
      alert('이름이나 전화번호 중 하나라도 입력해 주세요.');
      return;
    }
    if (window.confirm("수집된 개인 정보는 행사 기간 이후 완전 파기될 예정이며 캐릭터 이름이 선정된 인원에게만 별도 연락드리고 출처를 남겨 내년 축제에 사용할 예정입니다.\n\n동의하시겠습니까?")) {
      const fullPhone = [phone1, phone2, phone3].filter(p => p.trim()).join('');
      setPhotoData(prev => ({ 
        ...prev, 
        mascotName: inputName, 
        providerName: providerName.trim() || null, 
        providerPhone: fullPhone || null
      }));
      navigate('/upload');
    }
  };

  if (step === 'form') {
    return (
      <div className="page-container" style={{ gap: '2rem', padding: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', textAlign: 'center', color: 'var(--primary)', marginBottom: '1rem' }}>
          출처 남기기
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>이름</label>
            <input 
              type="text" 
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="예: 홍길동"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>전화번호</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input 
                type="tel" 
                value={phone1}
                onChange={(e) => setPhone1(e.target.value.replace(/[^0-9]/g, '').slice(0,3))}
                style={{ flex: 1, minWidth: 0, padding: '10px 5px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', textAlign: 'center' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', color: '#888' }}>-</span>
              <input 
                type="tel" 
                value={phone2}
                onChange={(e) => setPhone2(e.target.value.replace(/[^0-9]/g, '').slice(0,4))}
                style={{ flex: 1, minWidth: 0, padding: '10px 5px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', textAlign: 'center' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', color: '#888' }}>-</span>
              <input 
                type="tel" 
                value={phone3}
                onChange={(e) => setPhone3(e.target.value.replace(/[^0-9]/g, '').slice(0,4))}
                style={{ flex: 1, minWidth: 0, padding: '10px 5px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', textAlign: 'center' }}
              />
            </div>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '300px', margin: '2rem auto 0', display: 'flex', gap: '10px' }}>
          <button className="secondary" onClick={() => setStep('modal')} style={{ flex: 1, padding: '12px' }}>
            뒤로가기
          </button>
          <button className="primary" onClick={handleSaveForm} style={{ flex: 1, padding: '12px' }}>
            저장
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ gap: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', lineHeight: '1.5' }}>
          <span style={{ color: '#222' }}>2026 서초 양재</span><br/>
          <span style={{ color: 'var(--primary)' }}>벚꽃등 축제</span><br/>
        </h1>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '500', lineHeight: '1.6' }}>
          서초 양재 벚꽃등축제 마스코트<br/>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{inputName ? inputName + ' ' : ''}</span>업어가세요
        </h2>
      </div>

      <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <img 
          src="/꽃등이.jpg" 
          alt="꽃등이 캐릭터" 
          style={{ width: '100%', borderRadius: 'var(--border-radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} 
        />
      </div>

      <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            value={inputName} 
            onChange={(e) => setInputName(e.target.value)} 
            placeholder="이름 지어주기" 
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' }}
          />
          <button 
            onClick={handlePropose}
            style={{ padding: '0 20px', borderRadius: '8px', backgroundColor: '#333', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            제안
          </button>
        </div>

        <button className="primary" onClick={() => navigate('/upload')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: inputName ? 0.6 : 1 }}>
          <Sparkles size={20} />
          그냥 업어가기
        </button>
        
        {step === 'modal' && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{ backgroundColor: '#fff', padding: '30px 20px', borderRadius: '16px', width: '100%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '25px', color: '#222' }}>
                저희 마스코트 이름을<br/>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.3rem' }}>"{inputName}"</span>(으)로<br/>
                제안해주셔서 감사합니다!
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={handleGoForm}
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
                >
                  기록 남기기
                </button>
                <button 
                  onClick={handleGift}
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#f1f1f1', color: '#555', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
                >
                  그냥 선물하기
                </button>
                <button 
                  onClick={() => setStep('main')}
                  style={{ width: '100%', marginTop: '5px', padding: '10px', backgroundColor: 'transparent', color: '#999', border: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  취소(닫기)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        
      <div style={{ width: '100%', marginTop: 'auto' }}>
        <p className="notice" style={{ marginTop: '1rem' }}>
          본 프로그램 이용 시 마케팅 활용 및 개인정보 수집에 동의하게 되며,<br/>데이터는 4월 30일 이후 파기됩니다.
        </p>
      </div>
    </div>
  );
}

export default Home;

