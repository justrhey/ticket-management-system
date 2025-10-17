// Use relative path or dynamic origin instead of hardcoded localhost
const API_BASE = '/api/tickets';
let allTickets = [];
let currentPage = 1;
let pageSize = 25;
let totalPages = 1;
let totalItems = 0;
let selectedTickets = new Set();
let currentFilters = {
    status: [],
    search: '',
    sort: 'createdAt,desc'
};
let isAutoRefreshEnabled = true;
let refreshInterval = 5000;
let refreshIntervalId = null;
let lastTicketCount = 0;

// Modal state variables
let currentTicketId = null;

const notificationSounds = {
    'new-ticket': 'new-ticket',
    'ticket-update': 'ticket-update', 
    'success': 'success',
    'error': 'error',
    'info': 'info'
};

function preloadSounds() {
    console.log('Sound system initialized - using browser audio API');
}

function playNotificationSound(soundType = 'info') {
    try {
        // Use Web Audio API for browser-based sounds
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different frequencies for different notification types
        const frequencies = {
            'success': 800,
            'error': 400,
            'new-ticket': 600,
            'ticket-update': 500,
            'info': 300
        };
        
        const frequency = frequencies[soundType] || 500;
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        console.log('Played sound:', soundType);
        
    } catch (error) {
        console.log('Sound playback failed:', error);
        // Fallback: Use browser's speech synthesis for accessibility
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = ' '; // Silent utterance
            utterance.volume = 0;
            window.speechSynthesis.speak(utterance);
        }
    }
}

// Load tickets when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing table manager...');
    
    // Initialize systems
    preloadSounds();
    initializeNetworkInfo();
    initializeEventListeners();
    
    // Load data
    loadTickets();
    
    // Set up auto-refresh
    initializeAutoRefresh();
    
    console.log('Table manager fully initialized');
});

function initializeAutoRefresh(){
    const toggle = document.getElementById('auto-refresh-toggle');
    const indicator = document.getElementById('refresh-indicator');

    if(toggle){
        toggle.checked = isAutoRefreshEnabled;
        toggle.addEventListener('change', function() {
            isAutoRefreshEnabled = this.checked;
            if(isAutoRefreshEnabled){
                startAutoRefresh();
                showNotification('Auto Refresh', 'Live updates enabled','success');
            }else{
                stopAutoRefresh();
                showNotification('Auto Refresh', 'Live updates disabled', 'info');
            }
        });
    }
    if(isAutoRefreshEnabled){
        startAutoRefresh();
    }
}

function startAutoRefresh() {
    stopAutoRefresh();
    
    refreshIntervalId = setInterval(async () => {
        if (!isAutoRefreshEnabled) return;
        
        try {
            await checkForUpdates();
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }, refreshInterval);
    
    updateRefreshIndicator(true);
}

function updateRefreshIndicator(isActive) {
    const indicator = document.getElementById('refresh-indicator');
    if (indicator) {
        indicator.innerHTML = isActive ? '🟢 Live' : '🔴 Off';
        indicator.title = isActive ? 'Live updates enabled' : 'Live updates disabled';
    }
}

function stopAutoRefresh() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }
    updateRefreshIndicator(false);
}

async function checkForUpdates() {
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const newTickets = await response.json();
        const newTicketCount = newTickets.length;
        
        // Detect new tickets
        if (lastTicketCount > 0 && newTicketCount > lastTicketCount) {
            const newTicketsCount = newTicketCount - lastTicketCount;
            showNewTicketNotification(newTicketsCount);
        }
        
        // Detect ticket changes
        if (lastTicketCount > 0) {
            detectTicketChanges(newTickets);
        }
        
        // Update if data changed
        if (JSON.stringify(allTickets) !== JSON.stringify(newTickets)) {
            allTickets = newTickets;
            applyFiltersAndSort();
        }
        
        lastTicketCount = newTicketCount;
        
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}

