package com.ssau.project.ssaupe.controller;

import com.ssau.project.ssaupe.model.Role;
import com.ssau.project.ssaupe.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class RoleInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        // Проверяем и создаем роль ADMIN
        if (roleRepository.findByName("ADMIN") == null) {
            Role adminRole = new Role();
            adminRole.setId(1L);
            adminRole.setName("ADMIN");
            roleRepository.save(adminRole);
            System.out.println("Роль ADMIN успешно создана.");
        }

        // Проверяем и создаем роль USER
        if (roleRepository.findByName("USER") == null) {
            Role userRole = new Role();
            userRole.setId(2L);
            userRole.setName("USER");
            roleRepository.save(userRole);
            System.out.println("Роль USER успешно создана.");
        }
    }
}