// public/js/export.js

// === CSV экспорт (без изменений) ===
function exportCSV(pollData) {
  if (!pollData || !pollData.options) {
    alert('Нет данных для экспорта');
    return;
  }

  const options = pollData.options || [];
  const type = pollData.type || 'single';
  const question = pollData.question || 'Голосование';

  let rows = [];
  let headers = ['Вариант'];
  if (type === 'rated_options') {
    headers.push('Средняя оценка', 'Кол-во оценок');
  } else {
    headers.push('Голосов', 'Процент');
  }
  rows.push(headers.join(';'));

  const total = options.reduce((sum, opt) => {
    return sum + (type === 'rated_options' ? Number(opt.vote_count) || 0 : Number(opt.votes) || 0);
  }, 0);

  options.forEach(opt => {
    let row = [opt.text];
    if (type === 'rated_options') {
      const avg = Number(opt.average_rating) || 0;
      const count = Number(opt.vote_count) || 0;
      row.push(avg.toFixed(1), count);
    } else {
      const votes = Number(opt.votes) || 0;
      const percent = total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
      row.push(votes, percent + '%');
    }
    rows.push(row.join(';'));
  });

  rows.push('');
  rows.push(`"Всего голосов";${total}`);

  const csvContent = rows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `результаты_${question.substring(0, 30)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// === PDF экспорт (красивый дизайн через html2canvas) ===
function exportPDF(pollData) {
  if (!pollData || !pollData.options) {
    alert('Нет данных для экспорта');
    return;
  }

  // Проверка библиотек
  if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
    alert('Библиотека jsPDF не загружена');
    return;
  }
  if (typeof html2canvas === 'undefined') {
    alert('Библиотека html2canvas не загружена');
    return;
  }

  const content = document.getElementById('poll-content');
  if (!content) {
    alert('Не найден контент');
    return;
  }

  // Создаём временный контейнер с красивым оформлением
  let exportContainer = document.getElementById('export-container');
  if (!exportContainer) {
    exportContainer = document.createElement('div');
    exportContainer.id = 'export-container';
    exportContainer.style.position = 'absolute';
    exportContainer.style.left = '-9999px';
    exportContainer.style.top = '-9999px';
    exportContainer.style.width = '650px';
    exportContainer.style.background = '#ffffff';
    exportContainer.style.padding = '30px';
    exportContainer.style.borderRadius = '12px';
    exportContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    exportContainer.style.fontFamily = 'Arial, sans-serif';
    exportContainer.style.color = '#1e293b';
    document.body.appendChild(exportContainer);
  }

  // Клонируем содержимое модалки
  const clone = content.cloneNode(true);
  // Удаляем кнопки и интерактивные элементы
  clone.querySelectorAll('.btn-modal, button, input, select, .custom-option, .custom-control, .peer').forEach(el => el.remove());

  // Добавляем красивый заголовок
  const header = document.createElement('div');
  header.style.background = 'linear-gradient(135deg, #7c3aed, #8b5cf6)';
  header.style.color = 'white';
  header.style.padding = '20px';
  header.style.borderRadius = '8px';
  header.style.marginBottom = '20px';
  header.style.textAlign = 'center';
  header.innerHTML = `
    <h1 style="margin:0;font-size:24px;font-weight:bold;">📊 Результаты голосования</h1>
    <p style="margin:5px 0 0;font-size:14px;opacity:0.9;">${pollData.question}</p>
  `;
  clone.prepend(header);

  // Информация о дате и типе
  const info = document.createElement('div');
  info.style.display = 'flex';
  info.style.justifyContent = 'space-between';
  info.style.marginBottom = '15px';
  info.style.padding = '10px 15px';
  info.style.background = '#f8fafc';
  info.style.borderRadius = '6px';
  info.style.fontSize = '13px';
  info.style.color = '#475569';
  const typeLabels = {
    single: 'Один вариант',
    multiple: 'Несколько вариантов',
    rated_options: 'Оценка (1–5)'
  };
  info.innerHTML = `
    <span>📅 ${new Date().toLocaleString('ru-RU')}</span>
    <span>📌 Тип: ${typeLabels[pollData.type] || pollData.type}</span>
  `;
  clone.prepend(info);

  // Улучшаем таблицу: добавляем рамки и стили
  const table = clone.querySelector('table');
  if (table) {
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '15px';
    table.style.fontSize = '14px';
    // Заголовки таблицы
    const ths = table.querySelectorAll('th');
    ths.forEach(th => {
      th.style.background = '#7c3aed';
      th.style.color = 'white';
      th.style.padding = '10px';
      th.style.textAlign = 'left';
      th.style.fontWeight = 'bold';
      th.style.border = '1px solid #e2e8f0';
    });
    // Ячейки
    const tds = table.querySelectorAll('td');
    tds.forEach(td => {
      td.style.padding = '8px 10px';
      td.style.border = '1px solid #e2e8f0';
    });
    // Чередование строк
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (index % 2 === 0 && index > 0) {
        row.style.background = '#f8fafc';
      }
    });
    // Итоговая строка (если есть)
    const lastRow = rows[rows.length - 1];
    if (lastRow && lastRow.textContent.includes('Всего')) {
      lastRow.style.background = '#e2e8f0';
      lastRow.style.fontWeight = 'bold';
    }
  }

  // График — делаем белую рамку и тень
  const canvas = clone.querySelector('canvas');
  if (canvas) {
    canvas.style.background = '#ffffff';
    canvas.style.borderRadius = '8px';
    canvas.style.padding = '10px';
    canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
    canvas.style.width = '100%';
    canvas.style.maxHeight = '280px';
  }

  // Футер
  const footer = document.createElement('div');
  footer.style.marginTop = '25px';
  footer.style.textAlign = 'center';
  footer.style.fontSize = '11px';
  footer.style.color = '#94a3b8';
  footer.style.borderTop = '1px solid #e2e8f0';
  footer.style.paddingTop = '15px';
  footer.innerHTML = 'Сгенерировано в <strong>VoteMind</strong> · Все права защищены';
  clone.appendChild(footer);

  // Очищаем и заполняем экспорт-контейнер
  exportContainer.innerHTML = '';
  exportContainer.appendChild(clone);

  // Делаем скриншот
  setTimeout(() => {
    html2canvas(exportContainer, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      useCORS: true,
    }).then(canvasImg => {
      const imgData = canvasImg.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvasImg.height / canvasImg.width) * imgWidth;

      if (imgHeight > doc.internal.pageSize.getHeight() - margin * 2) {
        const ratio = (doc.internal.pageSize.getHeight() - margin * 2) / imgHeight;
        doc.addImage(imgData, 'PNG', margin, margin, imgWidth * ratio, doc.internal.pageSize.getHeight() - margin * 2);
      } else {
        doc.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      }

      doc.save(`результаты_${pollData.question.substring(0, 30)}.pdf`);
    }).catch(err => {
      console.error('html2canvas error:', err);
      alert('Ошибка при создании PDF: ' + err.message);
    });
  }, 600);
}

window.exportCSV = exportCSV;
window.exportPDF = exportPDF;