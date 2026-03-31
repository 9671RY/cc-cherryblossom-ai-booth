import React, { useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Camera, Upload as UploadIcon, X } from 'lucide-react';

function Upload() {
  const navigate = useNavigate();
  const { setPhotoData } = useContext(AppContext);
  const [inputText, setInputText] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      alert('본인의 얼굴 사진을 업로드해 주세요!');
      return;
    }
    
    setPhotoData(prev => ({
      ...prev,
      originalFile: selectedFile,
      originalUrl: null,
      uploadId: null,
      coordinates: null,
      textPrompt: inputText.trim()
    }));
    
    navigate('/loading');
  };

  return (
    <div className="page-container" style={{ padding: '20px 15px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '1.5rem', marginTop: '1rem', fontSize: '1.5rem', textAlign: 'center' }}>
        사진을 올리고 {photoData.mascotName || '꽃등이'}(을)를 만나보세요!
      </h1>
      
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '320px', 
          backgroundColor: 'var(--gray-bg)', 
          borderRadius: 'var(--border-radius)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        {!previewUrl ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5', textAlign: 'center', marginBottom: '10px' }}>
              정면이 잘 나온 본인 사진을 선택해주세요.
            </p>
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileChange} 
            />
            <button 
              className="primary" 
              style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <UploadIcon size={20} />
              사진 앨범에서 선택
            </button>
            <label 
              className="secondary" 
              style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', color: '#333', textAlign: 'center' }}
            >
              <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleFileChange} />
              <Camera size={20} />
              바로 사진 촬영
            </label>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'contain' }} 
            />
            <button 
              onClick={clearImage}
              style={{ 
                position: 'absolute', top: '-10px', right: '-10px', 
                backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', 
                border: 'none', borderRadius: '50%', padding: '5px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

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
        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', textAlign: 'center', width: '100%', marginBottom: '10px', fontWeight: 'bold' }}>
          추가 요청사항 (선택)
        </p>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="예: 어깨 위에 있는 캐릭터가 활짝 웃고 있으면 좋겠어요!"
          style={{
            width: '100%',
            height: '80px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            resize: 'none',
            fontSize: '0.95rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <button 
        className="primary" 
        onClick={handleSubmit}
        disabled={!selectedFile}
        style={{ 
          padding: '15px 20px', width: '100%', maxWidth: '320px', fontSize: '1.05rem', fontWeight: 'bold',
          opacity: !selectedFile ? 0.6 : 1, cursor: !selectedFile ? 'not-allowed' : 'pointer'
        }}
      >
        {photoData.mascotName || '꽃등이'} 불러오기
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
