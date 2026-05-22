package com.ssau.project.ssaupe.service;

import com.ssau.project.ssaupe.dto.EventRequestDto;
import com.ssau.project.ssaupe.dto.EventResponseDto;
import com.ssau.project.ssaupe.model.Event;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface EventService {

    @Transactional
    Event createEvent(EventRequestDto request);

    List<EventResponseDto> getAllEvents();
}
