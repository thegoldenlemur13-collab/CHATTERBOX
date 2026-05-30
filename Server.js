const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route (fixes "Not Found")
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const users = new Map();
const rooms = new Set(['global']);

io.on('connection', (socket) => {
  console.log('🔥 New hero connected:', socket.id);

  socket.on('setUsername', (username) => {
    if (!username || users.has(username)) {
      return socket.emit('usernameError', 'Username taken!');
    }
    users.set(username, socket.id);
    socket.username = username;
    socket.join('global');
    socket.emit('usernameSet', { username, rooms: Array.from(rooms) });
  });

  socket.on('chatMessage', (data) => {
    const room = data.room || 'global';
    io.to(room).emit('chatMessage', {
      username: socket.username,
      message: data.message,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    if (socket.username) users.delete(socket.username);
  });
});

// Use Render's port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Chatterbox successfully running on port ${PORT}`);
});
