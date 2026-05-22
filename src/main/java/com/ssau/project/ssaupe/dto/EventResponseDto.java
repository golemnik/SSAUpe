package com.ssau.project.ssaupe.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class EventResponseDto {
    private Integer id;
    private String title;
    private String description;
    private String location;
    private LocalDate dateStart;
    private LocalDate dateEnd;
    private Integer activitiesCount;
    private Integer totalVolunteers;
    private List<String> categories;
}
