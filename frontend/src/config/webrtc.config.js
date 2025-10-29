/**
 * WebRTC Configuration
 * Enhanced ICE servers and connection settings for better cross-network connectivity
 */

// Build ICE servers from environment variables with safe defaults
function buildIceServers() {
  const iceServers = [];

  // ExpressTURN Configuration - Only use environment variables (SECURE)
  const turnUrl = import.meta?.env?.VITE_TURN_URL || '';
  const turnUsername = import.meta?.env?.VITE_TURN_USERNAME || '';
  const turnCredential = import.meta?.env?.VITE_TURN_CREDENTIAL || '';

  // Xirsys TURN Configuration - Only use environment variables (SECURE)
  const xirsysTurnUrl = import.meta?.env?.VITE_XIRYS_TURN_URL || '';
  const xirsysTurnUsername = import.meta?.env?.VITE_XIRYS_TURN_USERNAME || '';
  const xirsysTurnCredential = import.meta?.env?.VITE_XIRYS_TURN_CREDENTIAL || '';

  // Check which TURN servers are available
  const hasExpressTurn = turnUrl && turnUsername && turnCredential;
  const hasXirsysTurn = xirsysTurnUrl && xirsysTurnUsername && xirsysTurnCredential;

  if (hasExpressTurn && hasXirsysTurn) {
    // Both TURN servers available - use ExpressTURN as primary, Xirsys as fallback

    // Add ExpressTURN servers first (primary)
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

    // Add Xirsys servers as fallback
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
  } else if (hasExpressTurn) {
    // Only ExpressTURN available
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
  } else if (hasXirsysTurn) {
    // Only Xirsys available
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
  } else {
    // No TURN servers configured - add working free TURN servers as fallback
    console.warn('⚠️ No TURN servers configured, using free public TURN/STUN servers');

    // Add multiple free TURN servers for better connectivity
    // Metered.ca free TURN server (Works great for cross-network)
    iceServers.push({
      urls: [
        'turn:a.relay.metered.ca:80',
        'turn:a.relay.metered.ca:80?transport=tcp',
        'turn:a.relay.metered.ca:443',
        'turn:a.relay.metered.ca:443?transport=tcp',
      ],
      username: 'f4b4035342858393c5678b78',
      credential: '0OMQNZdwy1K3HjIi',
    });

    // OpenRelay free TURN server (Backup)
    iceServers.push({
      urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    });

    // Twilio's free STUN servers
    iceServers.push(
      { urls: 'stun:global.stun.twilio.com:3478' },
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    );
  }

  // Add STUN servers from environment variables (optional)
  const stunUrl1 = import.meta?.env?.VITE_STUN_URL || '';
  const stunUrl2 = import.meta?.env?.VITE_STUN_URL_2 || '';

  if (stunUrl1) {
    iceServers.push({ urls: stunUrl1 });
  } else {
    // Default Google STUN servers for better connectivity
    iceServers.push({ urls: 'stun:stun.l.google.com:19302' });
  }

  if (stunUrl2) {
    iceServers.push({ urls: stunUrl2 });
  } else {
    // Additional STUN servers
    iceServers.push(
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    );
  }

  return iceServers;
}

export const ICE_SERVERS = buildIceServers();

// Enhanced debugging for cross-network issues
export const WEBRTC_DEBUG_CONFIG = {
  enableDetailedLogging: true,
  logIceCandidates: true,
  logConnectionStates: true,
  logNetworkInfo: true,
};

// Allow forcing TURN-only via env to diagnose cross-network issues
const forceRelay = (import.meta?.env?.VITE_WEBRTC_FORCE_TURN || '0').toString() === '1';

export const PEER_CONNECTION_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceTransportPolicy: 'all', // Allow both direct and relay connections for better compatibility
  // Enhanced configuration for better cross-network connectivity
  iceConnectionReceivingTimeout: 30000, // 30 seconds
  iceBackupCandidatePairPingInterval: 25000, // 25 seconds
  // Additional configuration for better connectivity
  sdpSemantics: 'unified-plan',
  enableDtlsSrtp: true,
  enableRtpDataChannels: true,
  // Enhanced ICE gathering for cross-network
  iceGatheringTimeout: 10000, // 10 seconds
  // Better connection handling
  iceConnectionTimeout: 30000, // 30 seconds
  iceGatheringState: 'gathering',
  iceConnectionState: 'new',
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
