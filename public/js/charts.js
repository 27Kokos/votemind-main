// public/js/charts.js

function renderPollChart(pollData, containerId) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js не загружен, график не будет отрисован');
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Контейнер для графика не найден:', containerId);
    return;
  }

  // Очищаем контейнер (чтобы не дублировать canvas)
  container.innerHTML = '';

  let canvas = document.createElement('canvas');
  container.appendChild(canvas);

  // Уничтожаем старый график, если есть
  if (window._chartInstance) {
    window._chartInstance.destroy();
    window._chartInstance = null;
  }

  const options = pollData.options || [];
  const type = pollData.type || 'single';

  let labels = options.map(opt => opt.text);
  let dataValues = [];

  if (type === 'rated_options') {
    dataValues = options.map(opt => Number(opt.average_rating) || 0);
  } else {
    dataValues = options.map(opt => Number(opt.votes) || 0);
  }

  if (dataValues.every(v => v === 0)) {
    container.innerHTML = '<p class="text-gray-500 text-sm">Нет данных для графика</p>';
    return;
  }

  const colors = [
    'rgba(139, 92, 246, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(236, 72, 153, 0.8)',
  ];

  const ctx = canvas.getContext('2d');

  window._chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: colors.slice(0, dataValues.length),
        borderColor: '#ffffff',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#e0e0ff',
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle',
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              let value = context.raw;
              let total = context.dataset.data.reduce((a, b) => a + b, 0);
              let percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              if (type === 'rated_options') {
                return label + ': ' + Number(value).toFixed(1) + ' / 5';
              }
              return label + ': ' + Number(value) + ' голосов (' + percentage + '%)';
            }
          }
        }
      }
    }
  });
}