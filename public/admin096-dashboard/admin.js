// API Endpoints
const API_BASE = '/.netlify/functions';
const GIVEAWAYS_API = `${API_BASE}/getGiveaways`;
const CREATE_GIVEAWAY_API = `${API_BASE}/createGiveaway`;
const ENTRIES_API = `${API_BASE}/getEntries`;
const WINNERS_API = `${API_BASE}/pickWinners`;

// Global State
let currentGiveaways = [];
let currentEntries = [];
let currentWinners = [];

// DOM Elements
const sections = {
    dashboard: document.getElementById('dashboard-section'),
    giveaways: document.getElementById('giveaways-section'),
    entries: document.getElementById('entries-section'),
    winners: document.getElementById('winners-section'),
    settings: document.getElementById('settings-section')
};

const navItems = document.querySelectorAll('.nav-item');
const sectionTitle = document.getElementById('section-title');
const giveawayModal = document.getElementById('giveaway-modal');
const giveawayForm = document.getElementById('giveaway-form');

// Initialize the admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
    setupEventListeners();
    loadDashboardData();
});

function initializeAdminPanel() {
    // Check if user is logged in (simple session check)
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn && !window.location.pathname.includes('login')) {
        window.location.href = '/admin-login.html';
        return;
    }

    // Load initial data
    loadGiveaways();
    loadEntries();
}

function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        if (item.id !== 'logout-btn') {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-section');
                showSection(section);
            });
        }
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === giveawayModal) {
            closeModal();
        }
    });

    // Giveaway form
    giveawayForm.addEventListener('submit', handleGiveawaySubmit);

    // Filters
    document.getElementById('status-filter').addEventListener('change', filterGiveaways);
    document.getElementById('search-giveaways').addEventListener('input', filterGiveaways);
    document.getElementById('giveaway-filter').addEventListener('change', filterEntries);
    document.getElementById('search-entries').addEventListener('input', filterEntries);
    document.getElementById('winner-giveaway-filter').addEventListener('change', filterWinners);

    // Mobile menu toggle
    document.querySelector('.menu-toggle').addEventListener('click', toggleMobileMenu);
}

// Section Navigation
function showSection(sectionName) {
    // Hide all sections
    Object.values(sections).forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav items
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    sections[sectionName].classList.add('active');

    // Activate corresponding nav item
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Update section title
    sectionTitle.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

    // Load section-specific data
    switch(sectionName) {
        case 'giveaways':
            loadGiveaways();
            break;
        case 'entries':
            loadEntries();
            break;
        case 'winners':
            loadWinners();
            break;
        case 'dashboard':
            loadDashboardData();
            break;
    }
}

// Modal Functions
function openGiveawayModal(giveaway = null) {
    const modalTitle = document.getElementById('modal-title');
    const giveawayId = document.getElementById('giveaway-id');
    const titleInput = document.getElementById('giveaway-title');
    const descriptionInput = document.getElementById('giveaway-description');
    const prizeInput = document.getElementById('giveaway-prize');
    const startInput = document.getElementById('giveaway-start');
    const endInput = document.getElementById('giveaway-end');
    const winnersInput = document.getElementById('giveaway-winners');
    const statusSelect = document.getElementById('giveaway-status');

    if (giveaway) {
        // Edit mode
        modalTitle.textContent = 'Edit Giveaway';
        giveawayId.value = giveaway.id;
        titleInput.value = giveaway.title;
        descriptionInput.value = giveaway.description || '';
        prizeInput.value = giveaway.prize;
        startInput.value = formatDateForInput(giveaway.startDate);
        endInput.value = formatDateForInput(giveaway.endDate);
        winnersInput.value = giveaway.numberOfWinners || 1;
        statusSelect.value = giveaway.status;
    } else {
        // Create mode
        modalTitle.textContent = 'Create New Giveaway';
        giveawayForm.reset();
        giveawayId.value = '';
        
        // Set default values
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        startInput.value = formatDateForInput(now.toISOString());
        endInput.value = formatDateForInput(tomorrow.toISOString());
        statusSelect.value = 'upcoming';
    }

    giveawayModal.style.display = 'block';
}

function closeModal() {
    giveawayModal.style.display = 'none';
    giveawayForm.reset();
}

