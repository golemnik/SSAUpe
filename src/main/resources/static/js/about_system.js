const menuButton = document.getElementById('menuButton');
const menuDialog = document.getElementById('menuDialog');
const closeButton = document.querySelector('.menu-dialog__close-button');

// Функция открытия
function openMenu() {
  menuDialog.classList.add('menu-dialog--open');
}

// Функция закрытия
function closeMenu() {
  menuDialog.classList.remove('menu-dialog--open');
}

// Открытие по кнопке
menuButton.addEventListener('click', openMenu);

// Закрытие по крестику
closeButton.addEventListener('click', closeMenu);

// Закрытие по Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && menuDialog.classList.contains('menu-dialog--open')) {
    closeMenu();
  }
});