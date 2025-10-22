// Use relative path or dynamic origin instead of hardcoded localhost
const API_BASE = '/api/tickets';

// Configuration constants
const CONFIG = {
    PAGE_SIZE: 25,
    REFRESH_INTERVAL: 5000,
    AUTO_REFRESH_ENABLED: true,
    SOUNDS: {
        'new-ticket': '/sounds/ticket-notif.mp3',
        'ticket-update': '/sounds/ticket-notif.mp3',
        'success': '/sounds/success.mp3',
        'error': '/sounds/error.mp3',
        'info': '/sounds/ticket-notif.mp3'
    }
};

// Global state
let state = {
    allTickets: [],
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    selectedTickets: new Set(),
    currentFilters: {
        status: [],
        search: '',
        sort: 'createdAt,desc'
    },
    isAutoRefreshEnabled: CONFIG.AUTO_REFRESH_ENABLED,
    refreshIntervalId: null,
    lastTicketCount: 0,
    currentTicketId: null,
    audioEnabled: false,
    audioContext: null
};

// Network info state
let clientNetworkInfo = {
    publicIpAddress: 'Unknown',
    privateIpAddress: 'Unknown',
    hostname: 'Unknown',
    username: 'Unknown',
    userAgent: 'Unknown',
    deviceId: 'Unknown'
};