function detectTicketChanges(newTickets) {
    newTickets.forEach(newTicket => {
        const oldTicket = allTickets.find(t => t.ticketId === newTicket.ticketId);
        if (!oldTicket) return;
        
        // Status change
        if (oldTicket.ticketStatus !== newTicket.ticketStatus) {
            showTicketUpdateNotification(
                `Ticket #${newTicket.ticketId} status changed`,
                `Status changed from ${oldTicket.ticketStatus} to ${newTicket.ticketStatus}`,
                'info'
            );
        }
        
        // Assignment change
        if (oldTicket.assignedPerson !== newTicket.assignedPerson) {
            showTicketUpdateNotification(
                `Ticket #${newTicket.ticketId} reassigned`,
                `Assigned to ${newTicket.assignedPerson || 'Unassigned'}`,
                'info'
            );
        }
        
        // IT comments added
        if (oldTicket.itComment !== newTicket.itComment && newTicket.itComment) {
            showTicketUpdateNotification(
                `Ticket #${newTicket.ticketId} updated`,
                'New IT comments added',
                'success'
            );
        }
    });
}

function showNewTicketNotification(count) {
    const message = count === 1 
        ? '1 new ticket has been created' 
        : `${count} new tickets have been created`;
    showNotification('New Tickets', message, 'success', 'new-ticket');
}

function showTicketUpdateNotification(title, message, type) {
    showNotification(title, message, type, 'ticket-update');
}

function showNotification(title, message, type = 'info', soundType = null) {
    // Play sound
    playNotificationSound(soundType || type);
    
    const header = document.getElementById('notification-header');
    const titleEl = document.getElementById('notification-title');
    const messageEl = document.getElementById('notification-message');
    
    if (!header || !titleEl || !messageEl) return;
    
    const colors = {
        'error': '#dc3545',
        'success': '#28a745',
        'warning': '#ffc107',
        'info': '#0041d8'
    };
    
    header.style.background = colors[type] || colors.info;
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    const modal = document.getElementById('notificationModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Auto-close for non-critical notifications
        if (type === 'info' || type === 'success') {
            setTimeout(() => {
                if (modal.style.display === 'block') {
                    closeNotificationModal();
                }
            }, 5000);
        }
    }
}

function initializeNetworkInfo() {
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('clientIpAddress', data.ip);
        })
        .catch(error => {
            console.error('Failed to get IP:', error);
            localStorage.setItem('clientIpAddress', 'Unknown');
        });

    const computerName = window.location.hostname || 'Unknown';
    localStorage.setItem('computerName', computerName);
}

function getNetworkInfo() {
    return {
        clientIpAddress: localStorage.getItem('clientIpAddress') || 'Unknown',
        computerName: localStorage.getItem('computerName') || 'Unknown',
        userAgent: navigator.userAgent || 'Unknown'
    };
}

function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                debouncedSearch();
            }
        });
    }

    // Bulk action
    const bulkAction = document.getElementById('bulk-action');
    if (bulkAction) {
        bulkAction.addEventListener('change', function() {
            const action = this.value;
            const assignField = document.getElementById('bulk-assign-field');
            const statusField = document.getElementById('bulk-status-field');
            const priorityField = document.getElementById('bulk-priority-field');
            
            if (assignField) assignField.style.display = action === 'assign' ? 'block' : 'none';
            if (statusField) statusField.style.display = action === 'change-status' ? 'block' : 'none';
            if (priorityField) priorityField.style.display = action === 'change-priority' ? 'block' : 'none';
        });
    }

    // Edit form submission
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTicketEdit();
        });
    }

    // Modal close events
    document.querySelectorAll('.modal .close, .btn-secondary').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
}

async function loadTickets() {
    try {
        showLoading();
        console.log('Loading tickets from:', API_BASE);
        
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        allTickets = await response.json();
        console.log('Loaded tickets:', allTickets.length);
        
        if (allTickets.length > 0) {
            lastTicketCount = allTickets.length;
        }
        
        applyFiltersAndSort();
        hideLoading();
    } catch (error) {
        console.error('Error loading tickets:', error);
        showNotification('Error', 'Failed to load tickets: ' + error.message, 'error');
        hideLoading();
    }
}

