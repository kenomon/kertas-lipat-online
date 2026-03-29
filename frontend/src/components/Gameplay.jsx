import { useState, useEffect } from 'react';

export default function Gameplay({ room, socketId, steps, onSubmit, onCancel, error }) {
  const [text, setText] = useState('');
  
  if (!room || room.state !== 'playing') return null;
  
  const me = room.players.find(p => p.id === socketId);
  const currentRound = room.round;
  const currentStep = steps.find(s => s.id === currentRound);
  
  const handleSubmit = () => {
    if (text) {
      onSubmit(text);
      setText('');
    }
  };

  if (me?.hasSubmitted) {
    const pendingPlayers = room.players.filter(p => !p.hasSubmitted);
    
    return (
      <div className="paper-content" style={{ textAlign: 'center' }}>
        <h2>Menunggu...</h2>
        <p>Anda sudah melipat kertas ini.</p>
        <p>Menunggu {pendingPlayers.length} pemain lain selesai menulis...</p>
        
        {pendingPlayers.length > 0 && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(52, 152, 219, 0.1)', borderRadius: '10px' }}>
            <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '10px' }}>Belum selesai:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
              {pendingPlayers.map(p => (
                <span key={p.id} style={{ 
                  padding: '4px 12px', 
                  backgroundColor: 'white', 
                  borderRadius: '20px', 
                  fontSize: '0.85rem',
                  color: 'var(--ink-color)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #eee'
                }}>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <button onClick={onCancel} style={{ backgroundColor: '#e74c3c' }}>Ganti Jawaban</button>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-content">
      <h2>Bagian {currentRound} / 7</h2>
      {error && <div className="error-msg">{error}</div>}
      
      <div style={{ margin: '30px 0' }}>
        <h3>Tuliskan:</h3>
        <p style={{ fontSize: '1.4rem', color: 'var(--accent-color)', marginBottom: '5px', fontWeight: 'bold' }}>{currentStep?.label}</p>
        {currentStep?.desc && <p style={{ fontSize: '1rem', color: '#34495e', marginBottom: '20px', lineHeight: '1.4' }}>{currentStep.desc}</p>}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
          {currentStep?.defaultPrefix && (
            <span style={{ fontSize: '1.2rem', paddingBottom: '16px', whiteSpace: 'nowrap' }}>{currentStep.defaultPrefix}</span>
          )}
          <input 
            type="text" 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Jawabanmu..."
            autoFocus
          />
        </div>
      </div>
      
      <button onClick={handleSubmit} disabled={!text.trim()}>Lipat & Oper Kertas</button>
    </div>
  );
}
