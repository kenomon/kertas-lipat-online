import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Welcome({ onCreate, onJoin, onHowToPlay, error, invitationCode, onClearInvitation }) {
  const [modal, setModal] = useState(null); // null | 'create' | 'join'
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');

  // Handle invitation link
  useEffect(() => {
    if (invitationCode) {
      setRoomId(invitationCode);
      setModal('join');
      if (onClearInvitation) onClearInvitation();
    }
  }, [invitationCode]);

  const openModal = (type) => {
    setName('');
    setRoomId('');
    setModal(type);
  };

  const closeModal = () => setModal(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    closeModal();
  };

  const handleJoin = () => {
    if (!name.trim() || roomId.length !== 4) return;
    onJoin(roomId, name.trim());
    closeModal();
  };

  const overlayStyle = {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  };

  const dialogStyle = {
    background: 'var(--paper-color)',
    padding: '30px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '360px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
    fontFamily: 'var(--font-handwriting)',
    position: 'relative',
  };

  return (
    <div className="paper-content">
      {error && <div className="error-msg" style={{ textAlign: 'center' }}>{error}</div>}

      {/* Two main buttons */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <button
          onClick={() => openModal('create')}
          style={{ flex: 1, padding: '20px 10px', fontSize: '1.1rem', backgroundColor: 'var(--ink-color)' }}
        >
          Buat Game Baru
        </button>
        <button
          onClick={() => openModal('join')}
          style={{ flex: 1, padding: '20px 10px', fontSize: '1.1rem', backgroundColor: 'var(--ink-color)' }}
        >
          Gabung Ruangan
        </button>
      </div>

      {/* How to play link */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onHowToPlay}
          style={{ backgroundColor: 'transparent', border: '2px solid var(--ink-color)', color: 'var(--ink-color)', fontFamily: 'var(--font-handwriting)', fontSize: '1rem', padding: '0', cursor: 'pointer', borderRadius: '5px', width: '180px', height: '40px', textAlign: 'center' }}
        >
          Cara Bermain
        </button>
        <a
          href="https://teer.id/hompimparty"
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: 'transparent', border: '2px solid var(--ink-color)', color: 'var(--ink-color)', fontFamily: 'var(--font-handwriting)', fontWeight: '700', fontSize: '1rem', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '180px', height: '40px', boxSizing: 'border-box' }}
        >
          Traktir Cendol!
        </a>
      </div>

      {/* Footer */}
      <p style={{ marginTop: '30px', fontSize: '0.8rem', color: '#7f8c8d', textAlign: 'center', lineHeight: '1.6', borderTop: '1px dashed #bdc3c7', paddingTop: '15px' }}>
        Dikembangkan oleh{' '}
        <a href="https://www.instagram.com/hompimparty.id" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-color)', fontWeight: 'bold', textDecoration: 'none' }}>
          @hompimparty.id
        </a>
        , game ini diadaptasi dari tradisi permainan kertas lipat yang selalu menjadi primadona di setiap acara kumpul Keluarga Martono. Tradisi ini diadaptasi ke bentuk digital agar bisa membawa tawa yang sama besarnya bagi kalian, seperti tawa yang selalu hadir di tengah-tengah keluarga kami. Enjoy!
      </p>


      {modal === 'create' && createPortal(
        <div style={overlayStyle} onClick={closeModal}>
          <div style={dialogStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Buat Game Baru</h3>
            <label>Nama Kamu:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder=""
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={closeModal} style={{ flex: 1, backgroundColor: '#7f8c8d', fontSize: '1rem', padding: '10px' }}>Batal</button>
              <button onClick={handleCreate} disabled={!name.trim()} style={{ flex: 2, fontSize: '1rem', padding: '10px' }}>Buat Ruangan →</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Gabung Ruangan */}
      {modal === 'join' && createPortal(
        <div style={overlayStyle} onClick={closeModal}>
          <div style={dialogStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Gabung Ruangan</h3>
            <label>Nama Kamu:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder=""
              autoFocus
            />
            <label>Kode Ruangan:</label>
            <input
              type="text"
              value={roomId}
              onChange={e => setRoomId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder=""
              maxLength={4}
              style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.4rem' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={closeModal} style={{ flex: 1, backgroundColor: '#7f8c8d', fontSize: '1rem', padding: '10px' }}>Batal</button>
              <button onClick={handleJoin} disabled={!name.trim() || roomId.length !== 4} style={{ flex: 2, backgroundColor: (!name.trim() || roomId.length !== 4) ? '#7f8c8d' : 'var(--ink-color)', fontSize: '1rem', padding: '10px' }}>Gabung →</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
