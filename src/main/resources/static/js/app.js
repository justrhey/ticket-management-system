// Use relative path or dynamic origin instead of hardcoded localhost
const API_BASE = '/api/tickets';
let allTickets = [];
let selectedSubject = '';

// Enhanced network info with private IP detection
let clientNetworkInfo = {
    publicIpAddress: 'Unknown',
    privateIpAddress: 'Unknown',
    hostname: 'Unknown',
    username: 'Unknown',
    userAgent: 'Unknown',
    deviceId: 'Unknown'
};

// Load tickets when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTickets();
    initializeEventListeners();
    initializeEnhancedNetworkInfo(); // Initialize enhanced network information
});

// Initialize enhanced network information with private IP detection
async function initializeEnhancedNetworkInfo() {
    try {
        console.log('=== ENHANCED NETWORK INFO INITIALIZATION ===');
        
        // Get basic info
        clientNetworkInfo.userAgent = navigator.userAgent;
        
        // Get public IP
        await getPublicIP();
        
        // Get private IP using WebRTC
        await getPrivateIP();
        
        // Generate device ID
        clientNetworkInfo.deviceId = generateDeviceId();
        
        // Get backend-detected information (computer name and username)
        await getBackendNetworkInfo();
        
        console.log('Final Network Info:', clientNetworkInfo);
        localStorage.setItem('clientNetworkInfo', JSON.stringify(clientNetworkInfo));
        
        // Update the network info label
        updateNetworkInfoLabel();
        
    } catch (error) {
        console.error('Error initializing network info:', error);
    }
}

// Get backend-detected network information (COMPUTER NAME & USERNAME)
async function getBackendNetworkInfo() {
    try {
        console.log('Fetching backend network info...');
        const response = await fetch('/api/network/info');
        
        if (response.ok) {
            const backendInfo = await response.json();
            console.log('Backend network info received:', backendInfo);
            
            // Use backend-detected computer name
            if (backendInfo.computerName && 
                backendInfo.computerName !== 'Unknown-Host' && 
                backendInfo.computerName !== 'localhost') {
                clientNetworkInfo.hostname = backendInfo.computerName;
                console.log('✓ Computer name from backend:', backendInfo.computerName);
            } else {
                // Try to get from browser
                clientNetworkInfo.hostname = await getBrowserComputerName();
                console.log('✓ Computer name from browser:', clientNetworkInfo.hostname);
            }
            
            // Use backend-detected username if available
            if (backendInfo.userName && 
                backendInfo.userName !== 'Unknown-User' &&
                backendInfo.userName !== 'Netscape') {
                clientNetworkInfo.username = backendInfo.userName;
                console.log('✓ Username from backend:', backendInfo.userName);
            } else {
                // Fallback to asking user or using browser info
                clientNetworkInfo.username = await getClientUsername();
            }
            
        } else {
            console.log('Backend network info not available, using fallback');
            clientNetworkInfo.hostname = await getBrowserComputerName();
            clientNetworkInfo.username = await getClientUsername();
        }
    } catch (error) {
        console.error('Failed to get backend network info:', error);
        clientNetworkInfo.hostname = await getBrowserComputerName();
        clientNetworkInfo.username = await getClientUsername();
    }
}

// Get computer name from browser (tries multiple methods)
async function getBrowserComputerName() {
    // Method 1: Check if previously stored
    const stored = localStorage.getItem('computerName');
    if (stored && stored !== 'Unknown' && stored !== 'localhost') {
        console.log('Using stored computer name:', stored);
        return stored;
    }
    
    // Method 2: Try to get from hostname
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return hostname;
    }
    
    // Method 3: Prompt user to enter their computer name (one-time)
    const computerName = prompt(
        'Please enter your computer name for ticket tracking:\n\n' +
        'Windows: Press Win+R, type "cmd", then type "hostname"\n' +
        'Mac: Open Terminal and type "hostname"'
    );
    
    if (computerName && computerName.trim().length > 0) {
        const cleanName = computerName.trim();
        localStorage.setItem('computerName', cleanName);
        return cleanName;
    }
    
    return 'Unknown-Computer';
}

