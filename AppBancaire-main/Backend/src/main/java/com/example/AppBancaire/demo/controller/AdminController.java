package com.example.bank.demo.controller;

import com.example.bank.demo.model.Agency;
import com.example.bank.demo.model.User;
import com.example.bank.demo.service.AgencyService;
import com.example.bank.demo.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AdminController {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    
    @Autowired
    private UserService userService;

    @Autowired
    private AgencyService agencyService;

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isAdmin(username)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            List<User> users = userService.getAllUsers();
            users.forEach(user -> {
                user.setPassword(null);
                user.setAccounts(null);
            });
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error fetching users", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        logger.info("Received request to create user: {}", user.getUsername());
        try {
            User createdUser = userService.createUser(user);
            logger.info("Created user with ID: {}", createdUser.getId());
            return ResponseEntity.ok(createdUser);
        } catch (Exception e) {
            logger.error("Error creating user", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        logger.info("Received request to get user with ID: {}", id);
        try {
            User user = userService.getUserById(id);
            logger.info("Found user: {}", user.getUsername());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error getting user with ID: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        logger.info("Received request to update user with ID: {}", id);
        try {
            User updatedUser = userService.updateUserAsAdmin(id, userDetails);
            logger.info("Updated user: {}", updatedUser.getUsername());
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Error updating user with ID: {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isAdmin(username)) {
                return ResponseEntity.status(403).body(Map.of("error", "Accès non autorisé"));
            }

            // Vérifier que l'utilisateur n'essaie pas de se supprimer lui-même
            User currentUser = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (currentUser.getId().equals(id)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Vous ne pouvez pas supprimer votre propre compte"
                ));
            }

            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé avec succès"));
        } catch (Exception e) {
            logger.error("Error deleting user with ID: {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/agencies")
    public ResponseEntity<?> createAgency(
        @RequestBody Map<String, Object> request,
        @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isAdmin(username)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            Agency agency = new Agency();
            agency.setCode((String) request.get("code"));
            agency.setName((String) request.get("name"));
            agency.setAddress((String) request.get("address"));
            agency.setPhone((String) request.get("phone"));
            agency.setEmail((String) request.get("email"));

            Long directorId = Long.parseLong(request.get("directorId").toString());
            Agency createdAgency = agencyService.createAgency(agency, directorId);

            return ResponseEntity.ok(createdAgency);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/agencies")
    public ResponseEntity<?> getAllAgencies(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isAdmin(username)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            List<Agency> agencies = agencyService.getAllAgencies();
            agencies.forEach(agency -> {
                if (agency.getDirector() != null) {
                    agency.getDirector().setAccounts(null);
                    agency.getDirector().setPassword(null);
                }
            });
            return ResponseEntity.ok(agencies);
        } catch (Exception e) {
            logger.error("Error fetching agencies", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/agencies/{id}")
    public ResponseEntity<?> deleteAgency(
        @PathVariable Long id,
        @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isAdmin(username)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            agencyService.deleteAgency(id);
            return ResponseEntity.ok().body(Map.of("message", "Agence supprimée avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/agencies/{id}")
    public ResponseEntity<?> updateAgency(
        @PathVariable Long id,
        @RequestBody Map<String, Object> request,
        @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isAdmin(username)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            Agency agency = agencyService.getAgencyById(id);
            agency.setCode((String) request.get("code"));
            agency.setName((String) request.get("name"));
            agency.setAddress((String) request.get("address"));
            agency.setPhone((String) request.get("phone"));
            agency.setEmail((String) request.get("email"));

            if (request.get("directorId") != null) {
                Long directorId = Long.parseLong(request.get("directorId").toString());
                User director = userService.getUserById(directorId);
                agency.setDirector(director);
            }

            Agency updatedAgency = agencyService.updateAgency(id, agency);
            return ResponseEntity.ok(updatedAgency);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String extractUsername(String authHeader) {
        String base64Credentials = authHeader.substring("Basic".length()).trim();
        String credentials = new String(Base64.getDecoder().decode(base64Credentials));
        return credentials.split(":", 2)[0];
    }
} 