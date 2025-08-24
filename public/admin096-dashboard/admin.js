// Firebase initialization (should be added to your HTML or a separate config file)
// Make sure to include Firebase SDK in your HTML:
// <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

// Initialize Firebase (replace with your config)
const firebaseConfig = {
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

// Authentication state observer
firebase.auth().onAuthStateChanged((user) => {
  if (!user && window.location.pathname !== '/admin-login.html') {
    window.location.href = '/admin-login.html';
  }
});

// Section switching
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (item.id === 'logout-btn') {
      firebase.auth().signOut().then(() => {
        window.location.href = '/admin-login.html';
      });
      return;
    }

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
      document.getElementById('section-title').textContent = item.querySelector('span').textContent;
      
      // Load section-specific data
      if (section === 'giveaways') {
        loadGiveaways();
      } else if (section === 'entries') {
        loadEntries();
      } else if (section === 'winners') {
        loadWinners();
        loadGiveawaysForPicker();
      } else if (section === 'dashboard') {
        loadDashboardStats();
      }
    }
  });
});

// Modal logic
function openGiveawayModal(giveawayId = null) {
  const modal = document.getElementById('giveaway-modal');
  const form = document.getElementById('giveaway-form');
  const title = document.getElementById('modal-title');
  
  if (giveawayId) {
    // Edit mode
    title.textContent = 'Edit Giveaway';
    db.collection('giveaways').doc(giveawayId).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('giveaway-id').value = doc.id;
        document.getElementById('giveaway-title').value = data.title;
        document.getElementById('giveaway-description').value = data.description || '';
        document.getElementById('giveaway-prize').value = data.prize;
        document.getElementById('giveaway-start').value = formatDateTimeLocal(data.startDate);
        document.getElementById('giveaway-end').value = formatDateTimeLocal(data.endDate);
        document.getElementById('giveaway-winners').value = data.numberOfWinners || 1;
        document.getElementById('giveaway-status').value = data.status || 'active';
      }
    });
  } else {
    // Create mode
    title.textContent = 'Create New Giveaway';
    form.reset();
    document.getElementById('giveaway-id').value = '';
    document.getElementById('giveaway-status').value = 'active';
  }
  
  modal.style.display = 'block';
}

function closeModal() {
  document.getElementById('giveaway-modal').style.display = 'none';
}

window.addEventListener('click', e => {
  if (e.target === document.getElementById('giveaway-modal')) {
    closeModal();
  }
});

// Format date for datetime-local input
function formatDateTimeLocal(dateString) {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
}

