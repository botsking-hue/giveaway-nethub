// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyCvJqST6D_rUJhIMk7He9B2iQqsDnXTvNk",
  authDomain: "giveaway-app-69b8f.firebaseapp.com",
  projectId: "giveaway-app-69b8f",
  storageBucket: "giveaway-app-69b8f.appspot.com",
  messagingSenderId: "622768665857",
  appId: "1:622768665857:web:fda9de620a830c42031700" // Replace with your actual app ID from Firebase console
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Section switching
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    const section = item.getAttribute('data-section');
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
      sec.style.display = 'none';
    });

    const target = document.getElementById(`${section}-section`);
    if (target) {
      target.classList.add('active');
      target.style.display = 'block';
      document.getElementById('section-title').textContent = item.textContent.trim();
      
      // Load section-specific data
      if (section === 'giveaways') {
        loadGiveaways();
      } else if (section === 'winners') {
        loadWinnersList();
      } else if (section === 'entries') {
        loadEntries();
      } else if (section === 'analytics') {
        loadAnalytics();
      }
    }
  });
});

// Modal logic
function openGiveawayModal(giveawayId = null) {
  document.getElementById('giveaway-modal').style.display = 'block';
  document.getElementById('giveaway-form').reset();
  
  if (giveawayId) {
    // Editing existing giveaway
    document.getElementById('modal-title').textContent = 'Edit Giveaway';
    document.getElementById('giveaway-id').value = giveawayId;
    loadGiveawayData(giveawayId);
  } else {
    // Creating new giveaway
    document.getElementById('modal-title').textContent = 'Create New Giveaway';
    document.getElementById('giveaway-id').value = '';
  }
}

function closeModal() {
  document.getElementById('giveaway-modal').style.display = 'none';
}

window.addEventListener('click', e => {
  if (e.target === document.getElementById('giveaway-modal')) {
    closeModal();
  }
});

// Load giveaway data for editing
async function loadGiveawayData(giveawayId) {
  try {
    const doc = await db.collection('giveaways').doc(giveawayId).get();
    if (doc.exists) {
      const data = doc.data();
      document.getElementById('giveaway-title').value = data.title;
      document.getElementById('giveaway-description').value = data.description;
      document.getElementById('giveaway-prize').value = data.prize;
      
      // Format dates for input fields (YYYY-MM-DD)
      if (data.startDate && data.startDate.toDate) {
        document.getElementById('giveaway-start').value = formatDateForInput(data.startDate.toDate());
      }
      if (data.endDate && data.endDate.toDate) {
        document.getElementById('giveaway-end').value = formatDateForInput(data.endDate.toDate());
      }
      
      document.getElementById('giveaway-winners').value = data.numberOfWinners;
      document.getElementById('giveaway-status').value = data.status;
    }
  } catch (error) {
    console.error('Error loading giveaway data:', error);
    alert('Failed to load giveaway data.');
  }
}

function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

// Form submission
document.getElementById('giveaway-form').addEventListener('submit', async e => {
  e.preventDefault();

  const giveawayId = document.getElementById('giveaway-id').value;
  const giveaway = {
    title: document.getElementById('giveaway-title').value,
    description: document.getElementById('giveaway-description').value,
    prize: document.getElementById('giveaway-prize').value,
    startDate: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('giveaway-start').value)),
    endDate: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('giveaway-end').value)),
    numberOfWinners: parseInt(document.getElementById('giveaway-winners').value),
    status: document.getElementById('giveaway-status').value,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Add createdAt for new giveaways
  if (!giveawayId) {
    giveaway.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  }

  try {
    if (giveawayId) {
      // Update existing giveaway
      await db.collection('giveaways').doc(giveawayId).update(giveaway);
      alert('Giveaway updated successfully!');
    } else {
      // Create new giveaway
      await db.collection('giveaways').add(giveaway);
      alert('Giveaway created successfully!');
    }
    
    closeModal();
    loadGiveaways(); // Refresh the list
  } catch (error) {
    console.error('Error saving giveaway:', error);
    alert('Something went wrong. Please try again.');
  }
});

// Load giveaways for management
async function loadGiveaways() {
  try {
    const snapshot = await db.collection('giveaways')
      .orderBy('createdAt', 'desc')
      .get();
    
    const giveaways = [];
    snapshot.forEach(doc => {
      giveaways.push({ id: doc.id, ...doc.data() });
    });
    
    displayGiveaways(giveaways);
  } catch (error) {
    console.error('Error loading giveaways:', error);
    document.getElementById('giveaways-list').innerHTML = `
      <div class="error-message">
        <p>Failed to load giveaways. Please try again later.</p>
      </div>
    `;
  }
}