function applyFiltersAndSort() {
    let filteredTickets = [...allTickets];
    
    // Apply status filter
    if (currentFilters.status.length > 0) {
        filteredTickets = filteredTickets.filter(ticket => {
            if (!ticket.ticketStatus) return false;
            const ticketStatus = normalizeStatus(ticket.ticketStatus);
            const filterStatuses = currentFilters.status.map(normalizeStatus);
            return filterStatuses.includes(ticketStatus);
        });
    }
    
    // Apply search filter
    if (currentFilters.search) {
        const query = currentFilters.search.toLowerCase();
        filteredTickets = filteredTickets.filter(ticket =>
            (ticket.subject && ticket.subject.toLowerCase().includes(query)) ||
            (ticket.fullName && ticket.fullName.toLowerCase().includes(query)) ||
            (ticket.intent && ticket.intent.toLowerCase().includes(query)) ||
            (ticket.assignedPerson && ticket.assignedPerson.toLowerCase().includes(query))
        );
    }
    
    // Apply sorting
    filteredTickets = sortTickets(filteredTickets, currentFilters.sort);
    
    // Update pagination
    totalItems = filteredTickets.length;
    totalPages = Math.ceil(totalItems / pageSize);
    currentPage = Math.min(currentPage, totalPages || 1);
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageTickets = filteredTickets.slice(startIndex, endIndex);
    
    displayTickets(pageTickets);
    updatePagination();
    updateStats(allTickets);
}

function normalizeStatus(status) {
    if (!status) return '';
    return status.toUpperCase().replace(/_/g, '').replace(/\s/g, '').trim();
}

function sortTickets(tickets, sortOption) {
    const sorted = [...tickets];
    
    switch (sortOption) {
        case 'createdAt,desc':
            return sorted.sort((a, b) => new Date(b.requestedTime) - new Date(a.requestedTime));
        case 'createdAt,asc':
            return sorted.sort((a, b) => new Date(a.requestedTime) - new Date(b.requestedTime));
        case 'title,asc':
            return sorted.sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));
        case 'priority,desc':
            return sorted.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
        case 'priority,asc':
            return sorted.sort((a, b) => getPriorityValue(a.priority) - getPriorityValue(b.priority));
        default:
            return sorted;
    }
}

function getPriorityValue(priority) {
    const priorityValues = {
        'LOW': 1,
        'MEDIUM': 2,
        'HIGH': 3,
        'URGENT': 4
    };
    return priorityValues[priority] || 0;
}

