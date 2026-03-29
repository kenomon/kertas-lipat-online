import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createRoom, joinRoom, validateStart, startGame, submitStep, disconnectUser, getRoom, backToLobby, leaveRoom, setPassMode, movePlayer, cancelStep, setReadyStatus, kickPlayer, setRevealMode, STEPS } from './gameLogic.js';

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 7860;

app.get('/', (req, res) => {
  res.send('Kertas Lipat Digital Server is running');
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_room', ({ playerName }) => {
    const room = createRoom(socket.id, playerName);
    socket.join(room.id);
    socket.emit('room_created', room);
    io.to(room.id).emit('room_update', room);
  });

  socket.on('join_room', ({ roomId, playerName }) => {
    const roomIdUpper = roomId.toUpperCase();
    const result = joinRoom(roomIdUpper, socket.id, playerName);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      socket.join(roomIdUpper);
      socket.emit('room_joined', result);
      io.to(roomIdUpper).emit('room_update', result);
    }
  });

  socket.on('start_game', ({ roomId }) => {
    const validation = validateStart(roomId, socket.id);
    if (validation.error) {
      socket.emit('error_message', validation.error);
      return;
    }
    const room = startGame(roomId);
    io.to(roomId).emit('game_started', { room, steps: STEPS });
  });

  socket.on('submit_step', ({ roomId, text }) => {
    const result = submitStep(roomId, socket.id, text);
    if (result.error) {
      socket.emit('error_message', result.error);
      return;
    }
    
    // Notify room that game state updated
    io.to(roomId).emit('game_update', result.room);
    
    // If round finished, specific event (optional depending on frontend needs)
    if (result.roundFinished) {
      io.to(roomId).emit('round_finished', result.room);
    }
  });

  socket.on('get_room_state', ({ roomId }) => {
      const room = getRoom(roomId);
      if (room) {
          socket.emit('room_update', room);
      }
  });

  socket.on('leave_room', ({ roomId }) => {
    const result = leaveRoom(roomId, socket.id);
    socket.leave(roomId);
    if (result && result.room && result.room.players.length > 0) {
      io.to(roomId).emit('room_update', result.room);
      if (result.leftName) {
        io.to(roomId).emit('error_message', `Pemain "${result.leftName}" keluar dari ruangan.`);
      }
    }
  });

  socket.on('back_to_lobby', ({ roomId }) => {
    const room = backToLobby(roomId);
    if (room) io.to(roomId).emit('room_update', room);
  });

  socket.on('move_player', ({ roomId, playerId, direction }) => {
    const result = movePlayer(roomId, socket.id, playerId, direction);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      io.to(roomId).emit('room_update', result);
    }
  });

  socket.on('set_pass_mode', ({ roomId, passMode }) => {
    const result = setPassMode(roomId, socket.id, passMode);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      io.to(roomId).emit('room_update', result);
    }
  });

  socket.on('set_ready', ({ roomId, isReady }) => {
    const result = setReadyStatus(roomId, socket.id, isReady);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      io.to(roomId).emit('room_update', result);
    }
  });

  socket.on('set_reveal_mode', ({ roomId, revealMode }) => {
    const result = setRevealMode(roomId, socket.id, revealMode);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      io.to(roomId).emit('room_update', result);
    }
  });

  socket.on('kick_player', ({ roomId, playerId }) => {
    const result = kickPlayer(roomId, socket.id, playerId);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      io.to(playerId).emit('kicked');
      const kickedSocket = io.sockets.sockets.get(playerId);
      if (kickedSocket) kickedSocket.leave(roomId);
      io.to(roomId).emit('room_update', result);
    }
  });

  socket.on('cancel_step', ({ roomId, playerId }) => {
    const roomIdUpper = roomId?.toUpperCase();
    // Gunakan playerId dari frontend jika ada (lebih stabil), fallback ke socket.id
    const targetId = playerId || socket.id;
    console.log(`-- CANCEL STEP REQUEST: Room ${roomIdUpper}, Player ${targetId} --`);
    const result = cancelStep(roomIdUpper, targetId);
    if (result.error) {
      console.log(`-- CANCEL STEP ERROR: ${result.error} --`);
      socket.emit('error_message', result.error);
    } else {
      console.log(`-- CANCEL STEP SUCCESS: Room ${roomId}, Player ${socket.id} --`);
      // Gunakan Deep Clone untuk memaksa React di frontend melakukan re-render
      const freshRoom = JSON.parse(JSON.stringify(result));
      io.to(roomId).emit('room_update', freshRoom);
      io.to(roomId).emit('game_update', freshRoom);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const affectedRooms = disconnectUser(socket.id);
    affectedRooms.forEach(({ room, disconnectedName, wasPlaying }) => {
      io.to(room.id).emit('room_update', room);
      const msg = `Pemain "${disconnectedName}" keluar dari ruangan.`;
      io.to(room.id).emit('error_message', wasPlaying ? `${msg} Permainan dibatalkan.` : msg);
    });
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`-- SERVER RUNNING ON PORT ${PORT} --`);
  console.log(`-- HOST BINDING TO 0.0.0.0 --`);
});
