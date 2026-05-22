package com.ssau.project.ssaupe.model;

public enum EventDirection {
    SOCIAL("Социальная помощь"),
    ANIMALS("Защита животных"),
    ECOLOGY("Экология"),
    HEALTH("Здравоохранение"),
    EDUCATION("Образование"),
    SPORT("Спорт"),
    EVENT_ORG("Организация мероприятий"),
    EMERGENCY("Ликвидация ЧС"),
    DIGITAL("Цифровое волонтёрство");

    private final String displayName;

    EventDirection(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}