function displayTickets(tickets) {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) {
        console.error('Table body element not found!');
        return;
    }
    
    tableBody.innerHTML = '';

    if (!tickets || tickets.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    tickets.forEach(ticket => {
        const row = document.createElement('tr');
        const priority = ticket.priority || 'MEDIUM';
        const status = ticket.ticketStatus || 'OPEN';
        const isSelected = selectedTickets.has(ticket.ticketId);
        
        row.innerHTML = `
            <td class="select-column">
                <input type="checkbox" value="${ticket.ticketId}" 
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleSelection(${ticket.ticketId})">
            </td>
            <td class="id-column">#${ticket.ticketId}</td>
            <td class="title-column">
                <div class="ticket-title">${escapeHtml(ticket.subject || 'No subject')}</div>
                <div class="ticket-description">${escapeHtml(ticket.intent || 'No description')}</div>
                <div class="ticket-network-info">
                    IP: ${escapeHtml(ticket.clientIpAddress || 'Unknown')} | 
                    Computer: ${escapeHtml(ticket.computerName || 'Unknown')} |
                    Assign: ${escapeHtml(ticket.assignedPerson || 'Unassigned')}
                </div>
            </td>
            <td class="status-column">
                <span class="status-badge status-${status.toLowerCase()}">${status}</span>
            </td>
            <td class="priority-column">
                <span class="priority-badge priority-${priority.toLowerCase()}">${priority}</span>
            </td>
            <td class="assignee-column">${escapeHtml(ticket.assignedPerson || 'Unassigned')}</td>
            <td class="date-column">${formatDate(ticket.requestedTime)}</td>
            <td class="actions-column">
                <button class="btn btn-small btn-secondary" onclick="editTicket(${ticket.ticketId})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteTicket(${ticket.ticketId})">Delete</button>
                <button class="btn btn-small" onclick="viewTicket(${ticket.ticketId})">View</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Edit Ticket Functions
function editTicket(ticketId) {
    console.log('Edit ticket clicked:', ticketId);
    const ticket = allTickets.find(t => t.ticketId === ticketId);
    if (!ticket) {
        console.error('Ticket not found:', ticketId);
        showNotification('Error', 'Ticket not found', 'error');
        return;
    }
    
    currentTicketId = ticketId;
    
    // Set form values
    const subjectInput = document.getElementById('edit-subject');
    const statusSelect = document.getElementById('edit-status');
    const prioritySelect = document.getElementById('edit-priority');
    const assignedSelect = document.getElementById('edit-assignedPerson');
    const originalDesc = document.getElementById('edit-original-description');
    const itComment = document.getElementById('edit-it-comment');
    
    if (subjectInput) subjectInput.value = ticket.subject || '';
    if (statusSelect) statusSelect.value = ticket.ticketStatus || 'OPEN';
    if (prioritySelect) prioritySelect.value = ticket.priority || 'MEDIUM';
    if (assignedSelect) assignedSelect.value = ticket.assignedPerson || '';
    if (originalDesc) originalDesc.textContent = ticket.intent || 'No description provided';
    if (itComment) itComment.value = ticket.itComment || '';
    
    openEditModal();
}

function openEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const form = document.getElementById('editForm');
    if (form) {
        form.reset();
    }
    currentTicketId = null;
}

async function saveTicketEdit() {
    if (!currentTicketId) {
        showNotification('Error', 'No ticket selected for editing', 'error');
        return;
    }

    const subject = document.getElementById('edit-subject')?.value;
    const status = document.getElementById('edit-status')?.value;
    const priority = document.getElementById('edit-priority')?.value;
    const assignedPerson = document.getElementById('edit-assignedPerson')?.value;
    const itComment = document.getElementById('edit-it-comment')?.value;

    if (!subject || !assignedPerson) {
        showNotification('Error', 'Please fill in all required fields.', 'error');
        return;
    }

    try {
        const ticket = allTickets.find(t => t.ticketId === currentTicketId);
        if (!ticket) {
            showNotification('Error', 'Ticket not found', 'error');
            return;
        }

        const response = await fetch(`${API_BASE}/${currentTicketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ...ticket, 
                subject: subject,
                ticketStatus: status,
                priority: priority,
                assignedPerson: assignedPerson,
                itComment: itComment 
            })
        });

        if (response.ok) {
            closeEditModal();
            await loadTickets();
            showNotification('Success', 'Ticket updated successfully!', 'success');
        } else {
            const errorText = await response.text();
            showNotification('Error', 'Failed to update ticket: ' + errorText, 'error');
        }
    } catch (error) {
        showNotification('Error', 'Error updating ticket: ' + error.message, 'error');
    }
}

