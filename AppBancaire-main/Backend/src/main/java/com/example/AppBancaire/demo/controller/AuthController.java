package com.example.bank.demo.controller;

import com.example.bank.demo.model.User;
import com.example.bank.demo.model.Account;
import com.example.bank.demo.service.UserService;
import com.example.bank.demo.service.AccountService;
import com.example.bank.demo.security.LoginAttemptService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private UserService userService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestHeader("Authorization") String authHeader) {
        try {
            String base64Credentials = authHeader.substring("Basic".length()).trim();
            String credentials = new String(Base64.getDecoder().decode(base64Credentials));
            String[] values = credentials.split(":", 2);
            String username = values[0];
            String password = values[1];

            // Vérifier si l'utilisateur est bloqué
            if (loginAttemptService.isBlocked(username)) {
                long remainingTime = loginAttemptService.getRemainingBlockTime(username);
                String timeUnit = loginAttemptService.isInLongBlock(username) ? "heures" : "minutes";
                String message = loginAttemptService.isInLongBlock(username) 
                    ? "Compte bloqué pour 24 heures suite à de multiples tentatives échouées."
                    : "Trop de tentatives échouées. Réessayez dans " + remainingTime + " " + timeUnit + ".";
                
                return ResponseEntity.status(429).body(Map.of(
                    "error", "Compte temporairement bloqué",
                    "message", message,
                    "remainingTime", remainingTime,
                    "isLongBlock", loginAttemptService.isInLongBlock(username)
                ));
            }

            User user = userService.authenticate(username, password);
            
            if (user != null) {
                // Réinitialiser le compteur de tentatives en cas de succès
                loginAttemptService.loginSucceeded(username);

                if ("ROLE_USER".equals(user.getRole())) {
                    List<Account> userAccounts = accountService.getAccountsByUsername(username);
                    boolean allAccountsClosed = userAccounts.stream()
                        .allMatch(account -> "CLOSED".equals(account.getStatus()));

                    if (allAccountsClosed) {
                        return ResponseEntity.status(403).body(Map.of(
                            "error", "Votre compte a été clôturé. Veuillez contacter votre agence."
                        ));
                    }
                }

                Map<String, String> response = new HashMap<>();
                response.put("role", user.getRole());
                response.put("username", user.getUsername());
                response.put("id", user.getId().toString());
                response.put("fullName", user.getFullName());
                return ResponseEntity.ok(response);
            }
            
            // Incrémenter le compteur de tentatives échouées
            loginAttemptService.loginFailed(username);
            
            return ResponseEntity.status(401).body(Map.of(
                "error", "Identifiants invalides",
                "remainingAttempts", (3 - loginAttemptService.getAttempts(username))
            ));
        } catch (Exception e) {
            logger.error("Error during authentication", e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Une erreur est survenue lors de l'authentification"
            ));
        }
    }
} 