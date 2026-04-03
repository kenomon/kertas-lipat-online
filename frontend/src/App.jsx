import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Welcome from './components/Welcome';
import Lobby from './components/Lobby';
import Gameplay from './components/Gameplay';
import Reveal from './components/Reveal';
import HowToPlay from './components/HowToPlay';
import { HelpCircle } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const socket = io(SOCKET_URL, { autoConnect: false });

function App() {
  const [gameState, setGameState] = useState('welcome');
  const [room, setRoom] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [steps, setSteps] = useState([]);
  const [invitationCode, setInvitationCode] = useState('');

  // Extract room ID from URL query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode && roomCode.length === 4) {
      setInvitationCode(roomCode.toUpperCase());
      // Clean up URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Gunakan useRef untuk menyimpan myPlayerId agar selalu up-to-date di semua closure
  const myPlayerIdRef = useRef('');
  // Ref untuk room dan playerName agar bisa diakses di socket listeners tanpa stale closure
  const roomRef = useRef(null);
  const playerNameRef = useRef('');

  // Sync roomRef dan playerNameRef saat state berubah
  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);

  // Gunakan useRef untuk gameState agar bisa dibaca di dalam socket listeners
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    socket.connect();

    socket.on('room_created', (r) => {
      myPlayerIdRef.current = socket.id;
      console.log('-- PLAYER ID SET (created):', socket.id, '--');
      setRoom(r);
      setGameState('lobby');
      setError('');
    });

    socket.on('room_joined', (r) => {
      myPlayerIdRef.current = socket.id;
      console.log('-- PLAYER ID SET (joined):', socket.id, '--');
      setRoom(r);
      setGameState('lobby');
      setError('');
    });

    socket.on('room_update', (r) => {
      console.log('-- ROOM UPDATE --', r.state, 'current gameState:', gameStateRef.current);
      setRoom(r);
      if (gameStateRef.current === 'playing' && r.state === 'lobby') {
        setGameState('interrupted');
      }
    });

    socket.on('game_update', (r) => {
      console.log('-- GAME UPDATE --', r.state);
      setRoom(r);
    });

    socket.on('game_started', ({ room: r, steps: gameSteps }) => {
      setRoom(r);
      setSteps(gameSteps);
      setGameState('playing');
    });

    socket.on('round_finished', (r) => {
      setRoom(r);
      if (r.state === 'reveal') {
        setGameState('reveal');
      }
    });

    socket.on('error_message', (msg) => {
      console.error('-- SERVER ERROR --', msg);
      setError(msg);
      // Jangan hapus error terlalu cepat jika sedang "Memproses..."
      setTimeout(() => setError(''), 8000);
    });

    socket.on('rejoin_ack', (r) => {
      console.log('-- REJOIN ACK RECEIVED --', r.id);
      setRoom(r);
      // Pastikan steps juga terisi jika sedang bermain
      if (r.state === 'playing') {
        setGameState('playing');
      }
    });

    socket.on('kicked', () => {
      setRoom(null);
      setGameState('welcome');
      setError('Kamu telah dikeluarkan dari ruangan oleh Host.');
      setTimeout(() => setError(''), 5000);
    });

    // Event 'connect' dipanggil saat pertama konek DAN saat reconnect
    socket.on('connect', () => {
      const prevId = myPlayerIdRef.current;
      const newId = socket.id;
      console.log('-- SOCKET CONNECT, id:', newId, '(prev:', prevId, ') --');

      // Hanya proses jika ini reconnect (bukan koneksi pertama)
      if (prevId && prevId !== newId) {
        myPlayerIdRef.current = newId;
        const currentRoom = roomRef.current;
        const currentName = playerNameRef.current;
        if (currentRoom && currentName) {
          console.log('-- RECONNECT: rejoin room', currentRoom.id, 'as', currentName, '--');
          socket.emit('rejoin_room', { roomId: currentRoom.id, playerName: currentName, oldPlayerId: prevId });
        }
      } else {
        myPlayerIdRef.current = newId;
      }
    });

    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('room_update');
      socket.off('game_update');
      socket.off('game_started');
      socket.off('round_finished');
      socket.off('error_message');
      socket.off('kicked');
      socket.off('connect');
      socket.off('rejoin_ack');
    };
  }, []); // <-- Kosong: hanya daftar sekali, pakai Ref agar selalu sinkron

  const handleCreateRoom = (name) => {
    setPlayerName(name);
    socket.emit('create_room', { playerName: name });
  };

  const handleJoinRoom = (roomId, name) => {
    setPlayerName(name);
    socket.emit('join_room', { roomId, playerName: name });
  };

  const handleStartGame = () => {
    if (room) socket.emit('start_game', { roomId: room.id });
  };

  const handleSubmitStep = (text) => {
    if (room) socket.emit('submit_step', { roomId: room.id, text });
  };

  const handleCancelStep = () => {
    if (room) {
      console.log('-- ACTION: cancel_step -- roomId:', room.id, 'socketId:', socket.id);
      setError(''); // Clear previous errors
      socket.emit('cancel_step', { roomId: room.id });
    }
  };

  const handleLeaveRoom = () => {
    if (room) socket.emit('leave_room', { roomId: room.id });
    setRoom(null);
    setGameState('welcome');
  };

  const handleBackToLobby = () => {
    if (room) socket.emit('back_to_lobby', { roomId: room.id });
    setGameState('lobby');
  };

  const handleHowToPlay = () => setGameState('howtoplay');
  const handleBackFromHowToPlay = () => setGameState('welcome');

  const renderScreen = () => {
    switch (gameState) {
      case 'welcome':
        return <Welcome onCreate={handleCreateRoom} onJoin={handleJoinRoom} onHowToPlay={handleHowToPlay} error={error} invitationCode={invitationCode} onClearInvitation={() => setInvitationCode('')} />;
      case 'howtoplay':
        return <HowToPlay onBack={handleBackFromHowToPlay} />;
      case 'lobby':
        return <Lobby room={room} socket={socket} onStart={handleStartGame} error={error} myPlayerId={myPlayerIdRef.current} />;
      case 'playing':
        return <Gameplay room={room} socketId={myPlayerIdRef.current} steps={steps} onSubmit={handleSubmitStep} onCancel={handleCancelStep} error={error} />;
      case 'interrupted':
        return (
          <div className="paper-content" style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#e74c3c' }}>Permainan Terhenti</h2>
            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', margin: '30px 0' }}>Seseorang keluar dari ruangan.</p>
            <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleBackToLobby} style={{ backgroundColor: 'var(--ink-color)' }}>Kembali ke Ruang Tunggu</button>
              <button onClick={handleLeaveRoom} style={{ backgroundColor: 'var(--ink-color)' }}>Keluar ke Halaman Awal</button>
            </div>
          </div>
        );
      case 'reveal':
        return <Reveal room={room} socket={socket} onLeave={handleLeaveRoom} onBackToLobby={handleBackToLobby} />;
      default:
        return <Welcome onCreate={handleCreateRoom} onJoin={handleJoinRoom} error={error} />;
    }
  };

  return (
    <>
      <h1 className="title">Kertas Lipat Online</h1>
      <div className="paper ruled">
        {renderScreen()}
      </div>
    </>
  );
}

export default App;
