import { useState, useEffect } from 'react';

export default function Reveal({ room, socket, onLeave, onBackToLobby }) {
  const [unfolded, setUnfolded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedIndices, setViewedIndices] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [visibleChars, setVisibleChars] = useState(0);
  
  if (!room || !room.papers) return null;

  const me = room.players.find(p => p.id === socket.id);
  const isHost = me?.isHost;
  const revealMode = room.revealMode || 'all';
  const allPapers = Object.values(room.papers);

  // Pre-calculate segments for typing effect
  const paperSegments = useState(() => {
    return allPapers.map(paper => {
      return paper.steps.map(step => {
        let prefix = "";
        if (step.round === 2) prefix = "Sewaktu ";
        if (step.round === 6) prefix = "Sampai ";
        if (step.round === 7) prefix = "Di ";
        return prefix + step.text;
      });
    });
  })[0];

  // Set initial index for individual mode
  useEffect(() => {
    if (revealMode === 'individual') {
      const myPaperIndex = allPapers.findIndex(paper => paper.currentHolderId === socket.id);
      if (myPaperIndex !== -1) {
        setCurrentIndex(myPaperIndex);
      }
    }
  }, [revealMode, socket.id]); // Run once on mount if mode is individual

  const currentSegments = paperSegments[currentIndex] || [];
  const totalLength = currentSegments.reduce((acc, curr) => acc + curr.length, 0);

  // Typing Effect Logic
  
  useEffect(() => {
    if (!unfolded) return;
    
    if (viewedIndices.has(currentIndex)) {
      setVisibleChars(totalLength);
      setIsTyping(false);
      return;
    }

    // Start typing
    setIsTyping(true);
    setVisibleChars(0);
    
    const timer = setInterval(() => {
      setVisibleChars(prev => {
        if (prev >= totalLength) {
          clearInterval(timer);
          setIsTyping(false);
          setViewedIndices(old => new Set(old).add(currentIndex));
          return totalLength;
        }
        return prev + 1;
      });
    }, 50); // 50ms per character

    return () => clearInterval(timer);
  }, [currentIndex, unfolded, totalLength]);

  const handlePaperClick = () => {
    if (isTyping) {
      setVisibleChars(totalLength);
      setIsTyping(false);
      setViewedIndices(old => new Set(old).add(currentIndex));
    }
  };

  const renderEndButtons = () => (
    <div style={{ marginTop: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p>Selesai! Terima kasih sudah bermain.</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexDirection: 'column' }}>
        <button onClick={onLeave} style={{ fontSize: '1rem' }}>Kembali ke Halaman Awal</button>
        <button onClick={onBackToLobby} style={{ fontSize: '1rem' }}>Main Lagi (Room Sama)</button>
      </div>
    </div>
  );

  const renderPaper = (segments, currentVisible) => {
    let charCount = 0;
    return (
      <div 
        onClick={handlePaperClick}
        style={{ 
          padding: '20px', 
          border: '2px dashed #bdc3c7', 
          borderRadius: '5px', 
          backgroundColor: '#fff', 
          fontSize: '1.4rem', 
          lineHeight: '1.8',
          cursor: isTyping ? 'pointer' : 'default',
          minHeight: '200px'
        }}
      >
        {segments.map((text, idx) => {
          const start = charCount;
          charCount += text.length;
          
          if (currentVisible <= start) return null;
          
          const visibleInThisSegment = Math.min(text.length, currentVisible - start);
          const visibleText = text.substring(0, visibleInThisSegment);
          
          // Split into prefix (if any) and bold text
          // Note: This is a bit simplified since we joined them. 
          // Let's re-parse or just show it simply for the typing feel.
          // To keep the bold style, we need to know where the prefix ends.
          
          let prefix = "";
          let actualText = text;
          if (text.startsWith("Sewaktu ")) { prefix = "Sewaktu "; actualText = text.substring(8); }
          else if (text.startsWith("Sampai ")) { prefix = "Sampai "; actualText = text.substring(7); }
          else if (text.startsWith("Di ")) { prefix = "Di "; actualText = text.substring(3); }
          
          // Determine visible prefix and visible actual text
          const visiblePrefix = visibleText.substring(0, Math.min(visibleText.length, prefix.length));
          const visibleActual = visibleText.substring(prefix.length);

          return (
            <div key={idx}>
              {visiblePrefix}<strong>{visibleActual}</strong>
            </div>
          );
        })}
      </div>
    );
  };


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
            {renderPaper(currentSegments, visibleChars)}
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
          {renderPaper(currentSegments, visibleChars)}
          {renderEndButtons()}
        </div>
      )}
    </div>
  );
}

