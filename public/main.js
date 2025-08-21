// DOM Elements
const giveawaysContainer = document.getElementById('giveaways-container');
const winnersContainer = document.getElementById('winners-container');
const entryModal = document.getElementById('entry-modal');
const entryForm = document.getElementById('entry-form');
const closeModal = document.querySelector('.close');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const faqItems = document.querySelectorAll('.faq-item');

// API Endpoints
const API_BASE = '/.netlify/functions';
const GIVEAWAYS_API = `${API_BASE}/getGiveaways`;
const ENTRIES_API = `${API_BASE}/createEntry`;
const WINNERS_API = `${API_BASE}/getGiveaways`; // Reusing getGiveaways for winners data

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadGiveaways();
    loadWinners();
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
        entryModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === entryModal) {
            entryModal.style.display = 'none';
        }
    });
    
    // Entry form submission
    entryForm.addEventListener('submit', handleEntrySubmit);
    
    // FAQ accordion
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                navLinks.classList.remove('active');
            }
        });
    });
}

// Load giveaways from API
async function loadGiveaways() {
    try {
        const response = await fetch(GIVEAWAYS_API);
        const giveaways = await response.json();
        
        displayGiveaways(giveaways);
    } catch (error) {
        console.error('Error loading giveaways:', error);
        giveawaysContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to load giveaways. Please try again later.</p>
            </div>
        `;
    }
}

// Display giveaways in the grid
function displayGiveaways(giveaways) {
    if (!giveaways || giveaways.length === 0) {
        giveawaysContainer.innerHTML = `
            <div class="no-giveaways">
                <p>No active giveaways at the moment. Check back soon!</p>
            </div>
        `;
        return;
    }
    
    giveawaysContainer.innerHTML = giveaways.map(giveaway => `
        <div class="giveaway-card">
            <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80" 
                 alt="${giveaway.title}" class="giveaway-image">
            <div class="giveaway-content">
                <h3 class="giveaway-title">${giveaway.title}</h3>
                <p class="giveaway-prize">Prize: ${giveaway.prize}</p>
                <div class="giveaway-meta">
                    <span>Ends: ${formatDate(giveaway.endDate)}</span>
                    <span class="status status-${giveaway.status}">${giveaway.status}</span>
                </div>
                <p class="giveaway-description">${giveaway.description}</p>
                ${giveaway.status === 'active' ? 
                    `<button class="btn enter-btn" data-id="${giveaway.id}">Enter Now</button>` : 
                    `<button class="btn" disabled>${giveaway.status === 'upcoming' ? 'Coming Soon' : 'Ended'}</button>`
                }
            </div>
        </div>
    `).join('');
    
    // Add event listeners to entry buttons
    document.querySelectorAll('.enter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const giveawayId = e.target.getAttribute('data-id');
            openEntryModal(giveawayId);
        });
    });
}

// Load winners from API
async function loadWinners() {
    try {
        const response = await fetch(WINNERS_API);
        const giveaways = await response.json();
        
        // Filter giveaways that have winners
        const giveawaysWithWinners = giveaways.filter(g => g.winners && g.winners.length > 0);
        
        displayWinners(giveawaysWithWinners);
    } catch (error) {
        console.error('Error loading winners:', error);
        winnersContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to load winners. Please try again later.</p>
            </div>
        `;
    }
}

// Display winners in the grid
function displayWinners(giveaways) {
    if (!giveaways || giveaways.length === 0) {
        winnersContainer.innerHTML = `
            <div class="no-winners">
                <p>No winners announced yet. Check back after our giveaways end!</p>
            </div>
        `;
        return;
    }
    
    // Flatten winners from all giveaways
    const allWinners = [];
    giveaways.forEach(giveaway => {
        if (giveaway.winners && giveaway.winners.length > 0) {
            giveaway.winners.forEach(winner => {
                allWinners.push({
                    ...winner,
                    giveawayTitle: giveaway.title,
                    endDate: giveaway.endDate
                });
            });
        }
    });
    
    // Sort by date (newest first) and take the 6 most recent
    const recentWinners = allWinners
        .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
        .slice(0, 6);
    
    winnersContainer.innerHTML = recentWinners.map(winner => `
        <div class="winner-card">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(winner.username)}&background=4361ee&color=fff" 
                 alt="${winner.username}" class="winner-avatar">
            <h3 class="winner-name">${winner.username}</h3>
            <p class="winner-prize">${winner.prize || 'Awesome Prize'}</p>
            <p class="winner-date">Won on ${formatDate(winner.endDate)}</p>
        </div>
    `).join('');
}

// Open entry modal
function openEntryModal(giveawayId) {
    document.getElementById('giveaway-id').value = giveawayId;
    entryForm.reset();
    entryModal.style.display = 'block';
}

// Handle entry form submission
async function handleEntrySubmit(e) {
    e.preventDefault();
    
    const submitBtn = entryForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Get form data
    const entryData = {
        giveawayId: document.getElementById('giveaway-id').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        username: document.getElementById('username').value
    };
    
    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        const response = await fetch(ENTRIES_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entryData),
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Success
            alert('Entry submitted successfully! Good luck!');
            entryModal.style.display = 'none';
            entryForm.reset();
        } else {
            // Error
            alert(`Error: ${result.error || 'Failed to submit entry'}`);
        }
    } catch (error) {
        console.error('Error submitting entry:', error);
        alert('Failed to submit entry. Please try again later.');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
                                  }
