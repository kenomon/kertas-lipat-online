import { useState } from 'react';

export default function Reveal({ room, socket, onLeave, onBackToLobby }) {
  const [unfolded, setUnfolded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!room || !room.papers) return null;

  const me = room.players.find(p => p.id === socket.id);
  const isHost = me?.isHost;
  const revealMode = room.revealMode || 'all';
  const allPapers = Object.values(room.papers);

  const renderEndButtons = () => (
    <div style={{ marginTop: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p>Selesai! Terima kasih sudah bermain.</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexDirection: 'column' }}>
        <button onClick={onLeave} style={{ fontSize: '1rem' }}>Kembali ke Halaman Awal</button>
        <button onClick={onBackToLobby} style={{ fontSize: '1rem' }}>Main Lagi (Room Sama)</button>
      </div>
    </div>
  );

  const renderPaper = (paper) => (
    <div style={{ padding: '20px', border: '2px dashed #bdc3c7', borderRadius: '5px', backgroundColor: '#fff', fontSize: '1.4rem', lineHeight: '1.8' }}>
      {paper.steps.map((step, index) => {
        let prefix = "";
        if (step.round === 2) prefix = "Sewaktu ";
        if (step.round === 6) prefix = "Sampai ";
        if (step.round === 7) prefix = "Di ";
        return (
          <div key={index}>
            {prefix}<strong>{step.text}</strong>
          </div>
        );
      })}
    </div>
  );

  // --- Mode: Per Perangkat (individual) ---
  if (revealMode === 'individual') {
    const myPaperEntry = Object.entries(room.papers).find(([_, paper]) => paper.currentHolderId === socket.id);
    if (!myPaperEntry) return <div>Menunggu kertas...</div>;
    const myPaper = myPaperEntry[1];

    return (
      <div className="paper-content">
        <h2>Waktunya Membuka Kertas!</h2>
        {!unfolded ? (
          <div style={{ textAlign: 'center', margin: '40px 0' }}>
            <button onClick={() => setUnfolded(true)} style={{ backgroundColor: 'var(--accent-color)' }}>
              Buka Lipatan Kertas
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontWeight: 'bold' }}>Tulisan di dalam kertasmu:</p>
            {renderPaper(myPaper)}
            {renderEndButtons()}
          </div>
        )}
      </div>
    );
  }

  // --- Mode: Semua Perangkat (all) ---
  const currentPaper = allPapers[currentIndex];
  const ownerName = currentPaper?.originalOwnerName || '';

  return (
    <div className="paper-content">
      <h2>Waktunya Membuka Kertas!</h2>
      {!unfolded ? (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <button onClick={() => setUnfolded(true)} style={{ backgroundColor: 'var(--accent-color)' }}>
            Buka Semua Kertas
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button
              onClick={() => setCurrentIndex(i => i - 1)}
              disabled={currentIndex === 0}
              style={{ width: 'auto', padding: '8px 14px', fontSize: '1.2rem', backgroundColor: currentIndex === 0 ? '#bdc3c7' : 'var(--ink-color)' }}
            >←</button>
            <p style={{ margin: 0, fontWeight: 'bold', textAlign: 'center', color: '#7f8c8d' }}>
              {currentIndex + 1} / {allPapers.length}
            </p>
            <button
              onClick={() => setCurrentIndex(i => i + 1)}
              disabled={currentIndex === allPapers.length - 1}
              style={{ width: 'auto', padding: '8px 14px', fontSize: '1.2rem', backgroundColor: currentIndex === allPapers.length - 1 ? '#bdc3c7' : 'var(--ink-color)' }}
            >→</button>
          </div>
          {renderPaper(currentPaper)}
          {renderEndButtons()}
        </div>
      )}
    </div>
  );
}

