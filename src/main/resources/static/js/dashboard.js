// Dashboard functionality
let statusChart = null;
let currentDate = new Date();
let selectedDate = null;
let ticketsData = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loading...');
    loadDashboardData();
    loadRecentTickets();
    initializeCalendar();
});

// ===== DATA LOADING =====
async function loadDashboardData() {
    try {
        const response = await fetch('/api/tickets');
        if (!response.ok) {
            throw new Error('Failed to fetch tickets');
        }
        ticketsData = await response.json();
        console.log('Loaded tickets:', ticketsData.length);
        
        updateDashboardStats(ticketsData);
        updateFilterCounts(ticketsData);
        updateStatusChart(ticketsData);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

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

// ===== STATISTICS =====
function updateDashboardStats(tickets) {
    const totalTickets = tickets.length;
    
    // Count by status - use exact matching with your Java backend
    const openTickets = tickets.filter(t => 
        t.ticketStatus && t.ticketStatus.toLowerCase() === 'open'
    ).length;
    
    const closedTickets = tickets.filter(t => 
        t.ticketStatus && t.ticketStatus.toLowerCase() === 'closed'
    ).length;
    
    const assignedTickets = tickets.filter(t => 
        t.assignedPerson && t.assignedPerson.trim() !== ''
    ).length;
    
    // Today's tickets
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
    
    // Response rate
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

function updateFilterCounts(tickets) {
    // Count each status - case insensitive matching
    const openCount = tickets.filter(t => 
        t.ticketStatus && t.ticketStatus.toLowerCase() === 'open'
    ).length;
    
    const inProgressCount = tickets.filter(t => 
        t.ticketStatus && (
            t.ticketStatus.toLowerCase() === 'in progress' ||
            t.ticketStatus.toLowerCase() === 'in-progress' ||
            t.ticketStatus.toLowerCase() === 'inprogress'
        )
    ).length;
    
    const resolvedCount = tickets.filter(t => 
        t.ticketStatus && t.ticketStatus.toLowerCase() === 'resolved'
    ).length;
    
    const closedCount = tickets.filter(t => 
        t.ticketStatus && t.ticketStatus.toLowerCase() === 'closed'
    ).length;
    
    document.getElementById('count-open').textContent = openCount;
    document.getElementById('count-in-progress').textContent = inProgressCount;
    document.getElementById('count-resolved').textContent = resolvedCount;
    document.getElementById('count-closed').textContent = closedCount;
}

// ===== ACTIVITY LIST =====
function displayRecentTickets(tickets) {
    const container = document.getElementById('activityList');
    
    if (!tickets || tickets.length === 0) {
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

function getActivityIconClass(ticket) {
    const status = (ticket.ticketStatus || 'open').toLowerCase();
    if (status.includes('new') || status === 'open') return 'new';
    if (status.includes('progress')) return 'update';
    if (status.includes('closed') || status.includes('resolved')) return 'closed';
    return 'update';
}

function getActivityIconText(ticket) {
    const status = (ticket.ticketStatus || 'open').toLowerCase();
    if (status.includes('new') || status === 'open') return 'N';
    if (status.includes('progress')) return 'U';
    if (status.includes('closed') || status.includes('resolved')) return 'C';
    return 'U';
}

// ===== DONUT CHART =====
function updateStatusChart(tickets) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }
    
    // Count tickets by status - same logic as stats cards
    const statusCounts = {
        'Open': tickets.filter(t => 
            t.ticketStatus && t.ticketStatus.toLowerCase() === 'open'
        ).length,
        'In Progress': tickets.filter(t => 
            t.ticketStatus && (
                t.ticketStatus.toLowerCase() === 'in progress' ||
                t.ticketStatus.toLowerCase() === 'in-progress' ||
                t.ticketStatus.toLowerCase() === 'inprogress'
            )
        ).length,
        'Resolved': tickets.filter(t => 
            t.ticketStatus && t.ticketStatus.toLowerCase() === 'resolved'
        ).length,
        'Closed': tickets.filter(t => 
            t.ticketStatus && t.ticketStatus.toLowerCase() === 'closed'
        ).length
    };
    
    console.log('Chart data:', statusCounts);
    
    // Destroy existing chart
    if (statusChart) {
        statusChart.destroy();
    }
    
    // Create new chart
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#27ae60',  // Open - green
                    '#f39c12',  // In Progress - orange
                    '#3498db',  // Resolved - blue
                    '#95a5a6'   // Closed - gray
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ===== CALENDAR =====
function initializeCalendar() {
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day disabled';
        grid.appendChild(emptyDay);
    }
    
    // Add days of month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        // Check if today
        if (year === today.getFullYear() && 
            month === today.getMonth() && 
            day === today.getDate()) {
            dayCell.classList.add('today');
        }
        
        // Check if selected
        if (selectedDate && 
            year === selectedDate.getFullYear() && 
            month === selectedDate.getMonth() && 
            day === selectedDate.getDate()) {
            dayCell.classList.add('selected');
        }
        
        dayCell.onclick = () => selectDate(year, month, day);
        grid.appendChild(dayCell);
    }
}

function selectDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    renderCalendar();
    filterTicketsByDate(selectedDate);
}

function filterTicketsByDate(date) {
    const dateString = date.toDateString();
    const filteredTickets = ticketsData.filter(ticket => 
        new Date(ticket.requestedTime).toDateString() === dateString
    );
    
    displayRecentTickets(filteredTickets);
    
    // Show notification
    const count = filteredTickets.length;
    console.log(`Found ${count} ticket(s) on ${dateString}`);
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// ===== FILTER FUNCTIONS =====
function filterTickets() {
    console.log('Filtering tickets...');
    // Get selected statuses
    const selectedStatuses = [];
    
    if (document.getElementById('filter-open').checked) {
        selectedStatuses.push('open');
    }
    if (document.getElementById('filter-in-progress').checked) {
        selectedStatuses.push('in progress', 'in-progress', 'inprogress');
    }
    if (document.getElementById('filter-resolved').checked) {
        selectedStatuses.push('resolved');
    }
    if (document.getElementById('filter-closed').checked) {
        selectedStatuses.push('closed');
    }
    
    // Filter tickets
    let filteredTickets = ticketsData;
    if (selectedStatuses.length > 0) {
        filteredTickets = ticketsData.filter(ticket => {
            const status = (ticket.ticketStatus || '').toLowerCase();
            return selectedStatuses.some(s => status.includes(s));
        });
    }
    
    displayRecentTickets(filteredTickets);
}

// ===== EXPORT FUNCTION =====
async function exportData() {
    try {
        console.log('Starting export...');
        
        // Use existing ticketsData or fetch fresh
        let tickets = ticketsData;
        if (!tickets || tickets.length === 0) {
            const response = await fetch('/api/tickets');
            if (!response.ok) {
                throw new Error('Failed to fetch tickets');
            }
            tickets = await response.json();
        }
        
        if (tickets.length === 0) {
            alert('No tickets to export');
            return;
        }
        
        console.log('Exporting', tickets.length, 'tickets');
        
        // Create CSV content
        const headers = [
            'Ticket ID',
            'Full Name',
            'Subject',
            'Status',
            'Priority',
            'Assigned Person',
            'Requested Time',
            'Intent',
            'IP Address',
            'Computer Name',
            'User Agent',
            'IT Comment'
        ];
        
        let csvContent = headers.join(',') + '\n';
        
        tickets.forEach(ticket => {
            const row = [
                ticket.ticketId || '',
                escapeCSV(ticket.fullName || ''),
                escapeCSV(ticket.subject || ''),
                ticket.ticketStatus || '',
                ticket.priority || '',
                escapeCSV(ticket.assignedPerson || ''),
                formatDateTimeForCSV(ticket.requestedTime),
                escapeCSV(ticket.intent || ''),
                ticket.clientIpAddress || '',
                escapeCSV(ticket.computerName || ''),
                escapeCSV(ticket.userAgent || ''),
                escapeCSV(ticket.itComment || '')
            ];
            csvContent += row.join(',') + '\n';
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `tickets_export_${timestamp}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`Exported ${tickets.length} tickets to ${filename}`);
        alert(`Successfully exported ${tickets.length} tickets!`);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Failed to export data: ' + error.message);
    }
}

function escapeCSV(str) {
    if (!str) return '';
    // Convert to string and escape quotes
    str = String(str).replace(/"/g, '""');
    // Wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
    }
    return str;
}

function formatDateTimeForCSV(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (e) {
        return dateString;
    }
}

// ===== REFRESH =====
function refreshDashboard() {
    console.log('Refreshing dashboard...');
    loadDashboardData();
    loadRecentTickets();
}

// ===== UTILITY FUNCTIONS =====
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
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showError(message) {
    const container = document.getElementById('activityList');
    if (container) {
        container.innerHTML = `<div class="empty-state">${message}</div>`;
    }
}

// Auto-refresh every 30 seconds
setInterval(() => {
    loadDashboardData();
    loadRecentTickets();
}, 30000);

console.log('Dashboard JS loaded successfully');