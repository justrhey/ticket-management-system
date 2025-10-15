const API_BASE = 'http://localhost:8080/api/tickets';
let allTickets = [];
let currentPage = 1;
let pageSize = 25;
let totalPages = 1;
let totalItems = 0;
let selectedTickets = new Set();
let currentFilters = {
    status: [], // Start with no filters selected
    search: '',
    sort: 'createdAt,desc'
};

// Modal state variables
let currentTicketId = null;

// Load tickets when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing...');
    loadTickets();
    initializeEventListeners();
});

function initializeEventListeners() {
    // Enter key for search
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            debouncedSearch();
        }
    });

    // Bulk action field visibility
    document.getElementById('bulk-action').addEventListener('change', function() {
        const action = this.value;
        document.getElementById('bulk-assign-field').style.display = action === 'assign' ? 'block' : 'none';
        document.getElementById('bulk-status-field').style.display = action === 'change-status' ? 'block' : 'none';
        document.getElementById('bulk-priority-field').style.display = action === 'change-priority' ? 'block' : 'none';
    });
}

// API functions
async function loadTickets() {
    try {
        showLoading();
        console.log('Loading tickets from:', API_BASE);
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        allTickets = await response.json();
        console.log('Loaded tickets:', allTickets.length);
        
        // Debug ticket data
        if (allTickets.length > 0) {
            console.log('Sample ticket:', allTickets[0]);
            console.log('All statuses:', [...new Set(allTickets.map(t => t.ticketStatus))]);
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
    
    console.log('🔍 DEBUG: All tickets statuses:', allTickets.map(t => t.ticketStatus));
    console.log('🔍 DEBUG: Current filters:', currentFilters.status);
    
    // Apply status filter - only if statuses are selected
    if (currentFilters.status.length > 0) {
        filteredTickets = filteredTickets.filter(ticket => {
            if (!ticket.ticketStatus) return false;
            
            // Normalize both ticket status and filter status for comparison
            const ticketStatus = normalizeStatus(ticket.ticketStatus);
            const filterStatuses = currentFilters.status.map(normalizeStatus);
            
            const matches = filterStatuses.includes(ticketStatus);
            console.log(`🔍 DEBUG: Ticket ${ticket.ticketId} status "${ticket.ticketStatus}" (normalized: "${ticketStatus}") matches filter: ${matches}`);
            
            return matches;
        });
    }
    
    console.log('🔍 DEBUG: Filtered tickets count:', filteredTickets.length);
    
    // Apply search filter
    if (currentFilters.search) {
        const query = currentFilters.search.toLowerCase();
        filteredTickets = filteredTickets.filter(ticket =>
            (ticket.subject && ticket.subject.toLowerCase().includes(query)) ||
            (ticket.fullName && ticket.fullName.toLowerCase().includes(query)) ||
            (ticket.intent && ticket.intent.toLowerCase().includes(query)) ||
            (ticket.assignedPerson && ticket.assignedPerson.toLowerCase().includes(query)) ||
            (ticket.priority && ticket.priority.toLowerCase().includes(query))
        );
    }
    
    // Apply sorting
    filteredTickets = sortTickets(filteredTickets, currentFilters.sort);
    
    // Update pagination
    totalItems = filteredTickets.length;
    totalPages = Math.ceil(totalItems / pageSize);
    currentPage = Math.min(currentPage, totalPages || 1);
    
    // Get current page data
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageTickets = filteredTickets.slice(startIndex, endIndex);
    
    displayTickets(pageTickets);
    updatePagination();
    updateStats(allTickets); // Use ALL tickets for accurate sidebar counts
}

// Helper function to normalize status values
function normalizeStatus(status) {
    if (!status) return '';
    
    return status.toUpperCase()
        .replace(/_/g, '')      // Remove underscores
        .replace(/\s/g, '')     // Remove spaces
        .trim();
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
            </td>
            <td class="status-column">
                <span class="status-badge status-${status.toLowerCase()}">
                    ${status}
                </span>
            </td>
            <td class="priority-column">
                <span class="priority-badge priority-${priority.toLowerCase()}">
                    ${priority}
                </span>
            </td>
            <td class="assignee-column">${escapeHtml(ticket.assignedPerson || 'Unassigned')}</td>
            <td class="date-column">${formatDate(ticket.requestedTime)}</td>
            <td class="actions-column">
                <button class="btn btn-small btn-secondary" onclick="editTicket(${ticket.ticketId})">
                    Edit
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteTicket(${ticket.ticketId})">
                    Delete
                </button>
                <button class="btn btn-small" onclick="viewTicket(${ticket.ticketId})" style="background: #e9ecef;">
                    View
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Pagination implementation
function updatePagination() {
    const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, totalItems);
    
    document.getElementById('page-start').textContent = pageStart;
    document.getElementById('page-end').textContent = pageEnd;
    document.getElementById('total-items').textContent = totalItems;
    
    // Update button states
    document.getElementById('first-page').disabled = currentPage === 1;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    document.getElementById('last-page').disabled = currentPage === totalPages;
    
    // Generate page numbers
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

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); i++) {
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
    } else {
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

// Filter implementation
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

// Search implementation
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

// Selection implementation
function toggleSelection(ticketId) {
    if (selectedTickets.has(ticketId)) {
        selectedTickets.delete(ticketId);
    } else {
        selectedTickets.add(ticketId);
    }
    updateSelectionCount();
    updateSelectAllCheckbox();
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all');
    const allCheckboxes = document.querySelectorAll('#table-body input[type="checkbox"]');
    const checkedCount = document.querySelectorAll('#table-body input[type="checkbox"]:checked').length;
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = checkedCount > 0 && checkedCount === allCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
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

function updateSelectionCount() {
    const selectedCount = document.getElementById('selected-count');
    if (selectedCount) {
        selectedCount.textContent = selectedTickets.size;
    }
}

function toggleSelectAll(checkbox) {
    if (checkbox.checked) {
        selectAll();
    } else {
        clearSelection();
    }
}

// MODAL-BASED ACTIONS

// Edit Ticket Modal
function editTicket(ticketId) {
    console.log('Edit ticket clicked:', ticketId);
    const ticket = allTickets.find(t => t.ticketId === ticketId);
    if (!ticket) {
        console.error('Ticket not found:', ticketId);
        return;
    }
    
    currentTicketId = ticketId;
    document.getElementById('edit-ticketId').value = ticketId;
    document.getElementById('edit-subject').value = ticket.subject || '';
    document.getElementById('edit-status').value = ticket.ticketStatus || 'OPEN';
    document.getElementById('edit-priority').value = ticket.priority || 'MEDIUM';
    document.getElementById('edit-assignedPerson').value = ticket.assignedPerson || '';
    document.getElementById('edit-intent').value = ticket.intent || '';
    
    openEditModal();
}

function openEditModal() {
    document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editForm').reset();
    currentTicketId = null;
}

async function saveTicketEdit() {
    const subject = document.getElementById('edit-subject').value;
    const status = document.getElementById('edit-status').value;
    const priority = document.getElementById('edit-priority').value;
    const assignedPerson = document.getElementById('edit-assignedPerson').value;
    const intent = document.getElementById('edit-intent').value;

    if (!subject) {
        showNotification('Error', 'Please fill in all required fields.', 'error');
        return;
    }

    try {
        const ticket = allTickets.find(t => t.ticketId === currentTicketId);
        if (!ticket) return;

        const response = await fetch(`${API_BASE}/${currentTicketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ...ticket, 
                subject: subject,
                ticketStatus: status,
                priority: priority,
                assignedPerson: assignedPerson,
                intent: intent
            })
        });

        if (response.ok) {
            closeEditModal();
            loadTickets();
            showNotification('Success', 'Ticket updated successfully!', 'success');
        } else {
            showNotification('Error', 'Failed to update ticket', 'error');
        }
    } catch (error) {
        showNotification('Error', 'Error updating ticket: ' + error.message, 'error');
    }
}

// View Ticket Modal
function viewTicket(ticketId) {
    console.log('View ticket clicked:', ticketId);
    const ticket = allTickets.find(t => t.ticketId === ticketId);
    if (!ticket) return;

    document.getElementById('view-id').textContent = `#${ticket.ticketId}`;
    document.getElementById('view-subject').textContent = ticket.subject || 'No subject';
    document.getElementById('view-requester').textContent = ticket.fullName || 'Unknown';
    document.getElementById('view-status').innerHTML = `<span class="status-badge status-${(ticket.ticketStatus || 'OPEN').toLowerCase()}">${ticket.ticketStatus || 'OPEN'}</span>`;
    document.getElementById('view-priority').innerHTML = `<span class="priority-badge priority-${(ticket.priority || 'MEDIUM').toLowerCase()}">${ticket.priority || 'MEDIUM'}</span>`;
    document.getElementById('view-assigned').textContent = ticket.assignedPerson || 'Not assigned';
    document.getElementById('view-created').textContent = formatDateTime(ticket.requestedTime);
    document.getElementById('view-description').textContent = ticket.intent || 'No description provided';

    openViewModal();
}

function openViewModal() {
    document.getElementById('viewModal').style.display = 'block';
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

// Bulk Actions Modal
function bulkAction() {
    if (selectedTickets.size === 0) {
        showNotification('Error', 'Please select tickets first', 'error');
        return;
    }
    
    document.getElementById('bulk-count').textContent = selectedTickets.size;
    document.getElementById('bulk-action').value = '';
    document.getElementById('bulk-assignee').value = '';
    document.getElementById('bulk-status').value = 'OPEN';
    document.getElementById('bulk-priority').value = 'MEDIUM';
    document.getElementById('bulk-assign-field').style.display = 'none';
    document.getElementById('bulk-status-field').style.display = 'none';
    document.getElementById('bulk-priority-field').style.display = 'none';
    
    openBulkModal();
}

function openBulkModal() {
    document.getElementById('bulkModal').style.display = 'block';
}

function closeBulkModal() {
    document.getElementById('bulkModal').style.display = 'none';
}

async function executeBulkAction() {
    const action = document.getElementById('bulk-action').value;
    
    if (!action) {
        showNotification('Error', 'Please select an action', 'error');
        return;
    }

    if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${selectedTickets.size} tickets? This action cannot be undone.`)) {
            return;
        }
    }

    try {
        showLoading();
        
        switch (action) {
            case 'assign':
                const assignee = document.getElementById('bulk-assignee').value;
                if (!assignee) {
                    showNotification('Error', 'Please enter an assignee name', 'error');
                    return;
                }
                await bulkAssign(assignee);
                break;
                
            case 'change-status':
                const status = document.getElementById('bulk-status').value;
                await bulkChangeStatus(status);
                break;
                
            case 'change-priority':
                const priority = document.getElementById('bulk-priority').value;
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
        loadTickets();
        showNotification('Success', `Action completed successfully for ${selectedTickets.size} tickets`, 'success');
        
    } catch (error) {
        showNotification('Error', 'Bulk action failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function bulkDelete() {
    const deletePromises = Array.from(selectedTickets).map(ticketId => 
        fetch(`${API_BASE}/${ticketId}`, {
            method: 'DELETE'
        })
    );
    
    const results = await Promise.allSettled(deletePromises);
    const allSuccessful = results.every(result => result.status === 'fulfilled' && result.value.ok);
    
    if (!allSuccessful) {
        throw new Error('Some tickets could not be deleted');
    }
    
    clearSelection();
}

// Delete Confirmation Modal
function deleteTicket(ticketId) {
    console.log('Delete ticket clicked:', ticketId);
    currentTicketId = ticketId;
    openDeleteModal();
}

function openDeleteModal() {
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentTicketId = null;
}

async function confirmDelete() {
    if (!currentTicketId) return;

    try {
        const response = await fetch(`${API_BASE}/${currentTicketId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeDeleteModal();
            loadTickets();
            showNotification('Success', 'Ticket deleted successfully', 'success');
        } else {
            showNotification('Error', 'Error deleting ticket', 'error');
        }
    } catch (error) {
        showNotification('Error', 'Error deleting ticket: ' + error.message, 'error');
    }
}

// Bulk action implementations
async function bulkAssign(assignee) {
    const updates = Array.from(selectedTickets).map(ticketId => 
        fetch(`${API_BASE}/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignedPerson: assignee })
        })
    );
    
    await Promise.all(updates);
    clearSelection();
}

async function bulkClose() {
    const updates = Array.from(selectedTickets).map(ticketId => 
        fetch(`${API_BASE}/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketStatus: 'CLOSED' })
        })
    );
    
    await Promise.all(updates);
    clearSelection();
}

async function bulkChangeStatus(status) {
    const updates = Array.from(selectedTickets).map(ticketId => 
        fetch(`${API_BASE}/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketStatus: status })
        })
    );
    
    await Promise.all(updates);
    clearSelection();
}

async function bulkChangePriority(priority) {
    const updates = Array.from(selectedTickets).map(ticketId => 
        fetch(`${API_BASE}/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority: priority })
        })
    );
    
    await Promise.all(updates);
    clearSelection();
}

