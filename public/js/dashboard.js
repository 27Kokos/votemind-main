// public/js/dashboard.js

// === Онбординг ===
function showOnboarding() {
  const overlay = document.getElementById('onboarding-overlay');
  const tooltip = document.getElementById('onboarding-tooltip');
  setTimeout(() => {
    overlay.classList.add('active');
    tooltip.classList.add('active');
  }, 300);
}

function closeOnboarding() {
  const overlay = document.getElementById('onboarding-overlay');
  const tooltip = document.getElementById('onboarding-tooltip');
  overlay.classList.remove('active');
  tooltip.classList.remove('active');
  localStorage.setItem('seenOnboarding', 'true');
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toast-message');
  msg.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// === Загрузка комнат ===
async function loadRooms() {
  try {
    const res = await fetch('/rooms/my');
    if (!res.ok) throw new Error('Ошибка загрузки комнат');
    const rooms = await res.json();
    const container = document.getElementById('rooms-list');
    container.innerHTML = '';

    if (rooms.length === 0) {
      container.innerHTML = `
        <p class="text-center text-gray-500 text-sm py-4">
          <i class="fas fa-inbox text-xl mb-2 opacity-60"></i><br>
          Пока нет комнат
        </p>`;
      return;
    }

    rooms.forEach(room => {
      const isOwner = room.is_owner;
      const roleText = isOwner ? 'Владелец' : 'Участник';
      const roleClass = isOwner ? 'room-role' : 'room-role bg-blue-600';
      
      const el = document.createElement('a');
      el.href = `/room/${room.id}`;
      el.className = 'room-card';
      el.innerHTML = `
        <h3 class="room-name">${room.name}</h3>
        <p class="room-desc">${room.description || 'Без описания'}</p>
        <p class="room-code">Код: <strong>${room.invite_code}</strong></p>
        <span class="${roleClass}">${roleText}</span>
      `;
      container.appendChild(el);
    });
  } catch (err) {
    console.error(err);
    document.getElementById('rooms-list').innerHTML = '<p class="text-red-500">Ошибка загрузки комнат</p>';
  }
}

// === Загрузка предложений ===
async function loadProposals() {
  const list = document.getElementById('proposals-list');
  list.innerHTML = '<p class="text-gray-400">Загрузка...</p>';

  try {
    const roomsRes = await fetch('/rooms/my');
    if (!roomsRes.ok) throw new Error('Не удалось загрузить комнаты');
    const rooms = await roomsRes.json();
    const ownerRooms = rooms.filter(r => r.is_owner);
    if (ownerRooms.length === 0) {
      list.innerHTML = '<p class="text-gray-400">Вы не владеете комнатами</p>';
      return;
    }

    let allProposals = [];
    for (const r of ownerRooms) {
      const res = await fetch(`/proposals/room/${r.id}`);
      if (res.ok) {
        const data = await res.json();
        allProposals = allProposals.concat(data);
      }
    }

    if (allProposals.length === 0) {
      list.innerHTML = '<p class="text-gray-400">Нет предложений</p>';
      return;
    }

    list.innerHTML = '';
    allProposals.forEach(p => {
      const item = document.createElement('div');
      item.className = 'p-3 border-b border-gray-700';
      item.innerHTML = `
        <div class="font-medium text-white">${p.question}</div>
        <div class="text-sm text-gray-400">от @${p.username} в "${p.room_name}"</div>
        <div class="mt-3 space-x-2">
          <button onclick="approveProposal(${p.id})" class="btn-primary btn-success text-xs">✅ Одобрить</button>
          <button onclick="rejectProposal(${p.id})" class="btn-primary text-xs">❌ Отклонить</button>
        </div>
      `;
      list.appendChild(item);
    });

    // Обновляем бейдж
    const badge = document.getElementById('proposals-badge');
    if (allProposals.length > 0) {
      badge.classList.remove('hidden');
      badge.textContent = allProposals.length > 9 ? '9+' : allProposals.length;
    } else {
      badge.classList.add('hidden');
    }
  } catch (err) {
    list.innerHTML = '<p class="text-red-400">Ошибка загрузки</p>';
    console.error(err);
  }
}

// === Одобрить предложение ===
async function approveProposal(id) {
  try {
    const res = await fetch(`/proposals/approve/${id}`, { method: 'POST' });
    if (res.ok) {
      alert('Голосование создано!');
      loadProposals();
      fetchGlobalNotifications?.();
    } else {
      const text = await res.text();
      alert('Ошибка: ' + text);
    }
  } catch (err) {
    alert('Не удалось одобрить');
    console.error(err);
  }
}

// === Отклонить предложение ===
async function rejectProposal(id) {
  if (!confirm('Отклонить предложение?')) return;
  try {
    const res = await fetch(`/proposals/reject/${id}`, { method: 'POST' });
    if (res.ok) {
      loadProposals();
    } else {
      alert('Ошибка при отклонении');
    }
  } catch (err) {
    alert('Не удалось отклонить');
    console.error(err);
  }
}

// === Открыть/закрыть модалку ===
function openProposalsModal() {
  document.getElementById('proposals-modal').classList.remove('hidden');
  loadProposals();
}

function closeProposalsModal() {
  document.getElementById('proposals-modal').classList.add('hidden');
}

// === Инициализация ===
document.addEventListener('DOMContentLoaded', () => {
  loadRooms();
  fetchGlobalNotifications?.();
  setInterval(fetchGlobalNotifications, 10000);
  if (!localStorage.getItem('seenOnboarding')) {
    setTimeout(showOnboarding, 600);
  }
});

// Закрытие по Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProposalsModal();
    document.getElementById('onboarding-overlay')?.classList.contains('active') && closeOnboarding();
  }
});

// Глобально доступные функции
window.approveProposal = approveProposal;
window.rejectProposal = rejectProposal;
window.openProposalsModal = openProposalsModal;
window.closeProposalsModal = closeProposalsModal;
window.showToast = showToast;