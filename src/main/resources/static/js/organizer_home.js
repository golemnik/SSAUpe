document.addEventListener("DOMContentLoaded", () => {
  const state = {
    events: [],
    searchQuery: "",
    filters: {
      territory: new Set(),
      direction: new Set(),
      format: new Set()
    }
  };

  // =========================
  // Elements
  // =========================
  const menuButton = document.getElementById("menuButton");
  const menuDialog = document.getElementById("menuDialog");
  const menuCloseButton = document.querySelector(".menu-dialog__close-button");
  const menuLinks = document.querySelectorAll(".menu-dialog__link");

  const notificationsButton = document.getElementById("notificationsButton");
  const notificationsDialog = document.getElementById("notificationsDialog");
  const notificationsCloseButton = document.querySelector(".notifications-dialog__close-button");

  const filterButton = document.querySelector(".filter-button");
  const filterDialog = document.getElementById("filterDialog");
  const filterCloseButton = document.querySelector(".filter-dialog__close-button");
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");

  const searchInput = document.getElementById("searchInput");
  const searchButton = document.querySelector(".search-button");

  const addEventButton = document.getElementById("addEventButton");
  const eventFormModal = document.getElementById("eventFormModal");
  const eventForm = document.getElementById("eventForm");
  const eventModalCloseButton = document.querySelector(".event-form-modal__close-button");
  const cancelEventButton = document.querySelector(".event-form__cancel");
  const eventModalOverlay = document.querySelector(".event-form-modal__overlay");

  const activitiesContainer = document.getElementById("activitiesContainer");
  const addActivityBtn = document.getElementById("addActivityBtn");
  const activityTemplate = document.getElementById("activityFormTemplate");

  const eventsListContainer = document.getElementById("eventsListContainer");
  const emptyEventsMessage = document.getElementById("emptyEventsMessage");
  const eventCardTemplate = document.getElementById("eventCardTemplate");

  // =========================
  // Generic open / close helpers
  // =========================
  function openElement(element, openClassName) {
    if (!element) return;
    if (openClassName) {
      element.classList.add(openClassName);
    }
    element.style.display = "block";
  }

  function closeElement(element, openClassName) {
    if (!element) return;
    if (openClassName) {
      element.classList.remove(openClassName);
    }
    element.style.display = "none";
  }

  // =========================
  // Menu dialog
  // =========================
  function openMenu() {
    openElement(menuDialog, "menu-dialog--open");
  }

  function closeMenu() {
    closeElement(menuDialog, "menu-dialog--open");
  }

  if (menuButton) {
    menuButton.addEventListener("click", openMenu);
  }

  if (menuCloseButton) {
    menuCloseButton.addEventListener("click", closeMenu);
  }

  if (menuLinks.length > 0) {
    menuLinks.forEach(link => {
      link.addEventListener("click", closeMenu);
    });
  }

  if (menuDialog) {
    menuDialog.addEventListener("click", (event) => {
      if (event.target === menuDialog) {
        closeMenu();
      }
    });
  }

  // =========================
  // Notifications dialog
  // =========================
  function openNotifications() {
    openElement(notificationsDialog, "notifications-dialog--open");
  }

  function closeNotifications() {
    closeElement(notificationsDialog, "notifications-dialog--open");
  }

  if (notificationsButton) {
    notificationsButton.addEventListener("click", openNotifications);
  }

  if (notificationsCloseButton) {
    notificationsCloseButton.addEventListener("click", closeNotifications);
  }

  if (notificationsDialog) {
    notificationsDialog.addEventListener("click", (event) => {
      if (event.target === notificationsDialog) {
        closeNotifications();
      }
    });
  }

  // =========================
  // Filter dialog
  // =========================
  function openFilterDialog() {
    openElement(filterDialog, "filter-dialog--open");
  }

  function closeFilterDialog() {
    closeElement(filterDialog, "filter-dialog--open");
  }

  if (filterButton) {
    filterButton.addEventListener("click", openFilterDialog);
  }

  if (filterCloseButton) {
    filterCloseButton.addEventListener("click", closeFilterDialog);
  }

  if (filterDialog) {
    filterDialog.addEventListener("click", (event) => {
      if (event.target === filterDialog) {
        closeFilterDialog();
      }
    });
  }

  function readFiltersFromDialog() {
    state.filters.territory = new Set(
        Array.from(document.querySelectorAll('input[name="territory"]:checked')).map(input => input.value)
    );

    state.filters.direction = new Set(
        Array.from(document.querySelectorAll('input[name="direction"]:checked')).map(input => input.value)
    );

    state.filters.format = new Set(
        Array.from(document.querySelectorAll('input[name="format"]:checked')).map(input => input.value)
    );
  }

  function resetFiltersInDialog() {
    document.querySelectorAll('#filterDialog input[type="checkbox"]').forEach(input => {
      input.checked = false;
    });

    state.filters.territory.clear();
    state.filters.direction.clear();
    state.filters.format.clear();
  }

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
      readFiltersFromDialog();
      renderEvents();
      closeFilterDialog();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      resetFiltersInDialog();
      renderEvents();
      closeFilterDialog();
    });
  }

  // =========================
  // Event modal
  // =========================
  function openEventModal() {
    openElement(eventFormModal, "event-form-modal--open");
  }

  function closeEventModal() {
    closeElement(eventFormModal, "event-form-modal--open");
  }

  if (addEventButton) {
    addEventButton.addEventListener("click", openEventModal);
  }

  if (eventModalCloseButton) {
    eventModalCloseButton.addEventListener("click", closeEventModal);
  }

  if (cancelEventButton) {
    cancelEventButton.addEventListener("click", closeEventModal);
  }

  if (eventModalOverlay) {
    eventModalOverlay.addEventListener("click", closeEventModal);
  }

  // =========================
  // Activities inside event form
  // =========================
  function createActivityCard() {
    if (!activityTemplate || !activitiesContainer) return;

    const fragment = activityTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".activity-form-card");
    const removeButton = fragment.querySelector(".activity-form-card__remove");

    if (removeButton && card) {
      removeButton.addEventListener("click", () => {
        card.remove();
      });
    }

    activitiesContainer.appendChild(fragment);
  }

  function collectActivities() {
    const cards = document.querySelectorAll(".activity-form-card");

    return Array.from(cards).map(card => {
      const timeValue = card.querySelector(".activity-time")?.value || "";

      return {
        name: card.querySelector(".activity-name")?.value || "",
        activityDate: card.querySelector(".activity-date")?.value || null,
        startTime: timeValue ? `${timeValue}:00` : null,
        endTime: null,
        location: card.querySelector(".activity-location")?.value || "",
        description: card.querySelector(".activity-description")?.value || "",
        maxVolunteers: parseInt(card.querySelector(".activity-volunteers")?.value || "0", 10),
        direction: card.querySelector(".activity-direction")?.value || "",
        territory: card.querySelector(".activity-territory")?.value || "",
        format: card.querySelector(".activity-format")?.value || "",
        contact: card.querySelector(".activity-contact")?.value || ""
      };
    });
  }

  if (addActivityBtn) {
    addActivityBtn.addEventListener("click", createActivityCard);
  }

  // =========================
  // Event form submit
  // =========================
  async function submitEventForm(event) {
    event.preventDefault();

    const payload = {
      name: document.getElementById("eventTitle")?.value || "",
      description: document.getElementById("eventDescription")?.value || "",
      location: document.getElementById("eventLocation")?.value || "",
      startDate: document.getElementById("eventDateStart")?.value || null,
      endDate: document.getElementById("eventDateEnd")?.value || null,
      activities: collectActivities()
    };

    try {
      const response = await fetch("/api/organizer/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert("Error while saving event: " + errorText);
        return;
      }

      alert("Event created successfully");

      if (eventForm) {
        eventForm.reset();
      }

      if (activitiesContainer) {
        activitiesContainer.innerHTML = "";
      }

      closeEventModal();
      await loadEvents();
    } catch (error) {
      console.error("Submit event error:", error);
      alert("Network or server error");
    }
  }

  if (eventForm) {
    eventForm.addEventListener("submit", submitEventForm);
  }

  // =========================
  // Search
  // =========================
  function updateSearchQuery() {
    state.searchQuery = (searchInput?.value || "").trim().toLowerCase();
    renderEvents();
  }

  if (searchInput) {
    searchInput.addEventListener("input", updateSearchQuery);
  }

  if (searchButton) {
    searchButton.addEventListener("click", updateSearchQuery);
  }

  // =========================
  // Event loading / rendering
  // =========================
  async function loadEvents() {
    try {
      const response = await fetch("/api/organizer/events");

      if (!response.ok) {
        throw new Error("Failed to load events. Status: " + response.status);
      }

      const data = await response.json();
      state.events = Array.isArray(data) ? data : [];
      renderEvents();
    } catch (error) {
      console.error("Load events error:", error);
      state.events = [];
      renderEvents();
    }
  }

  function renderEvents() {
    if (!eventsListContainer || !eventCardTemplate) return;

    eventsListContainer.querySelectorAll(".event-item").forEach(item => item.remove());

    const filteredEvents = state.events.filter(matchesSearchAndFilters);

    if (filteredEvents.length === 0) {
      if (emptyEventsMessage) {
        emptyEventsMessage.style.display = "block";

        if (state.events.length === 0) {
          emptyEventsMessage.innerHTML = `
            <p>У вас пока нет созданных событий.</p>
            <p>Нажмите кнопку «Добавить событие», чтобы создать первое мероприятие.</p>
          `;
        } else {
          emptyEventsMessage.innerHTML = `
            <p>События не найдены.</p>
            <p>Попробуйте изменить строку поиска или фильтры.</p>
          `;
        }
      }
      return;
    }

    if (emptyEventsMessage) {
      emptyEventsMessage.style.display = "none";
    }

    filteredEvents.forEach(event => {
      const fragment = eventCardTemplate.content.cloneNode(true);

      const titleEl = fragment.querySelector(".event-item__title");
      const organizerEl = fragment.querySelector(".event-item__organizer");
      const categoriesEl = fragment.querySelector(".event-item__categories");
      const datetimeEl = fragment.querySelector(".event-item__datetime");
      const locationEl = fragment.querySelector(".event-item__location");
      const volunteersCountEl = fragment.querySelector(".event-item__volunteers-count");
      const statusEl = fragment.querySelector(".event-item__status");
      const editButtonEl = fragment.querySelector(".event-item__edit-button");

      if (titleEl) {
        titleEl.textContent = event.name || event.title || "";
      }

      if (organizerEl) {
        organizerEl.textContent = event.organizerName || "Организатор";
      }

      if (datetimeEl) {
        datetimeEl.textContent = formatDateRange(event.startDate, event.endDate);
      }

      if (locationEl) {
        locationEl.textContent = event.location || "";
      }

      if (volunteersCountEl) {
        volunteersCountEl.textContent = `Волонтёров: ${event.totalVolunteers ?? 0}`;
      }

      if (statusEl) {
        statusEl.textContent = `Активностей: ${event.activitiesCount ?? 0}`;
      }

      if (categoriesEl) {
        categoriesEl.innerHTML = "";

        const categories = Array.isArray(event.categories) ? uniqueValues(event.categories) : [];

        categories.forEach(category => {
          const tag = document.createElement("span");
          tag.className = "tag";
          tag.textContent = mapCategoryValue(category);
          categoriesEl.appendChild(tag);
        });
      }

      if (editButtonEl) {
        editButtonEl.addEventListener("click", () => {
          alert(`Редактирование события ID = ${event.id}`);
        });
      }

      eventsListContainer.appendChild(fragment);
    });
  }

  function matchesSearchAndFilters(event) {
    const searchText = [
      event.title,
      event.name,
      event.description,
      event.location,
      ...(Array.isArray(event.categories) ? event.categories : [])
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    const matchesSearch = !state.searchQuery || searchText.includes(state.searchQuery);

    const categories = (Array.isArray(event.categories) ? event.categories : []).map(value =>
        String(value).toLowerCase()
    );

    const matchesTerritory =
        state.filters.territory.size === 0 ||
        Array.from(state.filters.territory).some(value => categories.includes(value));

    const matchesDirection =
        state.filters.direction.size === 0 ||
        Array.from(state.filters.direction).some(value => categories.includes(value));

    const matchesFormat =
        state.filters.format.size === 0 ||
        Array.from(state.filters.format).some(value => categories.includes(value));

    return matchesSearch && matchesTerritory && matchesDirection && matchesFormat;
  }

  function uniqueValues(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function formatDateRange(start, end) {
    const startFormatted = formatDate(start);
    const endFormatted = formatDate(end);

    if (startFormatted && endFormatted) {
      return `${startFormatted} — ${endFormatted}`;
    }

    return startFormatted || endFormatted || "";
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function mapCategoryValue(value) {
    const map = {
      social: "Социальная помощь",
      animals: "Защита животных",
      ecology: "Экология",
      health: "Здравоохранение",
      education: "Образование",
      sport: "Спорт",
      event: "Организация мероприятий",
      emergency: "Ликвидация ЧС",
      digital: "Цифровое волонтёрство",

      local: "Локальный",
      municipal: "Муниципальный",
      regional: "Региональный",
      interregional: "Межрегиональный",
      national: "Всероссийский",
      international: "Международный",

      offline: "Очный",
      online: "Дистанционный",
      hybrid: "Смешанный"
    };

    return map[value] || value;
  }

  // =========================
  // Escape closes dialogs
  // =========================
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeMenu();
    closeNotifications();
    closeFilterDialog();
    closeEventModal();
  });

  // =========================
  // Initial load
  // =========================
  loadEvents();
});
