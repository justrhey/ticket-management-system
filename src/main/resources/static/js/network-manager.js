class NetworkService {
    constructor() {
        this.networkInfo = {
            publicIpAddress: 'Unknown',
            privateIpAddress: 'Unknown',
            hostname: 'Unknown',
            username: 'Unknown',
            userAgent: 'Unknown',
            deviceId: 'Unknown'
        };
    }

    async initializeEnhancedNetworkInfo() {
        try {
            console.log('=== ENHANCED NETWORK INFO INITIALIZATION ===');
            
            // Get basic info
            this.networkInfo.userAgent = navigator.userAgent;
            this.networkInfo.hostname = window.location.hostname || 'Unknown';
            
            // Get public IP
            await this.getPublicIP();
            
            // Get private IP using WebRTC
            await this.getPrivateIP();
            
            // Generate device ID
            this.networkInfo.deviceId = this.generateDeviceId();
            
            // Try to get username from various sources
            await this.getClientUsername();
            
            console.log('Final Network Info:', this.networkInfo);
            localStorage.setItem('clientNetworkInfo', JSON.stringify(this.networkInfo));
            
        } catch (error) {
            console.error('Error initializing network info:', error);
        }
    }

    async getPublicIP() {
        const ipMethods = [
            () => fetch('https://api.ipify.org?format=json').then(r => r.json()),
            () => fetch('https://api64.ipify.org?format=json').then(r => r.json()),
            () => fetch('https://jsonip.com').then(r => r.json()),
            () => fetch('/api/network/whoami').then(r => r.json()),
        ];
        
        for (const method of ipMethods) {
            try {
                const result = await method();
                const ip = result.ip || result.ipAddress;
                if (ip && ip !== 'Unknown' && !ip.includes('127.0.0.1') && !ip.includes('::1')) {
                    this.networkInfo.publicIpAddress = ip;
                    console.log('Public IP detected:', ip);
                    return;
                }
            } catch (error) {
                console.log('Public IP method failed:', error.message);
                continue;
            }
        }
        
        this.networkInfo.publicIpAddress = 'Unknown';
    }

    async getPrivateIP() {
        return new Promise((resolve) => {
            const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
            
            if (!RTCPeerConnection) {
                console.log('WebRTC not supported');
                this.networkInfo.privateIpAddress = 'WebRTC-Not-Supported';
                resolve();
                return;
            }

            const pc = new RTCPeerConnection({ iceServers: [] });
            let privateIP = 'Unknown';
            
            pc.onicecandidate = (event) => {
                if (!event.candidate) {
                    if (privateIP === 'Unknown') {
                        this.networkInfo.privateIpAddress = 'No-Local-IP-Found';
                    } else {
                        this.networkInfo.privateIpAddress = privateIP;
                    }
                    pc.close();
                    resolve();
                    return;
                }
                
                const candidate = event.candidate.candidate;
                const regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
                const match = candidate.match(regex);
                
                if (match) {
                    const ip = match[1];
                    if (this.isPrivateIP(ip)) {
                        privateIP = ip;
                        console.log('Private IP detected via WebRTC:', ip);
                    }
                }
            };

            pc.createDataChannel('');
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .catch(error => {
                    console.log('WebRTC offer error:', error);
                    this.networkInfo.privateIpAddress = 'WebRTC-Error';
                    resolve();
                });

            setTimeout(() => {
                if (privateIP === 'Unknown') {
                    this.networkInfo.privateIpAddress = 'Detection-Timeout';
                }
                pc.close();
                resolve();
            }, 3000);
        });
    }

    isPrivateIP(ip) {
        if (!ip) return false;
        
        if (ip.includes('.')) {
            if (ip.startsWith('10.')) return true;
            if (ip.startsWith('192.168.')) return true;
            if (ip.startsWith('172.')) {
                const parts = ip.split('.');
                if (parts.length >= 2) {
                    const second = parseInt(parts[1]);
                    if (second >= 16 && second <= 31) return true;
                }
            }
            if (ip.startsWith('127.')) return true;
            if (ip.startsWith('169.254.')) return true;
        }
        
        if (ip.includes(':')) {
            if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;
        }
        
        return false;
    }

    generateDeviceId() {
        const components = [
            navigator.userAgent,
            navigator.platform,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset()
        ].join('|');
        
        let hash = 0;
        for (let i = 0; i < components.length; i++) {
            const char = components.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'device_' + Math.abs(hash).toString(16);
    }

    async getClientUsername() {
        const usernameMethods = [
            () => fetch('/api/network/whoami').then(r => r.json()),
            () => {
                const possibleSources = [
                    navigator.userName,
                    navigator.appName,
                    document.documentElement.getAttribute('data-user'),
                    localStorage.getItem('username'),
                    sessionStorage.getItem('username')
                ];
                
                const found = possibleSources.find(source => 
                    source && source !== 'Unknown' && source !== 'null' && source.length > 0
                );
                
                if (found) {
                    return { username: found };
                }
                throw new Error('No username sources found');
            }
        ];
        
        for (const method of usernameMethods) {
            try {
                const result = await method();
                const username = result.username || result.displayName || result;
                if (username && username !== 'Unknown' && username !== 'null') {
                    this.networkInfo.username = username;
                    console.log('Username detected:', username);
                    return;
                }
            } catch (error) {
                console.log('Username method failed:', error.message);
                continue;
            }
        }
        
        this.networkInfo.username = 'Unknown-User';
    }

    getNetworkInfo() {
        return this.networkInfo;
    }

    async createTicketWithNetworkInfo(ticketData) {
        const networkInfo = this.getNetworkInfo();
        
        const enhancedTicketData = {
            ...ticketData,
            clientIpAddress: networkInfo.publicIpAddress,
            privateIpAddress: networkInfo.privateIpAddress,
            computerName: networkInfo.hostname,
            userName: networkInfo.username,
            userAgent: networkInfo.userAgent,
            deviceId: networkInfo.deviceId,
            detectedBy: 'enhanced-system'
        };
        
        console.log('Creating ticket with enhanced network info:', enhancedTicketData);
        
        try {
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(enhancedTicketData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating ticket:', error);
            throw error;
        }
    }

    updateNetworkInfoLabel() {
        const networkInfoLabel = document.getElementById('network-info-label');
        if (networkInfoLabel) {
            const networkInfo = this.getNetworkInfo();
            const publicIP = networkInfo.publicIpAddress || 'Unknown';
            const privateIP = networkInfo.privateIpAddress || 'Unknown';
            const computer = networkInfo.hostname || 'Unknown';
            const username = networkInfo.username || 'Unknown';
            
            networkInfoLabel.innerHTML = `
                <div style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px; border: 1px solid #e9ecef; font-size: 0.9em;">
                    <strong>Network Info:</strong> 
                    Public IP: ${escapeHtml(publicIP)} | 
                    Private IP: ${escapeHtml(privateIP)} | 
                    Computer: ${escapeHtml(computer)} |
                    User: ${escapeHtml(username)}
                </div>
            `;
        }
    }
}