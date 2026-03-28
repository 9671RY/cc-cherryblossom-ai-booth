import React, { useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { UploadCloud } from 'lucide-react';

function Upload() {
  const navigate = useNavigate();
  const { setPhotoData } = useContext(AppContext);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoData({
        originalFile: file,
        originalUrl: url,
        uploadId: null,
        coordinates: null
      });
      navigate('/loading');
    }
  };

  return (
    <div className="page-container">
      <h1 style={{ color: 'var(--primary)', marginBottom: '3rem' }}>사진 업로드</h1>
      
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '300px', 
          aspectRatio: '4/5', 
          backgroundColor: 'var(--gray-bg)', 
          borderRadius: 'var(--border-radius)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '3rem',
          position: 'relative',
          overflow: 'hidden',
          border: '2px dashed #ccc'
        }}
      >
        <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
          <UploadCloud size={48} style={{ marginBottom: '16px', color: 'var(--primary)' }} />
          <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
            마스코트가 어깨에 앉을 수 있도록<br/>
            상반신이 잘 보이는 사진을<br/>
            업로드 해주세요!
          </p>
        </div>
        
        {/* 예시 꽃등이 반투명 오버레이 */}
        <img 
          src="/꽃등이.jpg" 
          alt="예시" 
          style={{ position: 'absolute', width: '80px', right: '30px', top: '100px', opacity: 0.5, borderRadius: '50%' }}
        />
      </div>

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />
      
      <button 
        className="primary" 
        onClick={() => fileInputRef.current.click()}
        style={{ padding: '18px 24px' }}
      >
        축제장에서 촬영한 사진 올려주기
      </button>

      <button 
        className="secondary" 
        style={{ marginTop: '1rem', border: 'none', color: '#888' }}
        onClick={() => navigate('/')}
      >
        뒤로 가기
      </button>
    </div>
  );
}

export default Upload;
