const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "*" } 
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Important: Serve index.html for all routes (fixes "Not Found")
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const users = new Map();
const rooms = new Set(['global']);

io.on('connection', (socket) => {
  console.log('🔥 New hero connected:', socket.id);

  socket.on('setUsername', (username) => {
    if (!username || users.has(username)) {
      socket.emit('usernameError', 'Username taken or invalid!');
      return;
    }
    users.set(username, socket.id);
    socket.username = username;
    socket.join('global');
    socket.emit('usernameSet', { username, rooms: Array.from(rooms) });
    io.emit('userJoined', { username });
  });

  socket.on('createGroup', (groupName) => {
    const room = groupName.toLowerCase().replace(/\s+/g, '-');
    if (!rooms.has(room)) rooms.add(room);
    socket.join(room);
    socket.currentRoom = room;
    socket.emit('joinedGroup', { room });
    io.emit('newGroupCreated', { room, name: groupName });
  });

  socket.on('joinGroup', (room) => {
    socket.join(room);
    socket.currentRoom = room;
    socket.emit('joinedGroup', { room });
  });

  socket.on('chatMessage', (data) => {
    const room = data.room || 'global';
    io.to(room).emit('chatMessage', {
      username: socket.username,
      message: data.message,
      timestamp: new Date().toLocaleTimeString(),
      room
    });
  });

  socket.on('disconnect', () => {
    if (socket.username) users.delete(socket.username);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Chatterbox running on port ${PORT}`);
});
