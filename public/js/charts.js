// public/js/charts.js

function renderPollChart(pollData, containerId) {
  // containerId — это id элемента, в котором будет canvas
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Контейнер для графика не найден:', containerId);
    return;
  }

  // Если в контейнере уже есть canvas, используем его, иначе создаём
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }

  // Уничтожаем старый график, если есть
  if (window._chartInstance) {
    window._chartInstance.destroy();
    window._chartInstance = null;
  }

  const options = pollData.options || [];
  const type = pollData.type || 'single';

  // Подготовка данных
  let labels = options.map(opt => opt.text);
  let dataValues = [];

  if (type === 'rated_options') {
    dataValues = options.map(opt => Number(opt.average_rating) || 0);
  } else {
    dataValues = options.map(opt => Number(opt.votes) || 0);
  }

  // Если нет данных — выходим
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
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: type === 'rated_options' ? 'Средняя оценка' : 'Голосов',
        data: dataValues,
        backgroundColor: colors.slice(0, dataValues.length),
        borderColor: colors.slice(0, dataValues.length).map(c => c.replace('0.8', '1')),
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              let value = context.raw;
              if (type === 'rated_options') {
                return label + ': ' + Number(value).toFixed(1) + ' / 5';
              }
              return label + ': ' + Number(value) + ' голосов';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: type === 'rated_options' ? 0.5 : 1,
          }
        }
      }
    }
  });
}