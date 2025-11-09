// server.js (full-featured)
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// serve static public folder
app.use(express.static(path.join(__dirname, 'public')));

// in-memory state for demo
const users = new Map();      // socketId -> { id, name, color, width }
let opStack = [];             // finalized strokes
let redoStack = [];           // for redo

function broadcastUsers() {
  const list = Array.from(users.values()).map(u => ({ id: u.id, name: u.name, color: u.color, width: u.width }));
  io.emit('users:update', list);
}
function broadcastOps() {
  io.emit('ops:update', { ops: opStack });
}

io.on('connection', socket => {
  console.log('socket connected', socket.id);

  // Client will call 'join' after connecting
  socket.on('join', (meta = {}) => {
    const user = {
      id: socket.id,
      name: meta.name || `User-${socket.id.slice(0,4)}`,
      color: meta.color || '#000000',
      width: meta.width || 3
    };
    users.set(socket.id, user);
    // welcome payload: current ops and users
    socket.emit('welcome', { id: socket.id, users: Array.from(users.values()), ops: opStack });
    broadcastUsers();
    console.log('user joined:', user.name);
  });

  socket.on('meta:update', (meta = {}) => {
    const u = users.get(socket.id) || {};
    if (meta.name !== undefined) u.name = meta.name;
    if (meta.color !== undefined) u.color = meta.color;
    if (meta.width !== undefined) u.width = meta.width;
    users.set(socket.id, u);
    broadcastUsers();
  });

  // cursor broadcasting
  socket.on('cursor', (payload) => {
    const user = users.get(socket.id) || {};
    const p = { id: socket.id, x: payload.x, y: payload.y, name: user.name || payload.name || 'Anon', color: user.color || payload.color || '#000' };
    socket.broadcast.emit('cursor', p);
  });
  socket.on('cursor:leave', () => {
    socket.broadcast.emit('cursor:leave', { id: socket.id });
  });

  // strokes (start/progress/end)
  socket.on('stroke:start', (stroke) => {
    // broadcast to others (live preview)
    socket.broadcast.emit('stroke:progress', stroke);
  });

  socket.on('stroke:progress', (partial) => {
    socket.broadcast.emit('stroke:progress', partial);
  });

  socket.on('stroke:end', (stroke) => {
    const op = {
      id: stroke.id,
      userId: socket.id,
      points: stroke.points,
      color: stroke.color,
      width: stroke.width,
      timestamp: stroke.timestamp || Date.now()
    };
    opStack.push(op);
    // new op clears redo stack (standard semantics)
    redoStack = [];
    // broadcast final stroke to all
    io.emit('stroke:end', op);
  });

  // global undo
  socket.on('undo', () => {
    if (opStack.length === 0) return;
    const removed = opStack.pop();
    redoStack.push(removed);
    broadcastOps();
  });

  // global redo
  socket.on('redo', () => {
    if (redoStack.length === 0) return;
    const restored = redoStack.pop();
    opStack.push(restored);
    broadcastOps();
  });

  // clear canvas (server)
  socket.on('clear', () => {
    opStack = [];
    redoStack = [];
    broadcastOps();
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    broadcastUsers();
    socket.broadcast.emit('cursor:leave', { id: socket.id });
    console.log('socket disconnected', socket.id);
  });

});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
