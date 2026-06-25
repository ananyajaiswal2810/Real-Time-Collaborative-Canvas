Real-Time Collaborative Canvas

A multi-user collaborative drawing board built with Node.js, Express, and Socket.IO. Multiple users can draw on the same canvas simultaneously in real time — no account or setup required, just open and draw.

Features


Freehand pen — draw freely with smooth stroke rendering
Shapes — draw rectangles and circles with click-and-drag
Eraser — erase parts of the canvas without clearing everything
Colour picker — choose any stroke colour before drawing
Clear canvas — wipe the board clean for all connected users instantly
Real-time sync — all drawing actions broadcast instantly to every connected user via WebSockets


Tech Stack

LayerTechnologyBackendNode.js, ExpressReal-time communicationSocket.IOFrontendHTML5 Canvas, CSS3, Vanilla JavaScript

Getting Started

Prerequisites


Node.js (v18 or above)


Installation

bashgit clone https://github.com/ananyajaiswal2810/Real-Time-Collaborative-Canvas.git
cd Real-Time-Collaborative-Canvas
npm install

Run locally

bashnpm start

Open http://localhost:3000 in two or more browser tabs to see real-time collaboration in action.

How It Works

The server acts as a relay — when a user draws a stroke, the coordinates and tool state are emitted as a Socket.IO event to the server, which broadcasts them to all other connected clients. Each client re-renders the received stroke on their local canvas, keeping all views in sync.

Project Structure

├── server.js          # Express + Socket.IO server
├── public/            # Static frontend (HTML, CSS, JS)
│   └── index.html     # Canvas UI and client-side socket logic
├── package.json

Author

Ananya Jaiswal 