// Display giveaways in admin panel
function displayGiveaways(giveaways) {
  const giveawaysList = document.getElementById('giveaways-list');
  
  if (!giveaways || giveaways.length === 0) {
    giveawaysList.innerHTML = `
      <div class="no-giveaways">
        <p>No giveaways found. Create your first giveaway!</p>
      </div>
    `;
    return;
  }

  giveawaysList.innerHTML = giveaways.map(giveaway => `
    <div class="giveaway-item">
      <div class="giveaway-info">
        <h3>${giveaway.title}</h3>
        <p>${giveaway.description}</p>
        <div class="giveaway-meta">
          <span><strong>Prize:</strong> ${giveaway.prize}</span>
          <span><strong>Winners:</strong> ${giveaway.numberOfWinners}</span>
          <span><strong>Status:</strong> <span class="status status-${giveaway.status}">${giveaway.status}</span></span>
          <span><strong>Starts:</strong> ${formatDate(giveaway.startDate?.toDate ? giveaway.startDate.toDate() : new Date(giveaway.startDate))}</span>
          <span><strong>Ends:</strong> ${formatDate(giveaway.endDate?.toDate ? giveaway.endDate.toDate() : new Date(giveaway.endDate))}</span>
        </div>
      </div>
      <div class="giveaway-actions">
        <button class="btn btn-edit" onclick="openGiveawayModal('${giveaway.id}')">Edit</button>
        <button class="btn btn-delete" onclick="deleteGiveaway('${giveaway.id}')">Delete</button>
        ${giveaway.status === 'ended' ? 
          `<button class="btn btn-winners" onclick="selectGiveawayForWinners('${giveaway.id}')">Pick Winners</button>` : 
          `<button class="btn btn-end" onclick="endGiveaway('${giveaway.id}')">End Now</button>`
        }
      </div>
    </div>
  `).join('');
}

// Delete a giveaway
async function deleteGiveaway(giveawayId) {
  if (!confirm('Are you sure you want to delete this giveaway? This action cannot be undone.')) {
    return;
  }

  try {
    await db.collection('giveaways').doc(giveawayId).delete();
    alert('Giveaway deleted successfully!');
    loadGiveaways(); // Refresh the list
  } catch (error) {
    console.error('Error deleting giveaway:', error);
    alert('Failed to delete giveaway.');
  }
}