// Data Loading Functions
async function loadDashboardData() {
    try {
        showLoading('dashboard');
        
        const [giveawaysResponse, entriesResponse] = await Promise.all([
            fetch(GIVEAWAYS_API),
            fetch(ENTRIES_API)
        ]);

        if (!giveawaysResponse.ok || !entriesResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const giveaways = await giveawaysResponse.json();
        const entries = await entriesResponse.json();

        // Update stats
        document.getElementById('total-giveaways').textContent = giveaways.length;
        document.getElementById('active-giveaways').textContent = 
            giveaways.filter(g => g.status === 'active').length;
        document.getElementById('total-entries').textContent = entries.length;
        
        // Calculate total winners from all giveaways
        const totalWinners = giveaways.reduce((total, giveaway) => {
            return total + (giveaway.winners ? giveaway.winners.length : 0);
        }, 0);
        document.getElementById('total-winners').textContent = totalWinners;

        hideLoading('dashboard');

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
        hideLoading('dashboard');
    }
}

async function loadGiveaways() {
    try {
        showLoading('giveaways');
        
        const response = await fetch(GIVEAWAYS_API);
        if (!response.ok) throw new Error('Failed to fetch giveaways');
        
        currentGiveaways = await response.json();
        displayGiveaways(currentGiveaways);
        
        // Update filters
        updateGiveawayFilters();
        
        hideLoading('giveaways');
        
    } catch (error) {
        console.error('Error loading giveaways:', error);
        showNotification('Error loading giveaways', 'error');
        hideLoading('giveaways');
    }
}

async function loadEntries() {
    try {
        showLoading('entries');
        
        const response = await fetch(ENTRIES_API);
        if (!response.ok) throw new Error('Failed to fetch entries');
        
        currentEntries = await response.json();
        displayEntries(currentEntries);
        
        // Update filters
        updateEntryFilters();
        
        hideLoading('entries');
        
    } catch (error) {
        console.error('Error loading entries:', error);
        showNotification('Error loading entries', 'error');
        hideLoading('entries');
    }
}

async function loadWinners() {
    try {
        showLoading('winners');
        
        const response = await fetch(GIVEAWAYS_API);
        if (!response.ok) throw new Error('Failed to fetch giveaways');
        
        const giveaways = await response.json();
        
        // Extract winners from all giveaways
        currentWinners = [];
        giveaways.forEach(giveaway => {
            if (giveaway.winners && giveaway.winners.length > 0) {
                giveaway.winners.forEach(winner => {
                    currentWinners.push({
                        ...winner,
                        giveawayId: giveaway.id,
                        giveawayTitle: giveaway.title,
                        endDate: giveaway.endDate
                    });
                });
            }
        });
        
        displayWinners(currentWinners);
        updateWinnerFilters();
        
        hideLoading('winners');
        
    } catch (error) {
        console.error('Error loading winners:', error);
        showNotification('Error loading winners', 'error');
        hideLoading('winners');
    }
}

// Display Functions
function displayGiveaways(giveaways) {
    const tbody = document.getElementById('giveaways-tbody');
    
    if (!giveaways || giveaways.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No giveaways found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = giveaways.map(giveaway => `
        <tr>
            <td>${escapeHtml(giveaway.title)}</td>
            <td>${escapeHtml(giveaway.prize)}</td>
            <td>${formatDate(giveaway.startDate)}</td>
            <td>${formatDate(giveaway.endDate)}</td>
            <td>${giveaway.totalEntries || 0}</td>
            <td><span class="status status-${giveaway.status}">${giveaway.status}</span></td>
            <td>
                <button class="btn btn-sm" onclick="openGiveawayModal(${JSON.stringify(giveaway).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteGiveaway('${giveaway.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
                ${giveaway.status === 'ended' && (!giveaway.winners || giveaway.winners.length === 0) ? `
                <button class="btn btn-sm btn-success" onclick="pickWinnersForGiveaway('${giveaway.id}')">
                    <i class="fas fa-trophy"></i> Pick Winners
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function displayEntries(entries) {
    const tbody = document.getElementById('entries-tbody');
    
    if (!entries || entries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No entries found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = entries.map(entry => `
        <tr>
            <td>${escapeHtml(entry.name || 'N/A')}</td>
            <td>${escapeHtml(entry.email)}</td>
            <td>${escapeHtml(entry.username || 'N/A')}</td>
            <td>${escapeHtml(getGiveawayTitle(entry.giveawayId))}</td>
            <td>${formatDate(entry.createdAt || entry.entryDate)}</td>
            <td><span class="status status-active">Valid</span></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteEntry('${entry.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function displayWinners(winners) {
    const tbody = document.getElementById('winners-tbody');
    
    if (!winners || winners.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No winners found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = winners.map(winner => `
        <tr>
            <td>${escapeHtml(winner.username || winner.name || 'N/A')}</td>
            <td>${escapeHtml(winner.email)}</td>
            <td>${escapeHtml(winner.prize || 'N/A')}</td>
            <td>${escapeHtml(winner.giveawayTitle)}</td>
            <td>${formatDate(winner.endDate)}</td>
            <td><span class="status status-contact">Contacted</span></td>
            <td>
                <button class="btn btn-sm btn-success" onclick="markPrizeSent('${winner.id}')">
                    <i class="fas fa-check"></i> Mark Sent
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter Functions
function filterGiveaways() {
    const statusFilter = document.getElementById('status-filter').value;
    const searchFilter = document.getElementById('search-giveaways').value.toLowerCase();

    const filtered = currentGiveaways.filter(giveaway => {
        const matchesStatus = statusFilter === 'all' || giveaway.status === statusFilter;
        const matchesSearch = giveaway.title.toLowerCase().includes(searchFilter) ||
                             giveaway.prize.toLowerCase().includes(searchFilter);
        return matchesStatus && matchesSearch;
    });

    displayGiveaways(filtered);
}

function filterEntries() {
    const giveawayFilter = document.getElementById('giveaway-filter').value;
    const searchFilter = document.getElementById('search-entries').value.toLowerCase();

    const filtered = currentEntries.filter(entry => {
        const matchesGiveaway = giveawayFilter === 'all' || entry.giveawayId === giveawayFilter;
        const matchesSearch = (entry.name?.toLowerCase().includes(searchFilter) || false) ||
                             (entry.email.toLowerCase().includes(searchFilter) || false) ||
                             (entry.username?.toLowerCase().includes(searchFilter) || false);
        return matchesGiveaway && matchesSearch;
    });

    displayEntries(filtered);
}

function filterWinners() {
    const giveawayFilter = document.getElementById('winner-giveaway-filter').value;
    
    const filtered = giveawayFilter === 'all' 
        ? currentWinners 
        : currentWinners.filter(winner => winner.giveawayId === giveawayFilter);

    displayWinners(filtered);
}

// Update Filter Options
function updateGiveawayFilters() {
    const statusFilter = document.getElementById('status-filter');
    // Status filter options are static, no need to update
}

function updateEntryFilters() {
    const giveawayFilter = document.getElementById('giveaway-filter');
    const winnerGiveawayFilter = document.getElementById('winner-giveaway-filter');
    const pickGiveaway = document.getElementById('pick-giveaway');

    // Get unique giveaway IDs from entries
    const giveawayIds = [...new Set(currentEntries.map(entry => entry.giveawayId))];
    
    // Clear existing options except the first one
    while (giveawayFilter.options.length > 1) giveawayFilter.remove(1);
    while (winnerGiveawayFilter.options.length > 1) winnerGiveawayFilter.remove(1);
    while (pickGiveaway.options.length > 1) pickGiveaway.remove(1);

    // Add giveaway options
    giveawayIds.forEach(id => {
        const title = getGiveawayTitle(id);
        if (title) {
            const option = new Option(title, id);
            giveawayFilter.add(option);
            winnerGiveawayFilter.add(option.cloneNode(true));
            
            // For pick winners, only include active giveaways
            const giveaway = currentGiveaways.find(g => g.id === id);
            if (giveaway && giveaway.status === 'active') {
                pickGiveaway.add(option.cloneNode(true));
            }
        }
    });
}

function updateWinnerFilters() {
    const winnerGiveawayFilter = document.getElementById('winner-giveaway-filter');
    
    // Get unique giveaway IDs from winners
    const giveawayIds = [...new Set(currentWinners.map(winner => winner.giveawayId))];
    
    // Clear existing options except the first one
    while (winnerGiveawayFilter.options.length > 1) winnerGiveawayFilter.remove(1);

    // Add giveaway options
    giveawayIds.forEach(id => {
        const title = getGiveawayTitle(id);
        if (title) {
            const option = new Option(title, id);
            winnerGiveawayFilter.add(option);
        }
    });
}

// Form Handlers
async function handleGiveawaySubmit(e) {
    e.preventDefault();
    
    const submitBtn = giveawayForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    const giveawayId = document.getElementById('giveaway-id').value;
    
    const giveawayData = {
        title: document.getElementById('giveaway-title').value,
        description: document.getElementById('giveaway-description').value,
        prize: document.getElementById('giveaway-prize').value,
        startDate: new Date(document.getElementById('giveaway-start').value).toISOString(),
        endDate: new Date(document.getElementById('giveaway-end').value).toISOString(),
        numberOfWinners: parseInt(document.getElementById('giveaway-winners').value),
        status: document.getElementById('giveaway-status').value
    };

    try {
        const response = await fetch(CREATE_GIVEAWAY_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(giveawayData)
        });

        if (response.ok) {
            showNotification('Giveaway saved successfully!', 'success');
            closeModal();
            loadGiveaways();
            loadDashboardData();
        } else {
            const error = await response.text();
            throw new Error(error || 'Failed to save giveaway');
        }
    } catch (error) {
        console.error('Error saving giveaway:', error);
        showNotification('Error saving giveaway: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Action Functions
async function pickWinners() {
    const giveawayId = document.getElementById('pick-giveaway').value;
    const winnersCount = parseInt(document.getElementById('winners-count').value) || 1;

    if (!giveawayId) {
        showNotification('Please select a giveaway', 'error');
        return;
    }

    if (confirm(`Pick ${winnersCount} winner(s) for this giveaway? This action cannot be undone.`)) {
        try {
            const response = await fetch(WINNERS_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    giveawayId: giveawayId,
                    numberOfWinners: winnersCount
                })
            });

            if (response.ok) {
                showNotification('Winners picked successfully!', 'success');
                loadGiveaways();
                loadWinners();
                loadDashboardData();
                
                // Reset form
                document.getElementById('pick-giveaway').value = '';
                document.getElementById('winners-count').value = '1';
            } else {
                const error = await response.text();
                throw new Error(error || 'Failed to pick winners');
            }
        } catch (error) {
            console.error('Error picking winners:', error);
            showNotification('Error picking winners: ' + error.message, 'error');
        }
    }
}

async function pickWinnersForGiveaway(giveawayId) {
    if (confirm('Pick winners for this giveaway? This action cannot be undone.')) {
        try {
       const response = await fetch(WINNERS_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    giveawayId: giveawayId,
                    numberOfWinners: 1
                })
            });

            if (response.ok) {
                showNotification('Winners picked successfully!', 'success');
                loadGiveaways();
                loadWinners();
                loadDashboardData();
            } else {
                const error = await response.text();
                throw new Error(error || 'Failed to pick winners');
            }
        } catch (error) {
            console.error('Error picking winners:', error);
            showNotification('Error picking winners: ' + error.message, 'error');
        }
    }
}

async function deleteGiveaway(giveawayId) {
    if (confirm('Are you sure you want to delete this giveaway? This action cannot be undone.')) {
        try {
            // In a real application, you'd have a delete endpoint
            // For now, we'll simulate deletion by filtering it out
            const updatedGiveaways = currentGiveaways.filter(g => g.id !== giveawayId);
            
            // Update local state
            currentGiveaways = updatedGiveaways;
            displayGiveaways(updatedGiveaways);
            
            showNotification('Giveaway deleted successfully!', 'success');
            loadDashboardData();
            
        } catch (error) {
            console.error('Error deleting giveaway:', error);
            showNotification('Error deleting giveaway', 'error');
        }
    }
}

async function deleteEntry(entryId) {
    if (confirm('Are you sure you want to delete this entry?')) {
        try {
            // Simulate entry deletion
            const updatedEntries = currentEntries.filter(e => e.id !== entryId);
            currentEntries = updatedEntries;
            displayEntries(updatedEntries);
            
            showNotification('Entry deleted successfully!', 'success');
            
        } catch (error) {
            console.error('Error deleting entry:', error);
            showNotification('Error deleting entry', 'error');
        }
    }
}

function markPrizeSent(winnerId) {
    // This would update the winner status in a real application
    showNotification('Prize status updated to sent!', 'success');
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}

function getGiveawayTitle(giveawayId) {
    const giveaway = currentGiveaways.find(g => g.id === giveawayId);
    return giveaway ? giveaway.title : 'Unknown Giveaway';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#4cc9f0',
        error: '#f94144',
        warning: '#f9c74f',
        info: '#4361ee'
    };
    notification.style.background = colors[type] || colors.info;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showLoading(section) {
    const sectionElement = sections[section];
    const loadingElement = sectionElement.querySelector('.loading') || document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #4361ee;"></i>
            <p style="margin-top: 15px;">Loading...</p>
        </div>
    `;
    
    if (!sectionElement.querySelector('.loading')) {
        sectionElement.appendChild(loadingElement);
    }
}

function hideLoading(section) {
    const loadingElement = sections[section].querySelector('.loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

function toggleMobileMenu() {
    document.querySelector('.sidebar').classList.toggle('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminLoggedIn');
        window.location.href = '/admin-login.html';
    }
}

function exportData() {
    // Simple export functionality
    const data = JSON.stringify({
        giveaways: currentGiveaways,
        entries: currentEntries,
        winners: currentWinners
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `giveaway-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}
// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
    
    .notification {
        animation: fadeIn 0.3s ease;
    }
    
    .loading {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
    }
`;
document.head.appendChild(style);

// Make functions globally available for HTML onclick attributes
window.openGiveawayModal = openGiveawayModal;
window.pickWinners = pickWinners;
window.pickWinnersForGiveaway = pickWinnersForGiveaway;
window.deleteGiveaway = deleteGiveaway;
window.deleteEntry = deleteEntry;
window.markPrizeSent = markPrizeSent;
window.exportData = exportData;
window.showSection = showSection;