// View Ticket Functions
function viewTicket(ticketId){
    console.log('View Ticket clicked', ticketId);
    
    if (!ticketId) {
        console.error('No ticket ID provided to view');
        return;
    }
    
    const ticket = allTickets.find(t => t.ticketId === ticketId);
    console.log('Found Ticket:', ticket);
    
    if (!ticket) {
        console.error('Ticket not found:', ticketId);
        console.log('Available Ticket IDs:', allTickets.map(t => t.ticketId));
        showNotification('Error', 'Ticket not found', 'error');
        return;
    }

    const viewId = document.getElementById('view-id');
    const viewSubject = document.getElementById('view-subject');
    const viewRequester = document.getElementById('view-requester');
    const viewStatus = document.getElementById('view-status');
    const viewPriority = document.getElementById('view-priority');
    const viewAssigned = document.getElementById('view-assigned');
    const viewCreated = document.getElementById('view-created');
    const viewDescription = document.getElementById('view-description');
    const viewIp = document.getElementById('view-ip');
    const viewComputer = document.getElementById('view-computer');
    const viewUseragent = document.getElementById('view-useragent');
    const viewItComment = document.getElementById('view-it-comment');

    if (viewId) viewId.textContent = `#${ticket.ticketId}`;
    if (viewSubject) viewSubject.textContent = ticket.subject || 'No subject';
    if (viewRequester) viewRequester.textContent = ticket.fullName || 'Unknown';
    
    if (viewStatus) {
        const status = ticket.ticketStatus || 'OPEN';
        viewStatus.innerHTML = `<span class="status-badge status-${status.toLowerCase()}">${status}</span>`;
    }
    
    if (viewPriority) {
        const priority = ticket.priority || 'MEDIUM';
        viewPriority.innerHTML = `<span class="priority-badge priority-${priority.toLowerCase()}">${priority}</span>`;
    }
    
    if (viewAssigned) viewAssigned.textContent = ticket.assignedPerson || 'Not assigned';
    if (viewCreated) viewCreated.textContent = formatDateTime(ticket.requestedTime);
    if (viewDescription) viewDescription.textContent = ticket.intent || 'No description provided';
    if (viewIp) viewIp.textContent = ticket.clientIpAddress || 'Unknown';
    if (viewComputer) viewComputer.textContent = ticket.computerName || 'Unknown';
    if (viewUseragent) viewUseragent.textContent = ticket.userAgent || 'Unknown';

    if (viewItComment) {
        const itComment = ticket.itComment || 'No IT comments yet.';
        viewItComment.textContent = itComment;
        
        if (itComment && itComment !== 'No IT comments yet.' && itComment.trim() !== '') {
            viewItComment.style.background = '#f8f9fa';
            viewItComment.style.padding = '12px';
            viewItComment.style.borderRadius = '4px';
            viewItComment.style.borderLeft = '4px solid #0041d8';
        } else {
            viewItComment.style.background = '';
            viewItComment.style.padding = '';
            viewItComment.style.borderRadius = '';
            viewItComment.style.borderLeft = '';
        }
    }

    openViewModal();
}

function openViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error('View modal element not found');
    }
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Delete Ticket Functions - 
function deleteTicket(ticketId) {
    console.log('Delete ticket clicked:', ticketId);
    currentTicketId = ticketId;
    
    const ticket = allTickets.find(t => t.ticketId === ticketId);
    const ticketSubject = ticket ? (ticket.subject || 'Untitled') : 'this ticket';
    
    // THIS IS THE ONLY PLACE where delete confirmation message is set
    const confirmMessage = document.getElementById('delete-confirm-message');
    if (confirmMessage) {
        confirmMessage.textContent = `Are you sure you want to delete ticket #${ticketId} - "${ticketSubject}"? This action cannot be undone.`;
    }
    
    openDeleteModal();
}

function openDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentTicketId = null;
}

