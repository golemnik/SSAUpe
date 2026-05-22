package com.ssau.project.ssaupe.model;

public enum EventForces {
    LOCAL("Локальный"),
    MUNICIPAL("Муниципальный"),
    REGIONAL("Региональный"),
    INTERREGIONAL("Межрегиональный"),
    NATIONAL("Всероссийский"),
    INTERNATIONAL("Международный");

    private final String displayName;

    EventForces(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}