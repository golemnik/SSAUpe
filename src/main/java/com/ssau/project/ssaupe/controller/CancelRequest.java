package com.ssau.project.ssaupe.controller;


class CancelRequest {
    private String eventId;

    // Обязательно нужен пустой конструктор для Jackson
    public CancelRequest() {}

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }
}