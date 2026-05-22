package com.ssau.project.ssaupe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Setter
@Getter
public class EventRequestDto {
    @NotBlank
    private String name;
    @NotBlank
    private String description;
    @NotBlank
    private String location;
    @NotNull
    private LocalDate startDate;
    @NotNull
    private LocalDate endDate;
    private List<ActivityRequestDto> activities;
}
