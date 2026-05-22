(function() {
// =========================================================================
// 1. УПРАВЛЕНИЕ БУРГЕР-МЕНЮ И СМУЗ-СКРОЛЛОМ (ЯКОРЯМИ)
// =========================================================================
  const menuButton = document.getElementById('menuButton');
  const menuDialog = document.getElementById('menuDialog');
  const closeButton = document.querySelector('.menu-dialog__close-button');
  const menuLinks = menuDialog ? menuDialog.querySelectorAll('.menu-dialog__link') : [];

  const sectionIds = [
    'about-project',
    'events-examples',
    'events-catalog',
    'capabilities',
    'additional-info'
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

  let currentOpenEventId = null;
  let pendingActionCallback = null;
  let needReload = false;

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
    let contentHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
      <h3 style="color: #2b00aa; margin: 0; font-size: 22px; font-weight: bold;">Уведомления</h3>
      <span id="closeNotif" style="cursor: pointer; color: #5d3fd3; font-size: 32px; font-weight: bold; line-height: 0.8;">&times;</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 12px; max-height: 340px; overflow-y: auto; padding-right: 6px;">
  `;

    if (notificationsFromDb.length === 0) {
      contentHtml += `
      <div style="font-size: 16px; color: #2b00aa; text-align: center; padding: 30px 10px; font-weight: 500; line-height: 1.4;">
        Уведомлений нет
      </div>
    `;
    } else {
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

    document.getElementById('closeNotif').onclick = (e) => {
      e.stopPropagation();
      notifModal.style.display = 'none';
    };

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

    if (titleEl) titleEl.textContent = data.title || "Название мероприятия";
    if (dateEl) dateEl.textContent = data.datetime || "Дата и время проведения";
    if (descEl) descEl.textContent = data.description || "Описание отсутствует";

    const maxVols = parseInt(data.volunteersMax) || 0;
    const currentVols = parseInt(data.volunteersCurrent) || 0;

    if (volEl) volEl.textContent = maxVols;
    if (formatEl) formatEl.textContent = data.format || "Очный";
    if (dirEl) dirEl.textContent = data.direction || "Общее";

    if (participateBtn) {
      participateBtn.style.display = 'block';
      participateBtn.disabled = false;
      participateBtn.style.backgroundColor = '#2b00aa';
      participateBtn.style.cursor = 'pointer';
    }
    if (statusBlock) statusBlock.style.display = 'none';
    if (closedMessage) closedMessage.style.display = 'none';

    if (data.text) {
      let currentStatusText = "На рассмотрении";
      if (data.text.includes("одобрена")) currentStatusText = "Подтверждена";
      if (data.text.includes("отклонена")) currentStatusText = "Отклонена";

      if (participateBtn) participateBtn.style.display = 'none';
      if (statusBlock) statusBlock.style.display = 'block';
      if (statusValue) statusValue.textContent = currentStatusText;

      const innerCancelBtn = document.getElementById('modalCancelApplyBtn');
      if (innerCancelBtn) {
        innerCancelBtn.style.display = (currentStatusText === "Отклонена") ? 'none' : 'inline-block';
      }
    }
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
          notificationsFromDb = [];
          renderNotifications();
        });
  }

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
// 3. ЛОГИКА ДИАЛОГОВОГО ОКНА ПОДТВЕРЖДЕНИЯ ДЕЙСТВИЯ (CONFIRMATION)
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
    if (eventId === "test" || !eventId) {
      notificationsFromDb = notificationsFromDb.filter(n => n.activityId !== "test");
      renderNotifications();
      finalizeActionWorkflow("Заявка успешно <span style='color: #ff4d4d;'>отменена</span>!", "Отмена заявки");
      return;
    }

    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    const headers = {
      'Content-Type': 'application/json'
    };

    if (csrfToken && csrfHeader) {
      headers[csrfHeader] = csrfToken;
    }

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
            notificationsFromDb = notificationsFromDb.filter(notif => notif.activityId != eventId);
            renderNotifications();
            finalizeActionWorkflow(
                "Вы успешно <span style='color: #ff4d4d; font-weight: bold;'>отменили</span> заявку на участие! <br><span style='font-size: 15px; color: #5d3fd3; display: inline-block; margin-top: 8px;'>Данные в СУБД обновлены.</span>",
                "Отмена заявки"
            );
            needReload = true;
          } else {
            alert(data.message || "Не удалось отменить заявку.");
          }
        })
        .catch(err => {
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
// 6. ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ПО КЛИКУ НА КАРТОЧКИ ИЗ БАЗЫ ДАННЫХ
// =========================================================================
  window.handleMainCardClick = function(element) {
    const data = {
      activityId: element.getAttribute('data-activity-id'),
      title: element.getAttribute('data-title'),
      description: element.getAttribute('data-description'),
      datetime: element.getAttribute('data-datetime'),
      format: element.getAttribute('data-format'),
      direction: element.getAttribute('data-direction'),
      volunteersMax: parseInt(element.getAttribute('data-vols-max')) || 0,
      volunteersCurrent: parseInt(element.getAttribute('data-vols-current')) || 0,
      text: element.getAttribute('data-text')
    };

    openActivityCard(data);
  };

// =========================================================================
// 7. КАТАЛОГ СОБЫТИЙ: ПОИСК, ФИЛЬТРАЦИЯ И МОДАЛЬНОЕ ОКНО
// =========================================================================
  let allCatalogEvents = [];

  const eventsListContainer = document.getElementById('eventsListContainer');
  const emptyEventsMessage = document.getElementById('emptyEventsMessage');

  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const openFilterBtn = document.getElementById('openFilterBtn');

  const filterDialog = document.getElementById('filterDialog');
  const closeFilterBtn = document.querySelector('.filter-dialog__close-button');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  const eventDetailsModal = document.getElementById('eventDetailsModal');
  const closeEventModalBtn = document.querySelector('.event-details-modal__close');
  const modalEventTitle = document.getElementById('modalEventTitle');
  const modalEventDate = document.getElementById('modalEventDate');
  const modalEventDescription = document.getElementById('modalEventDescription');
  const modalActivitiesList = document.getElementById('modalActivitiesList');
  const emptyActivitiesMessage = document.getElementById('emptyActivitiesMessage');

  function fetchCatalogEvents() {
    fetch('/api/catalog/events')
        .then(res => res.json())
        .then(data => {
          allCatalogEvents = data;
          renderCatalog(allCatalogEvents);
        })
        .catch(err => console.error("Ошибка загрузки каталога:", err));
  }

  function renderCatalog(eventsToRender) {
    // Очищаем контейнер, оставляя только элемент пустого сообщения
    Array.from(eventsListContainer.children).forEach(child => {
      if (child.id !== 'emptyEventsMessage') {
        child.remove();
      }
    });

    if (eventsToRender.length === 0) {
      // ПОКАЗЫВАЕМ СООБЩЕНИЕ И ВЫРАВНИВАЕМ (меняем текст динамически)
      const isFiltered = searchInput.value.trim() !== '' || document.querySelectorAll('#filterDialog input[type="checkbox"]:checked').length > 0;

      if (isFiltered) {
        emptyEventsMessage.innerHTML = `
              <p>По вашему запросу и выбранным фильтрам ничего не найдено.</p>
              <p>Попробуйте изменить параметры поиска.</p>
          `;
      } else {
        emptyEventsMessage.innerHTML = `
              <p>В каталоге пока нет доступных событий.</p>
              <p>Загляните позже — организаторы обязательно добавят новые.</p>
          `;
      }

      emptyEventsMessage.style.display = 'flex'; // Меняем на flex для красивого центрирования
    } else {
      emptyEventsMessage.style.display = 'none';

      eventsToRender.forEach(event => {
        const directionTag = event.direction ? `<span style="background-color: #5d3fd3; color: white; padding: 5px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">${event.direction}</span>` : '';
        const forcesTag = event.forces ? `<span style="background-color: #5d3fd3; color: white; padding: 5px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">${event.forces}</span>` : '';
        const formatTag = event.format ? `<span style="background-color: #5d3fd3; color: white; padding: 5px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">${event.format}</span>` : '';

        const tagsContainer = (directionTag || forcesTag || formatTag) ? `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 15px;">
                 ${directionTag}
                 ${forcesTag}
                 ${formatTag}
            </div>
        ` : '';

        const cardHtml = `
              <div class="event-card-catalog" onclick="openEventDetailsModalById(${event.eventId})">
                  <h3 class="event-card-catalog__headline">${event.title}</h3>
                  ${tagsContainer}
                  <p class="event-card-catalog__datetime">${event.datetime}</p>
                  <p class="event-card-catalog__location">${event.location || ''}</p>
              </div>
            `;
        eventsListContainer.insertAdjacentHTML('beforeend', cardHtml);
      });
    }
  }

  window.openEventDetailsModalById = function(eventId) {
    const eventData = allCatalogEvents.find(e => e.eventId === eventId);
    if (!eventData) return;

    modalEventTitle.textContent = eventData.title;
    modalEventDate.textContent = eventData.datetime;
    modalEventDescription.textContent = eventData.description;

    modalActivitiesList.innerHTML = '';

    if (!eventData.activities || eventData.activities.length === 0) {
      emptyActivitiesMessage.style.display = 'block';
    } else {
      emptyActivitiesMessage.style.display = 'none';

      eventData.activities.forEach(act => {
        const isClosed = act.isClosed;
        const hasApplied = !!act.userStatus;
        let statusText = 'Набор открыт';

        if (hasApplied) {
          statusText = 'Заявка ' + act.userStatus.toLowerCase();
        } else if (isClosed) {
          statusText = 'Набор завершён';
        }

        const directionTag = eventData.direction ? `<span class="activity-modal-card__category-tag" style="background-color: #5d3fd3; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${eventData.direction}</span>` : '';
        const formatTag = eventData.format ? `<span class="activity-modal-card__category-tag" style="background-color: #5d3fd3; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${eventData.format}</span>` : '';
        const forcesTag = eventData.forces ? `<span class="activity-modal-card__category-tag" style="background-color: #5d3fd3; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${eventData.forces}</span>` : '';

        // Генерируем карточку
        const actHtml = `
            <div class="activity-modal-card" 
                 style="background-color: #2b00aa; border-radius: 15px; padding: 20px; color: white; display: flex; flex-direction: column; text-align: center; gap: 10px; cursor: pointer; transition: transform 0.2s;"
                 onmouseover="this.style.transform='translateY(-5px)'" 
                 onmouseout="this.style.transform='translateY(0)'"
                 data-activity-id="${act.activityId}"
                 data-title="${act.title}"
                 data-description="${eventData.description || 'Описание отсутствует'}"
                 data-datetime="${act.date} | ${act.time}" 
                 data-format="${eventData.format || ''}"
                 data-direction="${eventData.direction || ''}"
                 data-vols-max="${act.volunteersMax}"
                 data-vols-current="${act.volunteersCurrent}"
                 data-text="${act.userStatus ? act.userStatus.toLowerCase() : ''}"
                 onclick="handleInnerActivityClick(this)">
                 
                <h4 style="margin: 0; font-size: 20px;">${act.title}</h4>
                
                <p style="margin: 0; font-size: 14px; color: #a4bdfc; line-height: 1.4;">
                    ${act.date}<br>
                    ${act.time}
                </p>
                
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 10px 0;">
                    ${directionTag}
                    ${formatTag}
                    ${forcesTag}
                </div>
                
                <p style="margin: auto 0 10px 0; font-size: 14px; font-weight: bold;">
                    Требуется волонтёров:<br>${act.volunteersCurrent}/${act.volunteersMax}
                </p>
                
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #ff9900;">
                    ${statusText}
                </p>
            </div>
        `;
        modalActivitiesList.insertAdjacentHTML('beforeend', actHtml);
      });
    }

    eventDetailsModal.style.display = 'flex';
  };

  window.handleInnerActivityClick = function(element) {
    const data = {
      activityId: element.getAttribute('data-activity-id'),
      title: element.getAttribute('data-title'),
      description: element.getAttribute('data-description'),
      datetime: element.getAttribute('data-datetime'),
      format: element.getAttribute('data-format'),
      direction: element.getAttribute('data-direction'),
      volunteersMax: parseInt(element.getAttribute('data-vols-max')) || 0,
      volunteersCurrent: parseInt(element.getAttribute('data-vols-current')) || 0,
      text: element.getAttribute('data-text')
    };

    const eventDetailsModal = document.getElementById('eventDetailsModal');
    if (eventDetailsModal) {
      eventDetailsModal.style.display = 'none';
    }

    openActivityCard(data);
  };

  window.handleActivityApplyClick = function(e, buttonElement) {
    e.stopPropagation();
    const actId = buttonElement.getAttribute('data-activity-id');
    currentOpenEventId = actId;

    const mainParticipateBtn = document.getElementById('modalParticipateBtn');
    if (mainParticipateBtn) {
      mainParticipateBtn.click();
    }
  };

  if (closeEventModalBtn) {
    closeEventModalBtn.addEventListener('click', () => {
      eventDetailsModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === eventDetailsModal) {
      eventDetailsModal.style.display = 'none';
    }
  });

  // --- ЛОГИКА ФИЛЬТРАЦИИ И ПОИСКА ---
  function applyFiltersAndSearch() {
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const checkedDirections = Array.from(document.querySelectorAll('input[name="direction"]:checked')).map(cb => cb.value);
    const checkedFormats = Array.from(document.querySelectorAll('input[name="format"]:checked')).map(cb => cb.value);
    const checkedTerritories = Array.from(document.querySelectorAll('input[name="territory"]:checked')).map(cb => cb.value);

    const filteredEvents = allCatalogEvents.filter(event => {
      const matchesText = event.title.toLowerCase().includes(searchText) ||
          event.description.toLowerCase().includes(searchText);

      const matchesDirection = checkedDirections.length === 0 || checkedDirections.some(d => event.directions.includes(d));
      const matchesFormat = checkedFormats.length === 0 || checkedFormats.some(f => event.formats.includes(f));
      const matchesTerritory = checkedTerritories.length === 0 || checkedTerritories.some(t => event.territories.includes(t));

      return matchesText && matchesDirection && matchesFormat && matchesTerritory;
    });

    renderCatalog(filteredEvents);
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', applyFiltersAndSearch);
  }

  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') applyFiltersAndSearch();
    });
  }

  // --- ОБРАБОТЧИКИ МОДАЛЬНОГО ОКНА ФИЛЬТРА (CSS КЛАССЫ) ---
  if (openFilterBtn && filterDialog) {
    openFilterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Открываем модалку через класс CSS
      filterDialog.classList.add('filter-dialog--open');
    });
  }

  if (closeFilterBtn) {
    closeFilterBtn.addEventListener('click', () => {
      filterDialog.classList.remove('filter-dialog--open');
    });
  }

  // Закрытие фильтра при клике на темный фон вне контейнера
  window.addEventListener('click', (e) => {
    if (e.target === filterDialog) {
      filterDialog.classList.remove('filter-dialog--open');
    }
  });

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      applyFiltersAndSearch();
      filterDialog.classList.remove('filter-dialog--open');
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      document.querySelectorAll('#filterDialog input[type="checkbox"]').forEach(cb => cb.checked = false);
      if (searchInput) searchInput.value = '';
      applyFiltersAndSearch();
      filterDialog.classList.remove('filter-dialog--open');
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    fetchCatalogEvents();
  });

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

        const finalId = currentOpenEventId;
        if (!finalId) return;

        const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
        const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

        const headers = { 'Content-Type': 'application/json' };
        if (csrfToken && csrfHeader) {
          headers[csrfHeader] = csrfToken;
        }

        const originalText = mainParticipateBtn.innerText;
        mainParticipateBtn.innerText = "Отправка...";
        mainParticipateBtn.disabled = true;

        fetch('/api/applications/apply', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ eventId: finalId })
        })
            .then(res => {
              if (!res.ok) throw new Error("Ошибка ответа сервера");
              return res.json();
            })
            .then(data => {
              if (data.success) {
                mainParticipateBtn.style.display = 'none';

                const statusBlock = document.getElementById('modalApplicationStatusBlock');
                const statusValue = document.getElementById('modalApplicationStatusValue');
                const cancelBtn = document.getElementById('modalCancelApplyBtn');

                if (statusBlock) statusBlock.style.display = 'block';
                if (statusValue) statusValue.textContent = "На рассмотрении";
                if (cancelBtn) cancelBtn.style.display = 'inline-block';

                finalizeActionWorkflow(`
              Вы успешно подали заявку на участие в мероприятии! <br>
              <span style="font-size: 15px; color: #5d3fd3; display: inline-block; margin-top: 8px;">
                Статус: <b>${data.status}</b>.
              </span>
            `, "Успех!");

                fetchNotifications();
                needReload = true;

              } else {
                alert(`Внимание: ${data.message}`);
                mainParticipateBtn.innerText = originalText;
                mainParticipateBtn.disabled = false;
              }
            })
            .catch(err => {
              console.error("Сбой:", err);
              alert("Произошла ошибка соединения с сервером.");
              mainParticipateBtn.innerText = originalText;
              mainParticipateBtn.disabled = false;
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
      participationSuccessModal.onclick = (e) => { if (e.target === participationSuccessModal) participationSuccessModal.style.display = 'none'; if (needReload) {
        window.location.reload();
      } };
    }
    if (actionConfirmationModal) {
      actionConfirmationModal.onclick = (e) => { if (e.target === actionConfirmationModal) actionConfirmationModal.style.display = 'none'; };
    }
  });
})();