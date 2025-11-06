package com.assetserve.monetary.controller;

import com.assetserve.monetary.dto.LoginRequest;
import com.assetserve.monetary.dto.LoginResponse;
import com.assetserve.monetary.dto.RegisterRequest;
import com.assetserve.monetary.model.User;
import com.assetserve.monetary.service.AuthService;
import com.assetserve.monetary.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @Autowired
    public AuthController(AuthService authService, JwtService jwtService) {

        this.authService = authService;
        this.jwtService = jwtService;

    }

    // This creates our first endpoint: POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<String> registerUser( @RequestBody RegisterRequest request) {
        // @RequestBody tells Spring to turn the incoming JSON into our RegisterRequest object
        try{
            authService.registerUser(
                    request.getFirstName(),
                    request.getEmail(),
                    request.getPassword()
            );

            // If it succeeds, return a 200 OK status with a message
            return ResponseEntity.ok("User registered successfully");
        }catch(RuntimeException e){
            // If the user already exists (from our AuthService logic)
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser( @Valid @RequestBody LoginRequest request) {
        try{
            User user = authService.loginUser(
                    request.getEmail(),
                    request.getPassword()
            );

            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(new LoginResponse(token));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(e.getMessage());
        }
    }

}