// Stats implementation - FIXED
function updateStats(tickets) {
    console.log('📊 DEBUG: Updating stats with tickets:', tickets.length);
    
    const total = tickets.length;
    
    // Count by status - handle different case variations
    const statusCounts = {
        'OPEN': 0,
        'IN_PROGRESS': 0,
        'RESOLVED': 0,
        'CLOSED': 0
    };

    tickets.forEach(ticket => {
        const status = ticket.ticketStatus;
        console.log(`📊 DEBUG: Ticket ${ticket.ticketId} has status: "${status}"`);
        
        if (status) {
            const normalizedStatus = normalizeStatus(status);
            if (normalizedStatus === 'OPEN') statusCounts.OPEN++;
            else if (normalizedStatus === 'INPROGRESS') statusCounts.IN_PROGRESS++;
            else if (normalizedStatus === 'RESOLVED') statusCounts.RESOLVED++;
            else if (normalizedStatus === 'CLOSED') statusCounts.CLOSED++;
        }
    });

    console.log('📊 DEBUG: Final status counts:', statusCounts);
    
    // Update main stats
    const statTotal = document.getElementById('stat-total');
    const statOpen = document.getElementById('stat-open');
    
    if (statTotal) statTotal.textContent = total;
    if (statOpen) statOpen.textContent = statusCounts.OPEN;
    
    // Update filter counts
    document.getElementById('count-OPEN').textContent = statusCounts.OPEN;
    document.getElementById('count-IN_PROGRESS').textContent = statusCounts.IN_PROGRESS;
    document.getElementById('count-RESOLVED').textContent = statusCounts.RESOLVED;
    document.getElementById('count-CLOSED').textContent = statusCounts.CLOSED;
}

// UI state functions
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

// Notification Modal
function showNotification(title, message, type = 'info') {
    const header = document.getElementById('notification-header');
    const titleEl = document.getElementById('notification-title');
    const messageEl = document.getElementById('notification-message');
    
    if (!header || !titleEl || !messageEl) return;
    
    // Set colors based on type
    if (type === 'error') {
        header.style.background = '#dc3545';
    } else if (type === 'success') {
        header.style.background = '#28a745';
    } else {
        header.style.background = '#0041d8';
    }
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    document.getElementById('notificationModal').style.display = 'block';
}

function closeNotificationModal() {
    document.getElementById('notificationModal').style.display = 'none';
}

// Utility functions
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

// Global functions for HTML
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
            if (modalId === 'editModal') closeEditModal();
            if (modalId === 'viewModal') closeViewModal();
            if (modalId === 'bulkModal') closeBulkModal();
            if (modalId === 'deleteModal') closeDeleteModal();
            if (modalId === 'notificationModal') closeNotificationModal();
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

console.log('Ticket management system initialized');