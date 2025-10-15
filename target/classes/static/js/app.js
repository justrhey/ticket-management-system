const API_BASE = 'http://localhost:8080/api/tickets';
let allTickets = [];
let selectedSubject = '';

// Load tickets when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTickets();
    initializeEventListeners();
});

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

    const ticketData = {
        fullName: fullName,
        subject: selectedSubject,
        intent: intent,
        priority: priority,
        assignedPerson: assignedPerson || ''
    };

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
        ticketElement.innerHTML = `
            <div>#${ticket.ticketId}</div>
            <div>${escapeHtml(ticket.subject)}</div>
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
                (ticket.assignedPerson && ticket.assignedPerson.toLowerCase().includes(query.toLowerCase()))
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
            (ticket.assignedPerson && ticket.assignedPerson.toLowerCase().includes(query.toLowerCase()))
        );
        displayTickets(filteredTickets);
    }
}

function viewTicketDetails(ticket) {
    const createdDate = ticket.requestedTime ? new Date(ticket.requestedTime).toLocaleString() : 'Unknown';
    const priority = ticket.priority || 'Not specified';
    
    alert(`Ticket Details:\n\nID: #${ticket.ticketId}\nSubject: ${ticket.subject}\nRequester: ${ticket.fullName}\nStatus: ${ticket.ticketStatus}\nPriority: ${priority}\nDescription: ${ticket.intent}\nAssigned To: ${ticket.assignedPerson || 'Not assigned'}\nCreated: ${createdDate}`);
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