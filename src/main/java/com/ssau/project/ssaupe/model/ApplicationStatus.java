package com.ssau.project.ssaupe.model;

public enum ApplicationStatus {
    PENDING("на рассмотрении"),
    ACCEPTED("принят"),
    REJECTED("отклонён"),
    CANCELED("отменена");

    private final String russianValue;

    ApplicationStatus(String russianValue) {
        this.russianValue = russianValue;
    }

    public String getRussianValue() {
        return russianValue;
    }
}