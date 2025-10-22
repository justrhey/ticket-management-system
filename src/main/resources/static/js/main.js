// Service instances
const networkService = new NetworkService();
const audioService = new AudioService();
const ticketService = new TicketService();
const modalManager = new ModalManager();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ENHANCED TICKET SYSTEM INITIALIZATION ===');
    console.log('DOM loaded - initializing table manager...');
    
    // Initialize enhanced network info first
    networkService.initializeEnhancedNetworkInfo().then(() => {
        console.log('Network info initialized:', networkService.getNetworkInfo());
        
        // Update network info display
        networkService.updateNetworkInfoLabel();
        
        // Then load tickets and setup the rest
        ticketService.loadTickets();
        initializeEventListeners();
        initializeAutoRefresh();
        initializeUserManagement();

        // Test sound files after a short delay
        setTimeout(() => {
            console.log('Testing sound file accessibility...');
            audioService.testSoundFiles();
        }, 1000);
        
        // Enable audio on ANY user interaction
        const enableOnInteraction = () => {
            console.log('User interaction detected - enabling audio');
            audioService.enableAudio();
            
            // Remove listeners after first successful interaction
            document.removeEventListener('click', enableOnInteraction);
            document.removeEventListener('keydown', enableOnInteraction);
            document.removeEventListener('touchstart', enableOnInteraction);
        };
        
        document.addEventListener('click', enableOnInteraction);
        document.addEventListener('keydown', enableOnInteraction);
        document.addEventListener('touchstart', enableOnInteraction);
        
        console.log('Enhanced ticket system ready - click anywhere to enable sounds');
    });
});


// Modal Management Functions
window.editTicket = (id) => modalManager.editTicket(id);
window.deleteTicket = (id) => modalManager.deleteTicket(id);
window.viewTicket = (id) => modalManager.viewTicket(id);
window.saveTicketEdit = () => modalManager.saveTicketEdit();
window.closeEditModal = () => modalManager.closeEditModal();
window.closeViewModal = () => modalManager.closeViewModal();
window.closeBulkModal = () => bulkActionManager.closeBulkModal();
window.closeDeleteModal = () => modalManager.closeDeleteModal();
window.closeNotificationModal = () => closeNotificationModal();
window.confirmDelete = () => modalManager.confirmDelete();

// Bulk Action Functions
window.bulkAction = () => bulkActionManager.bulkAction();
window.executeBulkAction = () => bulkActionManager.executeBulkAction();

// Selection Management Functions
window.toggleSelection = (ticketId) => selectionManager.toggleSelection(ticketId);
window.toggleSelectAll = (checkbox) => selectionManager.toggleSelectAll(checkbox);
window.selectAll = () => selectionManager.selectAll();
window.clearSelection = () => selectionManager.clearSelection();

// Filter and Search Functions
window.updateFilters = () => filterManager.updateFilters();
window.updateSorting = () => filterManager.updateSorting();
window.debouncedSearch = () => filterManager.debouncedSearch();
window.changePageSize = () => filterManager.changePageSize();
window.clearFilters = () => filterManager.clearFilters();

// Pagination Functions
window.goToPage = (page) => ticketService.goToPage(page);
window.previousPage = () => ticketService.previousPage();
window.nextPage = () => ticketService.nextPage();

// Refresh and Utility Functions
window.refreshTable = () => ticketService.refreshTable();

// Sound System Functions
window.playNotificationSound = (type, isTest) => audioService.playNotificationSound(type, isTest);
window.enableAudio = () => audioService.enableAudio();
window.testSoundFiles = () => audioService.testSoundFiles();

// Enhanced Network Functions
window.getNetworkInfo = () => networkService.getNetworkInfo();
window.createTicketWithNetworkInfo = (data) => networkService.createTicketWithNetworkInfo(data);
window.updateNetworkInfoLabel = () => networkService.updateNetworkInfoLabel();
