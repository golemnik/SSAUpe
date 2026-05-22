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
    public String registration(@ModelAttribute("userForm") SystemUser clientForm, BindingResult bindingResult, Model model) {
        userValidator.validate(clientForm, bindingResult);

        if (bindingResult.hasErrors()) {
            System.out.println("Валидация не пройдена. Обнаружены ошибки:");
            return "registration";
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

    @RequestMapping(value = "/volunteer_home", method = RequestMethod.GET)
    public String volunteerHome(Model model) {
        return "volunteer_home";
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

        if (payload == null || payload.getEventId() == null || payload.getEventId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(response);
        }

        // ИСПРАВЛЕНИЕ: Переводим в Integer, так как в сущностях Activity и Application ID является Integer!
        Integer eventId;
        try {
            eventId = Integer.parseInt(payload.getEventId().trim());
            System.out.println("[LOG] Успешно распарсен ID активности как Integer: " + eventId);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(response);
        }

        String currentUsername = authentication.getName();
        SystemUser currentUser = userRepository.findByUsername(currentUsername);

        if (currentUser != null) {
            List<Application> userApplications = applicationRepository.findByVolunteer(currentUser);

            // Теперь это сравнение (Integer сопоставляется с Integer) вернет true!
            Application appToCancel = userApplications.stream()
                    .filter(a -> a.getActivity() != null && a.getActivity().getId().equals(eventId))
                    .findFirst()
                    .orElse(null);

            if (appToCancel != null) {
                appToCancel.setStatus(ApplicationStatus.CANCELED);
                applicationRepository.save(appToCancel);

                System.out.println("[LOG SUCCESS] Статус заявки успешно изменен на CANCELED в БД.");
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

                // ИСПРАВЛЕНИЕ: Если заявка отменена волонтером, полностью скрываем ее из списков уведомлений
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

                notification.put("format", activity.getFormat());
                notification.put("direction", activity.getDirection());

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

        Long activityId = Long.parseLong(payload.get("eventId").toString());
        String currentUsername = authentication.getName();
        SystemUser currentUser = userRepository.findByUsername(currentUsername);
        Activity activity = activityRepository.findById(activityId).orElse(null);

        if (currentUser == null || activity == null) {
            response.put("success", false);
            response.put("message", "Данные пользователя или мероприятия не найдены");
            return ResponseEntity.badRequest().body(response);
        }

        // АЛЬТЕРНАТИВА А2: Проверяем, нет ли уже АКТИВНОЙ (не отмененной) заявки на это событие
        List<Application> existingApps = applicationRepository.findByVolunteer(currentUser);
        boolean alreadyApplied = existingApps.stream()
                .anyMatch(a -> a.getActivity().getId().equals(activityId) && a.getStatus() != ApplicationStatus.CANCELED);

        if (alreadyApplied) {
            response.put("success", false);
            response.put("reason", "A2");
            response.put("message", "Вы уже подали заявку на это мероприятие");
            return ResponseEntity.badRequest().body(response);
        }

        // АЛЬТЕРНАТИВА А1: Набор участников окончен
        long acceptedCount = activity.getApplications() != null ?
                activity.getApplications().stream().filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED).count() : 0;
        if (activity.getMaxVolunteers() != null && acceptedCount >= activity.getMaxVolunteers()) {
            response.put("success", false);
            response.put("reason", "A1");
            response.put("message", "Набор участников окончен");
            return ResponseEntity.badRequest().body(response);
        }

        // Если пользователь ранее отменял заявку, а теперь подает снова — обновляем старую или создаем новую
        Application targetApp = existingApps.stream()
                .filter(a -> a.getActivity().getId().equals(activityId) && a.getStatus() == ApplicationStatus.CANCELED)
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
        response.put("message", "Заявка успешно зарегистрирована в системе");
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
                    // Игнорируем
                }
            }
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

}
