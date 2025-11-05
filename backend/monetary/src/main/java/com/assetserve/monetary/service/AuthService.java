package com.assetserve.monetary.service;

import com.assetserve.monetary.model.User;
import com.assetserve.monetary.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    // Inject User Repository that we made
    private final UserRepository userRepository;

    @Autowired
    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerUser(String firstName, String email, String password) {
        if (userRepository.existsByEmail(email)){
            throw new RuntimeException("Email already exists");
        }

        User newUser = User.builder()
                .firstName(firstName)
                .email(email)
                .password(password) // TODO: Add password hashing
                .build();

        return userRepository.save(newUser);
    }
}
