const API_BASE = '/api/tickets';
const AUTH_API = '/api/users/validate';
let allTickets = [];
let selectedSubject = '';

// Network info without PC name collection
let clientNetworkInfo = {
    publicIpAddress: 'Unknown',
    privateIpAddress: 'Unknown',
    userAgent: 'Unknown',
    deviceId: 'Unknown'
};

// Load tickets when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTickets();
    initializeEventListeners();
    initializeNetworkInfo();
});

// Safe fetch function for public endpoints
async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Initialize network information (IP only)
async function initializeNetworkInfo() {
    try {
        console.log('=== NETWORK INFO INITIALIZATION ===');
        
        clientNetworkInfo.userAgent = navigator.userAgent;
        await getPublicIP();
        await getPrivateIP();
        clientNetworkInfo.deviceId = generateDeviceId();
        
        console.log('Final Network Info:', clientNetworkInfo);
        localStorage.setItem('clientNetworkInfo', JSON.stringify(clientNetworkInfo));
        updateNetworkInfoLabel();
        
    } catch (error) {
        console.error('Error initializing network info:', error);
    }
}

// Get public IP address
async function getPublicIP() {
    const ipMethods = [
        () => fetch('https://api.ipify.org?format=json').then(r => r.json()),
        () => fetch('https://api64.ipify.org?format=json').then(r => r.json()),
    ];
    
    for (const method of ipMethods) {
        try {
            const result = await method();
            const ip = result.ip;
            if (ip && ip !== 'Unknown' && !ip.includes('127.0.0.1') && !ip.includes('::1')) {
                clientNetworkInfo.publicIpAddress = ip;
                return;
            }
        } catch (error) {
            continue;
        }
    }
    
    clientNetworkInfo.publicIpAddress = 'Unknown';
}

// Get private IP using WebRTC
async function getPrivateIP() {
    return new Promise((resolve) => {
        const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        
        if (!RTCPeerConnection) {
            clientNetworkInfo.privateIpAddress = 'WebRTC-Not-Supported';
            resolve();
            return;
        }

        try {
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            
            let privateIPs = new Set();
            
            pc.onicecandidate = (event) => {
                if (!event || !event.candidate) {
                    if (privateIPs.size > 0) {
                        const ipArray = Array.from(privateIPs);
                        clientNetworkInfo.privateIpAddress = ipArray[0];
                    } else {
                        clientNetworkInfo.privateIpAddress = 'No-Local-IP-Found';
                    }
                    pc.close();
                    resolve();
                    return;
                }
                
                const candidate = event.candidate.candidate;
                const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/g;
                const matches = candidate.match(ipRegex);
                
                if (matches) {
                    matches.forEach(ip => {
                        if (ip !== '0.0.0.0' && !ip.startsWith('127.') && isPrivateIP(ip)) {
                            privateIPs.add(ip);
                        }
                    });
                }
            };

            pc.createDataChannel('');
            
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .catch(error => {
                    clientNetworkInfo.privateIpAddress = 'WebRTC-Error';
                    pc.close();
                    resolve();
                });

            setTimeout(() => {
                if (privateIPs.size > 0) {
                    const ipArray = Array.from(privateIPs);
                    clientNetworkInfo.privateIpAddress = ipArray[0];
                } else {
                    clientNetworkInfo.privateIpAddress = 'Detection-Timeout';
                }
                try { pc.close(); } catch (e) {}
                resolve();
            }, 5000);
            
        } catch (error) {
            clientNetworkInfo.privateIpAddress = 'WebRTC-Setup-Error';
            resolve();
        }
    });
}

// Check if IP is private
function isPrivateIP(ip) {
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
        
        networkInfoLabel.innerHTML = `
            <div style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px; border: 1px solid #e9ecef; font-size: 0.9em;">
                <strong>📡 Network Info:</strong> 
                Public IP: ${escapeHtml(publicIP)} | 
                Private IP: ${escapeHtml(privateIP)}
            </div>
        `;
    }
}

function initializeEventListeners() {
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
    hideAuthError();
    updateNetworkInfoLabel();
}

