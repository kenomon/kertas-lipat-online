import { useState, useEffect } from 'react';
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
  const [gameState, setGameState] = useState('welcome'); // welcome, lobby, playing, reveal
  const [room, setRoom] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    socket.connect();

    socket.on('room_created', (r) => {
      setRoom(r);
      setGameState('lobby');
      setError('');
    });

    socket.on('room_joined', (r) => {
      setRoom(r);
      setGameState('lobby');
      setError('');
    });

    socket.on('room_update', (r) => {
      // Jika sebelumnya sedang bermain tapi tiba-tiba status room kembali ke lobby, 
      // berarti permainan terhenti (biasanya karena ada yang disconnect)
      if (gameState === 'playing' && r.state === 'lobby') {
        setGameState('interrupted');
      }
      setRoom(r);
    });

    socket.on('game_started', ({ room: r, steps: gameSteps }) => {
      setRoom(r);
      setSteps(gameSteps);
      setGameState('playing');
    });

    socket.on('game_update', (r) => {
      setRoom(r);
    });

    socket.on('round_finished', (r) => {
      setRoom(r);
      if (r.state === 'reveal') {
        setGameState('reveal');
      }
    });

    socket.on('error_message', (msg) => {
      setError(msg);
      // Auto-clear error
      setTimeout(() => setError(''), 5000);
    });

    socket.on('kicked', () => {
      setRoom(null);
      setGameState('welcome');
      setError('Kamu telah dikeluarkan dari ruangan oleh Host.');
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('room_update');
      socket.off('game_started');
      socket.off('game_update');
      socket.off('round_finished');
      socket.off('error_message');
      socket.off('kicked');
    };
  }, [gameState]);

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
    if (room) socket.emit('cancel_step', { roomId: room.id });
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
        return <Welcome onCreate={handleCreateRoom} onJoin={handleJoinRoom} onHowToPlay={handleHowToPlay} error={error} />;
      case 'howtoplay':
        return <HowToPlay onBack={handleBackFromHowToPlay} />;
      case 'lobby':
        return <Lobby room={room} socket={socket} onStart={handleStartGame} error={error} />;
      case 'playing':
        return <Gameplay room={room} socketId={socket.id} steps={steps} onSubmit={handleSubmitStep} onCancel={handleCancelStep} error={error} />;
      case 'interrupted':
        return (
          <div className="paper-content" style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#e74c3c' }}>Permainan Terhenti</h2>
            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', margin: '30px 0' }}>{error || 'Seseorang keluar dari ruangan.'}</p>
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
