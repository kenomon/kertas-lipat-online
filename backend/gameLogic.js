import { randomBytes } from 'crypto';

// Basic state
const rooms = new Map();

export const MAX_ROUNDS = 7;

export const STEPS = [
  { id: 1, label: "Nama", desc: "Masukkan nama siapa saja di sini. Bisa teman yang sedang main bareng kamu sekarang, orang yang kalian semua kenal, atau tokoh terkenal sekalian.", defaultPrefix: "" },
  { id: 2, label: "Sewaktu ...", desc: "Masukkan keterangan waktu atau momen tertentu. Contoh: 'Sewaktu bayi', 'Sewaktu menikah', atau 'Sewaktu dunia dilanda pandemi'", defaultPrefix: "Sewaktu " },
  { id: 3, label: "Kata kerja Me-", desc: "Masukkan satu kata kerja aktif berawalan 'Me-'. Pastikan kata ini bisa diikuti oleh benda atau orang lain (Contoh: 'Mencuci', 'Meniup', 'Membelah').", defaultPrefix: "" },
  { id: 4, label: "Bagian Tubuh", desc: "Masukkan satu nama anggota tubuh manusia atau hewan.", defaultPrefix: "" },
  { id: 5, label: "Nama (lagi)", desc: "Masukkan satu nama lagi di sini. Bisa nama teman, tokoh terkenal, atau bahkan nama hewan. Disarankan pilih nama yang berbeda dari yang pertama", defaultPrefix: "" },
  { id: 6, label: "Sampai ...", desc: "Masukkan sebuah kondisi atau keterangan waktu penutup. Bayangkan seberapa lama atau seberapa parah kejadian tadi berlangsung. Contoh: 'Sampai nangis', 'Sampai kenyang', atau 'Sampai tahun depan'.", defaultPrefix: "Sampai " },
  { id: 7, label: "Di ...", desc: "Masukkan sebuah keterangan tempat. Bayangkan di mana semua kejadian ini berlangsung. Contoh: 'Di dalam lemari', 'Di Mars', atau 'Di konser dangdut'.", defaultPrefix: "Di " }
];

export function generateRoomId() {
  let id;
  do {
    id = randomBytes(2).toString('hex').toUpperCase(); // 4 chars
  } while (rooms.has(id));
  return id;
}

export function createRoom(socketId, playerName) {
  const roomId = generateRoomId();
  const player = { id: socketId, name: playerName, isHost: true, hasSubmitted: false, isReady: false };
  const room = {
    id: roomId,
    state: 'lobby',
    passMode: 'sequential', // 'sequential' or 'random'
    revealMode: 'individual', // 'all' or 'individual'
    players: [player],
    papers: {}, 
    round: 1,
    lastActivity: Date.now()
  };
  rooms.set(roomId, room);
  return room;
}

export function updateRoomActivity(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    room.lastActivity = Date.now();
  }
}

export function cleanupRooms(timeoutMs) {
  const now = Date.now();
  let count = 0;
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActivity > timeoutMs) {
      rooms.delete(roomId);
      count++;
    }
  }
  return count;
}

export function joinRoom(roomId, socketId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  if (room.state !== 'lobby') return { error: 'Game has already started' };
  if (room.players.find(p => p.id === socketId)) return { error: 'Already in room' };

  if (room.players.length === 0) {
    room.players.push({ id: socketId, name: playerName, isHost: true, hasSubmitted: false, isReady: false });
  } else {
    room.players.push({ id: socketId, name: playerName, isHost: false, hasSubmitted: false, isReady: false });
  }
  updateRoomActivity(roomId);
  return room;
}

// Saat socket reconnect, update ID lama ke ID baru agar pemain tetap di room
export function rejoinRoom(roomId, newSocketId, playerName, oldSocketId) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };

  // Cari pemain berdasarkan oldSocketId atau nama (fallback)
  let player = oldSocketId ? room.players.find(p => p.id === oldSocketId) : null;
  if (!player) {
    player = room.players.find(p => p.name === playerName);
  }
  
  if (!player) {
    console.log(`-- REJOIN FAIL: Player ${playerName} (oldId: ${oldSocketId}) not found in room ${roomId} --`);
    return { error: 'Pemain tidak ditemukan di ruangan ini.' };
  }

  const prevId = player.id;
  // Update player ID
  player.id = newSocketId;

  // Update papers: ganti semua referensi ke prevId
  // Note: paperId adalah originalOwnerId
  for (const paperId in room.papers) {
    const paper = room.papers[paperId];
    if (paper.originalOwnerId === prevId) paper.originalOwnerId = newSocketId;
    if (paper.currentHolderId === prevId) paper.currentHolderId = newSocketId;
  }

  // Juga update key di papers map jika key-nya adalag prevId (artinya dia owner aslinya)
  if (room.papers[prevId]) {
    room.papers[newSocketId] = room.papers[prevId];
    delete room.papers[prevId];
    console.log(`-- REJOIN: Moved paper ownership from ${prevId} to ${newSocketId} --`);
  }

  // Update steps authorId agar pencocokan di cancelStep tetap jalan
  for (const paperId in room.papers) {
    const paper = room.papers[paperId];
    if (paper.steps) {
      paper.steps.forEach(step => {
        if (step.authorId === prevId) step.authorId = newSocketId;
      });
    }
  }

  console.log(`-- REJOIN SUCCESS: Player ${playerName} updated from ${prevId} to ${newSocketId} --`);
  updateRoomActivity(roomId);
  return room;
}