function closeCreateModal() {
    document.getElementById('createModal').style.display = 'none';
    document.getElementById('createForm').reset();
    document.querySelectorAll('.category-option').forEach(option => {
        option.classList.remove('selected');
    });
    selectedSubject = '';
    hideCreateLoading();
    hideAuthError();
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

async function validateAndCreateTicket() {
    const userEmail = document.getElementById('userEmail').value;
    const userPassword = document.getElementById('userPassword').value;
    const intent = document.getElementById('intent').value;
    const priority = document.getElementById('priority').value;
    const assignedPerson = document.getElementById('assignedPerson').value;

    // Validate required fields
    if (!userEmail || !userPassword || !selectedSubject || !intent || !priority) {
        showNotification('Please fill in all required fields.');
        return;
    }

    // Show loading state
    showCreateLoading();
    hideAuthError();

    try {
        // First validate user credentials
        console.log('Validating user credentials...');
        const isValidUser = await validateUserCredentials(userEmail, userPassword);
        
        if (!isValidUser) {
            hideCreateLoading();
            showAuthError();
            return;
        }

        // If credentials are valid, proceed with ticket creation
        const networkInfo = getNetworkInfo();

        const ticketData = {
            fullName: userEmail,  // Use email as fullName
            subject: selectedSubject,
            intent: intent,
            priority: priority,
            assignedPerson: assignedPerson || '',
            clientIpAddress: networkInfo.publicIpAddress,
            privateIpAddress: networkInfo.privateIpAddress,
            userAgent: networkInfo.userAgent,
            deviceId: networkInfo.deviceId
        };

        console.log('User validated. Submitting ticket...', ticketData);
        await createTicket(ticketData);
        
    } catch (error) {
        console.error('Error during validation or ticket creation:', error);
        hideCreateLoading();
        showNotification('Error processing your request. Please try again.');
    }
}

// Validate user credentials with backend
async function validateUserCredentials(email, password) {
    try {
        const response = await fetch(AUTH_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error('Authentication failed');
        }

        const result = await response.json();
        return result.valid === true;
        
    } catch (error) {
        console.error('Error validating user:', error);
        return false;
    }
}

// Show authentication error
function showAuthError() {
    const errorElement = document.getElementById('auth-error');
    errorElement.classList.remove('hidden');
}

// Hide authentication error
function hideAuthError() {
    const errorElement = document.getElementById('auth-error');
    errorElement.classList.add('hidden');
}

// Show loading state in create modal
function showCreateLoading() {
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const loadingElement = document.getElementById('create-loading');
    
    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    submitBtn.innerHTML = '<div class="button-spinner"></div> Verifying...';
    loadingElement.classList.remove('hidden');
}

// Hide loading state in create modal
function hideCreateLoading() {
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const loadingElement = document.getElementById('create-loading');
    
    submitBtn.disabled = false;
    cancelBtn.disabled = false;
    submitBtn.textContent = 'Submit Ticket';
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

// API Functions - NO AUTH REQUIRED for viewing
async function loadTickets() {
    try {
        const response = await safeFetch(API_BASE);
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
        ticketElement.style.cursor = 'pointer';
        
        const networkInfo = [];
        if (ticket.clientIpAddress && ticket.clientIpAddress !== 'Unknown') {
            networkInfo.push(`Public IP: ${ticket.clientIpAddress}`);
        }
        if (ticket.privateIpAddress && ticket.privateIpAddress !== 'Unknown') {
            networkInfo.push(`Private IP: ${ticket.privateIpAddress}`);
        }
        
        const networkInfoText = networkInfo.length > 0 ? 
            `<div style="font-size: 0.8em; color: #666; margin-top: 4px;">${networkInfo.join(' | ')}</div>` : '';
        
        ticketElement.innerHTML = `
            <div>#${ticket.ticketId}</div>
            <div>
                <div class="ticket-title">${escapeHtml(ticket.subject)}</div>
                <div class="ticket-description">${escapeHtml(ticket.intent || 'No description')}</div>
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
        
        hideCreateLoading();
        showSuccessModal('Ticket created successfully! IT team has been notified.');
        
        setTimeout(() => {
            loadTickets();
        }, 1000);
        
    } catch (error) {
        console.error('Error creating ticket:', error);
        hideCreateLoading();
        showNotification('Error creating ticket. Please try again.');
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return 'Invalid Date';
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    } catch (e) {
        console.error('Error formatting date:', e);
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

async function searchTickets() {
    const query = document.getElementById('searchInput').value.trim();
    if (query === '') {
        displayTickets(allTickets);
        return;
    }

    try {
        const response = await safeFetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`);
        const tickets = await response.json();
        displayTickets(tickets);
    } catch (error) {
        console.error('Error searching tickets:', error);
        const filteredTickets = allTickets.filter(ticket => 
            (ticket.subject && ticket.subject.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.userEmail && ticket.userEmail.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.intent && ticket.intent.toLowerCase().includes(query.toLowerCase())) ||
            (ticket.priority && ticket.priority.toLowerCase().includes(query.toLowerCase()))
        );
        displayTickets(filteredTickets);
    }
}

function viewTicketDetails(ticket) {
    console.log('Viewing ticket details:', ticket);
    
    const viewId = document.getElementById('view-id');
    const viewSubject = document.getElementById('view-subject');
    const viewRequester = document.getElementById('view-requester');
    const viewRequesterDetails = document.getElementById('view-requester-details');
    const viewStatus = document.getElementById('view-status');
    const viewPriority = document.getElementById('view-priority');
    const viewAssigned = document.getElementById('view-assigned');
    const viewCreated = document.getElementById('view-created');
    const viewDescription = document.getElementById('view-description');
    const viewIp = document.getElementById('view-ip');
    const viewPrivateIp = document.getElementById('view-private-ip');
    const viewItComment = document.getElementById('view-it-comment');
    const viewUpdated = document.getElementById('view-updated');

    // Populate basic ticket information
    if (viewId) viewId.textContent = '#' + ticket.ticketId;
    if (viewSubject) viewSubject.textContent = ticket.subject || 'No subject';
    if (viewRequester) viewRequester.textContent = ticket.fullName || ticket.userEmail || 'Unknown';
    if (viewStatus) viewStatus.textContent = ticket.ticketStatus || 'OPEN';
    if (viewPriority) viewPriority.textContent = ticket.priority || 'MEDIUM';
    if (viewAssigned) viewAssigned.textContent = ticket.assignedPerson || 'Not assigned';
    if (viewCreated) viewCreated.textContent = formatDateTime(ticket.requestedTime);
    if (viewUpdated) viewUpdated.textContent = formatDateTime(ticket.updatedTime || ticket.requestedTime);
    if (viewDescription) viewDescription.textContent = ticket.intent || 'No description provided';
    if (viewIp) viewIp.textContent = ticket.clientIpAddress || 'Unknown';
    if (viewPrivateIp) viewPrivateIp.textContent = ticket.privateIpAddress || 'Unknown';

    // Populate requester details
    if (viewRequesterDetails) {
        const userEmail = ticket.userEmail || 'No email';
        const userPosition = ticket.userPosition || 'No position';
        viewRequesterDetails.innerHTML = `
            <strong>Email:</strong> ${escapeHtml(userEmail)}<br>
            <strong>Position:</strong> ${escapeHtml(userPosition)}
        `;
    }

    // IT Comment display - READ ONLY
    if (viewItComment) {
        const itComment = ticket.itComment || 'No IT comments yet.';
        viewItComment.textContent = itComment;
        
        // Enhanced styling for IT comments section
        if (itComment && itComment !== 'No IT comments yet.' && itComment.trim() !== '') {
            viewItComment.style.background = '#f8f9fa';
            viewItComment.style.padding = '12px';
            viewItComment.style.borderRadius = '4px';
            viewItComment.style.borderLeft = '4px solid #0041d8';
            viewItComment.style.whiteSpace = 'pre-wrap';
            viewItComment.style.wordWrap = 'break-word';
            viewItComment.style.minHeight = '60px';
            viewItComment.style.fontFamily = 'monospace';
            viewItComment.style.fontSize = '0.9em';
            viewItComment.style.border = '1px solid #dee2e6';
        } else {
            viewItComment.style.background = '#f5f5f5';
            viewItComment.style.padding = '12px';
            viewItComment.style.borderRadius = '4px';
            viewItComment.style.borderLeft = '4px solid #6c757d';
            viewItComment.style.color = '#6c757d';
            viewItComment.style.fontStyle = 'italic';
            viewItComment.style.border = '1px dashed #dee2e6';
        }
    }

    openViewModal();
}

function openViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Simple notification function
function showNotification(message) {
    alert(message);
}

// Make functions globally available
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.selectCategory = selectCategory;
window.validateAndCreateTicket = validateAndCreateTicket;
window.closeSuccessModal = closeSuccessModal;
window.searchTickets = searchTickets;
window.viewTicketDetails = viewTicketDetails;
window.openViewModal = openViewModal;
window.closeViewModal = closeViewModal;

console.log('Ticket system initialized - public viewing, authenticated submission');