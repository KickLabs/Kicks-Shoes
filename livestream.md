# Livestream WebRTC (Node.js + React) – Minimal Starter

A minimal, self‑hosted livestream with **<50 viewers** using **WebRTC + WebSocket signaling**, with realtime **chat** visible to both seller (host) and all buyers (viewers). No YouTube or third‑party streaming APIs.

---

## Features

- Seller starts camera/mic and broadcasts via WebRTC.
- Buyers join a room to watch.
- Realtime chat; messages show up for everyone.
- Each viewer gets a dedicated PeerConnection with the host (simple star topology).
- STUN server configured; optional TURN hook included.

---

## Project Structure

```
webrtc-live/
├─ server/
│  ├─ package.json
│  ├─ .env (optional)
│  └─ index.js
└─ client/
   ├─ package.json
   ├─ vite.config.js
   └─ src/
      ├─ main.jsx
      ├─ App.jsx
      ├─ pages/
      │  ├─ Host.jsx
      │  └─ Viewer.jsx
      └─ components/
         └─ ChatBox.jsx
```

---

## 1) Server (Node.js + ws)

### server/package.json

```json
{
  "name": "webrtc-live-server",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "ws": "^8.18.0",
    "nanoid": "^5.0.7"
  }
}
```

### server/.env (optional)

```dotenv
PORT=8081
```

### server/index.js

```js
import { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 8081;
const wss = new WebSocketServer({ port: PORT });

// roomId -> { host: { ws, id }, viewers: Map<viewerId,{ws,id}> }
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { host: null, viewers: new Map() });
  }
  return rooms.get(roomId);
}

function safeSend(ws, obj) {
  try {
    ws.readyState === 1 && ws.send(JSON.stringify(obj));
  } catch {}
}

wss.on('connection', ws => {
  let roomId = null;
  let role = null; // "host" | "viewer"
  let clientId = nanoid(10);

  ws.on('message', buf => {
    const msg = JSON.parse(buf.toString());

    if (msg.type === 'join') {
      roomId = msg.roomId;
      role = msg.role;
      const room = getRoom(roomId);

      if (role === 'host') {
        // If there was an old host, drop it
        if (room.host?.ws) {
          safeSend(room.host.ws, { type: 'system', text: 'Replaced by new host.' });
          try {
            room.host.ws.close();
          } catch {}
        }
        room.host = { ws, id: clientId };
        safeSend(ws, { type: 'joined', role, clientId, viewers: Array.from(room.viewers.keys()) });
        // Announce current viewers to host
      } else if (role === 'viewer') {
        room.viewers.set(clientId, { ws, id: clientId });
        safeSend(ws, { type: 'joined', role, clientId });
        // Notify host that a new viewer joined
        if (room.host?.ws) safeSend(room.host.ws, { type: 'viewer-joined', viewerId: clientId });
      }
      return;
    }

    // Broadcast chat within room
    if (msg.type === 'chat') {
      const room = getRoom(roomId);
      const payload = { type: 'chat', from: role, clientId, text: msg.text, ts: Date.now() };
      if (room.host?.ws) safeSend(room.host.ws, payload);
      for (const { ws: vws } of room.viewers.values()) safeSend(vws, payload);
      return;
    }

    // WebRTC signaling
    if (msg.type === 'offer') {
      // host -> a specific viewer
      const room = getRoom(roomId);
      const { viewerId, sdp } = msg;
      const viewer = room.viewers.get(viewerId);
      if (viewer) safeSend(viewer.ws, { type: 'offer', sdp, fromHost: true, viewerId });
      return;
    }

    if (msg.type === 'answer') {
      // viewer -> host (for a specific viewerId)
      const room = getRoom(roomId);
      const { viewerId, sdp } = msg;
      if (room.host?.ws) safeSend(room.host.ws, { type: 'answer', sdp, viewerId });
      return;
    }

    if (msg.type === 'ice') {
      // relay ICE to the correct peer
      const room = getRoom(roomId);
      const { target, viewerId, candidate } = msg;
      if (target === 'host') {
        if (room.host?.ws) safeSend(room.host.ws, { type: 'ice', viewerId, candidate });
      } else if (target === 'viewer') {
        const viewer = room.viewers.get(viewerId);
        if (viewer) safeSend(viewer.ws, { type: 'ice', viewerId, candidate });
      }
      return;
    }
  });

  ws.on('close', () => {
    if (!roomId) return;
    const room = getRoom(roomId);

    if (role === 'host') {
      // notify all viewers the host left
      for (const { ws: vws } of room.viewers.values()) safeSend(vws, { type: 'host-left' });
      room.host = null;
    } else if (role === 'viewer') {
      room.viewers.delete(clientId);
      // inform host that viewer left
      if (room.host?.ws) safeSend(room.host.ws, { type: 'viewer-left', viewerId: clientId });
    }
  });
});

console.log(`WS signaling on ws://localhost:${PORT}`);
```

---

## 2) Client (React + Vite)

### client/package.json

```json
{
  "name": "webrtc-live-client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.2"
  }
}
```

### client/vite.config.js

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
```

