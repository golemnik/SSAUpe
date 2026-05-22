package com.ssau.project.ssaupe.model;

public enum EventFormat {
    OFFLINE("Очный"),
    ONLINE("Дистанционный"),
    HYBRID("Смешанный");

    private final String displayName;

    EventFormat(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}