// End a giveaway early
async function endGiveaway(giveawayId) {
  try {
    await db.collection('giveaways').doc(giveawayId).update({
      status: 'ended',
      endDate: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('Giveaway ended successfully!');
    loadGiveaways(); // Refresh the list
  } catch (error) {
    console.error('Error ending giveaway:', error);
    alert('Failed to end giveaway.');
  }
}

// Load winners list for admin view
async function loadWinnersList() {
  try {
    const snapshot = await db.collection('winners')
      .orderBy('drawnAt', 'desc')
      .get();
    
    const winnersList = [];
    snapshot.forEach(doc => {
      winnersList.push({ id: doc.id, ...doc.data() });
    });
    
    displayWinnersList(winnersList);
  } catch (error) {
    console.error('Error loading winners:', error);
    document.getElementById('winners-list').innerHTML = `
      <div class="error-message">
        <p>Failed to load winners. Please try again later.</p>
      </div>
    `;
  }
}

// Display winners in admin panel
function displayWinnersList(winners) {
  const winnersContainer = document.getElementById('winners-list');
  
  if (!winners || winners.length === 0) {
    winnersContainer.innerHTML = `
      <div class="no-winners">
        <p>No winners have been selected yet.</p>
      </div>
    `;
    return;
  }

  winnersContainer.innerHTML = winners.map(winner => `
    <div class="winner-item">
      <h3>Giveaway: ${winner.giveawayTitle || winner.giveawayId}</h3>
      <p>Drawn on: ${formatDate(winner.drawnAt?.toDate ? winner.drawnAt.toDate() : new Date(winner.drawnAt))}</p>
      <div class="winners-container">
        ${winner.winners.map(win => `
          <div class="winner-detail">
            <p><strong>Winner:</strong> ${win.name} (${win.username})</p>
            <p><strong>Email:</strong> ${win.email}</p>
            <p><strong>Prize:</strong> ${win.prize}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Load entries for admin view
async function loadEntries() {
  try {
    const snapshot = await db.collection('entries')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const entries = [];
    snapshot.forEach(doc => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    
    displayEntries(entries);
  } catch (error) {
    console.error('Error loading entries:', error);
    document.getElementById('entries-list').innerHTML = `
      <div class="error-message">
        <p>Failed to load entries. Please try again later.</p>
      </div>
    `;
  }
}

// Display entries in admin panel
function displayEntries(entries) {
  const entriesContainer = document.getElementById('entries-list');
  
  if (!entries || entries.length === 0) {
    entriesContainer.innerHTML = `
      <div class="no-entries">
        <p>No entries found.</p>
      </div>
    `;
    return;
  }

  entriesContainer.innerHTML = `
    <div class="entries-header">
      <span>Name (Username)</span>
      <span>Email</span>
      <span>Giveaway ID</span>
      <span>Entry Date</span>
    </div>
    ${entries.map(entry => `
      <div class="entry-item">
        <span>${entry.name} (${entry.username})</span>
        <span>${entry.email}</span>
        <span class="giveaway-id">${entry.giveawayId}</span>
        <span>${formatDate(entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt))}</span>
      </div>
    `).join('')}
  `;
}

// Load analytics data
async function loadAnalytics() {
  try {
    // Get total giveaways count
    const giveawaysSnapshot = await db.collection('giveaways').get();
    const totalGiveaways = giveawaysSnapshot.size;
    
    // Get total entries count
    const entriesSnapshot = await db.collection('entries').get();
    const totalEntries = entriesSnapshot.size;
    
    // Get active giveaways count
    const activeGiveawaysSnapshot = await db.collection('giveaways')
      .where('status', '==', 'active')
      .get();
    const activeGiveaways = activeGiveawaysSnapshot.size;
    
    // Get winners count
    const winnersSnapshot = await db.collection('winners').get();
    let totalWinners = 0;
    winnersSnapshot.forEach(doc => {
      totalWinners += doc.data().winners.length;
    });
    
    // Display analytics
    document.getElementById('total-giveaways').textContent = totalGiveaways;
    document.getElementById('active-giveaways').textContent = activeGiveaways;
    document.getElementById('total-entries').textContent = totalEntries;
    document.getElementById('total-winners').textContent = totalWinners;
    
  } catch (error) {
    console.error('Error loading analytics:', error);
    document.getElementById('analytics-content').innerHTML = `
      <div class="error-message">
        <p>Failed to load analytics. Please try again later.</p>
      </div>
    `;
  }
}

// Pick winners functionality
function selectGiveawayForWinners(giveawayId) {
  document.getElementById('pick-giveaway').value = giveawayId;
  
  // Try to get the number of winners from the giveaway
  db.collection('giveaways').doc(giveawayId).get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('winners-count').value = data.numberOfWinners;
      }
    })
    .catch(error => {
      console.error('Error loading giveaway details:', error);
    });
}

// Pick winners
async function pickWinners() {
  const giveawayId = document.getElementById('pick-giveaway').value;
  const count = parseInt(document.getElementById('winners-count').value);

  if (!giveawayId || count < 1) {
    alert('Please select a giveaway and enter a valid number of winners.');
    return;
  }

  try {
    // Get the giveaway details
    const giveawayDoc = await db.collection('giveaways').doc(giveawayId).get();
    if (!giveawayDoc.exists) {
      alert('Giveaway not found.');
      return;
    }
    
    const giveaway = giveawayDoc.data();
    
    // Get all entries for this giveaway
    const entriesSnapshot = await db.collection('entries')
      .where('giveawayId', '==', giveawayId)
      .get();
    
    const entries = [];
    entriesSnapshot.forEach(doc => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    
    if (entries.length === 0) {
      alert('No entries found for this giveaway.');
      return;
    }
    
    if (entries.length < count) {
      if (!confirm(`There are only ${entries.length} entries but you want to select ${count} winners. Continue with ${entries.length} winners?`)) {
        return;
      }
    }
    
    // Random selection algorithm
    const winners = [];
    const availableEntries = [...entries];
    const actualCount = Math.min(count, entries.length);
    
    for (let i = 0; i < actualCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableEntries.length);
      winners.push(availableEntries[randomIndex]);
      availableEntries.splice(randomIndex, 1);
    }
    
    // Save winners to Firestore
    const winnerLog = {
      giveawayId,
      giveawayTitle: giveaway.title,
      winners: winners.map(winner => ({
        entryId: winner.id,
        username: winner.username,
        email: winner.email,
        name: winner.name,
        prize: giveaway.prize
      })),
      drawnAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('winners').add(winnerLog);
    
    // Update giveaway status to ended if not already
    if (giveaway.status !== 'ended') {
      await db.collection('giveaways').doc(giveawayId).update({
        status: 'ended',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    alert(`Winners selected successfully: ${winners.map(w => w.username).join(', ')}`);
    
    // Refresh the winners list
    loadWinnersList();
    
  } catch (error) {
    console.error('Error picking winners:', error);
    alert('Failed to pick winners.');
  }
}

// Export data
function exportData() {
  alert('Export functionality would be implemented here. This would typically generate a CSV or Excel file of the data.');
}

// Format Date for display
function formatDate(date) {
  if (!date) return 'Date not available';
  
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(date).toLocaleDateString(undefined, options);
}

// Optional: filter/search hooks
document.getElementById('status-filter')?.addEventListener('change', () => {
  // Filter giveaways by status
  // This would require additional implementation
});

document.getElementById('search-giveaways')?.addEventListener('input', () => {
  // Search giveaways by title
  // This would require additional implementation
});

// Initialize the admin panel with giveaways loaded by default
document.addEventListener('DOMContentLoaded', () => {
  loadGiveaways();
});
