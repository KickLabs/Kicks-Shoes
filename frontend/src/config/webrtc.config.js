/**
 * WebRTC Configuration
 * Enhanced ICE servers and connection settings for better cross-network connectivity
 */

// Build ICE servers from env with safe defaults. Avoid shipping hard-coded TURN creds.
function buildIceServers() {
  const iceServers = [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    // Additional reliable STUN servers
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.ideasip.com' },
    { urls: 'stun:stun.rixtelecom.se' },
    { urls: 'stun:stun.schlund.de' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    { urls: 'stun:stun.voxgratia.org' },
    { urls: 'stun:stunserver.org:3478' },
  ];

  // Check for custom TURN from environment
  const turnUrl = import.meta?.env?.VITE_TURN_URL || '';
  const turnUsername = import.meta?.env?.VITE_TURN_USERNAME || '';
  const turnCredential = import.meta?.env?.VITE_TURN_CREDENTIAL || '';

  if (turnUrl && turnUsername && turnCredential) {
    // Support multiple comma-separated URLs
    turnUrl
      .split(',')
      .map(u => u.trim())
      .filter(Boolean)
      .forEach(url => {
        iceServers.push({
          urls: url,
          username: turnUsername,
          credential: turnCredential,
        });
      });
  } else {
    // Fallback to public TURN servers (less reliable but better than nothing)
    console.warn(
      'No TURN credentials provided. Using public TURN servers which may be unreliable.'
    );
    iceServers.push(
      {
        urls: 'turn:turn01.hubl.in?transport=udp',
        username: 'webrtc',
        credential: 'webrtc',
      },
      {
        urls: 'turn:turn02.hubl.in?transport=tcp',
        username: 'webrtc',
        credential: 'webrtc',
      },
      {
        urls: 'turn:turn.bistri.com:80',
        username: 'homeo',
        credential: 'homeo',
      },
      {
        urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
        username: 'webrtc',
        credential: 'webrtc',
      }
    );
  }

  return iceServers;
}

export const ICE_SERVERS = buildIceServers();

// Log ICE servers for debugging
console.log(
  '🧊 ICE Servers configured:',
  ICE_SERVERS.map(s => ({
    urls: s.urls,
    hasCredentials: !!(s.username && s.credential),
  }))
);

// Allow forcing TURN-only via env to diagnose cross-network issues
const forceRelay = (import.meta?.env?.VITE_WEBRTC_FORCE_TURN || '').toString() === '1';

if (forceRelay) {
  console.log('🔧 TURN-only mode enabled for debugging cross-network connectivity');
}

export const PEER_CONNECTION_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceTransportPolicy: forceRelay ? 'relay' : 'all',
};

export const OFFER_OPTIONS = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
  voiceActivityDetection: true,
};

export const SOCKET_CONFIG = {
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: true,
  timeout: 10000,
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  maxReconnectionAttempts: 5,
};

export const CONNECTION_STATES = {
  NEW: 'new',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
  CLOSED: 'closed',
};

export const ICE_CONNECTION_STATES = {
  NEW: 'new',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DISCONNECTED: 'disconnected',
  CLOSED: 'closed',
};
