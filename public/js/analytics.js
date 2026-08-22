// public/js/analytics.js

let statsData = null;
let chartInstances = {};

// === Анимация цифр ===
function animateNumber(element, target, duration = 1200) {
  if (!element) return;
  const startTime = performance.now();
  const update = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(progress * target);
    element.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
    else element.textContent = target;
  };
  update();
}

// === Загрузка статистики ===
async function loadStats() {
  try {
    const res = await fetch('/api/analytics/stats');
    if (!res.ok) throw new Error('Ошибка загрузки');
    statsData = await res.json();
    console.log('📊 Данные аналитики:', statsData);

    animateNumber(document.getElementById('stat-users'), statsData.totalUsers || 0);
    animateNumber(document.getElementById('stat-rooms'), statsData.totalRooms || 0);
    animateNumber(document.getElementById('stat-polls'), statsData.totalPolls || 0);
    animateNumber(document.getElementById('stat-votes'), statsData.totalVotes || 0);

    renderCharts(statsData);
  } catch (err) {
    console.error('❌ Ошибка загрузки:', err);
    document.getElementById('stats-grid').innerHTML = '<p class="text-red-500">Ошибка загрузки данных</p>';
  }
}

// === Графики ===
function renderCharts(data) {
  console.log('🖼️ Начинаем рендеринг графиков');
  // Уничтожаем старые графики
  Object.values(chartInstances).forEach(chart => chart.destroy());
  chartInstances = {};

  // 1. Топ комнат (столбцы)
  const topCanvas = document.getElementById('topRoomsChart');
  console.log('📌 topRoomsChart:', topCanvas);
  if (topCanvas) {
    const topData = data.topRooms && data.topRooms.length > 0 ? data.topRooms : [{ name: 'Нет данных', votes_count: 0 }];
    console.log('📊 Топ комнат данные:', topData);
    chartInstances.topRooms = new Chart(topCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: topData.map(r => r.name || 'Без названия'),
        datasets: [{
          label: 'Голосов',
          data: topData.map(r => r.votes_count || 0),
          backgroundColor: 'rgba(139, 92, 246, 0.7)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
    console.log('✅ График топ комнат создан');
  } else {
    console.warn('⚠️ Canvas topRoomsChart не найден');
  }

  // 2. Активность по дням (линия)
  const activityCanvas = document.getElementById('activityChart');
  console.log('📌 activityChart:', activityCanvas);
  if (activityCanvas) {
    const activityData = data.activityByDay && data.activityByDay.length > 0 ? data.activityByDay : [{ date: 'Нет данных', count: 0 }];
    console.log('📊 Активность данные:', activityData);
    chartInstances.activity = new Chart(activityCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: activityData.map(d => d.date || ''),
        datasets: [{
          label: 'Голосов',
          data: activityData.map(d => d.count || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointRadius: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
    console.log('✅ График активности создан');
  } else {
    console.warn('⚠️ Canvas activityChart не найден');
  }

  // 3. Распределение голосов (круговая)
  const pieCanvas = document.getElementById('pieChart');
  console.log('📌 pieChart:', pieCanvas);
  if (pieCanvas) {
    const pieData = data.userRoomsStats && data.userRoomsStats.length > 0 ? data.userRoomsStats : [{ name: 'Нет данных', votes_count: 1 }];
    console.log('📊 Распределение данные:', pieData);
    chartInstances.pie = new Chart(pieCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: pieData.map(r => r.name || 'Без названия'),
        datasets: [{
          data: pieData.map(r => r.votes_count || 1),
          backgroundColor: ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
          borderWidth: 2,
          borderColor: '#1a1a2e',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#c4b5fd', usePointStyle: true } }
        }
      }
    });
    console.log('✅ График распределения создан');
  } else {
    console.warn('⚠️ Canvas pieChart не найден');
  }
}

// === Инициализация ===
document.addEventListener('DOMContentLoaded', loadStats);