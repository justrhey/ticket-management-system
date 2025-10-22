class ModalManager {
    constructor() {
        this.currentTicketId = null;
    }

    // Edit Ticket Functions
    editTicket(ticketId) {
        console.log('Edit ticket clicked: ' + ticketId);
        const ticket = state.allTickets.find(t => t.ticketId === ticketId);
        if (!ticket) {
            console.error('Ticket not found: ' + ticketId);
            showNotification('Error', 'Ticket not found', 'error');
            return;
        }
        
        this.currentTicketId = ticketId;
        
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
        
        this.openEditModal();
    }

    openEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none';
        }
        const form = document.getElementById('editForm');
        if (form) {
            form.reset();
        }
        this.currentTicketId = null;
    }

    async saveTicketEdit() {
        if (!this.currentTicketId) {
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
            const ticket = state.allTickets.find(t => t.ticketId === this.currentTicketId);
            if (!ticket) {
                showNotification('Error', 'Ticket not found', 'error');
                return;
            }

            const response = await fetch(API_BASE + '/' + this.currentTicketId, {
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
                this.closeEditModal();
                await ticketService.loadTickets();
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
    viewTicket(ticketId){
        console.log('View Ticket clicked ' + ticketId);
        
        if (!ticketId) {
            console.error('No ticket ID provided to view');
            return;
        }
        
        const ticket = state.allTickets.find(t => t.ticketId === ticketId);
        console.log('Found Ticket:', ticket);
        
        if (!ticket) {
            console.error('Ticket not found: ' + ticketId);
            console.log('Available Ticket IDs:', state.allTickets.map(t => t.ticketId));
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
        const viewPrivateIp = document.getElementById('view-private-ip');
        const viewComputer = document.getElementById('view-computer');
        const viewUseragent = document.getElementById('view-useragent');
        const viewItComment = document.getElementById('view-it-comment');
        const viewUsername = document.getElementById('view-username');
        const viewDeviceId = document.getElementById('view-device-id');

        if (viewId) viewId.textContent = '#' + ticket.ticketId;
        if (viewSubject) viewSubject.textContent = ticket.subject || 'No subject';
        if (viewRequester) viewRequester.textContent = ticket.fullName || 'Unknown';
        
        if (viewStatus) {
            const status = ticket.ticketStatus || 'OPEN';
            viewStatus.innerHTML = '<span class="status-badge status-' + status.toLowerCase() + '">' + status + '</span>';
        }
        
        if (viewPriority) {
            const priority = ticket.priority || 'MEDIUM';
            viewPriority.innerHTML = '<span class="priority-badge priority-' + priority.toLowerCase() + '">' + priority + '</span>';
        }
        
        if (viewAssigned) viewAssigned.textContent = ticket.assignedPerson || 'Not assigned';
        if (viewCreated) viewCreated.textContent = formatDateTime(ticket.requestedTime);
        if (viewDescription) viewDescription.textContent = ticket.intent || 'No description provided';
        if (viewIp) viewIp.textContent = ticket.clientIpAddress || 'Unknown';
        if (viewPrivateIp) viewPrivateIp.textContent = ticket.privateIpAddress || 'Unknown';
        if (viewComputer) viewComputer.textContent = ticket.computerName || 'Unknown';
        if (viewUseragent) viewUseragent.textContent = ticket.userAgent || 'Unknown';
        if (viewUsername) viewUsername.textContent = ticket.userName || ticket.fullName || 'Unknown';
        if (viewDeviceId) viewDeviceId.textContent = ticket.deviceId || 'Unknown';

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

        this.openViewModal();
    }

    openViewModal() {
        const modal = document.getElementById('viewModal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            console.error('View modal element not found');
        }
    }

    closeViewModal() {
        const modal = document.getElementById('viewModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Delete Ticket Functions
    deleteTicket(ticketId) {
        console.log('Delete ticket clicked: ' + ticketId);
        this.currentTicketId = ticketId;
        
        const ticket = state.allTickets.find(t => t.ticketId === ticketId);
        const ticketSubject = ticket ? (ticket.subject || 'Untitled') : 'this ticket';
        
        const confirmMessage = document.getElementById('delete-confirm-message');
        if (confirmMessage) {
            confirmMessage.textContent = 'Are you sure you want to delete ticket #' + ticketId + ' - "' + ticketSubject + '"? This action cannot be undone.';
        }
        
        this.openDeleteModal();
    }

    openDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentTicketId = null;
    }

    async confirmDelete() {
        if (!this.currentTicketId) {
            showNotification('Error', 'No ticket selected for deletion', 'error');
            return;
        }

        try {
            const response = await fetch(API_BASE + '/' + this.currentTicketId, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.closeDeleteModal();
                showNotification('Success', 'Ticket deleted successfully', 'success');
                
                if (state.selectedTickets.has(this.currentTicketId)) {
                    state.selectedTickets.delete(this.currentTicketId);
                    this.updateSelectionCount();
                }
                
                await ticketService.loadTickets();
            } else {
                const errorText = await response.text();
                showNotification('Error', 'Failed to delete ticket: ' + errorText, 'error');
            }
        } catch (error) {
            showNotification('Error', 'Error deleting ticket: ' + error.message, 'error');
        }
    }
}