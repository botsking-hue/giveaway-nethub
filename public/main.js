// Firebase configuration and initialization
const firebaseConfig = {
  // Replace with your Firebase project config
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const giveawaysContainer = document.getElementById('giveaways-container');
const winnersContainer = document.getElementById('winners-container');
const entryModal = document.getElementById('entry-modal');
const entryForm = document.getElementById('entry-form');
const closeModal = document.querySelector('.close');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const faqItems = document.querySelectorAll('.faq-item');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadGiveaways();
  loadWinners();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  closeModal.addEventListener('click', () => {
    entryModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === entryModal) {
      entryModal.style.display = 'none';
    }
  });

  entryForm.addEventListener('submit', handleEntrySubmit);

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
        navLinks.classList.remove('active');
      }
    });
  });
}

// Load Giveaways from Firebase
async function loadGiveaways() {
  try {
    const snapshot = await db.collection('giveaways')
      .where('status', 'in', ['active', 'upcoming'])
      .orderBy('endDate', 'asc')
      .get();
    
    const giveaways = [];
    snapshot.forEach(doc => {
      giveaways.push({ id: doc.id, ...doc.data() });
    });
    
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

// Display Giveaways
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
      <img src="${giveaway.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1770&q=80'}" 
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

  document.querySelectorAll('.enter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const giveawayId = e.target.getAttribute('data-id');
      openEntryModal(giveawayId);
    });
  });
}

// Load Winners from Firebase
async function loadWinners() {
  try {
    const snapshot = await db.collection('winners')
      .orderBy('winDate', 'desc')
      .limit(6)
      .get();
    
    const winners = [];
    snapshot.forEach(doc => {
      winners.push({ id: doc.id, ...doc.data() });
    });
    
    displayWinners(winners);
  } catch (error) {
    console.error('Error loading winners:', error);
    winnersContainer.innerHTML = `<div class="error-message"><p>Failed to load winners. Please try again later.</p></div>`;
  }
}

// Display Winners
function displayWinners(winners) {
  if (!winners || winners.length === 0) {
    winnersContainer.innerHTML = `<div class="no-winners"><p>No winners announced yet. Check back after our giveaways end!</p></div>`;
    return;
  }

  winnersContainer.innerHTML = winners.map(winner => `
    <div class="winner-card">
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(winner.username)}&background=4361ee&color=fff"
           alt="${winner.username}" class="winner-avatar">
      <h3 class="winner-name">${winner.username}</h3>
      <p class="winner-prize">${winner.prize || 'Awesome Prize'}</p>
      <p class="winner-date">Won on ${formatDate(winner.winDate)}</p>
    </div>
  `).join('');
}

// Open Entry Modal
function openEntryModal(giveawayId) {
  document.getElementById('giveaway-id').value = giveawayId;
  entryForm.reset();
  entryModal.style.display = 'block';
}

// Handle Entry Submission to Firebase
async function handleEntrySubmit(e) {
  e.preventDefault();

  const submitBtn = entryForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  const entryData = {
    giveawayId: document.getElementById('giveaway-id').value,
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    username: document.getElementById('username').value,
    entryDate: new Date().toISOString()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    // Add entry to Firebase
    await db.collection('entries').add(entryData);
    
    alert('Entry submitted successfully! Good luck!');
    entryModal.style.display = 'none';
    entryForm.reset();
  } catch (error) {
    console.error('Error submitting entry:', error);
    alert('Failed to submit entry. Please try again later.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Format Date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}
