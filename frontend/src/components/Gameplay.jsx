import { useState, useEffect, useRef } from 'react';

export default function Gameplay({ room, socketId, steps, onSubmit, onCancel, error }) {
  const [text, setText] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelTimerRef = useRef(null);
  
  // Ambil data diri sendiri. Pastikan menggunakan socketId yang stabil.
  const me = room.players.find(p => p.id === (socketId || ''));
  const currentRound = room.round;
  const currentStep = steps.find(s => s.id === currentRound);
  
  // Efek untuk membersihkan status loading jika hasSubmitted berubah (berhasil dicancel)
  // ATAU jika terjadi error, agar tombol kembali bisa diklik
  useEffect(() => {
    // Tombol kembali normal jika:
    // 1. me.hasSubmitted berubah jadi false (berhasil dicancel)
    // 2. Ada error baru dari server
    // 3. me tiba-tiba hilang (rekoneksi sedang berjalan)
    if (!me?.hasSubmitted || error) {
      setIsCancelling(false);
      if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    }
  }, [me?.hasSubmitted, error]);

  if (!room || room.state !== 'playing') return null;
  
  const handleSubmit = () => {
    if (text) {
      onSubmit(text);
      setText('');
    }
  };

  const handleCancelClick = () => {
    setIsCancelling(true);
    onCancel();
    
    // Fail-safe: Jika 5 detik tidak ada respon dari server, riset status tombol
    if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    cancelTimerRef.current = setTimeout(() => {
      setIsCancelling(false);
    }, 5000);
  };

  if (me?.hasSubmitted) {
    const totalPlayers = room.players.length;
    const submittedCount = room.players.filter(p => p.hasSubmitted).length;
    const pendingPlayers = room.players.filter(p => !p.hasSubmitted).map(p => p.name);
    
    return (
      <div className="paper-content" style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--ink-color)' }}>Terkirim!</h2>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Menunggu pemain lain...</p>
        
        {/* Tampilan progres tanpa garis dan tanpa latar belakang */}
        <div style={{ padding: '15px', margin: '20px 0' }}>
          <p style={{ fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '10px' }}>Progres: {submittedCount} / {totalPlayers} Pemain</p>
          {pendingPlayers.length > 0 && (
            <p style={{ fontSize: '1.1rem', color: '#666' }}>Menunggu: <span style={{ fontStyle: 'italic' }}>{pendingPlayers.join(', ')}</span></p>
          )}
        </div>

        {error && <div className="error-msg" style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</div>}

        <button 
          onClick={handleCancelClick} 
          disabled={isCancelling}
          style={{ 
            backgroundColor: '#e74c3c', 
            opacity: isCancelling ? 0.7 : 1, 
            marginTop: '20px',
            transform: isCancelling ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.2s ease',
            cursor: isCancelling ? 'not-allowed' : 'pointer',
            padding: '12px 24px',
            fontSize: '1.1rem'
          }}
        >
          {isCancelling ? (
             <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                Memproses...
             </span>
          ) : 'Ganti Jawaban'}
        </button>
        
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="paper-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Bagian {currentRound} / 7</h2>
        {room.passMode === 'random' && <span style={{ fontSize: '0.8rem', backgroundColor: '#eee', padding: '2px 8px', borderRadius: '4px' }}>Acak</span>}
      </div>

      {error && <div className="error-msg" style={{ color: '#e74c3c', marginBottom: '15px', fontWeight: 'bold' }}>{error}</div>}
      
      <div style={{ margin: '30px 0' }}>
        <h3 style={{ fontSize: '1rem', color: '#7f8c8d', marginBottom: '10px' }}>Tuliskan:</h3>
        <p style={{ fontSize: '1.4rem', color: 'var(--accent-color)', marginBottom: '5px', fontWeight: 'bold' }}>{currentStep?.label}</p>
        {currentStep?.desc && <p style={{ fontSize: '0.9rem', color: '#34495e', marginBottom: '20px', lineHeight: '1.4', fontStyle: 'italic' }}>{currentStep.desc}</p>}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
          {currentStep?.defaultPrefix && (
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currentStep.defaultPrefix}</span>
          )}
          <input 
            type="text" 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Ketik di sini..."
            autoFocus
            style={{ flex: 1 }}
          />
        </div>
      </div>
      
      <button 
        onClick={handleSubmit} 
        disabled={!text.trim()} 
        style={{ width: '100%', marginTop: '20px' }}
      >
        Lipat & Oper Kertas →
      </button>
    </div>
  );
}
