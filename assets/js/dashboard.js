// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // DOM elements
    const snippetsContainer = document.getElementById('snippets-container');
    const searchInput = document.getElementById('search-snippets');
    const searchBtn = document.getElementById('search-btn');
    const dateFilter = document.getElementById('date-filter');
    const tagsFilter = document.getElementById('tags-filter');
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const closeModal = document.querySelector('.close-modal');
    
    // Current snippet to delete
    let currentSnippetId = null;
    
    // User info
    document.getElementById('username').textContent = user.username;
    
    // Display snippets
    function loadSnippets() {
        // Get all user snippets
        const snippets = user.snippets || [];
        const noSnippets = document.querySelector('.no-snippets');
        
        // Check if user has snippets
        if (snippets.length === 0) {
            noSnippets.classList.remove('hidden');
            return;
        }
        
        noSnippets.classList.add('hidden');
        snippetsContainer.innerHTML = '';
        
        // Load all unique tags for filter
        loadTagsFilter(snippets);
        
        // Sort snippets by most recent
        const sortedSnippets = [...snippets].sort((a, b) => {
            return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        });
        
        // Render each snippet
        sortedSnippets.forEach(snippet => {
            const snippetCard = createSnippetCard(snippet);
            snippetsContainer.appendChild(snippetCard);
        });
    }
    
    // Create snippet card DOM element
    function createSnippetCard(snippet) {
        const card = document.createElement('div');
        card.className = 'snippet-card';
        card.dataset.id = snippet.id;
        
        const html = snippet.html || '';
        const css = snippet.css || '';
        const js = snippet.js || '';
        
        let previewCode = '';
        if (html) previewCode += html.substring(0, 200);
        if (css) previewCode += '\n\n' + css.substring(0, 200);
        if (js) previewCode += '\n\n' + js.substring(0, 200);
        
        // Format date
        const date = new Date(snippet.updatedAt || snippet.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Create tags HTML
        const tagsHtml = snippet.tags ? snippet.tags
            .split(',')
            .map(tag => `<span class="tag">${tag.trim()}</span>`)
            .join('') : '';
        
        card.innerHTML = `
            <div class="snippet-header">
                <h3 class="snippet-title">${snippet.title || 'Untitled Snippet'}</h3>
                <div class="snippet-actions">
                    <button class="edit-snippet" title="Edit snippet"><i class="fas fa-edit"></i></button>
                    <button class="delete-snippet" title="Delete snippet"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="snippet-preview">
                <pre class="snippet-code">${previewCode}</pre>
            </div>
            <div class="snippet-footer">
                <div class="snippet-meta">Last edited: ${date}</div>
                <div class="snippet-tags">${tagsHtml}</div>
            </div>
        `;
        
        // Add event listeners
        card.querySelector('.edit-snippet').addEventListener('click', () => {
            editSnippet(snippet);
        });
        
        card.querySelector('.delete-snippet').addEventListener('click', () => {
            showDeleteModal(snippet.id);
        });
        
        return card;
    }
    
    // Load tags filter
    function loadTagsFilter(snippets) {
        // Extract all tags
        const allTags = new Set();
        snippets.forEach(snippet => {
            if (snippet.tags) {
                snippet.tags.split(',').forEach(tag => {
                    allTags.add(tag.trim());
                });
            }
        });
        
        // Clear tags container except the 'All' tag
        const tagsContainer = document.getElementById('tags-filter');
        tagsContainer.innerHTML = '<span class="tag active">All</span>';
        
        // Add tags to filter
        allTags.forEach(tag => {
            if (tag) {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag';
                tagEl.textContent = tag;
                tagEl.addEventListener('click', () => {
                    filterByTag(tag);
                });
                tagsContainer.appendChild(tagEl);
            }
        });
        
        // Add event listener to 'All' tag
        tagsContainer.querySelector('.tag.active').addEventListener('click', () => {
            filterByTag('all');
        });
    }
    
    // Filter snippets by tag
    function filterByTag(tag) {
        // Update active tag
        const tags = document.querySelectorAll('#tags-filter .tag');
        tags.forEach(tagEl => {
            tagEl.classList.remove('active');
            if (
                (tag === 'all' && tagEl.textContent === 'All') || 
                (tagEl.textContent === tag)
            ) {
                tagEl.classList.add('active');
            }
        });
        
        // Filter snippets
        const snippetCards = document.querySelectorAll('.snippet-card');
        if (tag === 'all') {
            snippetCards.forEach(card => card.style.display = '');
            return;
        }
        
        // Show/hide snippets based on tag
        snippetCards.forEach(card => {
            const snippetId = card.dataset.id;
            const snippet = user.snippets.find(s => s.id === snippetId);
            
            if (snippet && snippet.tags && snippet.tags.split(',').map(t => t.trim()).includes(tag)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Filter by date
    function filterByDate(timeframe) {
        const snippetCards = document.querySelectorAll('.snippet-card');
        const now = new Date();
        
        snippetCards.forEach(card => {
            const snippetId = card.dataset.id;
            const snippet = user.snippets.find(s => s.id === snippetId);
            
            if (!snippet) return;
            
            const snippetDate = new Date(snippet.updatedAt || snippet.createdAt);
            let show = true;
            
            if (timeframe === 'today') {
                show = isSameDay(now, snippetDate);
            } else if (timeframe === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                show = snippetDate >= weekAgo;
            } else if (timeframe === 'month') {
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                show = snippetDate >= monthAgo;
            }
            
            card.style.display = show ? '' : 'none';
        });
    }
    
    // Check if two dates are the same day
    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    // Search snippets
    function searchSnippets(query) {
        query = query.toLowerCase();
        const snippetCards = document.querySelectorAll('.snippet-card');
        
        snippetCards.forEach(card => {
            const snippetId = card.dataset.id;
            const snippet = user.snippets.find(s => s.id === snippetId);
            
            if (!snippet) return;
            
            const title = (snippet.title || '').toLowerCase();
            const description = (snippet.description || '').toLowerCase();
            const tags = (snippet.tags || '').toLowerCase();
            const code = `${snippet.html || ''} ${snippet.css || ''} ${snippet.js || ''}`.toLowerCase();
            
            if (
                title.includes(query) || 
                description.includes(query) || 
                tags.includes(query) || 
                code.includes(query)
            ) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Edit snippet
    function editSnippet(snippet) {
        // Store snippet in local storage to load in editor
        localStorage.setItem('currentEditingSnippet', JSON.stringify(snippet));
        
        // Navigate to editor
        window.location.href = 'index.html';
    }
    
    // Show delete confirmation modal
    function showDeleteModal(snippetId) {
        currentSnippetId = snippetId;
        deleteModal.style.display = 'block';
    }
    
    // Delete snippet
    function deleteSnippet(snippetId) {
        // Find user
        const user = getLoggedInUser();
        if (!user) return;
        
        // Remove snippet
        user.snippets = user.snippets.filter(s => s.id !== snippetId);
        
        // Update storage
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        
        // Update user in users array
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Reload snippets
        loadSnippets();
    }
    
    // Event Listeners
    
    // Search
    searchBtn.addEventListener('click', () => {
        searchSnippets(searchInput.value);
    });
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchSnippets(searchInput.value);
        }
    });
    
    // Date filter
    dateFilter.addEventListener('change', () => {
        filterByDate(dateFilter.value);
    });
    
    // View toggle (grid/list)
    gridViewBtn.addEventListener('click', () => {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        snippetsContainer.classList.remove('list');
        snippetsContainer.classList.add('grid');
    });
    
    listViewBtn.addEventListener('click', () => {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        snippetsContainer.classList.remove('grid');
        snippetsContainer.classList.add('list');
    });
    
    // Delete modal
    confirmDeleteBtn.addEventListener('click', () => {
        deleteSnippet(currentSnippetId);
        deleteModal.style.display = 'none';
    });
    
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });
    
    closeModal.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    // Helper functions
    function getLoggedInUser() {
        const userJson = localStorage.getItem('loggedInUser');
        return userJson ? JSON.parse(userJson) : null;
    }
    
    function getUsers() {
        const usersJson = localStorage.getItem('users');
        return usersJson ? JSON.parse(usersJson) : [];
    }
    
    // Initialize dashboard
    loadSnippets();
});
