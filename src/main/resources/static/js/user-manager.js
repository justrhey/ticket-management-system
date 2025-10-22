// User Management System
const USERS_API = '/api/users';
let allUsers = [];
let currentEditingUserId = null;

// Initialize user management system
function initializeUserManagement() {
    loadAllUsers();
    initializeUserEventListeners();
}

// Load all users from the database
async function loadAllUsers() {
    try {
        console.log('Loading users from database...');
        const response = await fetch(USERS_API);
        if (response.ok) {
            allUsers = await response.json();
            console.log(`Loaded ${allUsers.length} users from database`);
            displayUsersTable(allUsers);
        } else {
            console.error('Failed to load users:', response.status);
            showNotification('Error', 'Failed to load users from database', 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error', 'Error loading users: ' + error.message, 'error');
    }
}

// Initialize event listeners for user management
function initializeUserEventListeners() {
    // User form submission
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveUser();
        });
    }

    // User search functionality
    const userSearchInput = document.getElementById('userSearchInput');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', debounce(function(e) {
            searchUsers(e.target.value);
        }, 300));
    }

    // Role change handler
    const roleSelect = document.getElementById('userRole');
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            toggleAdminFields(this.value);
        });
    }
}

// Open the add user modal
function openAddUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        currentEditingUserId = null;
        resetUserForm();
        modal.style.display = 'block';
        document.getElementById('userModalTitle').textContent = 'Add New User';
        document.getElementById('userSubmitBtn').textContent = 'Add User';
    }
}

// Open edit user modal
function openEditUserModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('Error', 'User not found', 'error');
        return;
    }

    const modal = document.getElementById('userModal');
    if (modal) {
        currentEditingUserId = userId;
        populateUserForm(user);
        modal.style.display = 'block';
        document.getElementById('userModalTitle').textContent = 'Edit User';
        document.getElementById('userSubmitBtn').textContent = 'Update User';
    }
}

// Close user modal
function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
        resetUserForm();
        currentEditingUserId = null;
    }
}

// Reset user form
function resetUserForm() {
    const form = document.getElementById('userForm');
    if (form) {
        form.reset();
        toggleAdminFields('USER');
    }
}

// Populate user form for editing
function populateUserForm(user) {
    document.getElementById('userFullName').value = user.fullName || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPosition').value = user.position || '';
    document.getElementById('userRole').value = user.role || 'USER';
    
    // Only show password field for new users, not when editing
    const passwordGroup = document.getElementById('userPasswordGroup');
    if (passwordGroup) {
        passwordGroup.style.display = 'none';
    }
    
    toggleAdminFields(user.role);
}

// Toggle admin-specific fields based on role
function toggleAdminFields(role) {
    const adminFields = document.getElementById('adminFields');
    if (adminFields) {
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
            adminFields.style.display = 'block';
        } else {
            adminFields.style.display = 'none';
        }
    }
}

// Save user (create or update)
async function saveUser() {
    const fullName = document.getElementById('userFullName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const position = document.getElementById('userPosition').value.trim();
    const role = document.getElementById('userRole').value;
    const password = document.getElementById('userPassword')?.value;

    // Validation
    if (!fullName || !email) {
        showNotification('Error', 'Full name and email are required', 'error');
        return;
    }

    if (!currentEditingUserId && !password) {
        showNotification('Error', 'Password is required for new users', 'error');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Error', 'Please enter a valid email address', 'error');
        return;
    }

    const userData = {
        fullName: fullName,
        email: email,
        position: position,
        role: role
    };

    // Only include password for new users or when changing password
    if (password) {
        userData.password = password;
    }

    try {
        showUserLoading(true);
        
        let response;
        if (currentEditingUserId) {
            // Update existing user
            response = await fetch(`${USERS_API}/${currentEditingUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
        } else {
            // Create new user
            response = await fetch(USERS_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
        }

        if (response.ok) {
            const savedUser = await response.json();
            showNotification('Success', 
                currentEditingUserId ? 'User updated successfully' : 'User created successfully', 
                'success'
            );
            closeUserModal();
            await loadAllUsers(); // Refresh the users list
        } else {
            const errorText = await response.text();
            showNotification('Error', `Failed to save user: ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Error', 'Error saving user: ' + error.message, 'error');
    } finally {
        showUserLoading(false);
    }
}

// Delete user with confirmation
async function deleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Are you sure you want to delete user "${user.fullName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${USERS_API}/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Success', 'User deleted successfully', 'success');
            await loadAllUsers(); // Refresh the users list
        } else {
            const errorText = await response.text();
            showNotification('Error', `Failed to delete user: ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error', 'Error deleting user: ' + error.message, 'error');
    }
}

// Search users
function searchUsers(query) {
    if (!query.trim()) {
        displayUsersTable(allUsers);
        return;
    }

    const filteredUsers = allUsers.filter(user =>
        user.fullName?.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase()) ||
        user.position?.toLowerCase().includes(query.toLowerCase()) ||
        user.role?.toLowerCase().includes(query.toLowerCase())
    );

    displayUsersTable(filteredUsers);
}

// Display users in the table
function displayUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-users-message">
                    No users found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${escapeHtml(user.fullName || 'N/A')}</td>
            <td>${escapeHtml(user.email || 'N/A')}</td>
            <td>${escapeHtml(user.position || 'N/A')}</td>
            <td>
                <span class="role-badge role-${user.role?.toLowerCase() || 'user'}">
                    ${user.role || 'USER'}
                </span>
            </td>
            <td>${formatDate(user.createdAt) || 'N/A'}</td>
            <td class="user-actions">
                <button class="btn btn-small btn-secondary" onclick="openEditUserModal(${user.id})">
                    Edit
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteUser(${user.id})" 
                        ${user.role === 'SUPER_ADMIN' ? 'disabled title="Cannot delete super admin"' : ''}>
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Show/hide user loading state
function showUserLoading(show) {
    const submitBtn = document.getElementById('userSubmitBtn');
    const loadingElement = document.getElementById('userLoading');
    
    if (submitBtn && loadingElement) {
        if (show) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="button-spinner"></div> Saving...';
            loadingElement.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = currentEditingUserId ? 'Update User' : 'Add User';
            loadingElement.classList.add('hidden');
        }
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Open user management modal (main entry point)
function openUserManagement() {
    const modal = document.getElementById('userManagementModal');
    if (modal) {
        modal.style.display = 'block';
        loadAllUsers(); // Refresh users list when opening
    }
}

// Close user management modal
function closeUserManagement() {
    const modal = document.getElementById('userManagementModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Export users to CSV
function exportUsersToCSV() {
    if (allUsers.length === 0) {
        showNotification('Info', 'No users to export', 'info');
        return;
    }

    const headers = ['Full Name', 'Email', 'Position', 'Role', 'Created At'];
    const csvData = [
        headers.join(','),
        ...allUsers.map(user => [
            `"${user.fullName || ''}"`,
            `"${user.email || ''}"`,
            `"${user.position || ''}"`,
            `"${user.role || 'USER'}"`,
            `"${formatDate(user.createdAt) || ''}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Success', 'Users exported successfully', 'success');
}

// Make functions globally available
window.openAddUserModal = openAddUserModal;
window.closeUserModal = closeUserModal;
window.openEditUserModal = openEditUserModal;
window.deleteUser = deleteUser;
window.openUserManagement = openUserManagement;
window.closeUserManagement = closeUserManagement;
window.exportUsersToCSV = exportUsersToCSV;

console.log('User management system initialized');