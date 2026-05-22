package com.ssau.project.ssaupe.service;

import com.ssau.project.ssaupe.dto.ActivityRequestDto;
import com.ssau.project.ssaupe.dto.EventRequestDto;
import com.ssau.project.ssaupe.dto.EventResponseDto;
import com.ssau.project.ssaupe.model.Activity;
import com.ssau.project.ssaupe.model.Event;
import com.ssau.project.ssaupe.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;

    public EventServiceImpl(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Transactional
    public Event createEvent(EventRequestDto request) {
        Event event = new Event();
        event.setName(request.getName());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());

        if (request.getActivities() != null) {
            for (ActivityRequestDto item : request.getActivities()) {
                Activity activity = new Activity();
                activity.setName(item.getName());
                activity.setDescription(item.getDescription());
                activity.setActivityDate(item.getActivityDate());
                activity.setStartTime(item.getStartTime());
                activity.setEndTime(item.getEndTime());
                activity.setLocation(item.getLocation());
                activity.setMaxVolunteers(item.getMaxVolunteers());
                activity.setDirection(item.getDirection());
                activity.setTerritory(item.getTerritory());
                activity.setFormat(item.getFormat());
                activity.setContact(item.getContact());

                event.addActivity(activity);
            }
        }

        return eventRepository.save(event);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDto> getAllEvents() {
        List<Event> events = eventRepository.findAll();
        return events.stream()
                .map(this::toDto)
                .toList();
    }

    private EventResponseDto toDto(Event event) {
        EventResponseDto dto = new EventResponseDto();
        dto.setId(event.getId());
        dto.setTitle(event.getName());
        dto.setDescription(event.getDescription());
        dto.setLocation(event.getLocation());
        dto.setDateStart(event.getStartDate());
        dto.setDateEnd(event.getEndDate());

        int totalVolunteers = 0;
        List<String> categories = new ArrayList<>();

        if (event.getActivities() != null) {
            for (Activity activity : event.getActivities()) {
                if (activity.getMaxVolunteers() != null) {
                    totalVolunteers += activity.getMaxVolunteers();
                }

                if (activity.getDirection() != null && !categories.contains(activity.getDirection())) {
                    categories.add(activity.getDirection());
                }
                if (activity.getTerritory() != null && !categories.contains(activity.getTerritory())) {
                    categories.add(activity.getTerritory());
                }
                if (activity.getFormat() != null && !categories.contains(activity.getFormat())) {
                    categories.add(activity.getFormat());
                }
            }

            dto.setActivitiesCount(event.getActivities().size());
        } else {
            dto.setActivitiesCount(0);
        }

        dto.setTotalVolunteers(totalVolunteers);
        dto.setCategories(categories);

        return dto;
    }
}