async function confirmDelete() {
    if (!currentTicketId) {
        showNotification('Error', 'No ticket selected for deletion', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${currentTicketId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeDeleteModal();
            showNotification('Success', 'Ticket deleted successfully', 'success');
            
            // Remove from selection if selected
            if (selectedTickets.has(currentTicketId)) {
                selectedTickets.delete(currentTicketId);
                updateSelectionCount();
            }
            
            await loadTickets();
        } else {
            const errorText = await response.text();
            showNotification('Error', 'Failed to delete ticket: ' + errorText, 'error');
        }
    } catch (error) {
        showNotification('Error', 'Error deleting ticket: ' + error.message, 'error');
    }
}

// Bulk Actions
function bulkAction() {
    if (selectedTickets.size === 0) {
        showNotification('Error', 'Please select tickets first', 'error');
        return;
    }
    
    const bulkCount = document.getElementById('bulk-count');
    if (bulkCount) bulkCount.textContent = selectedTickets.size;
    
    const bulkActionSelect = document.getElementById('bulk-action');
    if (bulkActionSelect) bulkActionSelect.value = '';
    
    const assignField = document.getElementById('bulk-assign-field');
    const statusField = document.getElementById('bulk-status-field');
    const priorityField = document.getElementById('bulk-priority-field');
    
    if (assignField) assignField.style.display = 'none';
    if (statusField) statusField.style.display = 'none';
    if (priorityField) priorityField.style.display = 'none';
    
    openBulkModal();
}

function openBulkModal() {
    const modal = document.getElementById('bulkModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeBulkModal() {
    const modal = document.getElementById('bulkModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function executeBulkAction() {
    const bulkActionSelect = document.getElementById('bulk-action');
    if (!bulkActionSelect || !bulkActionSelect.value) {
        showNotification('Error', 'Please select an action', 'error');
        return;
    }

    const action = bulkActionSelect.value;
    
    if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${selectedTickets.size} tickets? This action cannot be undone.`)) {
            return;
        }
    }

    try {
        showLoading();
        
        switch (action) {
            case 'assign':
                const assignee = document.getElementById('bulk-assignee')?.value;
                if (!assignee) {
                    showNotification('Error', 'Please enter an assignee name', 'error');
                    hideLoading();
                    return;
                }
                await bulkAssign(assignee);
                break;
                
            case 'change-status':
                const status = document.getElementById('bulk-status')?.value;
                await bulkChangeStatus(status);
                break;
                
            case 'change-priority':
                const priority = document.getElementById('bulk-priority')?.value;
                await bulkChangePriority(priority);
                break;
                
            case 'close':
                await bulkClose();
                break;
                
            case 'delete':
                await bulkDelete();
                break;
        }
        
        closeBulkModal();
        await loadTickets();
        showNotification('Success', `Action completed successfully for ${selectedTickets.size} tickets`, 'success');
        clearSelection();
        
    } catch (error) {
        showNotification('Error', 'Bulk action failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function bulkAssign(assignee) {
    const updates = Array.from(selectedTickets).map(ticketId => {
        const ticket = allTickets.find(t => t.ticketId === ticketId);
        return fetch(`${API_BASE}/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...ticket, assignedPerson: assignee })
        });
    });
    
    await Promise.all(updates);
}

async function bulkClose() {
    const updates = Array.from(selectedTickets).map(ticketId => {
        const ticket = allTickets.find(t => t.ticketId === ticketId);
        return fetch(`${API_BASE}/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...ticket, ticketStatus: 'CLOSED' })
        });
    });
    
    await Promise.all(updates);
}

async function bulkChangeStatus(status) {
    const updates = Array.from(selectedTickets).map(ticketId => {
        const ticket = allTickets.find(t => t.ticketId === ticketId);
        return fetch(`${API_BASE}/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...ticket, ticketStatus: status })
        });
    });
    
    await Promise.all(updates);
}

