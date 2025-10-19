# WebRTC ICE Server Test Script
Write-Host "Testing WebRTC ICE Servers..." -ForegroundColor Green

# Navigate to frontend directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $ProjectRoot "frontend"

if (-not (Test-Path $FrontendDir)) {
    Write-Host "Error: Frontend directory not found at $FrontendDir" -ForegroundColor Red
    exit 1
}

Set-Location $FrontendDir

# Create a simple test HTML file
$TestHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>WebRTC ICE Server Test</title>
</head>
<body>
    <h1>WebRTC ICE Server Test</h1>
    <div id="results"></div>
    <script>
        const iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
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
            {
                urls: 'turn:turn01.hubl.in?transport=udp',
                username: 'webrtc',
                credential: 'webrtc'
            },
            {
                urls: 'turn:turn02.hubl.in?transport=tcp',
                username: 'webrtc',
                credential: 'webrtc'
            },
            {
                urls: 'turn:turn.bistri.com:80',
                username: 'homeo',
                credential: 'homeo'
            },
            {
                urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
                username: 'webrtc',
                credential: 'webrtc'
            }
        ];

        async function testICEServers() {
            const results = document.getElementById('results');
            results.innerHTML = '<h2>Testing ICE Servers...</h2>';

            for (const server of iceServers) {
                const pc = new RTCPeerConnection({ iceServers: [server] });
                const candidates = [];
                
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        candidates.push({
                            type: event.candidate.type,
                            protocol: event.candidate.protocol,
                            address: event.candidate.address
                        });
                    }
                };

                pc.onicegatheringstatechange = () => {
                    if (pc.iceGatheringState === 'complete') {
                        const hasRelay = candidates.some(c => c.type === 'relay');
                        const hasSrflx = candidates.some(c => c.type === 'srflx');
                        const hasHost = candidates.some(c => c.type === 'host');
                        
                        const status = hasRelay ? '✅ RELAY' : hasSrflx ? '⚠️ SRFLX' : hasHost ? '⚠️ HOST' : '❌ FAILED';
                        results.innerHTML += \`<p><strong>\${server.urls}</strong> - \${status} (\${candidates.length} candidates)</p>\`;
                        
                        if (candidates.length > 0) {
                            results.innerHTML += '<ul>';
                            candidates.forEach(c => {
                                results.innerHTML += \`<li>\${c.type} - \${c.protocol} - \${c.address || 'N/A'}</li>\`;
                            });
                            results.innerHTML += '</ul>';
                        }
                        
                        pc.close();
                    }
                };

                try {
                    await pc.createDataChannel('test');
                    await pc.createOffer().then(offer => pc.setLocalDescription(offer));
                } catch (error) {
                    results.innerHTML += \`<p><strong>\${server.urls}</strong> - ❌ ERROR: \${error.message}</p>\`;
                    pc.close();
                }
            }
        }

        testICEServers();
    </script>
</body>
</html>
"@

$TestHtml | Out-File -FilePath "test-ice.html" -Encoding UTF8

Write-Host "Test file created: test-ice.html" -ForegroundColor Green
Write-Host "Open this file in your browser to test ICE servers" -ForegroundColor Yellow
Write-Host "Look for servers with 'RELAY' status for cross-network connectivity" -ForegroundColor Yellow

# Return to original directory
Set-Location $ProjectRoot