// Get public IP address
async function getPublicIP() {
    const ipMethods = [
        () => fetch('https://api.ipify.org?format=json').then(r => r.json()),
        () => fetch('https://api64.ipify.org?format=json').then(r => r.json()),
        () => fetch('https://jsonip.com').then(r => r.json()),
    ];
    
    for (const method of ipMethods) {
        try {
            const result = await method();
            const ip = result.ip || result.ipAddress;
            if (ip && ip !== 'Unknown' && !ip.includes('127.0.0.1') && !ip.includes('::1')) {
                clientNetworkInfo.publicIpAddress = ip;
                console.log('Public IP detected:', ip);
                return;
            }
        } catch (error) {
            console.log('Public IP method failed:', error.message);
            continue;
        }
    }
    
    clientNetworkInfo.publicIpAddress = 'Unknown';
}

// Get private IP using WebRTC (improved version)
async function getPrivateIP() {
    return new Promise((resolve) => {
        const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        
        if (!RTCPeerConnection) {
            console.log('WebRTC not supported');
            clientNetworkInfo.privateIpAddress = 'WebRTC-Not-Supported';
            resolve();
            return;
        }

        try {
            // Use multiple STUN servers to improve detection
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            });
            
            let privateIPs = new Set();
            let candidateCount = 0;
            
            pc.onicecandidate = (event) => {
                candidateCount++;
                
                if (!event || !event.candidate) {
                    // ICE gathering complete
                    console.log(`ICE gathering complete. Found ${candidateCount} candidates.`);
                    
                    if (privateIPs.size > 0) {
                        // Convert Set to Array and pick the first valid private IP
                        const ipArray = Array.from(privateIPs);
                        clientNetworkInfo.privateIpAddress = ipArray[0];
                        console.log('✓ Private IP detected via WebRTC:', ipArray);
                    } else {
                        console.log('No private IP found in candidates');
                        clientNetworkInfo.privateIpAddress = 'No-Local-IP-Found';
                    }
                    
                    pc.close();
                    resolve();
                    return;
                }
                
                const candidate = event.candidate.candidate;
                console.log('ICE candidate:', candidate);
                
                // Extract IP address from candidate string
                // Format: "candidate:... typ host" contains the local IP
                const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/g;
                const matches = candidate.match(ipRegex);
                
                if (matches) {
                    matches.forEach(ip => {
                        // Filter out invalid IPs
                        if (ip !== '0.0.0.0' && !ip.startsWith('127.') && isPrivateIP(ip)) {
                            privateIPs.add(ip);
                            console.log('Found private IP:', ip);
                        }
                    });
                }
                
                // Also try to extract IPv6
                const ipv6Regex = /([0-9a-f]{1,4}(:[0-9a-f]{1,4}){7})/gi;
                const ipv6Matches = candidate.match(ipv6Regex);
                if (ipv6Matches) {
                    ipv6Matches.forEach(ip => {
                        if (isPrivateIP(ip)) {
                            privateIPs.add(ip);
                            console.log('Found private IPv6:', ip);
                        }
                    });
                }
            };

            pc.onicegatheringstatechange = () => {
                console.log('ICE gathering state:', pc.iceGatheringState);
            };

            // Create a data channel to trigger ICE candidate gathering
            pc.createDataChannel('');
            
            // Create offer
            pc.createOffer()
                .then(offer => {
                    console.log('WebRTC offer created');
                    return pc.setLocalDescription(offer);
                })
                .catch(error => {
                    console.log('WebRTC offer error:', error);
                    clientNetworkInfo.privateIpAddress = 'WebRTC-Error';
                    pc.close();
                    resolve();
                });

            // Timeout after 5 seconds
            setTimeout(() => {
                console.log('WebRTC detection timeout');
                if (privateIPs.size > 0) {
                    const ipArray = Array.from(privateIPs);
                    clientNetworkInfo.privateIpAddress = ipArray[0];
                    console.log('✓ Private IP from timeout:', ipArray);
                } else {
                    clientNetworkInfo.privateIpAddress = 'Detection-Timeout';
                }
                try {
                    pc.close();
                } catch (e) {
                    console.log('Error closing peer connection:', e);
                }
                resolve();
            }, 5000);
            
        } catch (error) {
            console.error('WebRTC setup error:', error);
            clientNetworkInfo.privateIpAddress = 'WebRTC-Setup-Error';
            resolve();
        }
    });
}

