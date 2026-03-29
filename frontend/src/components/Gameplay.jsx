import { useState, useEffect } from 'react';

export default function Gameplay({ room, socketId, steps, onSubmit, onCancel, error }) {
  const [text, setText] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Ambil data diri sendiri. Pastikan menggunakan socketId yang stabil.
  const me = room.players.find(p => p.id === (socketId || ''));
  const currentRound = room.round;
  const currentStep = steps.find(s => s.id === currentRound);
  
  // Efek untuk membersihkan status loading jika hasSubmitted berubah (berhasil dicancel)
  // ATAU jika terjadi error, agar tombol kembali bisa diklik
  useEffect(() => {
    if (!me?.hasSubmitted || error) {
      setIsCancelling(false);
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
  };

  if (me?.hasSubmitted) {
    const totalPlayers = room.players.length;
    const submittedCount = room.players.filter(p => p.hasSubmitted).length;
    const pendingPlayers = room.players.filter(p => !p.hasSubmitted).map(p => p.name);
    
    return (
      <div className="paper-content" style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--ink-color)' }}>Terlipat!</h2>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Kertasmu sudah dioper. Tunggu pemain lain selesai melipat ya...</p>
        
        {/* Tampilan progres tanpa kotak latar belakang */}
        <div style={{ padding: '15px', margin: '20px 0', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }}>
          <p style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>Progres: {submittedCount} / {totalPlayers} Pemain</p>
          {pendingPlayers.length > 0 && (
            <p style={{ fontSize: '1rem', color: '#666', marginTop: '10px' }}>Menunggu: <span style={{ fontStyle: 'italic' }}>{pendingPlayers.join(', ')}</span></p>
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
            transition: 'all 0.2s ease'
          }}
        >
          {isCancelling ? 'Memproses...' : 'Ganti Jawaban'}
        </button>
      </div>
    );
  }

  return (
    <div className="paper-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Babak {currentRound} / 7</h2>
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
