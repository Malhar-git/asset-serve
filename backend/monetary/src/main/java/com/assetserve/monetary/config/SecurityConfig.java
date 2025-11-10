package com.assetserve.monetary.config;

import com.assetserve.monetary.filter.JwtAuthFilter;
import jakarta.servlet.Filter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration // Tells Spring this is a configuration file
@EnableWebSecurity // Turns on modern Spring Security
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final Http401UnauthorizedEntryPoint unauthorizedEntryPoint;

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
                ).sessionManagement(session-> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedEntryPoint))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore((Filter) jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}