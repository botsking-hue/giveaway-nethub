// Get Firebase modules from global scope
const { 
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, 
  query, orderBy, where, limit, serverTimestamp, Timestamp 
} = window.firebaseModules;
const db = window.db;

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
    document.getElementById('modal-title').textContent = 'Edit Giveaway';
    document.getElementById('giveaway-id').value = giveawayId;
    loadGiveawayData(giveawayId);
  } else {
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
    const docRef = doc(db, 'giveaways', giveawayId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('giveaway-title').value = data.title;
      document.getElementById('giveaway-description').value = data.description;
      document.getElementById('giveaway-prize').value = data.prize;
      
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
    startDate: Timestamp.fromDate(new Date(document.getElementById('giveaway-start').value)),
    endDate: Timestamp.fromDate(new Date(document.getElementById('giveaway-end').value)),
    numberOfWinners: parseInt(document.getElementById('giveaway-winners').value),
    status: document.getElementById('giveaway-status').value,
    updatedAt: serverTimestamp()
  };

  if (!giveawayId) {
    giveaway.createdAt = serverTimestamp();
  }

  try {
    if (giveawayId) {
      await updateDoc(doc(db, 'giveaways', giveawayId), giveaway);
      alert('Giveaway updated successfully!');
    } else {
      await addDoc(collection(db, 'giveaways'), giveaway);
      alert('Giveaway created successfully!');
    }
    
    closeModal();
    loadGiveaways();
  } catch (error) {
    console.error('Error saving giveaway:', error);
    alert('Something went wrong. Please try again.');
  }
});

// Load giveaways for management
async function loadGiveaways() {
  try {
    const q = query(
      collection(db, 'giveaways'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
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
    await deleteDoc(doc(db, 'giveaways', giveawayId));
    alert('Giveaway deleted successfully!');
    loadGiveaways();
  } catch (error) {
    console.error('Error deleting giveaway:', error);
    alert('Failed to delete giveaway.');
  }
}

// End a giveaway early
async function endGiveaway(giveawayId) {
  try {
    await updateDoc(doc(db, 'giveaways', giveawayId), {
      status: 'ended',
      endDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    alert('Giveaway ended successfully!');
    loadGiveaways();
  } catch (error) {
    console.error('Error ending giveaway:', error);
    alert('Failed to end giveaway.');
  }
}

// Load winners list for admin view
async function loadWinnersList() {
  try {
    const q = query(
      collection(db, 'winners'),
      orderBy('drawnAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
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
      <h3>Giveaway: ${winner.giveawayTitle}</h3>
      <p>Drawn on: ${formatDate(winner.drawnAt?.toDate ? winner.drawnAt.toDate() : new Date(winner.drawnAt))}</p>
      <div class="winners-container">
        ${winner.winners.map(win => `
          <div class="winner-detail">
            <p><strong>Winner:</strong> ${win.name} (${win.username})</p>
            <p><strong>Email:</strong> ${win.email}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Load entries for admin view
async function loadEntries() {
  try {
    const q = query(
      collection(db, 'entries'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
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
    const giveawaysSnapshot = await getDocs(collection(db, 'giveaways'));
    const totalGiveaways = giveawaysSnapshot.size;
    
    // Get total entries count
    const entriesSnapshot = await getDocs(collection(db, 'entries'));
    const totalEntries = entriesSnapshot.size;
    
    // Get active giveaways count
    const activeGiveawaysQuery = query(
      collection(db, 'giveaways'),
      where('status', '==', 'active')
    );
    const activeGiveawaysSnapshot = await getDocs(activeGiveawaysQuery);
    const activeGiveaways = activeGiveawaysSnapshot.size;
    
    // Get winners count
    const winnersSnapshot = await getDocs(collection(db, 'winners'));
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
  
  getDoc(doc(db, 'giveaways', giveawayId))
    .then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
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
    const giveawayDoc = await getDoc(doc(db, 'giveaways', giveawayId));
    if (!giveawayDoc.exists()) {
      alert('Giveaway not found.');
      return;
    }
    
    const giveaway = giveawayDoc.data();
    
    const entriesQuery = query(
      collection(db, 'entries'),
      where('giveawayId', '==', giveawayId)
    );
    const entriesSnapshot = await getDocs(entriesQuery);
    
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
    
    const winners = [];
    const availableEntries = [...entries];
    const actualCount = Math.min(count, entries.length);
    
    for (let i = 0; i < actualCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableEntries.length);
      winners.push(availableEntries[randomIndex]);
      availableEntries.splice(randomIndex, 1);
    }
    
    const winnerLog = {
      giveawayId,
      giveawayTitle: giveaway.title,
      winners: winners.map(winner => ({
        name: winner.name,
        email: winner.email,
        username: winner.username
      })),
      drawnAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'winners'), winnerLog);
    
    if (giveaway.status !== 'ended') {
      await updateDoc(doc(db, 'giveaways', giveawayId), {
        status: 'ended',
        updatedAt: serverTimestamp()
      });
    }
    
    alert(`Winners selected successfully: ${winners.map(w => w.username).join(', ')}`);
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

// Initialize the admin panel with giveaways loaded by default
document.addEventListener('DOMContentLoaded', () => {
  loadGiveaways();
});