### client/src/main.jsx

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

### client/src/App.jsx

```jsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Host from './pages/Host';
import Viewer from './pages/Viewer';

export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <h2>WebRTC Livestream Demo</h2>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link to="/host">Host</Link>
        <Link to="/viewer">Viewer</Link>
      </nav>
      <Routes>
        <Route path="/host" element={<Host />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="*" element={<p>Chọn Host hoặc Viewer</p>} />
      </Routes>
    </div>
  );
}
```

### client/src/components/ChatBox.jsx

```jsx
import React from 'react';

export default function ChatBox({ messages, onSend }) {
  const [text, setText] = React.useState('');
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ height: 180, overflowY: 'auto', border: '1px solid #ddd', padding: 8 }}>
        {messages.map((m, i) => (
          <div key={i}>
            <strong>{m.from}</strong>: {m.text}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && text.trim()) {
              onSend(text.trim());
              setText('');
            }
          }}
          placeholder="Nhập tin nhắn..."
          style={{ flex: 1 }}
        />
        <button
          onClick={() => {
            if (text.trim()) {
              onSend(text.trim());
              setText('');
            }
          }}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
```

### client/src/pages/Host.jsx

```jsx
import React from 'react';
import ChatBox from '../components/ChatBox';

const ROOM_ID = 'shop-001';
const WS_URL = 'ws://localhost:8081';
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // Optional TURN example (set your own):
  // { urls: 'turn:your.turn.server:3478', username: 'user', credential: 'pass' }
];

export default function Host() {
  const videoRef = React.useRef(null);
  const wsRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const peersRef = React.useRef(new Map()); // viewerId -> RTCPeerConnection
  const [messages, setMessages] = React.useState([]);
  const [info, setInfo] = React.useState({ clientId: null, viewers: [] });

  React.useEffect(() => {
    (async () => {
      // get camera/mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 24 },
        audio: true,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ type: 'join', roomId: ROOM_ID, role: 'host' }));

      ws.onmessage = async ev => {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'joined') {
          setInfo({ clientId: msg.clientId, viewers: msg.viewers || [] });
          // for already-present viewers, proactively create offers
          for (const vId of msg.viewers || []) {
            await createOfferForViewer(vId);
          }
        }
        if (msg.type === 'viewer-joined') {
          await createOfferForViewer(msg.viewerId);
        }
        if (msg.type === 'viewer-left') {
          const pc = peersRef.current.get(msg.viewerId);
          if (pc) {
            pc.close();
            peersRef.current.delete(msg.viewerId);
          }
        }
        if (msg.type === 'answer') {
          const pc = peersRef.current.get(msg.viewerId);
          if (pc && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
          }
        }
        if (msg.type === 'ice') {
          const pc = peersRef.current.get(msg.viewerId);
          if (pc && msg.candidate) {
            try {
              await pc.addIceCandidate(msg.candidate);
            } catch {}
          }
        }
        if (msg.type === 'chat') {
          setMessages(m => [...m, { from: msg.from, text: msg.text }]);
        }
      };
    })();
    return () => {
      wsRef.current?.close();
      for (const pc of peersRef.current.values()) {
        try {
          pc.close();
        } catch {}
      }
      peersRef.current.clear();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  async function createOfferForViewer(viewerId) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current.set(viewerId, pc);

    streamRef.current.getTracks().forEach(t => pc.addTrack(t, streamRef.current));

    pc.onicecandidate = e => {
      if (e.candidate)
        wsRef.current?.send(
          JSON.stringify({
            type: 'ice',
            target: 'viewer',
            viewerId,
            candidate: e.candidate,
          })
        );
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        peersRef.current.delete(viewerId);
      }
    };

    const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
    await pc.setLocalDescription(offer);
    wsRef.current?.send(JSON.stringify({ type: 'offer', viewerId, sdp: offer.sdp }));
  }

  function sendChat(text) {
    wsRef.current?.send(JSON.stringify({ type: 'chat', text }));
  }

  return (
    <div>
      <h3>Host</h3>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: 640, height: 360, background: '#000' }}
      />
      <p>
        Your ID: <code>{info.clientId}</code>
      </p>
      <ChatBox messages={messages} onSend={sendChat} />
      <p style={{ marginTop: 8 }}>
        Tip: dùng HTTPS/WSS trên domain thật để getUserMedia hoạt động ổn định.
      </p>
    </div>
  );
}
```