export function validateStart(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  if (room.state !== 'lobby') return { error: 'Game already started' };
  const player = room.players.find(p => p.id === socketId);
  if (!player || !player.isHost) return { error: 'Only host can start' };
  if (room.players.length < 3) return { error: 'Minimum 3 players required' };
  
  const allPlayersReady = room.players.filter(p => !p.isHost).every(p => p.isReady);
  if (!allPlayersReady) return { error: 'Semua pemain harus siap sebelum mulai' };
  
  return room;
}

export function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  room.state = 'playing';
  room.round = 1;
  room.papers = {};
  
  // Create a paper for each player
  room.players.forEach((p, index) => {
    p.hasSubmitted = false;
    p.isReady = false;
    room.papers[p.id] = {
      originalOwnerId: p.id,
      originalOwnerName: p.name,
      currentHolderId: p.id,
      currentHolderIndex: index,
      steps: []
    };
  });
  
  updateRoomActivity(roomId);
  return room;
}

export function submitStep(roomId, socketId, text) {
  const room = rooms.get(roomId);
  if (!room || room.state !== 'playing') return { error: 'Game not active' };
  
  const player = room.players.find(p => p.id === socketId);
  if (!player) return { error: 'Player not found' };
  if (player.hasSubmitted) return { error: 'Already submitted this round' };

  // Find the paper currently held by this player
  const paperEntry = Object.entries(room.papers).find(([_, paper]) => paper.currentHolderId === socketId);
  if (!paperEntry) return { error: 'Paper not found for player' };
  
  const [paperId, paper] = paperEntry;
  
  paper.steps.push({
    round: room.round,
    text: text.trim(),
    authorId: socketId,
    authorName: player.name
  });
  
  player.hasSubmitted = true;
  
  // Check if everyone submitted
  const allSubmitted = room.players.every(p => p.hasSubmitted);
  
  let result = { room, roundFinished: false };
  
  if (allSubmitted) {
    result.roundFinished = true;
    
    // Rotate papers depending on pass mode
    if (room.passMode === 'random') {
      let availablePapers = Object.values(room.papers);
      // Basic random shuffle
      availablePapers.sort(() => Math.random() - 0.5);
      room.players.forEach((p, index) => {
        const paper = availablePapers[index];
        paper.currentHolderIndex = index;
        paper.currentHolderId = p.id;
      });
    } else {
      // Sequential rotation
      Object.values(room.papers).forEach(p => {
        p.currentHolderIndex = (p.currentHolderIndex + 1) % room.players.length;
        p.currentHolderId = room.players[p.currentHolderIndex].id;
      });
    }
    
    // Reset submitted flags
    room.players.forEach(p => p.hasSubmitted = false);
    
    // Increment round
    room.round++;
    if (room.round > MAX_ROUNDS) {
      room.state = 'reveal';
    }
  }
  
  updateRoomActivity(roomId);
  return result;
}

export function backToLobby(roomId) {
  const room = rooms.get(roomId);
  if (room && room.state === 'reveal') {
    room.state = 'lobby';
    updateRoomActivity(roomId);
  }
  return room;
}

export function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const pIndex = room.players.findIndex(p => p.id === socketId);
  let leftName = null;
  if (pIndex !== -1) {
    leftName = room.players[pIndex].name;
    const wasHost = room.players[pIndex].isHost;
    room.players.splice(pIndex, 1);
    if (room.players.length === 0) {
      rooms.delete(roomId);
    } else {
      if (wasHost && room.players.length > 0) {
        const randomIndex = Math.floor(Math.random() * room.players.length);
        room.players[randomIndex].isHost = true;
      }
    }
    updateRoomActivity(roomId);
  }
  return { room, leftName };
}

export function setPassMode(roomId, socketId, passMode) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  
  const caller = room.players.find(p => p.id === socketId);
  if (!caller || !caller.isHost) return { error: 'Only Host can change pass mode' };
  
  room.passMode = passMode;
  updateRoomActivity(roomId);
  return room;
}

