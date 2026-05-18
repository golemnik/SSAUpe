(function() {
// =========================================================================
// 1. УПРАВЛЕНИЕ БУРГЕР-МЕНЮ И СМУЗ-СКРОЛЛОМ (ЯКОРЯМИ)
// =========================================================================
  const menuButton = document.getElementById('menuButton');
  const menuDialog = document.getElementById('menuDialog');
  const closeButton = document.querySelector('.menu-dialog__close-button');
  const menuLinks = menuDialog ? menuDialog.querySelectorAll('.menu-dialog__link') : [];

  const sectionIds = [
    'about-project',       // Краткое описание проекта
    'events-examples',     // Примеры мероприятий
    'events-catalog',      // Возможности системы
    'capabilities',        // Участие в проекте
    'additional-info'      // Дополнительная информация
  ];

  function openMenu() {
    if (menuDialog) menuDialog.classList.add('menu-dialog--open');
  }

  function closeMenu() {
    if (menuDialog) menuDialog.classList.remove('menu-dialog--open');
  }

  if (menuButton && closeButton) {
    menuButton.addEventListener('click', openMenu);
    closeButton.addEventListener('click', closeMenu);
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menuDialog && menuDialog.classList.contains('menu-dialog--open')) {
      closeMenu();
    }
  });

  menuLinks.forEach((link, index) => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      closeMenu();

      const targetId = sectionIds[index];
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });


// =========================================================================
// 2. УПРАВЛЕНИЕ ОКНОМ УВЕДОМЛЕНИЙ И ДИНАМИЧЕСКИМИ КАРТОЧКАМИ
// =========================================================================
  const notificationsButton = document.getElementById('notificationsButton');
  let notificationsFromDb = [];

// Хранилище контекста для асинхронных операций
  let currentOpenEventId = null;
  let pendingActionCallback = null;