### client/src/pages/Viewer.jsx

```jsx
import React from 'react';
import ChatBox from '../components/ChatBox';

const ROOM_ID = 'shop-001';
const WS_URL = 'ws://localhost:8081';
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function Viewer() {
  const videoRef = React.useRef(null);
  const wsRef = React.useRef(null);
  const pcRef = React.useRef(null);
  const [messages, setMessages] = React.useState([]);
  const [ids, setIds] = React.useState({ clientId: null });

  React.useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: 'join', roomId: ROOM_ID, role: 'viewer' }));
    ws.onmessage = async ev => {
      const msg = JSON.parse(ev.data);

      if (msg.type === 'joined') setIds({ clientId: msg.clientId });

      if (msg.type === 'offer' && msg.fromHost && msg.viewerId) {
        // Create PC upon receiving offer
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;
        pc.ontrack = e => {
          if (videoRef.current) videoRef.current.srcObject = e.streams[0];
        };
        pc.onicecandidate = e => {
          if (e.candidate)
            wsRef.current?.send(
              JSON.stringify({
                type: 'ice',
                target: 'host',
                viewerId: msg.viewerId,
                candidate: e.candidate,
              })
            );
        };

        await pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        wsRef.current?.send(
          JSON.stringify({ type: 'answer', viewerId: msg.viewerId, sdp: answer.sdp })
        );
      }

      if (msg.type === 'ice' && msg.candidate && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(msg.candidate);
        } catch {}
      }

      if (msg.type === 'host-left') {
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
      }

      if (msg.type === 'chat') {
        setMessages(m => [...m, { from: msg.from, text: msg.text }]);
      }
    };

    return () => {
      wsRef.current?.close();
      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch {}
        pcRef.current = null;
      }
    };
  }, []);

  function sendChat(text) {
    wsRef.current?.send(JSON.stringify({ type: 'chat', text }));
  }

  return (
    <div>
      <h3>Viewer</h3>
      <video
        ref={videoRef}
        autoPlay
        controls
        playsInline
        style={{ width: 640, height: 360, background: '#000' }}
      />
      <p>
        Your ID: <code>{ids.clientId}</code>
      </p>
      <ChatBox messages={messages} onSend={sendChat} />
    </div>
  );
}
```

---

## 3) How to Run (local dev)

1. **Server**

   ```bash
   cd server
   npm i
   npm start
   # WS on ws://localhost:8081
   ```

2. **Client**

   ```bash
   cd client
   npm i
   npm run dev
   # Open http://localhost:5173
   ```

3. **Test**

   - Mở hai tab: một vào **/host**, một (hoặc nhiều) vào **/viewer**.
   - Cho phép truy cập camera & micro ở tab **host**.
   - Gửi chat từ viewer → host và ngược lại, sẽ thấy instant.

> **Note**: Trên môi trường thật, dùng **HTTPS/WSS** (Nginx reverse proxy) để `getUserMedia` hoạt động ổn định và tránh mixed content.

---

## 4) Production Notes

- **Bandwidth host** tăng theo số viewer (mỗi PeerConnection \~1 stream uplink). Hạn chế: \~10–20 viewers 720p tuỳ đường truyền. Khi gần ngưỡng, cân nhắc hạ bitrate hoặc chuyển sang **SFU** (LiveKit/mediasoup) tự host.
- **STUN/TURN**: thêm một **TURN (coturn)** cho các mạng NAT chặt chẽ:

  ```
  // ICE_SERVERS example
  [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:your.turn.server:3478', username: 'user', credential: 'pass' }
  ]
  ```

- **Auth**: khoá route /host bằng login, chỉ seller mới phát được.
- **Scaling**: tách signaling thành dịch vụ riêng; log chat vào DB.

---

## 5) Message Contract (WebSocket)

- `join` `{ type, roomId, role }`
- `joined` `{ type, role, clientId, [viewers] }`
- `viewer-joined` `{ type, viewerId }`
- `viewer-left` `{ type, viewerId }`
- `offer` (host→viewer) `{ type, viewerId, sdp }`
- `answer` (viewer→host) `{ type, viewerId, sdp }`
- `ice` `{ type, target: 'host'|'viewer', viewerId, candidate }`
- `chat` `{ type, text }` → broadcast room
- `host-left` when host disconnects

---

## 6) Next Steps (nice-to-have)

- Nút **Start/Stop** camera, chọn thiết bị audio/video.
- Điều chỉnh **encoding params** (bitrate/framerate) bằng `RTCRtpSender.setParameters`.
- Ghi lại chat + replays (ghi client side bằng MediaRecorder trên host nếu cần).
- Chuyển sang **SFU** khi số viewer tăng.
