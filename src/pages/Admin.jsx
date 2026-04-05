import React, { useEffect, useState } from 'react';

function Admin() {
  const [stats, setStats] = useState({ totalShares: 0, photos: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Admin fetch error", err);
        setLoading(false);
      });
  }, []);

  const handleClearQueue = async () => {
    if (!window.confirm("정말로 대기열을 초기화하시겠습니까? (처리 중/대기 중인 작업이 모두 리셋됩니다)")) return;
    try {
      const res = await fetch('/api/admin/clear-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: 'cherry-blossom-clear' })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
      } else {
        alert("실패: " + (data.error || "알 수 없는 오류"));
      }
    } catch (err) {
      alert("에러: " + err.message);
    }
  };

  if (loading) return <div className="page-container">Admin Loading...</div>;

  return (
    <div className="page-container" style={{ alignItems: 'flex-start', justifyContent: 'flex-start', textAlign: 'left', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--primary)' }}>Admin Dashboard</h1>
        <button 
          onClick={handleClearQueue}
          style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          대기열 강제 초기화
        </button>
      </div>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>총 공유 횟수: {stats.totalShares}회</h2>
      
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
        {stats.photos.map((photo) => (
          <div key={photo.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '8px' }}>
            {photo.result1_url ? (
               <img src={photo.result1_url} alt="Result" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }} />
            ) : (
               <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Img</div>
            )}
            <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>
              ID: {photo.id} <br/>
              Shares: {photo.share_count} <br/>
              Date: {new Date(photo.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
        
        {stats.photos.length === 0 && <p>데이터가 없습니다.</p>}
      </div>
    </div>
  );
}

export default Admin;
