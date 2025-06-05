document.getElementById('region-selector').addEventListener('change', function() {
const selectedTheme = this.value;
// Применяем выбранную тему
applyTheme(selectedTheme);

// Сохраняем выбор пользователя (опционально)
localStorage.setItem('selectedTheme', selectedTheme);
});

function applyTheme(theme) {
// Удаляем все предыдущие классы тем
document.body.classList.remove(
    'mondstadt-theme',
    'liyue-theme',
    'inazuma-theme',
    'sumeru-theme',
    'fontaine-theme',
    'natlan-theme'
);

// Добавляем класс выбранной темы
document.body.classList.add(`${theme}-theme`);

// Здесь можно добавить другую логику смены темы
console.log(`Тема изменена на: ${theme}`);
}

// При загрузке страницы применяем сохранённую тему (если есть)
window.addEventListener('DOMContentLoaded', () => {
const savedTheme = localStorage.getItem('selectedTheme');
if (savedTheme) {
    document.getElementById('region-selector').value = savedTheme;
    applyTheme(savedTheme);
}
});
