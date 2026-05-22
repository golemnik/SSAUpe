package com.ssau.project.ssaupe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

@Setter
@Getter
@Entity
@Table(name = "activity")
public class Activity {

    private Integer id;
    private String name;
    private String description;
    private Integer maxVolunteers;

    // Оставляем только 2 поля, которые хранят и дату, и время
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Event event;
    private Set<Application> applications;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer getId() { return id; }

    @Column(name = "name", nullable = false, length = 255)
    public String getName() { return name; }

    @Column(name = "description", length = 5000)
    public String getDescription() { return description; }

    @Column(name = "max_volunteers")
    public Integer getMaxVolunteers() { return maxVolunteers; }

    @Column(name = "start_time")
    public LocalDateTime getStartTime() { return startTime; }

    @Column(name = "end_time")
    public LocalDateTime getEndTime() { return endTime; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    public Event getEvent() { return event; }

    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    public Set<Application> getApplications() { return applications; }
}