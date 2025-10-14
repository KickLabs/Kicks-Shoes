/**
 * WebRTC Configuration
 * Enhanced ICE servers and connection settings for better cross-network connectivity
 */

// Build ICE servers from env with safe defaults. Avoid shipping hard-coded TURN creds.
function buildIceServers() {
  const iceServers = [
    // Use registered TURN servers instead of Google STUN
    // ExpressTURN STUN
    { urls: 'stun:relay1.expressturn.com:3478' },
    // Xirsys STUN
    { urls: 'stun:ss-turn1.xirsys.com' },
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

  // Check for Xirsys TURN servers
  const xirsysTurnUrl = import.meta?.env?.VITE_XIRYS_TURN_URL || '';
  const xirsysTurnUsername = import.meta?.env?.VITE_XIRYS_TURN_USERNAME || '';
  const xirsysTurnCredential = import.meta?.env?.VITE_XIRYS_TURN_CREDENTIAL || '';

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
  }

  if (xirsysTurnUrl && xirsysTurnUsername && xirsysTurnCredential) {
    // Add Xirsys TURN servers
    iceServers.push({
      urls: 'stun:ss-turn1.xirsys.com',
    });
    iceServers.push({
      urls: xirsysTurnUrl
        .split(',')
        .map(u => u.trim())
        .filter(Boolean),
      username: xirsysTurnUsername,
      credential: xirsysTurnCredential,
    });
  }

  if (!turnUrl && !xirsysTurnUrl) {
    // Fallback to multiple TURN servers for maximum reliability
    console.warn('No TURN credentials provided. Using multiple TURN servers for production.');
    iceServers.push(
      // ExpressTURN servers - production ready
      {
        urls: 'turn:relay1.expressturn.com:3480?transport=udp',
        username: '000000002075698469',
        credential: '4roONaZKXyvI3a0oVzVLAOQ3m4U=',
      },
      {
        urls: 'turn:relay1.expressturn.com:3480?transport=tcp',
        username: '000000002075698469',
        credential: '4roONaZKXyvI3a0oVzVLAOQ3m4U=',
      },
      {
        urls: 'turns:relay1.expressturn.com:3480?transport=tcp',
        username: '000000002075698469',
        credential: '4roONaZKXyvI3a0oVzVLAOQ3m4U=',
      },
      // Xirsys TURN servers - additional backup
      {
        urls: 'stun:ss-turn1.xirsys.com',
      },
      {
        urls: [
          'turn:ss-turn1.xirsys.com:80?transport=udp',
          'turn:ss-turn1.xirsys.com:3478?transport=udp',
          'turn:ss-turn1.xirsys.com:80?transport=tcp',
          'turn:ss-turn1.xirsys.com:3478?transport=tcp',
          'turns:ss-turn1.xirsys.com:443?transport=tcp',
          'turns:ss-turn1.xirsys.com:5349?transport=tcp',
        ],
        username:
          'C-9cBETPhN6kxM5BJirf7V5K5np3wmggRDUg2UuEb8XuLf283fUyMLnT_LZ9mD4yAAAAAGjso2BDdW9uZ0RR',
        credential: '32d8ae86-a802-11f0-972d-0242ac140004',
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

// Enhanced debugging for cross-network issues
export const WEBRTC_DEBUG_CONFIG = {
  enableDetailedLogging: true,
  logIceCandidates: true,
  logConnectionStates: true,
  logNetworkInfo: true,
};

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
  // Enhanced configuration for better cross-network connectivity
  iceConnectionReceivingTimeout: 30000, // 30 seconds
  iceBackupCandidatePairPingInterval: 25000, // 25 seconds
  // Force TURN for better connectivity
  iceTransportPolicy: 'relay', // Force TURN-only for maximum compatibility
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