export function cancelStep(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Ruangan tidak ditemukan atau sudah ditutup (server restart).' };
  if (room.state !== 'playing') return { error: 'Permainan sedang tidak aktif.' };
  
  // Cari pemain berdasarkan ID stabil
  const player = room.players.find(p => p.id === socketId);
  
  if (!player) {
    console.log(`-- CANCEL FAIL: Player with socketId ${socketId} not found in room ${roomId} --`);
    return { error: 'Identitas pemain tidak sinkron karena koneksi terputus. Mohon refresh halaman.' };
  }

  if (!player.hasSubmitted) {
    return { error: 'Kamu belum mengirim jawaban ronde ini.' };
  }

  // Cari kertas yang saat ini dipegang oleh pemain ini
  let targetPaper = null;
  for (const paperId in room.papers) {
    if (room.papers[paperId].currentHolderId === player.id) {
      targetPaper = room.papers[paperId];
      break;
    }
  }

  if (targetPaper && targetPaper.steps.length > 0) {
    const lastStep = targetPaper.steps[targetPaper.steps.length - 1];
    
    // Pastikan langkah terakhir memang miliknya di ronde ini
    if (lastStep.round === room.round) {
      if (lastStep.authorId === player.id) {
        targetPaper.steps.pop();
        console.log(`-- CANCEL SUCCESS: Popped step for ${player.name} in round ${room.round} --`);
      } else {
        console.log(`-- CANCEL WARNING: Author mismatch for ${player.name}. LastStep author: ${lastStep.authorId} vs PlayerId: ${player.id} --`);
        // Tetap allow cancel status submitted agar pemain bisa mencoba kirim lagi jika terjadi error aneh
      }
    } else {
      console.log(`-- CANCEL FAIL: Round mismatch. Room: ${room.round}, LastStep: ${lastStep.round} --`);
      return { error: 'Waktu habis! Ronde sudah berganti.' };
    }
  } else {
    console.log(`-- CANCEL ERROR: No paper/steps found for ${player.name} --`);
  }
  
  player.hasSubmitted = false;
  updateRoomActivity(roomId);
  return room;
}

export function movePlayer(roomId, socketId, playerId, direction) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  
  const caller = room.players.find(p => p.id === socketId);
  if (!caller || !caller.isHost) return { error: 'Only Host can reorder players' };
  
  const index = room.players.findIndex(p => p.id === playerId);
  if (index === -1) return { error: 'Player not found' };

  if (direction === 'up' && index > 0) {
    [room.players[index - 1], room.players[index]] = [room.players[index], room.players[index - 1]];
  } else if (direction === 'down' && index < room.players.length - 1) {
    [room.players[index + 1], room.players[index]] = [room.players[index], room.players[index + 1]];
  }
  
  updateRoomActivity(roomId);
  return room;
}

export function disconnectUser(socketId) {
  let updatedRooms = [];
  
  for (const [roomId, room] of rooms.entries()) {
    const pIndex = room.players.findIndex(p => p.id === socketId);
    if (pIndex !== -1) {
      const disconnectedName = room.players[pIndex].name;
      const wasHost = room.players[pIndex].isHost;
      room.players.splice(pIndex, 1);
      
      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        if (wasHost) {
          // Assign new host randomly
          const randomIndex = Math.floor(Math.random() * room.players.length);
          room.players[randomIndex].isHost = true;
        }
        let wasPlaying = false;
        // If in game, dropping out breaks it. Simply end it.
        if (room.state === 'playing') {
          room.state = 'lobby'; // Reset to lobby
          wasPlaying = true;
        }
        updateRoomActivity(roomId);
        updatedRooms.push({ room, disconnectedName, wasPlaying });
      }
    }
  }
  return updatedRooms;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

export function setReadyStatus(roomId, socketId, isReady) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  
  const player = room.players.find(p => p.id === socketId);
  if (!player) return { error: 'Player not found' };
  
  player.isReady = isReady;
  updateRoomActivity(roomId);
  return room;
}

export function kickPlayer(roomId, hostSocketId, playerToKickId) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  
  const host = room.players.find(p => p.id === hostSocketId);
  if (!host || !host.isHost) return { error: 'Hanya Host yang bisa mengeluarkan pemain' };
  
  const index = room.players.findIndex(p => p.id === playerToKickId);
  if (index === -1) return { error: 'Pemain tidak ditemukan' };
  
  room.players.splice(index, 1);
  if (room.players.length === 0) {
    rooms.delete(roomId);
  } else {
    if (!room.players.some(p => p.isHost)) {
       room.players[0].isHost = true;
    }
  }
  updateRoomActivity(roomId);
  return room;
}

export function setRevealMode(roomId, socketId, revealMode) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };

  const caller = room.players.find(p => p.id === socketId);
  if (!caller || !caller.isHost) return { error: 'Hanya Host yang bisa mengubah mode tampilan' };

  room.revealMode = revealMode;
  updateRoomActivity(roomId);
  return room;
}
