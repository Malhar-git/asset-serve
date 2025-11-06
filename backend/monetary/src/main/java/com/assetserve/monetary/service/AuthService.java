package com.assetserve.monetary.service;

import com.assetserve.monetary.model.User;
import com.assetserve.monetary.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    // Inject User Repository that we made
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthService(UserRepository userRepository)
    {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public User registerUser(String firstName, String email, String password) {
        if (userRepository.existsByEmail(email)){
            throw new RuntimeException("Email already exists");
        }

        //Encryption
        String hashedPassword = passwordEncoder.encode(password);

        User newUser = User.builder()
                .firstName(firstName)
                .email(email)
                .password(hashedPassword) // TODO: Add password hashing
                .build();

        return userRepository.save(newUser);
    }
}
