// Authentication and user management functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a page that uses auth features
    const isAuthPage = document.querySelector('#login-form, #signup-form');
    const isMainApp = document.querySelector('.user-actions');
    const isProfilePage = document.querySelector('.profile-container');
    
    // Setup authentication state
    function checkAuthState() {
        const user = getLoggedInUser();
        
        if (user) {
            // User is logged in
            if (isMainApp) {
                // Update UI for logged-in users in main app
                document.getElementById('login-btn')?.classList.add('hidden');
                document.getElementById('signup-btn')?.classList.add('hidden');
                document.getElementById('logout-btn')?.classList.remove('hidden');
                document.getElementById('user-display')?.classList.remove('hidden');
                document.getElementById('dashboard-link')?.classList.remove('hidden');
                document.getElementById('profile-link')?.classList.remove('hidden');
                
                // Display username
                const usernameEl = document.getElementById('username');
                if (usernameEl) {
                    usernameEl.textContent = user.username;
                }
            }
            
            // Redirect from auth pages if already logged in
            if (isAuthPage) {
                window.location.href = 'index.html';
            }
            
            // Handle profile page
            if (isProfilePage) {
                loadUserProfile(user);
            }
        } else {
            // User is not logged in
            if (isMainApp) {
                // Update UI for non-logged-in users
                document.getElementById('login-btn')?.classList.remove('hidden');
                document.getElementById('signup-btn')?.classList.remove('hidden');
                document.getElementById('logout-btn')?.classList.add('hidden');
                document.getElementById('user-display')?.classList.add('hidden');
                document.getElementById('dashboard-link')?.classList.add('hidden');
                document.getElementById('profile-link')?.classList.add('hidden');
            }
            
            // Redirect from pages that require authentication
            if (isProfilePage || window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'login.html';
            }
        }
    }
    
    // Get logged in user from local storage
    function getLoggedInUser() {
        const userJson = localStorage.getItem('loggedInUser');
        return userJson ? JSON.parse(userJson) : null;
    }
    
    // Save user to local storage
    function saveUser(user) {
        const users = getUsers();
        const existingUserIndex = users.findIndex(u => u.email === user.email);
        
        if (existingUserIndex !== -1) {
            users[existingUserIndex] = user;
        } else {
            users.push(user);
        }
        
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Get all users from local storage
    function getUsers() {
        const usersJson = localStorage.getItem('users');
        return usersJson ? JSON.parse(usersJson) : [];
    }
    
    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember')?.checked || false;
            
            // Validate inputs
            if (!email || !password) {
                showError('Please enter both email and password');
                return;
            }
            
            // Check credentials
            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                // Store auth state
                localStorage.setItem('loggedInUser', JSON.stringify(user));
                
                if (rememberMe) {
                    // Set long-term cookie for 'remember me'
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }
                
                // Redirect to main app
                window.location.href = 'index.html';
            } else {
                showError('Invalid email or password');
            }
        });
    }
    
    // Signup form handler
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const termsAgreed = document.getElementById('terms').checked;
            
            // Validate inputs
            if (!username || !email || !password || !confirmPassword) {
                showError('Please fill all fields');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            if (!termsAgreed) {
                showError('You must agree to the terms and privacy policy');
                return;
            }
            
            // Check if email is already registered
            const users = getUsers();
            if (users.some(u => u.email === email)) {
                showError('Email already registered');
                return;
            }
            
            // Create new user
            const newUser = {
                id: Date.now().toString(),
                username,
                email,
                password,
                createdAt: new Date().toISOString(),
                snippets: []
            };
            
            // Save user
            saveUser(newUser);
            
            // Auto login
            localStorage.setItem('loggedInUser', JSON.stringify(newUser));
            
            // Redirect to main app
            window.location.href = 'index.html';
        });
        
        // Password strength indicator
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', updatePasswordStrength);
        }
    }
    
    // Logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Clear auth state
            localStorage.removeItem('loggedInUser');
            
            // Redirect to login
            window.location.href = 'login.html';
        });
    }
    
    // Profile management logic
    function loadUserProfile(user) {
        // Set profile data
        document.getElementById('profile-username').textContent = user.username;
        document.getElementById('display-name').value = user.username;
        document.getElementById('profile-email').value = user.email;
        
        // Set join date
        const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.querySelector('#join-date span').textContent = joinDate;
        
        // Set snippet count
        document.getElementById('snippet-count').textContent = user.snippets?.length || 0;
        
        // Avatar handling
        const userAvatar = document.getElementById('user-avatar');
        if (user.avatar) {
            userAvatar.src = user.avatar;
        }
        
        // Avatar upload
        const avatarUpload = document.getElementById('avatar-upload');
        const avatarImage = document.querySelector('.avatar-image');
        
        if (avatarImage && avatarUpload) {
            avatarImage.addEventListener('click', () => {
                avatarUpload.click();
            });
            
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        userAvatar.src = event.target.result;
                        
                        // Update user avatar
                        user.avatar = event.target.result;
                        localStorage.setItem('loggedInUser', JSON.stringify(user));
                        saveUser(user);
                        
                        showMessage('Profile picture updated successfully', 'success', 'settings-message');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }
    
    // Profile form handler
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const user = getLoggedInUser();
            if (!user) return;
            
            const displayName = document.getElementById('display-name').value;
            
            // Update user data
            user.username = displayName;
            localStorage.setItem('loggedInUser', JSON.stringify(user));
            saveUser(user);
            
            // Update UI
            document.getElementById('profile-username').textContent = displayName;
            
            showMessage('Profile updated successfully', 'success', 'settings-message');
        });
    }
    
    // Password change form handler
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const user = getLoggedInUser();
            if (!user) return;
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;
            
            // Validate inputs
            if (!currentPassword || !newPassword || !confirmNewPassword) {
                showMessage('Please fill all password fields', 'error', 'password-message');
                return;
            }
            
            if (currentPassword !== user.password) {
                showMessage('Current password is incorrect', 'error', 'password-message');
                return;
            }
            
            if (newPassword !== confirmNewPassword) {
                showMessage('New passwords do not match', 'error', 'password-message');
                return;
            }
            
            // Update password
            user.password = newPassword;
            localStorage.setItem('loggedInUser', JSON.stringify(user));
            saveUser(user);
            
            // Clear form
            passwordForm.reset();
            
            showMessage('Password updated successfully', 'success', 'password-message');
        });
    }
    
    // Delete account handler
    const deleteAccountBtn = document.getElementById('delete-account');
    const confirmDeleteBtn = document.getElementById('confirm-delete-account');
    const cancelDeleteBtn = document.getElementById('cancel-delete-account');
    const deleteModal = document.getElementById('confirm-modal');
    const closeModal = document.querySelector('#confirm-modal .close-modal');
    
    if (deleteAccountBtn && deleteModal) {
        deleteAccountBtn.addEventListener('click', () => {
            deleteModal.style.display = 'block';
        });
        
        closeModal?.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
        
        cancelDeleteBtn?.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
        
        confirmDeleteBtn?.addEventListener('click', () => {
            const user = getLoggedInUser();
            if (!user) return;
            
            const confirmPassword = document.getElementById('confirm-password-delete').value;
            
            if (confirmPassword !== user.password) {
                alert('Password is incorrect');
                return;
            }
            
            // Delete user
            const users = getUsers();
            const updatedUsers = users.filter(u => u.id !== user.id);
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            // Clear auth state
            localStorage.removeItem('loggedInUser');
            
            // Redirect to homepage
            window.location.href = 'index.html';
        });
    }
    
    // Toggle password visibility
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const passwordField = btn.previousElementSibling;
            
            // Toggle password visibility
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                btn.classList.remove('fa-eye-slash');
                btn.classList.add('fa-eye');
            } else {
                passwordField.type = 'password';
                btn.classList.remove('fa-eye');
                btn.classList.add('fa-eye-slash');
            }
        });
    });
    
    // Password strength meter
    function updatePasswordStrength() {
        const password = this.value;
        const strengthMeter = document.querySelector('.strength-meter');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthMeter || !strengthText) return;
        
        // Calculate strength
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 25;
        
        // Character variety checks
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        
        // Update UI
        strengthMeter.style.width = `${strength}%`;
        
        if (strength <= 25) {
            strengthMeter.style.backgroundColor = '#ef4444';
            strengthText.textContent = 'Weak password';
        } else if (strength <= 50) {
            strengthMeter.style.backgroundColor = '#f59e0b';
            strengthText.textContent = 'Fair password';
        } else if (strength <= 75) {
            strengthMeter.style.backgroundColor = '#3b82f6';
            strengthText.textContent = 'Good password';
        } else {
            strengthMeter.style.backgroundColor = '#22c55e';
            strengthText.textContent = 'Strong password';
        }
    }
    
    // Helper to show error message
    function showError(message) {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                errorEl.classList.add('hidden');
            }, 5000);
        }
    }
    
    // Helper to show message
    function showMessage(message, type, elementId) {
        const messageEl = document.getElementById(elementId);
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.classList.remove('hidden', 'success', 'error');
            messageEl.classList.add(type);
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                messageEl.classList.add('hidden');
            }, 5000);
        }
    }
    
    // Navigation between auth pages
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            window.location.href = 'signup.html';
        });
    }
    
    // Run auth check
    checkAuthState();
});
