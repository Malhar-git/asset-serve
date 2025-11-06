package com.assetserve.monetary.service;

import com.assetserve.monetary.model.User;
import com.assetserve.monetary.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

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

    public User loginUser(String email, String password) {
        //Find user by their email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Inavalid email or password"));


        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Inavalid password");//    (Security Best Practice: Don't tell the attacker *which* part was wrong)
        }
        return user;
    }
}
