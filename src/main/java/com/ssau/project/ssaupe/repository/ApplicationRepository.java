package com.ssau.project.ssaupe.repository;

import com.ssau.project.ssaupe.model.Application;
import com.ssau.project.ssaupe.model.SystemUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    List<Application> findByVolunteer(SystemUser volunteer);
}