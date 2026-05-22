package com.ssau.project.ssaupe.controller;

import com.ssau.project.ssaupe.model.*;
import com.ssau.project.ssaupe.repository.ActivityRepository;
import com.ssau.project.ssaupe.repository.ApplicationRepository;
import com.ssau.project.ssaupe.repository.RoleRepository;
import com.ssau.project.ssaupe.repository.UserRepository;
import com.ssau.project.ssaupe.service.SecurityService;
import com.ssau.project.ssaupe.service.UserService;
import com.ssau.project.ssaupe.validator.UserValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.*;

@Controller
public class GeneralController {
    @Autowired
    private UserService userService;
    @Autowired
    private SecurityService securityService;
    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private ActivityRepository activityRepository;
    @Autowired
    private UserValidator userValidator;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private UserRepository userRepository;

    @GetMapping({"/","/home"})
    public String showHomePage() {
        return "home";
    }

    @GetMapping("/home/about_devs")
    public String showAboutDevsPage() {
        return "/home/about_devs";
    }

    @GetMapping("/home/about_system")
    public String showAboutSystemPage() {
        return "/home/about_system";
    }

    @RequestMapping(value = "/login", method = RequestMethod.GET)
    public String login(Model model, String error, String logout) {
        if (error != null)
            model.addAttribute("error", "Your username and password is invalid.");

        return "login";
    }

    @GetMapping(value = "/registration")
    public String registration(Model model) {
        model.addAttribute("userForm", new SystemUser());
        return "registration";
    }

    @PostMapping(value = "/registration")
    public String registration(@ModelAttribute("userForm") SystemUser clientForm,
                               @RequestParam(value = "avatarFile", required = false) MultipartFile file,
                               BindingResult bindingResult, Model model) {
        userValidator.validate(clientForm, bindingResult);

        SystemUser existingUser = userRepository.findByUsername(clientForm.getUsername());
        if (existingUser != null) {
            bindingResult.rejectValue("username", "error.userForm", "Пользователь с таким логином уже существует");
        }
        if (bindingResult.hasErrors()) {
            System.out.println("Валидация не пройдена. Обнаружены ошибки:");
            return "registration";
        }

        try {
            if (file != null && !file.isEmpty()) {
                clientForm.setProfile_picture(file.getBytes());
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        clientForm.setRoles(roleRepository.findByName("USER"));
        userService.save(clientForm);

        securityService.autologin(clientForm.getUsername(), clientForm.getPasswordConfirm());

        return "redirect:/volunteer_home";
    }

    @GetMapping("/back_home")
    public String goBack(Authentication authentication, Model model) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return "redirect:/";
        }
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        if (authorities.stream().anyMatch(a -> a.getAuthority().equals("ADMIN"))) {
            return "redirect:/organizer_home";
        } else if (authorities.stream().anyMatch(a -> a.getAuthority().equals("USER"))) {
            return "redirect:/volunteer_home";
        }
        return "redirect:/";
    }

    @RequestMapping(value = "/organizer_home", method = RequestMethod.GET)
    public String organizerHome(Model model) {
        return "organizer_home";
    }

    @PostMapping("/api/applications/cancel")
    @ResponseBody
    public ResponseEntity<?> cancelApplication(@RequestBody CancelRequest payload, Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(response);
        }

        long eventId;
        try {
            eventId = Long.parseLong(payload.getEventId().trim());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(response);
        }

        SystemUser currentUser = userRepository.findByUsername(authentication.getName());

        if (currentUser != null) {
            List<Application> userApplications = applicationRepository.findByVolunteer(currentUser);

            Application appToCancel = userApplications.stream()
                    .filter(a -> a.getActivity() != null && a.getActivity().getId().longValue() == eventId)
                    .filter(a -> a.getStatus() != ApplicationStatus.CANCELED)
                    .findFirst()
                    .orElse(null);

            if (appToCancel != null) {
                appToCancel.setStatus(ApplicationStatus.CANCELED);
                applicationRepository.save(appToCancel);
                response.put("success", true);
                return ResponseEntity.ok(response);
            }
        }

