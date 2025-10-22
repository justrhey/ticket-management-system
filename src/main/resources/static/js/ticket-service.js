class TicketService {
    constructor() {
        this.apiBase = API_BASE;
    }

    async loadTickets() {
        try {
            showLoading();
            console.log('Loading tickets from: ' + this.apiBase);
            
            const response = await fetch(this.apiBase);
            if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            
            state.allTickets = await response.json();
            console.log('Loaded tickets: ' + state.allTickets.length);
            
            if (state.allTickets.length > 0) {
                state.lastTicketCount = state.allTickets.length;
            }
            
            this.applyFiltersAndSort();
            hideLoading();
        } catch (error) {
            console.error('Error loading tickets: ' + error);
            showNotification('Error', 'Failed to load tickets: ' + error.message, 'error');
            hideLoading();
        }
    }

    applyFiltersAndSort() {
        let filteredTickets = [...state.allTickets];
        
        if (state.currentFilters.status.length > 0) {
            filteredTickets = filteredTickets.filter(ticket => {
                if (!ticket.ticketStatus) return false;
                const ticketStatus = this.normalizeStatus(ticket.ticketStatus);
                const filterStatuses = state.currentFilters.status.map(this.normalizeStatus);
                return filterStatuses.includes(ticketStatus);
            });
        }
        
        if (state.currentFilters.search) {
            const query = state.currentFilters.search.toLowerCase();
            filteredTickets = filteredTickets.filter(ticket =>
                (ticket.subject && ticket.subject.toLowerCase().includes(query)) ||
                (ticket.fullName && ticket.fullName.toLowerCase().includes(query)) ||
                (ticket.intent && ticket.intent.toLowerCase().includes(query)) ||
                (ticket.assignedPerson && ticket.assignedPerson.toLowerCase().includes(query)) ||
                (ticket.userName && ticket.userName.toLowerCase().includes(query)) ||
                (ticket.computerName && ticket.computerName.toLowerCase().includes(query)) ||
                (ticket.privateIpAddress && ticket.privateIpAddress.toLowerCase().includes(query))
            );
        }
        
        filteredTickets = this.sortTickets(filteredTickets, state.currentFilters.sort);
        
        state.totalItems = filteredTickets.length;
        state.totalPages = Math.ceil(state.totalItems / CONFIG.PAGE_SIZE);
        state.currentPage = Math.min(state.currentPage, state.totalPages || 1);
        
        const startIndex = (state.currentPage - 1) * CONFIG.PAGE_SIZE;
        const endIndex = startIndex + CONFIG.PAGE_SIZE;
        const pageTickets = filteredTickets.slice(startIndex, endIndex);
        
        this.displayTickets(pageTickets);
        this.updatePagination();
        this.updateStats(state.allTickets);
    }

    normalizeStatus(status) {
        if (!status) return '';
        return status.toUpperCase().replace(/_/g, '').replace(/\s/g, '').trim();
    }

    sortTickets(tickets, sortOption) {
        const sorted = [...tickets];
        
        switch (sortOption) {
            case 'createdAt,desc':
                return sorted.sort((a, b) => new Date(b.requestedTime) - new Date(a.requestedTime));
            case 'createdAt,asc':
                return sorted.sort((a, b) => new Date(a.requestedTime) - new Date(b.requestedTime));
            case 'title,asc':
                return sorted.sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));
            case 'priority,desc':
                return sorted.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
            case 'priority,asc':
                return sorted.sort((a, b) => this.getPriorityValue(a.priority) - this.getPriorityValue(b.priority));
            default:
                return sorted;
        }
    }

    getPriorityValue(priority) {
        const priorityValues = {
            'LOW': 1,
            'MEDIUM': 2,
            'HIGH': 3,
            'URGENT': 4
        };
        return priorityValues[priority] || 0;
    }

    displayTickets(tickets) {
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
            const isSelected = state.selectedTickets.has(ticket.ticketId);
            
            const networkInfo = [
                `Public IP: ${escapeHtml(ticket.clientIpAddress || 'Unknown')}`,
                `Private IP: ${escapeHtml(ticket.privateIpAddress || 'Unknown')}`,
                `Computer: ${escapeHtml(ticket.computerName || 'Unknown')}`,
                `User: ${escapeHtml(ticket.userName || ticket.fullName || 'Unknown')}`,
                `Assign: ${escapeHtml(ticket.assignedPerson || 'Unassigned')}`
            ].filter(info => !info.includes('Unknown')).join(' | ');
            
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
                    <div class="ticket-network-info">${networkInfo}</div>
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

    updatePagination() {
        const pageStart = state.totalItems === 0 ? 0 : (state.currentPage - 1) * CONFIG.PAGE_SIZE + 1;
        const pageEnd = Math.min(state.currentPage * CONFIG.PAGE_SIZE, state.totalItems);
        
        const pageStartEl = document.getElementById('page-start');
        const pageEndEl = document.getElementById('page-end');
        const totalItemsEl = document.getElementById('total-items');
        
        if (pageStartEl) pageStartEl.textContent = pageStart;
        if (pageEndEl) pageEndEl.textContent = pageEnd;
        if (totalItemsEl) totalItemsEl.textContent = state.totalItems;
        
        const firstPageBtn = document.getElementById('first-page');
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        const lastPageBtn = document.getElementById('last-page');
        
        if (firstPageBtn) firstPageBtn.disabled = state.currentPage === 1;
        if (prevPageBtn) prevPageBtn.disabled = state.currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = state.currentPage === state.totalPages;
        if (lastPageBtn) lastPageBtn.disabled = state.currentPage === state.totalPages;
        
        this.renderPageNumbers();
    }

    renderPageNumbers() {
        const container = document.getElementById('page-numbers');
        if (!container) return;
        
        const pages = this.generatePageNumbers();
        container.innerHTML = pages.map(page => `
            <button class="page-number ${page === state.currentPage ? 'active' : ''}" 
                    onclick="goToPage(${page})"
                    ${page === '...' ? 'disabled' : ''}>
                ${page}
            </button>
        `).join('');
    }

    generatePageNumbers() {
        if (state.totalPages <= 1) return [1];
        
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, state.currentPage - delta); i <= Math.min(state.totalPages - 1, state.currentPage + delta); i++) {
            range.push(i);
        }

        if (state.currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (state.currentPage + delta < state.totalPages - 1) {
            rangeWithDots.push('...', state.totalPages);
        } else if (state.totalPages > 1) {
            rangeWithDots.push(state.totalPages);
        }

        return rangeWithDots;
    }

    updateStats(tickets) {
        const total = tickets.length;
        const statusCounts = { 'OPEN': 0, 'IN_PROGRESS': 0, 'RESOLVED': 0, 'CLOSED': 0 };

        tickets.forEach(ticket => {
            const status = ticket.ticketStatus;
            if (status) {
                const normalizedStatus = this.normalizeStatus(status);
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
}