// Check if IP is private
function isPrivateIP(ip) {
    if (!ip) return false;
    
    // IPv4 private ranges
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
    
    // IPv6 private ranges
    if (ip.includes(':')) {
        if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;
    }
    
    return false;
}

// Generate device fingerprint
function generateDeviceId() {
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

// Try to get client username (fallback method)
async function getClientUsername() {
    // Check if we have stored username
    const stored = localStorage.getItem('clientUsername');
    if (stored && stored !== 'Unknown' && stored !== 'Unknown-User' && stored !== 'Netscape') {
        console.log('Using stored username:', stored);
        return stored;
    }
    
    // Prompt user for username (one-time setup)
    const userName = prompt('Please enter your name for ticket tracking:\n(This will be saved for future tickets)');
    
    if (userName && userName.trim().length > 0) {
        const cleanUsername = userName.trim();
        localStorage.setItem('clientUsername', cleanUsername);
        clientNetworkInfo.username = cleanUsername;
        console.log('Username saved:', cleanUsername);
        return cleanUsername;
    }
    
    clientNetworkInfo.username = 'Unknown-User';
    return 'Unknown-User';
}

// Get current network info
function getNetworkInfo() {
    return clientNetworkInfo;
}

// Update the network information label in the form
function updateNetworkInfoLabel() {
    const networkInfoLabel = document.getElementById('network-info-label');
    if (networkInfoLabel) {
        const networkInfo = getNetworkInfo();
        const publicIP = networkInfo.publicIpAddress || 'Unknown';
        const privateIP = networkInfo.privateIpAddress || 'Unknown';
        const computer = networkInfo.hostname || 'Unknown';
        const username = networkInfo.username || 'Unknown';
        
        networkInfoLabel.innerHTML = `
            <div style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px; border: 1px solid #e9ecef; font-size: 0.9em;">
                <strong>📡 Network Info:</strong> 
                Public IP: ${escapeHtml(publicIP)} | 
                Private IP: ${escapeHtml(privateIP)} | 
                Computer: ${escapeHtml(computer)} |
                User: ${escapeHtml(username)}
            </div>
        `;
    }
}

function initializeEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchTickets();
            }
        });
    }
}

// Modal functions
function openCreateModal() {
    document.getElementById('createModal').style.display = 'block';
    // Ensure network info is updated when modal opens
    updateNetworkInfoLabel();
}

function closeCreateModal() {
    document.getElementById('createModal').style.display = 'none';
    document.getElementById('createForm').reset();
    // Reset subject selection
    document.querySelectorAll('.category-option').forEach(option => {
        option.classList.remove('selected');
    });
    selectedSubject = '';
    // Reset loading state
    hideCreateLoading();
}

