import { ArrowUp, ArrowDown } from 'lucide-react';

export default function Lobby({ room, socket, onStart, error }) {
  if (!room) return null;
  
  const me = room.players.find(p => p.id === socket.id);
  const isHost = me?.isHost;
  
  const handleMove = (playerId, direction) => {
    if (isHost) {
      socket.emit('move_player', { roomId: room.id, playerId, direction });
    }
  };

  const handleToggleMode = () => {
    if (!isHost) return;
    const newMode = room.passMode === 'sequential' ? 'random' : 'sequential';
    socket.emit('set_pass_mode', { roomId: room.id, passMode: newMode });
  };

  const handleToggleRevealMode = () => {
    if (!isHost) return;
    const newMode = room.revealMode === 'individual' ? 'all' : 'individual';
    socket.emit('set_reveal_mode', { roomId: room.id, revealMode: newMode });
  };
  
  const handleToggleReady = () => {
    if (me) {
      socket.emit('set_ready', { roomId: room.id, isReady: !me.isReady });
    }
  };

  const handleKick = (playerId) => {
    if (window.confirm('Yakin ingin mengeluarkan pemain ini?')) {
      socket.emit('kick_player', { roomId: room.id, playerId });
    }
  };

  const allReady = room.players.filter(p => !p.isHost).every(p => p.isReady);
  
  return (
    <div className="paper-content">
      <h2>Ruang Tunggu</h2>
      <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.5rem' }}>
        Kode Ruangan: <strong>{room.id}</strong>
      </div>
      
      {error && <div className="error-msg">{error}</div>}
      
      <h3>Pemain ({room.players.length})</h3>
      <ul className="player-list">
        {room.players.map((p, index) => (
          <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
               <span style={{ minWidth: '25px', color: '#bdc3c7', fontSize: '1rem', fontStyle: 'italic', marginRight: '5px' }}>
                 #{index + 1}
               </span>
               <span style={{ fontWeight: 'bold' }}>{p.name}</span>
               {p.isHost && <span className="badge">Host</span>}
               {p.id === socket.id && <span className="badge" style={{backgroundColor: '#3498db'}}>Anda</span>}
               {!p.isHost && (
                 p.isReady ? (
                   <span className="badge" style={{backgroundColor: '#2ecc71', marginLeft: '5px'}}>Siap</span>
                 ) : (
                   <span className="badge" style={{backgroundColor: '#bdc3c7', marginLeft: '5px'}}>Belum Siap</span>
                 )
               )}
            </div>
            
            {isHost && (
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <button 
                  onClick={() => handleMove(p.id, 'up')} 
                  disabled={index === 0}
                  style={{ padding: '6px', width: 'auto', fontSize: '1rem', backgroundColor: index === 0 ? '#bdc3c7' : 'var(--ink-color)' }}
                  title="Pindah ke Atas"
                >
                  <ArrowUp size={16} />
                </button>
                <button 
                  onClick={() => handleMove(p.id, 'down')} 
                  disabled={index === room.players.length - 1}
                  style={{ padding: '6px', width: 'auto', fontSize: '1rem', backgroundColor: index === room.players.length - 1 ? '#bdc3c7' : 'var(--ink-color)' }}
                  title="Pindah ke Bawah"
                >
                  <ArrowDown size={16} />
                </button>
                {p.id !== socket.id && (
                  <button 
                    onClick={() => handleKick(p.id)}
                    style={{ padding: '6px 10px', width: 'auto', fontSize: '0.9rem', backgroundColor: '#c0392b' }}
                    title="Keluarkan Pemain"
                  >
                    Kick
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed #7f8c8d', borderRadius: '5px' }}>
        <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Mode Oper Kertas</h4>
        <div className="switch-container">
          <span style={{ fontWeight: room.passMode === 'sequential' ? 'bold' : 'normal', color: room.passMode === 'sequential' ? 'var(--ink-color)' : '#bdc3c7' }}>Berurutan</span>
          <label className="switch" style={{ opacity: isHost ? 1 : 0.6 }}>
            <input 
              type="checkbox" 
              checked={room.passMode === 'random'} 
              onChange={handleToggleMode} 
              disabled={!isHost} 
            />
            <span className="slider round"></span>
          </label>
          <span style={{ fontWeight: room.passMode === 'random' ? 'bold' : 'normal', color: room.passMode === 'random' ? 'var(--ink-color)' : '#bdc3c7' }}>Acak (Random)</span>
        </div>

        <h4 style={{ textAlign: 'center', margin: '15px 0 10px' }}>Mode Tampilan Hasil</h4>
        {(() => {
          const revealMode = room.revealMode || 'individual';
          return (
            <div className="switch-container">
              <span style={{ fontWeight: revealMode === 'individual' ? 'bold' : 'normal', color: revealMode === 'individual' ? 'var(--ink-color)' : '#bdc3c7' }}>Per Perangkat</span>
              <label className="switch" style={{ opacity: isHost ? 1 : 0.6 }}>
                <input
                  type="checkbox"
                  checked={revealMode === 'all'}
                  onChange={handleToggleRevealMode}
                  disabled={!isHost}
                />
                <span className="slider round"></span>
              </label>
              <span style={{ fontWeight: revealMode === 'all' ? 'bold' : 'normal', color: revealMode === 'all' ? 'var(--ink-color)' : '#bdc3c7' }}>Semua Perangkat</span>
            </div>
          );
        })()}
      </div>
      
      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {me && !me.isHost && (
           <button 
             onClick={handleToggleReady}
             style={{ backgroundColor: me.isReady ? '#7f8c8d' : 'var(--ink-color)', fontSize: '1.2rem', padding: '15px' }}
           >
             {me.isReady ? 'Batal Siap' : 'Saya Siap!'}
           </button>
        )}

        {isHost ? (
          <button 
            onClick={onStart} 
            disabled={room.players.length < 3 || !allReady}
          >
            {room.players.length < 3 ? 'Butuh Minimal 3 Pemain' : (!allReady ? 'Menunggu Pemain Siap...' : 'Mulai Permainan')}
          </button>
        ) : (
          <p style={{ textAlign: 'center', fontStyle: 'italic', fontFamily: 'var(--font-handwriting)' }}>
            Menunggu Host untuk memulai...
          </p>
        )}
      </div>
    </div>
  );
}
