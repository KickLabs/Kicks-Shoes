import React, { useMemo } from 'react';

const boxStyle = {
  position: 'fixed',
  bottom: '16px',
  right: '16px',
  zIndex: 9999,
  background: 'rgba(0,0,0,0.8)',
  color: '#fff',
  padding: '10px 12px',
  borderRadius: '8px',
  fontSize: '12px',
  width: '320px',
  maxWidth: '90vw',
};

export default function LivestreamDebugOverlay({
  roomId,
  userId,
  socket,
  isConnected,
  sendChatMessage,
}) {
  const socketInfo = useMemo(() => {
    if (!socket) return null;
    try {
      return {
        id: socket.id,
        uri: socket.io?.uri,
        path: socket.io?.opts?.path,
        nsps: Object.keys(socket.nsp ? { [socket.nsp]: true } : {}).join(',') || '/livestream',
        connected: socket.connected,
      };
    } catch {
      return null;
    }
  }, [socket]);

  const testSend = () => {
    if (!sendChatMessage) return;
    sendChatMessage('cách chốt');
  };

  return (
    <div style={boxStyle}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Livestream Debug</div>
      <div>Room: {roomId}</div>
      <div>User: {userId || 'anonymous'}</div>
      <div>Connected: {isConnected ? 'yes' : 'no'}</div>
      {socketInfo && (
        <>
          <div>Socket ID: {socketInfo.id || '-'}</div>
          <div>URL: {socketInfo.uri || '-'}</div>
          <div>Path: {socketInfo.path || '-'}</div>
          <div>NS: /livestream</div>
        </>
      )}
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={testSend} style={{ padding: '4px 8px' }}>
          Test hỏi: "cách chốt"
        </button>
      </div>
    </div>
  );
}
