package com.ssau.project.ssaupe.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/css/**", "/js/**", "/images/**", "/favicon/**").permitAll()
                        .requestMatchers("/registration", "/home", "/home/**", "/back_home").permitAll()
                        .requestMatchers("/volunteer_home", "/volunteer_home/**").hasAnyAuthority("USER", "ADMIN")
                        .requestMatchers("/organizer_home", "/organizer_home/**").hasAnyAuthority("ADMIN")
                        .requestMatchers("/api/organizer/events", "/api/organizer/events/**").hasAnyAuthority("ADMIN")
                        .anyRequest().authenticated()
                )
                .formLogin((form) -> form
                        .permitAll()
                        .loginPage("/login")
                        .loginProcessingUrl("/perform-login")
                        .usernameParameter("username")
                        .passwordParameter("password")
                        .successHandler((request, response, authentication) -> {
                            var roles = org.springframework.security.core.authority.AuthorityUtils
                                    .authorityListToSet(authentication.getAuthorities());
                            if (roles.contains("ADMIN")) {
                                response.sendRedirect("/organizer_home");
                            } else {
                                response.sendRedirect("/volunteer_home");
                            }
                        })
                )
                .logout((out) -> out
                        .permitAll()
                        .logoutSuccessUrl("/home")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                )
        ;

        return http.build();
    }
}