async function bulkChangePriority(priority) {
    const updates = Array.from(selectedTickets).map(ticketId => {
        const ticket = allTickets.find(t => t.ticketId === ticketId);
        return fetch(`${API_BASE}/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...ticket, priority: priority })
        });
    });
    
    await Promise.all(updates);
}

async function bulkDelete() {
    const deletePromises = Array.from(selectedTickets).map(ticketId => 
        fetch(`${API_BASE}/${ticketId}`, {
            method: 'DELETE'
        })
    );
    
    const results = await Promise.allSettled(deletePromises);
    const failed = results.filter(result => result.status === 'rejected' || !result.value.ok);
    
    if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} ticket(s)`);
    }
}

// Selection Functions
function toggleSelection(ticketId) {
    if (selectedTickets.has(ticketId)) {
        selectedTickets.delete(ticketId);
    } else {
        selectedTickets.add(ticketId);
    }
    updateSelectionCount();
    updateSelectAllCheckbox();
}

function updateSelectionCount() {
    const selectedCount = document.getElementById('selected-count');
    if (selectedCount) {
        selectedCount.textContent = selectedTickets.size;
    }
}

function selectAll() {
    const checkboxes = document.querySelectorAll('#table-body input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const ticketId = parseInt(checkbox.value);
        checkbox.checked = true;
        selectedTickets.add(ticketId);
    });
    updateSelectionCount();
    updateSelectAllCheckbox();
}

function clearSelection() {
    selectedTickets.clear();
    const checkboxes = document.querySelectorAll('#table-body input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    
    updateSelectionCount();
}

function toggleSelectAll(checkbox) {
    if (checkbox.checked) {
        selectAll();
    } else {
        clearSelection();
    }
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all');
    const allCheckboxes = document.querySelectorAll('#table-body input[type="checkbox"]');
    const checkedCount = document.querySelectorAll('#table-body input[type="checkbox"]:checked').length;
    
    if (selectAllCheckbox && allCheckboxes.length > 0) {
        selectAllCheckbox.checked = checkedCount > 0 && checkedCount === allCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
    }
}

// Pagination Functions
function updatePagination() {
    const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, totalItems);
    
    const pageStartEl = document.getElementById('page-start');
    const pageEndEl = document.getElementById('page-end');
    const totalItemsEl = document.getElementById('total-items');
    
    if (pageStartEl) pageStartEl.textContent = pageStart;
    if (pageEndEl) pageEndEl.textContent = pageEnd;
    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    
    const firstPageBtn = document.getElementById('first-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const lastPageBtn = document.getElementById('last-page');
    
    if (firstPageBtn) firstPageBtn.disabled = currentPage === 1;
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
    if (lastPageBtn) lastPageBtn.disabled = currentPage === totalPages;
    
    renderPageNumbers();
}

function renderPageNumbers() {
    const container = document.getElementById('page-numbers');
    if (!container) return;
    
    const pages = generatePageNumbers();
    container.innerHTML = pages.map(page => `
        <button class="page-number ${page === currentPage ? 'active' : ''}" 
                onclick="goToPage(${page})"
                ${page === '...' ? 'disabled' : ''}>
            ${page}
        </button>
    `).join('');
}

function generatePageNumbers() {
    if (totalPages <= 1) return [1];
    
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
    }

    if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
    } else {
        rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
}

function goToPage(page) {
    if (page < 1 || page > totalPages || page === '...') return;
    currentPage = page;
    applyFiltersAndSort();
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        applyFiltersAndSort();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        applyFiltersAndSort();
    }
}

function changePageSize() {
    const sizeSelect = document.getElementById('page-size');
    if (sizeSelect) {
        pageSize = parseInt(sizeSelect.value);
        currentPage = 1;
        applyFiltersAndSort();
    }
}

// Filter and Search Functions
function updateFilters() {
    const statusCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    currentFilters.status = Array.from(statusCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    console.log('Filters updated:', currentFilters.status);
    
    currentPage = 1;
    applyFiltersAndSort();
}

function updateSorting() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        currentFilters.sort = sortSelect.value;
        currentPage = 1;
        applyFiltersAndSort();
    }
}

let searchTimeout;
function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            currentFilters.search = searchInput.value;
            currentPage = 1;
            applyFiltersAndSort();
        }
    }, 300);
}

