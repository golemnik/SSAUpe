package com.ssau.project.ssaupe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "application")
public class Application {

    private Integer id;
    private SystemUser volunteer;
    private Activity activity;

    // ИЗМЕНЕНО: Тип поля теперь ApplicationStatus вместо String
    private ApplicationStatus status;
    private LocalDateTime createdAt;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Integer getId() {
        return id;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "volunteer_id", nullable = false)
    public SystemUser getVolunteer() {
        return volunteer;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    public Activity getActivity() {
        return activity;
    }

    // ИЗМЕНЕНО: Добавлена аннотация @Enumerated и изменен возвращаемый тип
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 45)
    public ApplicationStatus getStatus() {
        return status;
    }

    @Column(name = "created_at")
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}