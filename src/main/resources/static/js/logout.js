// logout.js - Logout functionality
async function logout() {
    try {
        console.log('Logging out...');
        
        // Show loading state
        showNotification('Logout', 'Logging out...', 'info');
        
        // Call logout endpoint
        const response = await fetch('/logout', {
            method: 'POST',
            credentials: 'include' // Important for session cookies
        });
        
        if (response.ok) {
            console.log('Logout successful');
            
            // Clear any local storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Show success message
            showNotification('Success', 'Logged out successfully', 'success');
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
            
        } else {
            throw new Error(`Logout failed: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error', 'Logout failed: ' + error.message, 'error');
        
        // Force redirect even if logout fails
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }
}

// Alternative simple logout function
function quickLogout() {
    // Clear all client-side data
    localStorage.clear();
    sessionStorage.clear();
    
    // Invalidate session and redirect
    fetch('/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .finally(() => {
        window.location.href = '/login';
    });
}

// Add logout button event listener
function initializeLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Also support old onclick attribute
    window.performLogout = logout;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeLogoutButton();
});