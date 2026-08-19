// public/js/export.js

function exportPollResults(pollData) {
  if (!pollData || !pollData.options) {
    alert('Нет данных для экспорта');
    return;
  }

  const options = pollData.options || [];
  const type = pollData.type || 'single';
  const question = pollData.question || 'Голосование';

  // Заголовки
  let rows = [];
  let headers = ['Вариант'];

  if (type === 'rated_options') {
    headers.push('Средняя оценка', 'Кол-во оценок');
  } else {
    headers.push('Голосов', 'Процент');
  }

  rows.push(headers.join(','));

  // Данные
  const total = options.reduce((sum, opt) => {
    return sum + (type === 'rated_options' ? Number(opt.vote_count) || 0 : Number(opt.votes) || 0);
  }, 0);

  options.forEach(opt => {
    let row = [opt.text];
    if (type === 'rated_options') {
      const avg = Number(opt.average_rating) || 0;
      const count = Number(opt.vote_count) || 0;
      row.push(avg.toFixed(1));
      row.push(count);
    } else {
      const votes = Number(opt.votes) || 0;
      const percent = total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
      row.push(votes);
      row.push(percent + '%');
    }
    rows.push(row.join(','));
  });

  // Добавляем пустую строку и итог
  rows.push('');
  rows.push(`"Всего голосов",${total}`);

  const csvContent = rows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM для Excel
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `результаты_${question.substring(0, 30)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  
}
window.exportPollResults = exportPollResults;