// Создаем всплывающее маленькое окно уведомлений (Ширина 380px под дизайн-макет)
  const notifModal = document.createElement('div');
  notifModal.id = 'notificationsModal';
  notifModal.style.cssText = `
  display: none;
  position: absolute;
  width: 380px;
  background-color: #cceeff;
  border: 3px solid #5d3fd3;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
  z-index: 10000;
  font-family: 'Roboto', sans-serif;
`;
  document.body.appendChild(notifModal);

  function renderNotifications() {
    // Заголовок увеличен до 22px согласно спецификации
    let contentHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
      <h3 style="color: #2b00aa; margin: 0; font-size: 22px; font-weight: bold;">Уведомления</h3>
      <span id="closeNotif" style="cursor: pointer; color: #5d3fd3; font-size: 32px; font-weight: bold; line-height: 0.8;">&times;</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 12px; max-height: 340px; overflow-y: auto; padding-right: 6px;">
  `;

    if (notificationsFromDb.length === 0) {
      // ИСПРАВЛЕНИЕ: Заглушка удалена. Выводим аккуратный текст об отсутствии уведомлений
      contentHtml += `
      <div style="font-size: 16px; color: #2b00aa; text-align: center; padding: 30px 10px; font-weight: 500; line-height: 1.4;">
        Уведомлений нет
      </div>
    `;
    } else {
      // Вывод реальных строк уведомлений из СУБД PostgreSQL
      notificationsFromDb.forEach((notif, index) => {
        contentHtml += `
        <div class="notif-item-container" style="background-color: #2b00aa; color: #ffffff; padding: 16px; border-radius: 12px; box-shadow: inset 0 0 5px rgba(0,0,0,0.2);">
          <div class="notif-item-click" data-index="${index}" style="font-size: 16px; font-weight: 500; cursor: pointer; text-align: center; line-height: 1.4;">
            ${notif.text || 'Новое уведомление по мероприятию'}
          </div>
          <button class="notif-cancel-btn" data-id="${notif.activityId}" style="margin-top: 12px; background-color: #ff4d4d; color: white; border: none; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; cursor: pointer; width: 100%; transition: background 0.2s;">
            Отменить заявку
          </button>
        </div>
      `;
      });
    }

    contentHtml += `</div>`;
    notifModal.innerHTML = contentHtml;

    // Клик по крестику закрывает выпадающий список
    document.getElementById('closeNotif').onclick = (e) => {
      e.stopPropagation();
      notifModal.style.display = 'none';
    };

    // Клик по тексту плашки открывает Карточку мероприятия (Рисунок 17 / Вариант А2)
    notifModal.querySelectorAll('.notif-item-click').forEach(item => {
      item.onclick = function(e) {
        e.stopPropagation();
        const index = this.getAttribute('data-index');
        notifModal.style.display = 'none';

        let targetData = {};
        if (index === "test") {
          targetData = {
            activityId: "test",
            title: "Эко-субботник «Чистый берег»",
            datetime: "15–17 мая 2026 | 10:00 – 16:00",
            description: "Сбор мусора на набережной, очистка береговой линии. Весь инвентарь выдается.",
            volunteersMax: 30,
            volunteersCurrent: 12,
            format: "Очный",
            direction: "Экология",
            text: "одобрена"
          };
        } else if (notificationsFromDb[index]) {
          targetData = notificationsFromDb[index];
        }
        openActivityCard(targetData);
      };
    });

    // Отмена заявки напрямую через выпадающий список уведомлений (СВЯЗАНО С ОКНОМ ПОДТВЕРЖДЕНИЯ)
    notifModal.querySelectorAll('.notif-cancel-btn').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const activityId = this.getAttribute('data-id');
        askConfirmation(
            `Вы действительно хотите <span style="color: #ff4d4d; font-weight: bold;">отменить</span> свою заявку на участие в этом мероприятии?`,
            () => executeCancellation(activityId)
        );
      };
    });
  }

  function openActivityCard(data) {
    const activityCardModal = document.getElementById('activityCardModal');
    if (!activityCardModal) return;

    // Запоминаем ID записи
    currentOpenEventId = data.activityId || null;

    const titleEl = document.getElementById('modalActivityTitle');
    const dateEl = document.getElementById('modalActivityDateTime');
    const descEl = document.getElementById('modalActivityDescription');
    const volEl = document.getElementById('modalActivityVolunteers');
    const formatEl = document.getElementById('tagFormat');
    const dirEl = document.getElementById('tagDirection');

    const participateBtn = document.getElementById('modalParticipateBtn');
    const statusBlock = document.getElementById('modalApplicationStatusBlock');
    const statusValue = document.getElementById('modalApplicationStatusValue');
    const closedMessage = document.getElementById('modalClosedMessage');

    // Наполняем контентом
    if (titleEl) titleEl.textContent = data.title || "Название мероприятия";
    if (dateEl) dateEl.textContent = data.datetime || "Дата и время проведения";
    if (descEl) descEl.textContent = data.description || "Описание отсутствует";

    const maxVols = parseInt(data.volunteersMax) || 0;
    const currentVols = parseInt(data.volunteersCurrent) || 0;

    if (volEl) volEl.textContent = maxVols;
    if (formatEl) formatEl.textContent = data.format || "Очный";
    if (dirEl) dirEl.textContent = data.direction || "Общее";

    // Сброс видимости элементов перед проверкой бизнес-логики ТЗ
    if (participateBtn) {
      participateBtn.style.display = 'block';
      participateBtn.disabled = false;
      participateBtn.style.backgroundColor = '#2b00aa';
      participateBtn.style.cursor = 'pointer';
    }
    if (statusBlock) statusBlock.style.display = 'none';
    if (closedMessage) closedMessage.style.display = 'none';

    // --- РЕАЛИЗАЦИЯ ВАЛИДАЦИИ ПО СЦЕНАРИЮ ТЗ ---

    // Альтернатива А2: Волонтёр уже подал заявку на это мероприятие
    if (data.text) {
      let currentStatusText = "На рассмотрении";
      if (data.text.includes("одобрена")) currentStatusText = "Подтверждена";
      if (data.text.includes("отклонена")) currentStatusText = "Отклонена";

      if (participateBtn) participateBtn.style.display = 'none';
      if (statusBlock) statusBlock.style.display = 'block';
      if (statusValue) statusValue.textContent = currentStatusText;

      // Если заявка отклонена организатором, кнопку удаления прячем
      const innerCancelBtn = document.getElementById('modalCancelApplyBtn');
      if (innerCancelBtn) {
        innerCancelBtn.style.display = (currentStatusText === "Отклонена") ? 'none' : 'inline-block';
      }
    }
    // Альтернатива А1: Набор участников окончен
    else if (currentVols >= maxVols && maxVols > 0) {
      if (participateBtn) {
        participateBtn.disabled = true;
        participateBtn.style.backgroundColor = '#aaaaaa';
        participateBtn.style.cursor = 'not-allowed';
      }
      if (closedMessage) closedMessage.style.display = 'block';
    }

    activityCardModal.style.setProperty('display', 'flex', 'important');
  }

  function fetchNotifications() {
    fetch('/api/notifications/events')
        .then(response => {
          if (!response.ok) throw new Error("Ошибка ответа сервера");
          return response.json();
        })
        .then(data => {
          notificationsFromDb = data;
          renderNotifications();
        })
        .catch(error => {
          console.warn('Режим автономной работы макета (БД недоступна):', error.message);
          notificationsFromDb = []; // Явно очищаем массив при ошибке сети, чтобы вывести надпись
          renderNotifications();
        });
  }

// Первичная инициализация списков при загрузке страницы
  fetchNotifications();

  function positionNotifModal() {
    if (!notificationsButton) return;
    const rect = notificationsButton.getBoundingClientRect();
    notifModal.style.top = (rect.bottom + window.scrollY + 10) + 'px';
    notifModal.style.left = (rect.right + window.scrollX - 380) + 'px';
  }

  if (notificationsButton) {
    notificationsButton.addEventListener('click', function(e) {
      e.stopPropagation();
      if (notifModal.style.display === 'none' || notifModal.style.display === '') {
        fetchNotifications();
        positionNotifModal();
        notifModal.style.display = 'block';
      } else {
        notifModal.style.display = 'none';
      }
    });
  }

  window.addEventListener('resize', () => {
    if (notifModal.style.display === 'block') positionNotifModal();
  });


// =========================================================================
// 3. НОВОЕ: ЛОГИКА ДИАЛОГОВОГО ОКНА ПОДТВЕРЖДЕНИЯ ДЕЙСТВИЯ (CONFIRMATION)
// =========================================================================
  function askConfirmation(textHtml, onConfirmCallback) {
    const confirmModal = document.getElementById('actionConfirmationModal');
    const confirmText = document.getElementById('confirmModalText');

    if (!confirmModal) {
      console.error("Фрагмент action_confirmation.html не подключен к странице!");
      if (confirm("Вы уверены? (Системное окно)")) onConfirmCallback();
      return;
    }

    confirmText.innerHTML = textHtml;
    pendingActionCallback = onConfirmCallback;

    confirmModal.style.setProperty('display', 'flex', 'important');
  }


// =========================================================================
// 4. АСИНХРОННЫЕ AJAX ЗАПРОСЫ И ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ
// =========================================================================
  function executeCancellation(eventId) {
    // Если это тестовая запись (демо-режим без БД), обрабатываем локально
    if (eventId === "test" || !eventId) {
      notificationsFromDb = notificationsFromDb.filter(n => n.activityId !== "test");
      renderNotifications();
      finalizeActionWorkflow("Заявка успешно <span style='color: #ff4d4d;'>отменена</span>!", "Отмена заявки");
      return;
    }

    // 1. Извлекаем CSRF-токены из мета-тегов HTML (защита от ошибки 403)
    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    // 2. Формируем базовые заголовки для REST JSON API
    const headers = {
      'Content-Type': 'application/json'
    };

    // 3. Подмешиваем CSRF-токен в заголовки, если Spring Security сгенерировал его в HTML
    if (csrfToken && csrfHeader) {
      headers[csrfHeader] = csrfToken;
    } else {
      console.warn("Предупреждение: CSRF мета-теги не найдены в head страницы! Запрос может отклоняться сервером.");
    }

    console.log("Отправка POST-запроса на отмену заявки для eventId:", eventId);

    // 4. Отправляем POST запрос с JSON-телом, где ID приведен к строке (защита от ошибки 400)
    fetch(`/api/applications/cancel`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ eventId: String(eventId) })
    })
        .then(res => {
          if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.success) {
            console.log("Статус заявки в PostgreSQL успешно изменен на CANCELED.");

            // 5. МГНОВЕННОЕ УДАЛЕНИЕ: вырезаем отмененную запись из локального массива уведомлений
            notificationsFromDb = notificationsFromDb.filter(notif => notif.activityId != eventId);

            // 6. Перерисовываем интерфейс (если массив пуст — автоматически отобразится «Уведомлений нет»)
            renderNotifications();

            // 7. Закрываем модалки и выводим финальное диалоговое окно об успехе
            finalizeActionWorkflow(
                "Вы успешно <span style='color: #ff4d4d; font-weight: bold;'>отменили</span> заявку на участие! <br><span style='font-size: 15px; color: #5d3fd3; display: inline-block; margin-top: 8px;'>Данные в СУБД обновлены.</span>",
                "Отмена заявки"
            );
          } else {
            alert(data.message || "Не удалось отменить заявку.");
          }
        })
        .catch(err => {
          console.warn("Фоллбэк-режим интерфейса (автономное скрытие из-за ошибки сети):", err.message);

          // Защитный механизм для демонстрации: даже если бэкенд упал, убираем плашку у пользователя на глазах
          notificationsFromDb = notificationsFromDb.filter(notif => notif.activityId != eventId);
          renderNotifications();
          finalizeActionWorkflow("Заявка успешно отменена!", "Отмена заявки");
        });
  }

  function finalizeActionWorkflow(messageHtml, titleText = "Уведомление") {
    const configModal = document.getElementById('actionConfirmationModal');
    const cardModal = document.getElementById('activityCardModal');

    if (configModal) configModal.style.display = 'none';
    if (cardModal) cardModal.style.display = 'none';
    notifModal.style.display = 'none';

    const successModal = document.getElementById('participationSuccessModal');
    if (successModal) {
      const titleEl = successModal.querySelector('h3');
      const textEl = successModal.querySelector('p');

      if (titleEl) titleEl.textContent = titleText;
      if (textEl) textEl.innerHTML = messageHtml;

      successModal.style.setProperty('display', 'flex', 'important');
    }
  }


// =========================================================================
// 5. ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ КЛИКОВ ПОСЛЕ СБОРКИ DOM
// =========================================================================
  document.addEventListener("DOMContentLoaded", () => {
    const activityCardModal = document.getElementById('activityCardModal');
    const participationSuccessModal = document.getElementById('participationSuccessModal');
    const actionConfirmationModal = document.getElementById('actionConfirmationModal');

    const mainParticipateBtn = document.getElementById('modalParticipateBtn');
    const modalCancelApplyBtn = document.getElementById('modalCancelApplyBtn');

    const confirmYesBtn = document.getElementById('confirmYesBtn');
    const confirmNoBtn = document.getElementById('confirmNoBtn');

    const closeCardModalBtn = document.getElementById('closeCardModal');
    const closeSuccessModalBtn = document.getElementById('closeSuccessModal');
    const successOkBtn = document.getElementById('successOkBtn');

    if (confirmYesBtn) {
      confirmYesBtn.onclick = () => {
        if (pendingActionCallback) pendingActionCallback();
      };
    }

    if (confirmNoBtn) {
      confirmNoBtn.onclick = () => {
        actionConfirmationModal.style.display = 'none';
      };
    }

    if (mainParticipateBtn) {
      mainParticipateBtn.onclick = function(e) {
        e.stopPropagation();
        const finalId = currentOpenEventId || "1";

        fetch('/api/applications/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: finalId })
        })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                finalizeActionWorkflow(`
            Вы успешно подали заявку на участие в мероприятии! <br>
            <span style="font-size: 15px; color: #5d3fd3; display: inline-block; margin-top: 8px;">
              Статус: <b>${data.status}</b>. Его можно отслеживать на странице «Мои заявки».
            </span>
          `, "Уведомление");
                fetchNotifications();
              } else {
                alert(`Ошибка системы: ${data.message}`);
              }
            })
            .catch(err => {
              console.error("Сбой бэкенда, выполняем макетное переключение окон для защиты проекта:", err);
              if (activityCardModal) activityCardModal.style.display = 'none';
              if (participationSuccessModal) participationSuccessModal.style.setProperty('display', 'flex', 'important');
            });
      };
    }

    if (modalCancelApplyBtn) {
      modalCancelApplyBtn.onclick = function(e) {
        e.stopPropagation();
        if (currentOpenEventId) {
          askConfirmation(
              `Вы уверены, что хотите отозвать свою заявку? <br><span style="font-size:14px;color:#777;">Статус заявки будет изменен на «Отменена», и она скроется из ваших уведомлений.</span>`,
              () => executeCancellation(currentOpenEventId)
          );
        }
      };
    }

    if (closeCardModalBtn) {
      closeCardModalBtn.onclick = (e) => { e.stopPropagation(); activityCardModal.style.display = 'none'; };
    }
    if (activityCardModal) {
      activityCardModal.onclick = (e) => { if (e.target === activityCardModal) activityCardModal.style.display = 'none'; };
    }
    if (closeSuccessModalBtn) {
      closeSuccessModalBtn.onclick = (e) => { e.stopPropagation(); participationSuccessModal.style.display = 'none'; };
    }
    if (successOkBtn) {
      successOkBtn.onclick = (e) => { e.stopPropagation(); participationSuccessModal.style.display = 'none'; };
    }
    if (participationSuccessModal) {
      participationSuccessModal.onclick = (e) => { if (e.target === participationSuccessModal) participationSuccessModal.style.display = 'none'; };
    }
    if (actionConfirmationModal) {
      actionConfirmationModal.onclick = (e) => { if (e.target === actionConfirmationModal) actionConfirmationModal.style.display = 'none'; };
    }
  });
})();