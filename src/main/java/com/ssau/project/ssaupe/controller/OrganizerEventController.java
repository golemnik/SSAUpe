package com.ssau.project.ssaupe.controller;

import com.ssau.project.ssaupe.dto.EventRequestDto;
import com.ssau.project.ssaupe.dto.EventResponseDto;
import com.ssau.project.ssaupe.model.Event;
import com.ssau.project.ssaupe.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizer/events")
public class OrganizerEventController {

    private final EventService eventService;

    public OrganizerEventController(EventService EventService) {
        this.eventService = EventService;
    }

    @PostMapping
    public ResponseEntity<Integer> createEvent(@Valid @RequestBody EventRequestDto request) {
        Event savedEvent = eventService.createEvent(request);
        return ResponseEntity.ok(savedEvent.getId());
    }

    @GetMapping
    public ResponseEntity<List<EventResponseDto>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }
}