// Category selection
function selectCategory(element, subject) {
    document.querySelectorAll('.category-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedSubject = subject;
    document.getElementById('subject').value = subject;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('createModal');
    if (event.target === modal) {
        closeCreateModal();
    }
    
    const successModal = document.getElementById('successModal');
    if (event.target === successModal) {
        closeSuccessModal();
    }
}

// Form submission with loading state
async function createTicketFromForm() {
    const fullName = document.getElementById('fullName').value;
    const intent = document.getElementById('intent').value;
    const priority = document.getElementById('priority').value;
    const assignedPerson = document.getElementById('assignedPerson').value;

    // Validate required fields
    if (!fullName || !selectedSubject || !intent || !priority) {
        showNotification('Please fill in all required fields and select a subject.');
        return;
    }

    // Get enhanced network information
    const networkInfo = getNetworkInfo();

    const ticketData = {
        fullName: fullName,
        subject: selectedSubject,
        intent: intent,
        priority: priority,
        assignedPerson: assignedPerson || '',
        clientIpAddress: networkInfo.publicIpAddress,
        privateIpAddress: networkInfo.privateIpAddress,
        computerName: networkInfo.hostname,
        userName: networkInfo.username,
        userAgent: networkInfo.userAgent,
        deviceId: networkInfo.deviceId
    };

    console.log('Submitting ticket with enhanced network info:', ticketData);

    // Show loading state
    showCreateLoading();
    
    await createTicket(ticketData);
}

// Show loading state in create modal
function showCreateLoading() {
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const loadingElement = document.getElementById('create-loading');
    
    // Disable buttons
    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    
    // Change button text
    submitBtn.innerHTML = '<div class="button-spinner"></div> Submitting...';
    
    // Show loading message
    loadingElement.classList.remove('hidden');
}

// Hide loading state in create modal
function hideCreateLoading() {
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const loadingElement = document.getElementById('create-loading');
    
    // Enable buttons
    submitBtn.disabled = false;
    cancelBtn.disabled = false;
    
    // Reset button text
    submitBtn.textContent = 'Submit Ticket';
    
    // Hide loading message
    loadingElement.classList.add('hidden');
}

// Success modal functions
function showSuccessModal(message) {
    document.getElementById('success-message').textContent = message;
    document.getElementById('successModal').style.display = 'block';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    closeCreateModal();
}

// API Functions
async function loadTickets() {
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allTickets = await response.json();
        console.log('Loaded tickets:', allTickets);
        displayTickets(allTickets);
    } catch (error) {
        console.error('Error loading tickets:', error);
        showNotification('Error loading tickets: ' + error.message);
    }
}

function displayTickets(tickets) {
    const ticketList = document.getElementById('ticketList');
    if (!ticketList) {
        console.error('ticketList element not found');
        return;
    }
    
    const header = ticketList.querySelector('.ticket-header');
    ticketList.innerHTML = '';
    if (header) ticketList.appendChild(header);

    if (!tickets || tickets.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'ticket-item';
        empty.style.gridTemplateColumns = '1fr';
        empty.textContent = 'No tickets found';
        empty.style.textAlign = 'center';
        ticketList.appendChild(empty);
        return;
    }

    tickets.forEach(ticket => {
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-item';
        
        // Enhanced display with private IP if available
        const networkInfo = [];
        if (ticket.clientIpAddress && ticket.clientIpAddress !== 'Unknown') {
            networkInfo.push(`Public IP: ${ticket.clientIpAddress}`);
        }
        if (ticket.privateIpAddress && ticket.privateIpAddress !== 'Unknown') {
            networkInfo.push(`Private IP: ${ticket.privateIpAddress}`);
        }
        if (ticket.computerName && ticket.computerName !== 'Unknown') {
            networkInfo.push(`Computer: ${ticket.computerName}`);
        }
        if (ticket.userName && ticket.userName !== 'Unknown') {
            networkInfo.push(`User: ${ticket.userName}`);
        }
        
        const networkInfoText = networkInfo.length > 0 ? 
            `<div style="font-size: 0.8em; color: #666; margin-top: 4px;">${networkInfo.join(' | ')}</div>` : '';
        
        ticketElement.innerHTML = `
            <div>#${ticket.ticketId}</div>
            <div>
                <div>${escapeHtml(ticket.subject)}</div>
                <div style="font-size: 0.9em; color: #666;">${escapeHtml(ticket.intent || 'No description')}</div>
                ${networkInfoText}
            </div>
            <div>${escapeHtml(ticket.fullName)}</div>
            <div class="status-badge status-${(ticket.ticketStatus || 'OPEN').toLowerCase()}">${ticket.ticketStatus || 'OPEN'}</div>
            <div class="priority-badge priority-${(ticket.priority || 'MEDIUM').toLowerCase()}">${ticket.priority || 'MEDIUM'}</div>
            <div>${formatDate(ticket.requestedTime)}</div>
        `;
        ticketElement.addEventListener('click', () => viewTicketDetails(ticket));
        ticketList.appendChild(ticketElement);
    });
}

async function createTicket(ticketData) {
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ticketData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.text();
        console.log('Ticket creation result:', result);
        
        // Hide loading and show success
        hideCreateLoading();
        showSuccessModal('Ticket created successfully! IT team has been notified.');
        
        // Refresh the ticket list after a short delay
        setTimeout(() => {
            loadTickets();
        }, 1000);
        
    } catch (error) {
        console.error('Error creating ticket:', error);
        hideCreateLoading();
        showNotification('Error creating ticket. Please try again.');
    }
}