// Form submission
document.getElementById('giveaway-form').addEventListener('submit', async e => {
  e.preventDefault();

  const giveawayId = document.getElementById('giveaway-id').value;
  const giveaway = {
    title: document.getElementById('giveaway-title').value,
    description: document.getElementById('giveaway-description').value,
    prize: document.getElementById('giveaway-prize').value,
    startDate: new Date(document.getElementById('giveaway-start').value).toISOString(),
    endDate: new Date(document.getElementById('giveaway-end').value).toISOString(),
    numberOfWinners: parseInt(document.getElementById('giveaway-winners').value),
    status: document.getElementById('giveaway-status').value,
    updatedAt: new Date().toISOString()
  };

  try {
    if (giveawayId) {
      // Update existing giveaway
      await db.collection('giveaways').doc(giveawayId).update(giveaway);
      alert('Giveaway updated successfully!');
    } else {
      // Create new giveaway
      giveaway.createdAt = new Date().toISOString();
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

// Load giveaways for admin
async function loadGiveaways() {
  try {
    const snapshot = await db.collection('giveaways')
      .orderBy('createdAt', 'desc')
      .get();
    
    const tbody = document.getElementById('giveaways-tbody');
    tbody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${data.title}</td>
        <td>${data.prize}</td>
        <td>${formatDate(data.startDate)}</td>
        <td>${formatDate(data.endDate)}</td>
        <td>${data.entryCount || 0}</td>
        <td><span class="status status-${data.status}">${data.status}</span></td>
        <td>
          <button class="btn btn-sm" onclick="openGiveawayModal('${doc.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteGiveaway('${doc.id}')">Delete</button>
        </td>
      `;
      
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading giveaways:', error);
  }
}

// Load entries
async function loadEntries() {
  try {
    const snapshot = await db.collection('entries')
      .orderBy('entryDate', 'desc')
      .get();
    
    const tbody = document.getElementById('entries-tbody');
    tbody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${data.name}</td>
        <td>${data.email}</td>
        <td>${data.username}</td>
        <td>${data.giveawayId}</td>
        <td>${formatDate(data.entryDate)}</td>
        <td><span class="status status-pending">Pending</span></td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteEntry('${doc.id}')">Delete</button>
        </td>
      `;
      
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading entries:', error);
  }
}

// Load winners
async function loadWinners() {
  try {
    const snapshot = await db.collection('winners')
      .orderBy('winDate', 'desc')
      .get();
    
    const tbody = document.getElementById('winners-tbody');
    tbody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${data.username}</td>
        <td>${data.email}</td>
        <td>${data.prize}</td>
        <td>${data.giveawayTitle}</td>
        <td>${formatDate(data.winDate)}</td>
        <td><span class="status status-contact">To Contact</span></td>
        <td>
          <button class="btn btn-sm btn-success" onclick="markContacted('${doc.id}')">Contacted</button>
          <button class="btn btn-sm btn-danger" onclick="deleteWinner('${doc.id}')">Delete</button>
        </td>
      `;
      
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading winners:', error);
  }
}

// Load giveaways for winner picker
async function loadGiveawaysForPicker() {
  try {
    const snapshot = await db.collection('giveaways')
      .where('status', '==', 'ended')
      .get();
    
    const select = document.getElementById('pick-giveaway');
    select.innerHTML = '<option value="">Select Giveaway</option>';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${data.title} (${data.prize})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading giveaways for picker:', error);
  }
}

// Load dashboard statistics
async function loadDashboardStats() {
  try {
    // Total giveaways
    const giveawaysSnapshot = await db.collection('giveaways').get();
    document.getElementById('total-giveaways').textContent = giveawaysSnapshot.size;
    
    // Active giveaways
    const activeSnapshot = await db.collection('giveaways')
      .where('status', '==', 'active')
      .get();
    document.getElementById('active-giveaways').textContent = activeSnapshot.size;
    
    // Total entries
    const entriesSnapshot = await db.collection('entries').get();
    document.getElementById('total-entries').textContent = entriesSnapshot.size;
    
    // Total winners
    const winnersSnapshot = await db.collection('winners').get();
    document.getElementById('total-winners').textContent = winnersSnapshot.size;
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
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
      alert('Giveaway not found!');
      return;
    }
    
    const giveaway = giveawayDoc.data();
    
    // Get all entries for this giveaway
    const entriesSnapshot = await db.collection('entries')
      .where('giveawayId', '==', giveawayId)
      .get();
    
    if (entriesSnapshot.empty) {
      alert('No entries found for this giveaway!');
      return;
    }
    
    const entries = [];
    entriesSnapshot.forEach(doc => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    
    // Randomly select winners
    const winners = [];
    const selectedIndexes = new Set();
    
    // Make sure we don't select more winners than entries
    const winnerCount = Math.min(count, entries.length);
    
    while (winners.length < winnerCount) {
      const randomIndex = Math.floor(Math.random() * entries.length);
      
      if (!selectedIndexes.has(randomIndex)) {
        selectedIndexes.add(randomIndex);
        winners.push(entries[randomIndex]);
      }
    }
    
    // Save winners to database
    const batch = db.batch();
    const winDate = new Date().toISOString();
    
    winners.forEach(winner => {
      const winnerRef = db.collection('winners').doc();
      batch.set(winnerRef, {
        giveawayId: giveawayId,
        giveawayTitle: giveaway.title,
        name: winner.name,
        email: winner.email,
        username: winner.username,
        prize: giveaway.prize,
        winDate: winDate,
        status: 'to_contact'
      });
    });
    
    // Update giveaway status if needed
    if (giveaway.status !== 'winners_selected') {
      batch.update(db.collection('giveaways').doc(giveawayId), {
        status: 'winners_selected',
        updatedAt: new Date().toISOString()
      });
    }
    
    await batch.commit();
    
    alert(`Successfully selected ${winners.length} winners!`);
    loadWinners(); // Refresh winners list
  } catch (error) {
    console.error('Error picking winners:', error);
    alert('Failed to pick winners. Please try again.');
  }
}

// Delete giveaway
async function deleteGiveaway(id) {
  if (!confirm('Are you sure you want to delete this giveaway?')) return;
  
  try {
    await db.collection('giveaways').doc(id).delete();
    alert('Giveaway deleted successfully!');
    loadGiveaways();
  } catch (error) {
    console.error('Error deleting giveaway:', error);
    alert('Failed to delete giveaway.');
  }
}

// Delete entry
async function deleteEntry(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;
  
  try {
    await db.collection('entries').doc(id).delete();
    alert('Entry deleted successfully!');
    loadEntries();
  } catch (error) {
    console.error('Error deleting entry:', error);
    alert('Failed to delete entry.');
  }
}

// Delete winner
async function deleteWinner(id) {
  if (!confirm('Are you sure you want to delete this winner?')) return;
  
  try {
    await db.collection('winners').doc(id).delete();
    alert('Winner deleted successfully!');
    loadWinners();
  } catch (error) {
    console.error('Error deleting winner:', error);
    alert('Failed to delete winner.');
  }
}

// Mark winner as contacted
async function markContacted(id) {
  try {
    await db.collection('winners').doc(id).update({
      status: 'contacted',
      contactedAt: new Date().toISOString()
    });
    alert('Winner marked as contacted!');
    loadWinners();
  } catch (error) {
    console.error('Error updating winner:', error);
    alert('Failed to update winner status.');
  }
}

// Format date for display
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Export data
function exportData() {
  alert('Export functionality would be implemented here. This would typically generate a CSV or Excel file of the selected data.');
}

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // Load initial data for dashboard
      loadDashboardStats();
      
      // Set up filter event listeners
      document.getElementById('status-filter')?.addEventListener('change', loadGiveaways);
      document.getElementById('search-giveaways')?.addEventListener('input', loadGiveaways);
    }
  });
});
