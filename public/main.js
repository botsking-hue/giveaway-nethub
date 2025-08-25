// DOM Elements
const giveawaysContainer = document.getElementById('giveaways-container');
const winnersContainer = document.getElementById('winners-container');
const entryModal = document.getElementById('entry-modal');
const entryForm = document.getElementById('entry-form');
const closeModal = document.querySelector('.close');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const faqItems = document.querySelectorAll('.faq-item');

// Get Firebase modules from global scope
const { 
  collection, addDoc, getDocs, query, orderBy, where, limit, 
  serverTimestamp, Timestamp 
} = window.firebaseModules;
const db = window.db;

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

// Load Giveaways with Firebase
async function loadGiveaways() {
  try {
    const q = query(
      collection(db, 'giveaways'),
      where('status', 'in', ['active', 'upcoming']),
      orderBy('endDate', 'asc')
    );
    
    const snapshot = await getDocs(q);
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
      <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1770&q=80" 
           alt="${giveaway.title}" class="giveaway-image">
      <div class="giveaway-content">
        <h3 class="giveaway-title">${giveaway.title}</h3>
        <p class="giveaway-prize">Prize: ${giveaway.prize}</p>
        <div class="giveaway-meta">
          <span>Ends: ${formatDate(giveaway.endDate?.toDate ? giveaway.endDate.toDate() : new Date(giveaway.endDate))}</span>
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

// Load Winners with Firebase
async function loadWinners() {
  try {
    const q = query(
      collection(db, 'winners'),
      orderBy('drawnAt', 'desc'),
      limit(6)
    );
    
    const snapshot = await getDocs(q);
    const winners = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Check if winners array exists and has items
      if (data.winners && data.winners.length > 0) {
        data.winners.forEach(winner => {
          winners.push({
            ...winner,
            giveawayTitle: data.giveawayTitle || "Unknown Giveaway",
            endDate: data.drawnAt
          });
        });
      }
    });
    
    const recentWinners = winners.slice(0, 6);
    displayWinners(recentWinners);
  } catch (error) {
    console.error('Error loading winners:', error);
    winnersContainer.innerHTML = `
      <div class="error-message">
        <p>Failed to load winners. Please try again later.</p>
      </div>
    `;
  }
}

// Display Winners
function displayWinners(winners) {
  if (!winners || winners.length === 0) {
    winnersContainer.innerHTML = `
      <div class="no-winners">
        <p>No winners announced yet. Check back after our giveaways end!</p>
      </div>
    `;
    return;
  }

  winnersContainer.innerHTML = winners.map(winner => `
    <div class="winner-card">
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(winner.username)}&background=4361ee&color=fff"
           alt="${winner.username}" class="winner-avatar">
      <h3 class="winner-name">${winner.username}</h3>
      <p class="winner-date">Won on ${formatDate(winner.endDate?.toDate ? winner.endDate.toDate() : new Date(winner.endDate))}</p>
    </div>
  `).join('');
}

// Open Entry Modal
function openEntryModal(giveawayId) {
  document.getElementById('giveaway-id').value = giveawayId;
  entryForm.reset();
  entryModal.style.display = 'block';
}

// Handle Entry Submission with Firebase
async function handleEntrySubmit(e) {
  e.preventDefault();

  const submitBtn = entryForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  const entryData = {
    giveawayId: document.getElementById('giveaway-id').value,
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    username: document.getElementById('username').value,
    createdAt: serverTimestamp()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    await addDoc(collection(db, 'entries'), entryData);
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
function formatDate(date) {
  if (!date) return 'Date not available';
  
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
                              }
