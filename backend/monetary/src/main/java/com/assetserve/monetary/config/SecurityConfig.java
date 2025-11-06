package com.assetserve.monetary.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration // Tells Spring this is a configuration file
@EnableWebSecurity // Turns on modern Spring Security
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); //Creating a password hashing tool
    }

    @Bean // Creates a "Bean" (a managed object) that defines our security rules
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Disable CSRF protection. This is standard for stateless REST APIs
                // that use JSON, not HTML forms.
                .csrf(AbstractHttpConfigurer::disable)

                // 2. This is the most important part: The "Whitelist"
                .authorizeHttpRequests(authz -> authz
                        // This makes your /api/auth/register endpoint public.
                        .requestMatchers("/api/auth/**").permitAll()
                        //For any other request in the application...
                        .anyRequest()
                        //user MUST be authenticated.
                        .authenticated()
                );

        return http.build();
    }
}