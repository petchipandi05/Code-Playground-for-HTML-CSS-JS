// Snippet management functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const saveBtn = document.getElementById('save-btn');
    const saveModal = document.getElementById('save-modal');
    const closeModal = document.querySelector('.close-modal');
    const saveForm = document.getElementById('save-form');
    const snippetTitleInput = document.getElementById('snippet-title');
    const modalTitleInput = document.getElementById('modal-snippet-title');
    const htmlEditor = document.getElementById('html-code');
    const cssEditor = document.getElementById('css-code');
    const jsEditor = document.getElementById('js-code');
    
    // Check for previously editing snippet
    function checkForEditingSnippet() {
        const editingSnippetJson = localStorage.getItem('currentEditingSnippet');
        if (editingSnippetJson) {
            const snippet = JSON.parse(editingSnippetJson);
            
            // Load snippet into editors
            if (snippet.html) htmlEditor.value = snippet.html;
            if (snippet.css) cssEditor.value = snippet.css;
            if (snippet.js) jsEditor.value = snippet.js;
            
            // Set title
            snippetTitleInput.value = snippet.title || 'Untitled Snippet';
            
            // Remove from storage to prevent re-loading
            localStorage.removeItem('currentEditingSnippet');
        }
    }
    
    // Show save modal
    function showSaveModal() {
        const user = getLoggedInUser();
        if (!user) {
            // Redirect to login if not logged in
            window.location.href = 'login.html';
            return;
        }
        
        // Set title in modal from input field
        modalTitleInput.value = snippetTitleInput.value || 'Untitled Snippet';
        
        // Show modal
        saveModal.style.display = 'block';
    }
    
    // Save snippet
    function saveSnippet(data) {
        const user = getLoggedInUser();
        if (!user) return;
        
        // Get snippet data
        const snippetId = data.id || Date.now().toString();
        const snippet = {
            id: snippetId,
            title: data.title,
            description: data.description,
            tags: data.tags,
            html: htmlEditor.value,
            css: cssEditor.value,
            js: jsEditor.value,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Check if snippet exists or is new
        if (!user.snippets) {
            user.snippets = [];
        }
        
        const existingSnippetIndex = user.snippets.findIndex(s => s.id === snippetId);
        if (existingSnippetIndex !== -1) {
            // Update existing snippet
            user.snippets[existingSnippetIndex] = snippet;
        } else {
            // Add new snippet
            user.snippets.push(snippet);
        }
        
        // Update local storage
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        
        // Update user in users array
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Close modal
        saveModal.style.display = 'none';
        
        // Update title in editor
        snippetTitleInput.value = data.title;
        
        // Show success message
        alert('Snippet saved successfully!');
    }
    
    // Event Listeners
    if (saveBtn) {
        saveBtn.addEventListener('click', showSaveModal);
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            saveModal.style.display = 'none';
        });
    }
    
    if (saveForm) {
        saveForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = modalTitleInput.value;
            const description = document.getElementById('snippet-description').value;
            const tags = document.getElementById('snippet-tags').value;
            
            // Check if we're editing an existing snippet
            const editingSnippetJson = localStorage.getItem('currentEditingSnippet');
            let snippetData = {
                title,
                description,
                tags
            };
            
            if (editingSnippetJson) {
                const editingSnippet = JSON.parse(editingSnippetJson);
                snippetData.id = editingSnippet.id;
                snippetData.createdAt = editingSnippet.createdAt;
            }
            
            saveSnippet(snippetData);
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === saveModal) {
            saveModal.style.display = 'none';
        }
    });
    
    // Helper Functions
    function getLoggedInUser() {
        const userJson = localStorage.getItem('loggedInUser');
        return userJson ? JSON.parse(userJson) : null;
    }
    
    function getUsers() {
        const usersJson = localStorage.getItem('users');
        return usersJson ? JSON.parse(usersJson) : [];
    }
    
    // Check for editing snippet on load
    checkForEditingSnippet();
});
