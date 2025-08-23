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
    }
  });
});

// Modal logic
function openGiveawayModal() {
  document.getElementById('giveaway-modal').style.display = 'block';
  document.getElementById('giveaway-form').reset();
  document.getElementById('modal-title').textContent = 'Create New Giveaway';
}

function closeModal() {
  document.getElementById('giveaway-modal').style.display = 'none';
}

window.addEventListener('click', e => {
  if (e.target === document.getElementById('giveaway-modal')) {
    closeModal();
  }
});

// Form submission
document.getElementById('giveaway-form').addEventListener('submit', async e => {
  e.preventDefault();

  const giveaway = {
    title: document.getElementById('giveaway-title').value,
    description: document.getElementById('giveaway-description').value,
    prize: document.getElementById('giveaway-prize').value,
    startDate: document.getElementById('giveaway-start').value,
    endDate: document.getElementById('giveaway-end').value,
    numberOfWinners: parseInt(document.getElementById('giveaway-winners').value),
    status: document.getElementById('giveaway-status').value
  };

  try {
    const response = await fetch('/.netlify/functions/createGiveaway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(giveaway)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Giveaway created successfully!');
      closeModal();
      // Optionally reload giveaways list here
    } else {
      alert(`Error: ${result.error || 'Failed to create giveaway'}`);
    }
  } catch (error) {
    console.error('Error creating giveaway:', error);
    alert('Something went wrong. Please try again.');
  }
});

// Pick winners
function pickWinners() {
  const giveawayId = document.getElementById('pick-giveaway').value;
  const count = parseInt(document.getElementById('winners-count').value);

  if (!giveawayId || count < 1) {
    alert('Please select a giveaway and enter a valid number of winners.');
    return;
  }

  fetch('/.netlify/functions/pickWinners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ giveawayId, numberOfWinners: count })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(`Winners selected: ${data.winners.map(w => w.username).join(', ')}`);
        // Optionally refresh winners table
      } else {
        alert(`Error: ${data.error}`);
      }
    })
    .catch(err => {
      console.error('Error picking winners:', err);
      alert('Failed to pick winners.');
    });
}

// Export data
function exportData() {
  alert('Exporting data... (functionality to be implemented)');
}

// Optional: filter/search hooks
document.getElementById('status-filter')?.addEventListener('change', () => {
  // Filter giveaways by status
});

document.getElementById('search-giveaways')?.addEventListener('input', () => {
  // Search giveaways by title
});
