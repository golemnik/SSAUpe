package com.ssau.project.ssaupe.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Setter
@Getter
public class ActivityRequestDto {
    @NotBlank
    private String name;
    @NotBlank
    private String description;
    @Min(1)
    private Integer maxVolunteers;
    private LocalTime startTime;
    private LocalTime endTime;
    private String format;
    private String direction;
    private LocalDate activityDate;
    private String location;
    private String territory;
    private String contact;
}
