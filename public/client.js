// public/client.js - collaborative client (vanilla JS)
(() => {
  const socket = io();

  // DOM
  const canvas = document.getElementById('canvas');
  const cursorsLayer = document.getElementById('cursors');
  const usersList = document.getElementById('usersList');

  const displayNameInput = document.getElementById('displayName');
  const colorPicker = document.getElementById('colorPicker');
  const widthRange = document.getElementById('widthRange');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const clearBtn = document.getElementById('clearBtn');

  // canvas setup
  const ctx = canvas.getContext('2d', { alpha: true });
  canvas.style.width = '100%';
  canvas.style.height = (window.innerHeight - 24) + 'px';
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderFromOps();
  }
  window.addEventListener('resize', resizeCanvas);

  // local state
  let localUser = { id: null, name: '', color: '#000', width: 3 };
  let isDrawing = false;
  let currentStroke = null;
  let pendingStrokeMap = {};
  let ops = [];

  // utilities
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,9);
  function getCanvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
  function drawStrokeOnContext(ctx, stroke) {
    if (!stroke || !stroke.points || stroke.points.length < 1) return;
    ctx.save();
    ctx.strokeStyle = stroke.color || '#000';
    ctx.lineWidth = stroke.width || 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const pts = stroke.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }

  function renderFromOps() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const op of ops) drawStrokeOnContext(ctx, op);
    for (const k in pendingStrokeMap) drawStrokeOnContext(ctx, pendingStrokeMap[k]);
  }

  // cursor UI helpers
  const otherCursors = {};
  function updateOrCreateCursor(user) {
    if (!user || user.id === localUser.id) return;
    let c = otherCursors[user.id];
    if (!c) {
      const el = document.createElement('div');
      el.className = 'cursor';
      el.innerHTML = `<span class="dot" style="background:${user.color}"></span><span class="name">${escapeHtml(user.name||'Anon')}</span>`;
      cursorsLayer.appendChild(el);
      c = { el };
      otherCursors[user.id] = c;
    }
    c.el.style.left = (user.x) + 'px';
    c.el.style.top = (user.y) + 'px';
  }
  function removeCursor(id) {
    const c = otherCursors[id];
    if (c) { c.el.remove(); delete otherCursors[id]; }
  }
  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  // socket events
  socket.on('connect', () => {
    localUser.id = socket.id;
    localUser.name = displayNameInput.value || `User-${socket.id.slice(0,4)}`;
    localUser.color = colorPicker.value;
    localUser.width = Number(widthRange.value);
    socket.emit('join', { name: localUser.name, color: localUser.color, width: localUser.width });
  });

  socket.on('welcome', data => {
    if (data.id) localUser.id = data.id;
    if (data.users) renderUsersList(data.users);
    ops = data.ops || [];
    renderFromOps();
  });

  socket.on('users:update', users => renderUsersList(users));

  socket.on('cursor', user => updateOrCreateCursor(user));
  socket.on('cursor:leave', ({id}) => removeCursor(id));

  socket.on('stroke:progress', payload => {
    if (!payload || !payload.id) return;
    pendingStrokeMap[payload.id] = payload;
    renderFromOps();
  });

  socket.on('stroke:end', payload => {
    if (!payload || !payload.id) return;
    delete pendingStrokeMap[payload.id];
    ops.push(payload);
    renderFromOps();
  });

  socket.on('ops:update', payload => {
    ops = payload.ops || [];
    pendingStrokeMap = {};
    renderFromOps();
  });

  // input handling
  const THROTTLE_MS = 20;
  let lastEmit = 0;
  function startLocalStroke(pt) {
    isDrawing = true;
    const strokeId = uid();
    currentStroke = { id: strokeId, userId: localUser.id, points: [pt], color: colorPicker.value, width: Number(widthRange.value), timestamp: Date.now() };
    pendingStrokeMap[strokeId] = currentStroke;
    socket.emit('stroke:start', currentStroke);
    renderFromOps();
  }
  function continueLocalStroke(pt) {
    if (!isDrawing || !currentStroke) return;
    currentStroke.points.push(pt);
    const now = Date.now();
    if (now - lastEmit > THROTTLE_MS) {
      lastEmit = now;
      socket.emit('stroke:progress', { id: currentStroke.id, points: currentStroke.points.slice(-8), userId: localUser.id, color: currentStroke.color, width: currentStroke.width, timestamp: Date.now() });
    }
    renderFromOps();
  }
  function endLocalStroke() {
    if (!isDrawing || !currentStroke) return;
    socket.emit('stroke:end', currentStroke);
    delete pendingStrokeMap[currentStroke.id];
    currentStroke = null;
    isDrawing = false;
    renderFromOps();
  }

  // pointer events
  let pointerDown = false;
  canvas.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    pointerDown = true;
    canvas.setPointerCapture(ev.pointerId);
    const pt = getCanvasPoint(ev.clientX, ev.clientY);
    startLocalStroke(pt);
  });
  canvas.addEventListener('pointermove', (ev) => {
    const pt = getCanvasPoint(ev.clientX, ev.clientY);
    socket.emit('cursor', { id: localUser.id, x: pt.x, y: pt.y, name: displayNameInput.value || localUser.name, color: colorPicker.value });
    if (!pointerDown) return;
    continueLocalStroke(pt);
  });
  canvas.addEventListener('pointerup', (ev) => {
    pointerDown = false;
    try { canvas.releasePointerCapture(ev.pointerId); } catch(e) {}
    endLocalStroke();
  });
  canvas.addEventListener('pointerleave', () => { socket.emit('cursor:leave', { id: localUser.id }); });

  // UI buttons
  undoBtn.addEventListener('click', () => socket.emit('undo'));
  redoBtn.addEventListener('click', () => socket.emit('redo'));
  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear canvas for everyone?')) return;
    socket.emit('clear');
  });

  // meta updates
  displayNameInput.addEventListener('change', () => {
    localUser.name = displayNameInput.value;
    socket.emit('meta:update', { name: localUser.name });
  });
  colorPicker.addEventListener('change', () => {
    localUser.color = colorPicker.value;
    socket.emit('meta:update', { color: localUser.color });
  });
  widthRange.addEventListener('change', () => {
    localUser.width = Number(widthRange.value);
    socket.emit('meta:update', { width: localUser.width });
  });

  // users list UI
  function renderUsersList(users) {
    usersList.innerHTML = '';
    users.forEach(u => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="swatch" style="background:${u.color}; width:12px;height:12px;display:inline-block;margin-right:8px;border-radius:3px;"></span><strong>${escapeHtml(u.name||'Anon')}</strong>`;
      usersList.appendChild(li);
    });
  }

  // init canvas sizing & render
  requestAnimationFrame(() => {
    resizeCanvas();
  });

})();