        response.put("success", false);
        return ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/api/notifications/events")
    @ResponseBody
    public List<Map<String, Object>> getEventNotifications(Authentication authentication) {
        List<Map<String, Object>> result = new ArrayList<>();

        if (authentication == null || !authentication.isAuthenticated()) {
            return result;
        }

        String currentUsername = authentication.getName();
        SystemUser currentUser = userRepository.findByUsername(currentUsername);

        if (currentUser != null) {
            List<Application> userApplications = applicationRepository.findByVolunteer(currentUser);

            for (Application app : userApplications) {
                if (app.getActivity() == null) continue;

                if (app.getStatus() == ApplicationStatus.CANCELED) {
                    continue;
                }

                var activity = app.getActivity();
                var event = activity.getEvent();

                Map<String, Object> notification = new HashMap<>();

                String statusRu = app.getStatus() == ApplicationStatus.ACCEPTED ? "одобрена" :
                        app.getStatus() == ApplicationStatus.REJECTED ? "отклонена" : "на рассмотрении";
                notification.put("text", "Заявка на \"" + activity.getName() + "\" " + statusRu + ". Нажмите для деталей.");

                notification.put("activityId", activity.getId());
                notification.put("title", activity.getName());
                notification.put("description", activity.getDescription());
                notification.put("volunteersMax", activity.getMaxVolunteers());

                long acceptedCount = activity.getApplications() != null ?
                        activity.getApplications().stream().filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED).count() : 0;
                notification.put("volunteersCurrent", acceptedCount);

                String dateStr = (event != null) ? event.getStartDate() + " - " + event.getEndDate() : "";
                notification.put("datetime", dateStr + " | " + activity.getStartTime() + " - " + activity.getEndTime());

                notification.put("format", event != null ? event.getFormat() : null);
                notification.put("direction", event != null ? event.getDirection() : null);

                result.add(notification);
            }
        }
        return result;
    }

    @PostMapping("/api/applications/apply")
    @ResponseBody
    public ResponseEntity<?> applyForEvent(@RequestBody Map<String, Object> payload, Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        if (authentication == null || !authentication.isAuthenticated()) {
            response.put("success", false);
            response.put("message", "Пользователь не авторизован");
            return ResponseEntity.status(401).body(response);
        }

        long activityId = Long.parseLong(payload.get("eventId").toString());
        String currentUsername = authentication.getName();
        SystemUser currentUser = userRepository.findByUsername(currentUsername);
        Activity activity = activityRepository.findById(activityId).orElse(null);

        if (currentUser == null || activity == null) {
            response.put("success", false);
            response.put("message", "Данные пользователя или мероприятия не найдены");
            return ResponseEntity.badRequest().body(response);
        }

        List<Application> existingApps = applicationRepository.findByVolunteer(currentUser);

        boolean alreadyApplied = existingApps.stream()
                .anyMatch(a -> a.getActivity().getId().longValue() == activityId && a.getStatus() != ApplicationStatus.CANCELED);

        if (alreadyApplied) {
            response.put("success", false);
            response.put("message", "Вы уже подали заявку на это мероприятие");
            return ResponseEntity.badRequest().body(response);
        }

        long acceptedCount = activity.getApplications() != null ?
                activity.getApplications().stream().filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED).count() : 0;
        if (activity.getMaxVolunteers() != null && acceptedCount >= activity.getMaxVolunteers()) {
            response.put("success", false);
            response.put("message", "Набор участников окончен");
            return ResponseEntity.badRequest().body(response);
        }

        Application targetApp = existingApps.stream()
                .filter(a -> a.getActivity().getId().longValue() == activityId && a.getStatus() == ApplicationStatus.CANCELED)
                .findFirst()
                .orElse(null);

        if (targetApp != null) {
            targetApp.setStatus(ApplicationStatus.PENDING);
            applicationRepository.save(targetApp);
        } else {
            Application newApplication = new Application();
            newApplication.setVolunteer(currentUser);
            newApplication.setActivity(activity);
            newApplication.setStatus(ApplicationStatus.PENDING);
            applicationRepository.save(newApplication);
        }

        response.put("success", true);
        response.put("status", "На рассмотрении");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile_edit")
    public String showProfileEditor(Model model, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "redirect:/login";
        }

        String currentUsername = authentication.getName();
        SystemUser currentUser = userRepository.findByUsername(currentUsername);

        if (currentUser == null) {
            return "redirect:/login";
        }

        model.addAttribute("userForm", currentUser);
        return "home/profile_editor";
    }

    @PostMapping("/profile_edit")
    public String updateProfile(@ModelAttribute("userForm") SystemUser updatedForm,
                                @RequestParam(value = "experiences", required = false) List<String> experiences,
                                @RequestParam(value = "avatarFile", required = false) MultipartFile file,
                                Authentication authentication,
                                BindingResult bindingResult) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "redirect:/login";
        }

        String currentUsername = authentication.getName();
        SystemUser databaseUser = userRepository.findByUsername(currentUsername);

        if (databaseUser == null) {
            return "redirect:/login";
        }

        databaseUser.setLastName(updatedForm.getLastName());
        databaseUser.setFirstName(updatedForm.getFirstName());
        databaseUser.setMiddleName(updatedForm.getMiddleName());
        databaseUser.setVolunteerBookId(updatedForm.getVolunteerBookId());
        databaseUser.setBirthDate(updatedForm.getBirthDate());
        databaseUser.setEmail(updatedForm.getEmail());
        databaseUser.setPhoneNumber(updatedForm.getPhoneNumber());
        databaseUser.setAdditionalLanguage(updatedForm.getAdditionalLanguage());

        if (databaseUser.getExperiences() != null) {
            databaseUser.getExperiences().clear();
        } else {
            databaseUser.setExperiences(new HashSet<>());
        }

        if (experiences != null && !experiences.isEmpty()) {
            for (String expString : experiences) {
                try {
                    ParticipationExperience enumValue = ParticipationExperience.valueOf(expString.toUpperCase().trim());
                    databaseUser.getExperiences().add(enumValue);
                } catch (IllegalArgumentException e) {
                }
            }
        }

        try {
            if (file != null && !file.isEmpty()) {
                databaseUser.setProfile_picture(file.getBytes());
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        if (updatedForm.getPassword() != null && !updatedForm.getPassword().trim().isEmpty()) {
            if (updatedForm.getPassword().equals(updatedForm.getPasswordConfirm())) {
                userService.save(databaseUser);
            } else {
                bindingResult.rejectValue("passwordConfirm", "error.userForm", "Пароли не совпадают");
                return "home/profile_editor";
            }
        } else {
            userRepository.save(databaseUser);
        }

        return "redirect:/volunteer_home";
    }

    // --- ПОЛНОСТЬЮ ИЗМЕНЕННЫЙ МЕТОД (Теперь данные для карточек захардкожены) ---
    @RequestMapping(value = "/volunteer_home", method = RequestMethod.GET)
    public String volunteerHome(Model model, Authentication authentication) {

//        List<Map<String, Object>> top3Cards = new ArrayList<>();
//
//        // Карточка 1
//        Map<String, Object> card1 = new HashMap<>();
//        card1.put("activityId", -1L);
//        card1.put("title", "Эко-субботник «Чистый берег»");
//        card1.put("organizer", "ЭкоСтарт");
//        card1.put("description", "Очистка береговой линии от мусора."); // ДОБАВЛЕНО
//        card1.put("direction", "Экология");
//        card1.put("forces", "Муниципальный");
//        card1.put("format", "Очный");
//        card1.put("datetime", "15–17 мая 2026, 10:00 – 16:00");
//        card1.put("location", "г. Самара, набережная, спуск у Ладьи");
//        card1.put("volunteersCurrent", 30);
//        card1.put("volunteersMax", 30);
//        card1.put("isClosed", true);
//        card1.put("text", "");
//        top3Cards.add(card1);
//
//        // Карточка 2
//        Map<String, Object> card2 = new HashMap<>();
//        card2.put("activityId", -2L);
//        card2.put("title", "Фестиваль «Добрая Встреча»");
//        card2.put("organizer", "Ресурсный центр добровольчества");
//        card2.put("description", "Помощь в организации городского фестиваля."); // ДОБАВЛЕНО
//        card2.put("direction", "Событийное");
//        card2.put("forces", "Региональный");
//        card2.put("format", "Очный");
//        card2.put("datetime", "5–7 июня 2026, 09:00 – 20:00");
//        card2.put("location", "г. Самара, Парк им. Гагарина");
//        card2.put("volunteersCurrent", 50);
//        card2.put("volunteersMax", 50);
//        card2.put("isClosed", true);
//        card2.put("text", "");
//        top3Cards.add(card2);
//
//        // Карточка 3
//        Map<String, Object> card3 = new HashMap<>();
//        card3.put("activityId", -3L);
//        card3.put("title", "Марафон «Помощь рядом»");
//        card3.put("organizer", "Федерация цифрового волонтёрства");
//        card3.put("description", "Онлайн-поддержка социальных проектов."); // ДОБАВЛЕНО
//        card3.put("direction", "Социальная помощь");
//        card3.put("forces", "Всероссийский");
//        card3.put("format", "Онлайн");
//        card3.put("datetime", "20 июня 2026, 12:00 – 15:00");
//        card3.put("location", "Онлайн-платформа");
//        card3.put("volunteersCurrent", 15);
//        card3.put("volunteersMax", 100);
//        card3.put("isClosed", true); // Сделал true, чтобы кнопка была "Набор завершён"
//        card3.put("text", "");
//        top3Cards.add(card3);
//
//        model.addAttribute("topActivities", top3Cards);
        return "volunteer_home";
    }

    @GetMapping("/api/catalog/events")
    @ResponseBody
    public List<Map<String, Object>> getAllCatalogEvents(Authentication authentication) {
        List<Map<String, Object>> result = new ArrayList<>();

        SystemUser currentUser = null;
        List<Application> userApplications = new ArrayList<>();

        if (authentication != null && authentication.isAuthenticated()) {
            currentUser = userRepository.findByUsername(authentication.getName());
            if (currentUser != null) {
                userApplications = applicationRepository.findByVolunteer(currentUser);
            }
        }

        List<Activity> allActivities = activityRepository.findAll();
        Map<Long, Map<String, Object>> eventsMap = new HashMap<>();

        for (Activity act : allActivities) {
            Event event = act.getEvent();
            if (event == null) continue;

            long eventId = event.getId();
            Map<String, Object> eventDto = eventsMap.get(eventId);

            if (eventDto == null) {
                eventDto = new HashMap<>();
                eventDto.put("eventId", eventId);
                eventDto.put("title", event.getName());
                eventDto.put("description", event.getDescription() != null ? event.getDescription() : "Описание отсутствует");
                eventDto.put("location", event.getLocation());

                String dirStr = event.getDirection() != null ? event.getDirection().getDisplayName() : null;
                String formStr = event.getFormat() != null ? event.getFormat().getDisplayName() : null;
                String forceStr = event.getForces() != null ? event.getForces().getDisplayName() : null;

                eventDto.put("direction", dirStr);
                eventDto.put("format", formStr);
                eventDto.put("forces", forceStr);

                eventDto.put("directions", dirStr != null ? Collections.singletonList(dirStr) : new ArrayList<>());
                eventDto.put("formats", formStr != null ? Collections.singletonList(formStr) : new ArrayList<>());
                eventDto.put("territories", forceStr != null ? Collections.singletonList(forceStr) : new ArrayList<>());

                String dateStr = formatRussianDate(event.getStartDate());
                String endStr = formatRussianDate(event.getEndDate());
                if (!dateStr.equals(endStr) && !endStr.isEmpty()) {
                    dateStr += " – " + endStr;
                }
                eventDto.put("datetime", dateStr);

                eventDto.put("activities", new ArrayList<Map<String, Object>>());
                eventsMap.put(eventId, eventDto);
            }

            Map<String, Object> actDto = new HashMap<>();
            actDto.put("activityId", act.getId());
            actDto.put("title", act.getName());

            java.time.format.DateTimeFormatter dateFormatter = java.time.format.DateTimeFormatter.ofPattern("d MMMM yyyy", new java.util.Locale("ru"));
            java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");

            String startDateStr = act.getStartTime() != null ? act.getStartTime().format(timeFormatter) : "";
            String endDateStr = act.getEndTime() != null ? act.getEndTime().format(timeFormatter) : "";

            String actDateStr = startDateStr;
            if (!startDateStr.equals(endDateStr) && !endDateStr.isEmpty()) {
                actDateStr += " – " + endDateStr;
            }
            if (actDateStr.isEmpty()) {
                actDateStr = "Дата не указана";
            }

// 3. Достаем время (Например: "18:00 - 20:00")
            String startTimeStr = act.getStartTime() != null ? act.getStartTime().format(timeFormatter) : "";
            String endTimeStr = act.getEndTime() != null ? act.getEndTime().format(timeFormatter) : "";
            String actTimeStr = startTimeStr + " – " + endTimeStr;

// 4. Кладем в JSON раздельно!
            actDto.put("date", actDateStr);
            actDto.put("time", actTimeStr);

            long maxVols = act.getMaxVolunteers() != null ? act.getMaxVolunteers() : 0;
            long acceptedCount = act.getApplications() != null ?
                    act.getApplications().stream().filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED).count() : 0;

            actDto.put("volunteersMax", maxVols);
            actDto.put("volunteersCurrent", acceptedCount);
            actDto.put("isClosed", maxVols > 0 && acceptedCount >= maxVols);

            Application userApp = userApplications.stream()
                    .filter(a -> a.getActivity().getId().longValue() == act.getId().longValue() && a.getStatus() != ApplicationStatus.CANCELED)
                    .findFirst()
                    .orElse(null);

            if (userApp != null) {
                String statusRu = userApp.getStatus() == ApplicationStatus.ACCEPTED ? "Одобрена" :
                        userApp.getStatus() == ApplicationStatus.REJECTED ? "Отклонена" : "На рассмотрении";
                actDto.put("userStatus", statusRu);
            } else {
                actDto.put("userStatus", null);
            }

            ((List<Map<String, Object>>) eventDto.get("activities")).add(actDto);
        }

        result.addAll(eventsMap.values());
        return result;
    }

    private String formatRussianDate(Object dateObj) {
        if (dateObj == null) return "";
        String str = dateObj.toString();
        try {
            java.time.LocalDate date = java.time.LocalDate.parse(str.length() > 10 ? str.substring(0, 10) : str);
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("d MMMM yyyy", new java.util.Locale("ru"));
            return date.format(formatter);
        } catch (Exception e) {
            return str;
        }
    }
}