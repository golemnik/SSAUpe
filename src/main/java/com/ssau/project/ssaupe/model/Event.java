package com.ssau.project.ssaupe.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Set;

@Setter
@Getter
@Entity
@Table(name = "event")
public class Event {

    private Integer id;
    private String name;
    private String description;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;

    private EventFormat format;
    private EventDirection direction;
    private EventForces forces;

    private Set<Activity> activities;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Integer getId() { return id; }

    @Column(name = "name", nullable = false, length = 255)
    public String getName() { return name; }

    @Column(name = "description", length = 5000)
    public String getDescription() { return description; }

    @Column(name = "location", length = 255)
    public String getLocation() { return location; }

    @Column(name = "start_date")
    public LocalDate getStartDate() { return startDate; }

    @Column(name = "end_date")
    public LocalDate getEndDate() { return endDate; }

    @Enumerated(EnumType.STRING)
    @Column(name = "format", length = 100)
    public EventFormat getFormat() { return format; }

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", length = 100)
    public EventDirection getDirection() { return direction; }

    @Enumerated(EnumType.STRING)
    @Column(name = "forces", length = 40)
    public EventForces getForces() { return forces; }

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    public Set<Activity> getActivities() { return activities; }
}