function clearFilters() {
    // Uncheck all filter checkboxes
    const checkboxes = document.querySelectorAll('.checkbox-item input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    // Clear search
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    // Reset to default sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'createdAt,desc';
    
    // Reset filters - empty array shows ALL tickets
    currentFilters = {
        status: [],
        search: '',
        sort: 'createdAt,desc'
    };
    
    currentPage = 1;
    applyFiltersAndSort();
}

// Stats Functions
function updateStats(tickets) {
    const total = tickets.length;
    const statusCounts = { 'OPEN': 0, 'IN_PROGRESS': 0, 'RESOLVED': 0, 'CLOSED': 0 };

    tickets.forEach(ticket => {
        const status = ticket.ticketStatus;
        if (status) {
            const normalizedStatus = normalizeStatus(status);
            if (normalizedStatus === 'OPEN') statusCounts.OPEN++;
            else if (normalizedStatus === 'INPROGRESS') statusCounts.IN_PROGRESS++;
            else if (normalizedStatus === 'RESOLVED') statusCounts.RESOLVED++;
            else if (normalizedStatus === 'CLOSED') statusCounts.CLOSED++;
        }
    });

    const statTotal = document.getElementById('stat-total');
    const statOpen = document.getElementById('stat-open');
    
    if (statTotal) statTotal.textContent = total;
    if (statOpen) statOpen.textContent = statusCounts.OPEN;
    
    const countOpen = document.getElementById('count-OPEN');
    const countInProgress = document.getElementById('count-IN_PROGRESS');
    const countResolved = document.getElementById('count-RESOLVED');
    const countClosed = document.getElementById('count-CLOSED');
    
    if (countOpen) countOpen.textContent = statusCounts.OPEN;
    if (countInProgress) countInProgress.textContent = statusCounts.IN_PROGRESS;
    if (countResolved) countResolved.textContent = statusCounts.RESOLVED;
    if (countClosed) countClosed.textContent = statusCounts.CLOSED;
}

// UI State Functions
function showLoading() {
    const loading = document.getElementById('loading-state');
    if (loading) loading.classList.remove('hidden');
}

function hideLoading() {
    const loading = document.getElementById('loading-state');
    if (loading) loading.classList.add('hidden');
}

function showEmptyState() {
    const empty = document.getElementById('empty-state');
    if (empty) empty.classList.remove('hidden');
}

function hideEmptyState() {
    const empty = document.getElementById('empty-state');
    if (empty) empty.classList.add('hidden');
}

function closeNotificationModal() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Utility Functions
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
        return new Date(dateString).toLocaleString();
    } catch (e) {
        return 'Invalid Date';
    }
}

function refreshTable() {
    currentPage = 1;
    loadTickets();
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = ['editModal', 'viewModal', 'bulkModal', 'deleteModal', 'notificationModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
            if (modalId === 'editModal') currentTicketId = null;
            if (modalId === 'deleteModal') currentTicketId = null;
        }
    });
}

// Make functions globally available
window.editTicket = editTicket;
window.deleteTicket = deleteTicket;
window.viewTicket = viewTicket;
window.saveTicketEdit = saveTicketEdit;
window.closeEditModal = closeEditModal;
window.closeViewModal = closeViewModal;
window.closeBulkModal = closeBulkModal;
window.closeDeleteModal = closeDeleteModal;
window.closeNotificationModal = closeNotificationModal;
window.confirmDelete = confirmDelete;
window.executeBulkAction = executeBulkAction;
window.toggleSelection = toggleSelection;
window.toggleSelectAll = toggleSelectAll;
window.selectAll = selectAll;
window.clearSelection = clearSelection;
window.updateFilters = updateFilters;
window.updateSorting = updateSorting;
window.debouncedSearch = debouncedSearch;
window.changePageSize = changePageSize;
window.goToPage = goToPage;
window.previousPage = previousPage;
window.nextPage = nextPage;
window.refreshTable = refreshTable;
window.clearFilters = clearFilters;
window.bulkAction = bulkAction;

console.log('Table manager initialized successfully');