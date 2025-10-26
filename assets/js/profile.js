// Profile page functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Additional profile-specific functionality can be added here
    // Most profile functionality is handled in auth.js
    
    // Helper function
    function getLoggedInUser() {
        const userJson = localStorage.getItem('loggedInUser');
        return userJson ? JSON.parse(userJson) : null;
    }
});
