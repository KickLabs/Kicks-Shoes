/**
 * WebRTC Configuration
 * Enhanced ICE servers and connection settings for better cross-network connectivity
 */

// Build ICE servers from environment variables with safe defaults
function buildIceServers() {
  const iceServers = [];

  // Add STUN servers from environment variables
  const stunUrl1 = import.meta?.env?.VITE_STUN_URL || '';
  const stunUrl2 = import.meta?.env?.VITE_STUN_URL_2 || '';

  if (stunUrl1) {
    iceServers.push({ urls: stunUrl1 });
  }
  if (stunUrl2) {
    iceServers.push({ urls: stunUrl2 });
  }

  // Fallback STUN servers if no environment STUN servers provided
  if (!stunUrl1 && !stunUrl2) {
    iceServers.push(
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.ekiga.net' },
      { urls: 'stun:stun.ideasip.com' },
      { urls: 'stun:stun.rixtelecom.se' },
      { urls: 'stun:stun.schlund.de' }
    );
  }

  // ExpressTURN Configuration
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
  }

  // Xirsys TURN Configuration
  const xirsysTurnUrl = import.meta?.env?.VITE_XIRYS_TURN_URL || '';
  const xirsysTurnUsername = import.meta?.env?.VITE_XIRYS_TURN_USERNAME || '';
  const xirsysTurnCredential = import.meta?.env?.VITE_XIRYS_TURN_CREDENTIAL || '';

  if (xirsysTurnUrl && xirsysTurnUsername && xirsysTurnCredential) {
    // Support multiple comma-separated URLs for Xirsys
    xirsysTurnUrl
      .split(',')
      .map(u => u.trim())
      .filter(Boolean)
      .forEach(url => {
        iceServers.push({
          urls: url,
          username: xirsysTurnUsername,
          credential: xirsysTurnCredential,
        });
      });
  }

  // Log configuration status
  if (!turnUrl && !xirsysTurnUrl) {
    console.warn(
      '⚠️ No TURN credentials provided. Using STUN servers only. Cross-network connectivity may be limited.'
    );
    console.info('💡 For production, configure TURN servers via environment variables:');
    console.info('   - VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL');
    console.info('   - VITE_XIRYS_TURN_URL, VITE_XIRYS_TURN_USERNAME, VITE_XIRYS_TURN_CREDENTIAL');
  } else {
    console.info('✅ TURN servers configured from environment variables');
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
const forceRelay = (import.meta?.env?.VITE_WEBRTC_FORCE_TURN || '0').toString() === '1';

if (forceRelay) {
  console.log('🔧 TURN-only mode enabled for debugging cross-network connectivity');
  console.warn(
    '⚠️ TURN-only mode may limit connectivity if TURN servers are not properly configured'
  );
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
