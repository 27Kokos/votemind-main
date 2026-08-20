// public/js/profile.js

let currentPage = 1;
let totalPages = 1;

async function loadProfile(page = 1) {
  try {
    const res = await fetch(`/api/profile?page=${page}&limit=10`);
    if (!res.ok) throw new Error('Ошибка загрузки');
    const data = await res.json();

    // Заполняем данные профиля
    document.getElementById('username').textContent = data.username;
    document.getElementById('created-at').textContent = new Date(data.created_at).toLocaleDateString('ru-RU');
    document.getElementById('current-avatar').src = data.avatar_url || '/img/default-avatar.png';
    document.getElementById('header-avatar').src = data.avatar_url || '/img/default-avatar.png';

    // Статистика
    document.getElementById('total-proposals').textContent = data.stats.total_proposals || 0;
    document.getElementById('approved-proposals').textContent = `${data.stats.approved_proposals || 0} (${data.stats.approval_rate || 0}%)`;
    document.getElementById('total-votes').textContent = `${data.stats.total_votes || 0} раз`;
    document.getElementById('total-rooms').textContent = data.stats.total_rooms || 0;
    document.getElementById('active-room').textContent = data.stats.active_room || '—';

    // Активность с пагинацией
    renderActivity(data.activity);
    
    // Настройки уведомлений
    const toggle = document.getElementById('toggle-notifications');
    if (toggle) {
      toggle.checked = data.notifications_enabled !== false;
      const label = document.getElementById('toggle-label');
      label.textContent = toggle.checked ? 'Уведомления включены' : 'Уведомления выключены';
    }
  } catch (err) {
    console.error('Ошибка загрузки профиля:', err);
    // Если ошибка, показываем заглушку
    document.getElementById('activity-list').innerHTML = '<p class="text-red-500 text-sm">Ошибка загрузки данных</p>';
  }
}

function renderActivity(activityData) {
  const container = document.getElementById('activity-list');
  const paginationContainer = document.getElementById('pagination-container');
  
  if (!container) return;

  const items = activityData.items || [];
  totalPages = activityData.totalPages || 1;
  currentPage = activityData.page || 1;

  if (items.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">Нет активности</p>';
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  container.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = `
      <span class="activity-icon">${item.icon || '📌'}</span>
      <div class="flex-1">
        <div class="activity-text">${item.text}</div>
        <div class="activity-time">${new Date(item.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    `;
    container.appendChild(div);
  });

  renderPagination(currentPage, totalPages, paginationContainer);
}

function renderPagination(currentPage, totalPages, container) {
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '<div class="flex gap-1 justify-center mt-4 flex-wrap">';
  
  if (currentPage > 1) {
    html += `<button onclick="goToPage(${currentPage - 1})" class="pagination-btn">‹</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<span class="pagination-btn active">${i}</span>`;
    } else {
      html += `<button onclick="goToPage(${i})" class="pagination-btn">${i}</button>`;
    }
  }

  if (currentPage < totalPages) {
    html += `<button onclick="goToPage(${currentPage + 1})" class="pagination-btn">›</button>`;
  }

  html += '</div>';
  container.innerHTML = html;
}

function goToPage(page) {
  if (page === currentPage) return;
  loadProfile(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  loadProfile(1);
  
  const toggle = document.getElementById('toggle-notifications');
  if (toggle) {
    toggle.addEventListener('change', async () => {
      try {
        await fetch('/profile/toggle-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: toggle.checked })
        });
        const label = document.getElementById('toggle-label');
        label.textContent = toggle.checked ? 'Уведомления включены' : 'Уведомления выключены';
      } catch (err) {
        console.error('Ошибка:', err);
        toggle.checked = !toggle.checked;
      }
    });
  }
});

window.goToPage = goToPage;