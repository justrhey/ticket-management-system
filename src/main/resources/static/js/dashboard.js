// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    loadDashboardData();
    loadRecentTickets();
});

// Load dashboard statistics
async function loadDashboardData() {
    try {
        // In a real application, this would fetch from your API
        // For demo purposes, we'll use mock data
        const mockTickets = generateMockTickets();
        
        updateDashboardStats(mockTickets);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Update dashboard statistics
function updateDashboardStats(tickets) {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.ticketStatus === 'Open').length;
    const closedTickets = tickets.filter(t => t.ticketStatus === 'Closed').length;
    const assignedTickets = tickets.filter(t => t.assignedPerson && t.assignedPerson.trim() !== '').length;
    
    // Update DOM
    document.getElementById('totalTickets').textContent = totalTickets;
    document.getElementById('openTickets').textContent = openTickets;
    document.getElementById('closedTickets').textContent = closedTickets;
    document.getElementById('assignedTickets').textContent = assignedTickets;
}

// Load recent tickets
async function loadRecentTickets() {
    try {
        // In a real application, this would fetch from your API
        // For demo purposes, we'll use mock data
        const mockTickets = generateMockTickets();
        
        // Sort by date (newest first) and take first 10
        const recentTickets = mockTickets
            .sort((a, b) => new Date(b.requestedTime) - new Date(a.requestedTime))
            .slice(0, 10);
        
        displayRecentTickets(recentTickets);
        
    } catch (error) {
        console.error('Error loading recent tickets:', error);
        showError('Failed to load recent tickets');
    }
}

// Display recent tickets in the activity list
function displayRecentTickets(tickets) {
    const container = document.getElementById('activityList');
    
    if (tickets.length === 0) {
        container.innerHTML = '<div class="empty-state">No tickets found</div>';
        return;
    }
    
    container.innerHTML = tickets.map(ticket => `
        <div class="activity-item">
            <div class="activity-icon ${getActivityIconClass(ticket)}">
                ${getActivityIconText(ticket)}
            </div>
            <div class="activity-content">
                <div class="activity-title">${escapeHtml(ticket.subject || 'No Subject')}</div>
                <div class="activity-meta">
                    <span class="activity-id">#${ticket.ticketId}</span>
                    <span class="activity-requester">${escapeHtml(ticket.fullName || 'Unknown')}</span>
                    <span class="activity-time">${formatDate(ticket.requestedTime)}</span>
                    <span class="status-badge status-${getStatusClass(ticket.ticketStatus)}">
                        ${ticket.ticketStatus || 'Open'}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// Get activity icon class based on ticket status
function getActivityIconClass(ticket) {
    const status = (ticket.ticketStatus || 'open').toLowerCase();
    if (status.includes('new') || status === 'open') return 'new';
    if (status.includes('progress')) return 'update';
    if (status.includes('closed') || status.includes('resolved')) return 'closed';
    return 'update';
}

// Get activity icon text
function getActivityIconText(ticket) {
    const status = (ticket.ticketStatus || 'open').toLowerCase();
    if (status.includes('new') || status === 'open') return 'N';
    if (status.includes('progress')) return 'U';
    if (status.includes('closed') || status.includes('resolved')) return 'C';
    return 'U';
}

// Get CSS class for status badge
function getStatusClass(status) {
    if (!status) return 'open';
    return status.toLowerCase().replace(' ', '-');
}

// Filter activities based on selection
function filterActivities() {
    const filter = document.getElementById('activity-filter').value;
    loadRecentTickets(); // In a real app, this would apply the filter to the data
}

// Refresh entire dashboard
function refreshDashboard() {
    loadDashboardData();
    loadRecentTickets();
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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

function showError(message) {
    const container = document.getElementById('activityList');
    container.innerHTML = `<div class="empty-state">${message}</div>`;
}

// Mock data generator for demo purposes
function generateMockTickets() {
    const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const subjects = [
        'Login issues', 'Password reset request', 'Software installation',
        'Network connectivity problem', 'Email configuration', 'Printer not working',
        'VPN access required', 'Software license renewal', 'Hardware replacement'
    ];
    const names = ['John Smith', 'Jane Doe', 'Robert Johnson', 'Sarah Wilson', 'Michael Brown'];
    
    const tickets = [];
    
    for (let i = 1; i <= 50; i++) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
        const randomName = names[Math.floor(Math.random() * names.length)];
        
        // Create dates within the last 30 days
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
        
        tickets.push({
            ticketId: `TKT${1000 + i}`,
            subject: randomSubject,
            fullName: randomName,
            ticketStatus: randomStatus,
            requestedTime: randomDate.toISOString(),
            assignedPerson: Math.random() > 0.3 ? 'Support Agent' : ''
        });
    }
    
    return tickets;
}

// Auto-refresh every 30 seconds
setInterval(loadDashboardData, 30000);