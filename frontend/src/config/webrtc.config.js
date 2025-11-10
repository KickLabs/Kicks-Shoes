/**
 * WebRTC Configuration
 * Enhanced ICE servers and connection settings for better cross-network connectivity
 */

// Build ICE servers from env with safe defaults. Avoid shipping hard-coded TURN creds.
function buildIceServers() {
  const iceServers = [
    // Google STUN servers - most reliable
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Additional reliable STUN servers
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stunserver.org' },
  ];

  // Check for custom TURN from environment
  const turnUrl =
    'turn:relay1.expressturn.com:3480?transport=udp,turn:relay1.expressturn.com:3480?transport=tcp,turns:relay1.expressturn.com:3480?transport=tcp';
  const turnUsername = '000000002075698469';
  const turnCredential = '4roONaZKXyvI3a0oVzVLAOQ3m4U=';

  // Check for Xirsys TURN servers - Updated credentials
  const xirsysTurnUrl =
    'turn:ss-turn1.xirsys.com:80?transport=udp,turn:ss-turn1.xirsys.com:3478?transport=udp,turn:ss-turn1.xirsys.com:80?transport=tcp,turn:ss-turn1.xirsys.com:3478?transport=tcp,turns:ss-turn1.xirsys.com:443?transport=tcp,turns:ss-turn1.xirsys.com:5349?transport=tcp';
  const xirsysTurnUsername =
    'cueqKJ4SvvtP_vN87mV2OxH6fzpeerFblcv34bxVRRpdqdONSdufIYjv_tVGCIqQAAAAAGkCSDlRdWFuZ0N1b25n';
  const xirsysTurnCredential = 'cd6359cc-b4e8-11f0-ae07-0242ac140004';

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
      // Xirsys TURN servers - updated credentials
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
          'cueqKJ4SvvtP_vN87mV2OxH6fzpeerFblcv34bxVRRpdqdONSdufIYjv_tVGCIqQAAAAAGkCSDlRdWFuZ0N1b25n',
        credential: 'cd6359cc-b4e8-11f0-ae07-0242ac140004',
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
  sdpSemantics: 'unified-plan',
  // More aggressive ICE configuration for cross-network connectivity
  iceCandidatePoolSize: 10,
  iceConnectionReceivingTimeout: 30000,
  iceBackupCandidatePairPingInterval: 25000,
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