async function searchTickets() {
    const query = document.getElementById('searchInput').value.trim();
    if (query === '') {
        displayTickets(allTickets);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`);
        if (response.ok) {
            const tickets = await response.json();
            displayTickets(tickets);
        } else {
            // Fallback to client-side search
            const filteredTickets = allTickets.filter(ticket => 
                (ticket.subject && ticket.subject.toLowerCase().includes(query.toLowerCase())) ||
                (ticket.fullName && ticket.fullName.toLowerCase().includes(query.toLowerCase())) ||
                (ticket.intent && ticket.intent.toLowerCase().includes(query.toLowerCase())) ||
                (ticket.priority && ticket.priority.toLowerCase().includes(query.toLowerCase())) ||
                (ticket.assignedPerson && ticket.assignedPerson.toLowerCase().includes(query.toLowerCase())) ||
                (ticket.clientIpAddress && ticket.clientIpAddress.toLowerCase().includes(query.toLowerCase())) ||
                (ticket.privateIpAddress && ticket.privateIpAddress.toLowerCase().includes(query.toLowerCase())) ||
                (ticket.computerName && ticket.computerName.toLowerCase().includes(query.toLowerCase())) ||
                (ticket.userName && ticket.userName.toLowerCase().includes(query.toLowerCase()))
            );
            displayTickets(filteredTickets);
        }
    } catch (error) {
        console.error('Error searching tickets:', error);
        // Fallback to client-side search
        const filteredTickets = allTickets.filter(ticket => 
            (ticket.subject && ticket.subject.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.fullName && ticket.fullName.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.intent && ticket.intent.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.priority && ticket.priority.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.assignedPerson && ticket.assignedPerson.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.clientIpAddress && ticket.clientIpAddress.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.privateIpAddress && ticket.privateIpAddress.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.computerName && ticket.computerName.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.userName && ticket.userName.toLowerCase().includes(query.toLowerCase()))
        );
        displayTickets(filteredTickets);
    }
}

function viewTicketDetails(ticket) {
    const createdDate = ticket.requestedTime ? new Date(ticket.requestedTime).toLocaleString() : 'Unknown';
    const priority = ticket.priority || 'Not specified';
    
    let details = `Ticket Details:\n\nID: #${ticket.ticketId}\nSubject: ${ticket.subject}\nRequester: ${ticket.fullName}\nStatus: ${ticket.ticketStatus}\nPriority: ${priority}\nDescription: ${ticket.intent}\nAssigned To: ${ticket.assignedPerson || 'Not assigned'}\nCreated: ${createdDate}`;
    
    // Add enhanced network information if available
    const networkInfo = [];
    if (ticket.clientIpAddress && ticket.clientIpAddress !== 'Unknown') {
        networkInfo.push(`Public IP: ${ticket.clientIpAddress}`);
    }
    if (ticket.privateIpAddress && ticket.privateIpAddress !== 'Unknown') {
        networkInfo.push(`Private IP: ${ticket.privateIpAddress}`);
    }
    if (ticket.computerName && ticket.computerName !== 'Unknown') {
        networkInfo.push(`Computer: ${ticket.computerName}`);
    }
    if (ticket.userName && ticket.userName !== 'Unknown') {
        networkInfo.push(`User: ${ticket.userName}`);
    }
    if (ticket.deviceId && ticket.deviceId !== 'Unknown') {
        networkInfo.push(`Device ID: ${ticket.deviceId}`);
    }
    
    if (networkInfo.length > 0) {
        details += `\n\nNetwork Information:\n${networkInfo.join('\n')}`;
    }
    
    alert(details);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return 'Invalid Date';
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Simple notification function
function showNotification(message) {
    alert(message);
}

// Make functions globally available
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.selectCategory = selectCategory;
window.createTicketFromForm = createTicketFromForm;
window.closeSuccessModal = closeSuccessModal;
window.searchTickets = searchTickets;

console.log('Enhanced ticket creation system with backend network detection initialized successfully');