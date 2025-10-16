// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadRecentTickets();
});

// Load dashboard statistics
async function loadDashboardData() {
    try {
        const response = await fetch('/api/tickets');
        if (!response.ok) {
            throw new Error('Failed to fetch tickets');
        }
        const tickets = await response.json();
        
        updateDashboardStats(tickets);
        updateFilterCounts(tickets);
        
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
    
    // Today's tickets (created today)
    const today = new Date().toDateString();
    const todayTickets = tickets.filter(t => 
        new Date(t.requestedTime).toDateString() === today
    ).length;
    
    // This week's tickets
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekTickets = tickets.filter(t => 
        new Date(t.requestedTime) >= oneWeekAgo
    ).length;
    
    // Response rate (simplified - tickets with assigned person)
    const responseRate = totalTickets > 0 ? 
        Math.round((assignedTickets / totalTickets) * 100) : 0;

    // Update DOM
    document.getElementById('totalTickets').textContent = totalTickets;
    document.getElementById('openTickets').textContent = openTickets;
    document.getElementById('closedTickets').textContent = closedTickets;
    document.getElementById('assignedTickets').textContent = assignedTickets;
    document.getElementById('todayTickets').textContent = todayTickets;
    document.getElementById('weekTickets').textContent = weekTickets;
    document.getElementById('responseRate').textContent = responseRate + '%';
}

// Update filter counts
function updateFilterCounts(tickets) {
    const openCount = tickets.filter(t => t.ticketStatus === 'Open').length;
    const inProgressCount = tickets.filter(t => t.ticketStatus === 'In Progress').length;
    const resolvedCount = tickets.filter(t => t.ticketStatus === 'Resolved').length;
    const closedCount = tickets.filter(t => t.ticketStatus === 'Closed').length;
    
    document.getElementById('count-open').textContent = openCount;
    document.getElementById('count-in-progress').textContent = inProgressCount;
    document.getElementById('count-resolved').textContent = resolvedCount;
    document.getElementById('count-closed').textContent = closedCount;
}

// Load recent tickets
async function loadRecentTickets() {
    try {
        const response = await fetch('/api/tickets');
        if (!response.ok) {
            throw new Error('Failed to fetch tickets');
        }
        const tickets = await response.json();
        
        // Sort by date (newest first) and take first 10
        const recentTickets = tickets
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
                <div class="activity-title">${escapeHtml(ticket.subject)}</div>
                <div class="activity-meta">
                    <span class="activity-id">#${ticket.ticketId}</span>
                    <span class="activity-requester">${escapeHtml(ticket.fullName)}</span>
                    <span class="activity-time">${formatDate(ticket.requestedTime)}</span>
                    <span class="status-badge status-${(ticket.ticketStatus || 'open').toLowerCase().replace(' ', '-')}">
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

// Filter tickets based on selected statuses
function filterTickets() {
    // This would filter the displayed tickets if we had a full list view
    console.log('Filtering tickets...');
    // Implementation would depend on having a full tickets view in the dashboard
}

// Export data
function exportData() {
    alert('Export functionality would be implemented here!');
    // This could export to CSV, PDF, etc.
}

// Refresh entire dashboard
function refreshDashboard() {
    loadDashboardData();
    loadRecentTickets();
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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

// Auto-refresh every 30 seconds
setInterval(loadDashboardData, 30000);