package com.example.bank.demo.controller;

import com.example.bank.demo.model.Account;
import com.example.bank.demo.model.BankCard;
import com.example.bank.demo.model.User;
import com.example.bank.demo.model.AccountCreationRequest;
import com.example.bank.demo.repository.BankCardRepository;
import com.example.bank.demo.service.AccountService;
import com.example.bank.demo.service.UserService;
import com.example.bank.demo.model.Transaction;
import com.example.bank.demo.service.TransactionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Date;
import java.util.stream.Collectors;

import com.example.bank.demo.model.CashierLog;
import com.example.bank.demo.service.CashierLogService;
import com.example.bank.demo.repository.TransactionRepository;
import com.example.bank.demo.model.Agency;
import com.example.bank.demo.service.AgencyService;

@RestController
@RequestMapping("/api/cashier")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class CashierController {
    
    @Autowired
    private TransactionService transactionService;
    
    @Autowired
    private AccountService accountService;
    
    @Autowired
    private UserService userService;

    @Autowired
    private BankCardRepository bankCardRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CashierLogService cashierLogService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AgencyService agencyService;

    private static final Logger logger = LoggerFactory.getLogger(CashierController.class);

    private String extractUsername(String authHeader) {
        String base64Credentials = authHeader.substring("Basic".length()).trim();
        String credentials = new String(Base64.getDecoder().decode(base64Credentials));
        return credentials.split(":", 2)[0];
    }

    private String generateAccountNumber() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    @GetMapping("/accounts/all")
    public ResponseEntity<List<Account>> getAllAccounts(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).build();
            }

            // Récupérer tous les comptes actifs sans filtrer par agence
            List<Account> accounts = accountService.getActiveAccounts();
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des comptes:", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/accounts/agency")
    public ResponseEntity<List<Account>> getAgencyAccounts(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).build();
            }

            if (cashier.getAgency() == null) {
                throw new RuntimeException("Caissier non associé à une agence");
            }

            // Récupérer les comptes de l'agence du caissier
            List<Account> accounts = accountService.getActiveAccounts().stream()
                .filter(account -> account.getUser().getAgency() != null 
                    && account.getUser().getAgency().getId().equals(cashier.getAgency().getId()))
                .collect(Collectors.toList());

            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des comptes:", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/accounts/{accountId}/balance")
    public ResponseEntity<?> updateBalance(
            @PathVariable Long accountId,
            @RequestBody Map<String, Double> balanceUpdate,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String base64Credentials = authHeader.substring("Basic".length()).trim();
            String credentials = new String(Base64.getDecoder().decode(base64Credentials));
            String[] values = credentials.split(":", 2);
            String username = values[0];

            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            Double newBalance = balanceUpdate.get("balance");
            if (newBalance == null) {
                return ResponseEntity.badRequest().body("Balance is required");
            }

            Account updatedAccount = accountService.updateBalance(accountId, newBalance);
            return ResponseEntity.ok(updatedAccount);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/cards")
    public ResponseEntity<?> createBankCard(@RequestBody BankCard card, @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            if (bankCardRepository.existsByCardNumber(card.getCardNumber())) {
                return ResponseEntity.badRequest().body("Card number already exists");
            }

            if (card.getAccount() == null || card.getAccount().getId() == null) {
                return ResponseEntity.badRequest().body("Account is required");
            }

            Account account = accountService.getAccountById(card.getAccount().getId())
                .orElseThrow(() -> new RuntimeException("Account not found"));
            card.setAccount(account);

            BankCard savedCard = bankCardRepository.save(card);

            // Ajouter le log pour la création de la carte
            cashierLogService.createDetailedLog(
                "CARD_CREATION",
                "Création de carte bancaire",
                cashier,
                "SUCCESS",
                null,
                account.getAccountNumber(),
                account.getUser().getFullName(),
                "Carte " + card.getCardNumber() + " créée"
            );

            return ResponseEntity.ok(savedCard);
        } catch (Exception e) {
            logger.error("Error creating bank card:", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/accounts/{accountId}/cards")
    public ResponseEntity<?> getAccountCards(
        @PathVariable Long accountId,
        @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).build();
            }

            // Vérifier que le compte appartient à l'agence du caissier
            Account account = accountService.getAccountById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            
            if (!account.getUser().getAgency().getId().equals(cashier.getAgency().getId())) {
                return ResponseEntity.status(403).build();
            }

            List<BankCard> cards = bankCardRepository.findByAccountId(accountId);
            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/cards/{cardId}/block")
    public ResponseEntity<?> blockCard(@PathVariable Long cardId, @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            // Ici, vous pouvez implémenter la logique réelle de blocage
            return ResponseEntity.ok().body("Card blocked successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/cards/{cardId}")
    public ResponseEntity<?> deleteCard(@PathVariable Long cardId, @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).build();
            }

            // Vérifier que la carte existe
            BankCard card = bankCardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));

            // Vérifier que la carte appartient à un compte de l'agence du caissier
            if (!card.getAccount().getUser().getAgency().getId().equals(cashier.getAgency().getId())) {
                return ResponseEntity.status(403).body("Not authorized to delete this card");
            }

            // Supprimer la carte
            bankCardRepository.deleteById(cardId);

            // Créer un log pour la suppression
            cashierLogService.createDetailedLog(
                "CARD_DELETION",
                "Suppression de carte bancaire",
                cashier,
                "SUCCESS",
                null,
                card.getAccount().getAccountNumber(),
                card.getAccount().getUser().getFullName(),
                "Carte " + card.getCardNumber() + " supprimée"
            );

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting bank card:", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<?> updateUserInfo(
            @PathVariable Long userId,
            @RequestBody User userDetails,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            // Vérifier si l'utilisateur existe
            User existingUser = userService.getUserById(userId);
            if (existingUser == null) {
                return ResponseEntity.notFound().build();
            }

            // Mettre à jour uniquement les champs autorisés
            existingUser.setFullName(userDetails.getFullName());
            existingUser.setEmail(userDetails.getEmail());
            existingUser.setPhone(userDetails.getPhone());
            existingUser.setAddress(userDetails.getAddress());

            // Sauvegarder les modifications
            User updatedUser = userService.updateUserAsCashier(existingUser);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Error updating user information:", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/accounts/create")
    public ResponseEntity<?> createAccount(@RequestBody AccountCreationRequest request, 
                                         @RequestHeader("Authorization") String authHeader) {
        User cashier = null;
        try {
            String username = extractUsername(authHeader);
            cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).body("Accès non autorisé");
            }

            // Vérifier que le username n'existe pas déjà
            if (userService.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest().body("Ce nom d'utilisateur existe déjà");
            }

            // Créer l'utilisateur avec le rôle USER
            User user = new User();
            user.setUsername(request.getUsername());
            String encodedPassword = userService.encodePassword(request.getPassword());
            user.setPassword(encodedPassword);
            user.setFullName(request.getFullName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setAddress(request.getAddress());
            user.setRole("ROLE_USER");
            
            // Associer l'agence du caissier au nouveau client
            if (cashier.getAgency() == null) {
                throw new RuntimeException("Le caissier n'est pas associé à une agence");
            }
            user.setAgency(cashier.getAgency());
            
            User savedUser = userService.createUser(user);

            // Créer le compte
            Account account = new Account();
            account.setUser(savedUser);
            account.setBalance(request.getInitialBalance());
            account.setAccountNumber(generateAccountNumber());
            account.setStatus("ACTIVE");
            
            Account savedAccount = accountService.createAccount(account);

            // Ajouter le log
            cashierLogService.createDetailedLog(
                "ACCOUNT_CREATION",
                "Création d'un nouveau compte",
                cashier,
                "SUCCESS",
                request.getInitialBalance(),
                savedAccount.getAccountNumber(),
                savedAccount.getUser().getFullName(),
                "Compte créé avec un solde initial de " + request.getInitialBalance() + " TND"
            );

            return ResponseEntity.ok(savedAccount);
        } catch (Exception e) {
            if (cashier != null) {
                cashierLogService.createDetailedLog(
                    "ACCOUNT_CREATION",
                    "Échec de création de compte",
                    cashier,
                    "FAILED",
                    null,
                    null,
                    request.getFullName(),
                    e.getMessage()
                );
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/accounts/{accountId}/close")
    public ResponseEntity<?> closeAccount(
        @PathVariable Long accountId,
        @RequestBody Map<String, String> request,
        @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Access denied"
                ));
            }

            // Vérifier le mot de passe du caissier
            String password = request.get("password");
            if (!userService.verifyPassword(username, password)) {
                return ResponseEntity.status(401).body(Map.of(
                    "error", "Mot de passe incorrect"
                ));
            }

            Account account = accountService.getAccountById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

            // Vérifier si le compte n'est pas déjà clôturé
            if ("CLOSED".equals(account.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Ce compte est déjà clôturé"
                ));
            }

            // Créer une transaction pour la clôture
            Transaction closeTransaction = new Transaction();
            closeTransaction.setAccount(account);
            closeTransaction.setAmount(account.getBalance());
            closeTransaction.setType("ACCOUNT_CLOSURE");
            closeTransaction.setDescription("Clôture du compte");
            closeTransaction.setDate(new Date());
            closeTransaction.setFromAccount(account.getAccountNumber());
            closeTransaction.setToAccount("BANK");
            transactionService.createTransaction(closeTransaction);

            // Mettre le solde à zéro et marquer comme clôturé
            double previousBalance = account.getBalance();
            account.setBalance(0.0);
            account.setStatus("CLOSED");
            accountService.updateAccount(account);

            // Ajouter le log de clture
            cashierLogService.createDetailedLog(
                "ACCOUNT_CLOSURE",
                "Clôture de compte",
                cashier,
                "SUCCESS",
                previousBalance,
                account.getAccountNumber(),
                account.getUser().getFullName(),
                "Clôture du compte avec solde de " + previousBalance + " TND"
            );

            return ResponseEntity.ok().body(Map.of(
                "message", "Account closed successfully"
            ));
        } catch (Exception e) {
            // Log en cas d'erreur
            User cashier = userService.findByUsername(extractUsername(authHeader))
                .orElse(null);
            if (cashier != null) {
                cashierLogService.createDetailedLog(
                    "ACCOUNT_CLOSURE",
                    "Échec de clôture de compte",
                    cashier,
                    "FAILED",
                    null,
                    null,
                    null,
                    e.getMessage()
                );
            }
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/accounts/{accountId}/deposit")
    public ResponseEntity<?> deposit(
        @PathVariable Long accountId,
        @RequestBody Map<String, Object> request,
        @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            Double amount = Double.parseDouble(request.get("amount").toString());
            String description = (String) request.get("description");

            Account account = accountService.getAccountById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

            // Vérifier si le compte n'est pas clôtur��
            if ("CLOSED".equals(account.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Ce compte est clôturé"
                ));
            }

            // Créer la transaction de dépôt
            Transaction depositTransaction = new Transaction();
            depositTransaction.setAccount(account);
            depositTransaction.setAmount(amount);
            depositTransaction.setType("DEPOSIT");
            depositTransaction.setDescription(description != null ? description : "Dépôt en espèces");
            depositTransaction.setDate(new Date());
            depositTransaction.setFromAccount("CASH");
            depositTransaction.setToAccount(account.getAccountNumber());
            transactionService.createTransaction(depositTransaction);

            // Mettre à jour le solde
            account.setBalance(account.getBalance() + amount);
            Account updatedAccount = accountService.updateAccount(account);

            // Ajouter le log de dépôt
            cashierLogService.createDetailedLog(
                "DEPOSIT",
                "Dépôt en espèces",
                cashier,
                "SUCCESS",
                amount,
                account.getAccountNumber(),
                account.getUser().getFullName(),
                description != null ? description : "Dépôt en espèces de " + amount + " TND"
            );

            return ResponseEntity.ok(Map.of(
                "message", "Dépôt effectué avec succès",
                "newBalance", updatedAccount.getBalance()
            ));
        } catch (Exception e) {
            // Log en cas d'erreur
            User cashier = userService.findByUsername(extractUsername(authHeader))
                .orElse(null);
            if (cashier != null) {
                cashierLogService.createDetailedLog(
                    "DEPOSIT",
                    "Échec de dépôt",
                    cashier,
                    "FAILED",
                    null,
                    null,
                    null,
                    e.getMessage()
                );
            }
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/accounts/{accountId}/withdraw")
    public ResponseEntity<?> withdraw(
        @PathVariable Long accountId,
        @RequestBody Map<String, Object> request,
        @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            Double amount = Double.parseDouble(request.get("amount").toString());
            String description = (String) request.get("description");

            Account account = accountService.getAccountById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

            // Vérifier si le compte n'est pas clôturé
            if ("CLOSED".equals(account.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Ce compte est clôturé"
                ));
            }

            // Vérifier le solde disponible
            if (account.getBalance() < amount) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Solde insuffisant"
                ));
            }

            // Créer la transaction de retrait
            Transaction withdrawTransaction = new Transaction();
            withdrawTransaction.setAccount(account);
            withdrawTransaction.setAmount(amount);
            withdrawTransaction.setType("WITHDRAW");
            withdrawTransaction.setDescription(description != null ? description : "Retrait en espèces");
            withdrawTransaction.setDate(new Date());
            withdrawTransaction.setFromAccount(account.getAccountNumber());
            withdrawTransaction.setToAccount("CASH");
            transactionService.createTransaction(withdrawTransaction);

            // Mettre à jour le solde
            account.setBalance(account.getBalance() - amount);
            Account updatedAccount = accountService.updateAccount(account);

            return ResponseEntity.ok(Map.of(
                "message", "Retrait effectué avec succès",
                "newBalance", updatedAccount.getBalance()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/accounts/transfer")
    public ResponseEntity<?> internalTransfer(
        @RequestBody Map<String, Object> request,
        @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            Long fromAccountId = Long.parseLong(request.get("fromAccountId").toString());
            String toAccountNumber = request.get("toAccountNumber").toString();
            Double amount = Double.parseDouble(request.get("amount").toString());
            String description = (String) request.get("description");

            Account fromAccount = accountService.getAccountById(fromAccountId)
                .orElseThrow(() -> new RuntimeException("Compte source non trouvé"));
            Account toAccount = accountService.findByAccountNumber(toAccountNumber)
                .orElseThrow(() -> new RuntimeException("Compte destinataire non trouvé"));

            // Vérifier si les comptes ne sont pas clôturés
            if ("CLOSED".equals(fromAccount.getStatus()) || "CLOSED".equals(toAccount.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "L'un des comptes est clôturé"
                ));
            }

            // Vérifier le solde disponible
            if (fromAccount.getBalance() < amount) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Solde insuffisant"
                ));
            }

            // Effectuer le transfert
            fromAccount.setBalance(fromAccount.getBalance() - amount);
            toAccount.setBalance(toAccount.getBalance() + amount);

            // Créer les transactions
            accountService.createTransactionPair(
                fromAccount,
                toAccount,
                amount,
                description != null ? description : "Virement interne"
            );

            accountService.updateAccount(fromAccount);
            accountService.updateAccount(toAccount);

            return ResponseEntity.ok(Map.of(
                "message", "Virement effectué avec succès",
                "fromAccountBalance", fromAccount.getBalance(),
                "toAccountBalance", toAccount.getBalance()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/logs")
    public ResponseEntity<List<CashierLog>> getCashierLogs(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (!userService.isCashier(username)) {
                return ResponseEntity.status(403).build();
            }

            User cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Cashier not found"));

            List<CashierLog> logs = cashierLogService.getLogsByCashier(cashier.getId());
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            logger.error("Error fetching cashier logs:", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/agency-transactions")
    public ResponseEntity<?> getAgencyTransactions(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            logger.info("Récupération des transactions pour le caissier: {}", username);
            
            User cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Caissier non trouvé"));
            
            logger.info("Caissier trouvé: ID={}, Role={}", cashier.getId(), cashier.getRole());
            
            if (cashier.getAgency() == null) {
                logger.error("Caissier {} n'est pas associé à une agence", username);
                throw new RuntimeException("Caissier non associé  une agence");
            }

            Agency agency = cashier.getAgency();
            logger.info("Agence du caissier: ID={}, Nom={}", agency.getId(), agency.getName());
            
            List<Transaction> transactions = transactionRepository.findTransactionsByAgencyId(agency.getId());
            
            logger.info("Nombre de transactions trouvées: {}", transactions.size());
            if (!transactions.isEmpty()) {
                transactions.forEach(t -> 
                    logger.info("Transaction: ID={}, Type={}, Amount={}, Account={}", 
                        t.getId(), t.getType(), t.getAmount(), t.getAccount().getAccountNumber())
                );
            } else {
                logger.info("Aucune transaction trouvée pour l'agence");
            }
            
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des transactions: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/agency-info")
    public ResponseEntity<?> getAgencyInfo(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User cashier = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Caissier non trouvé"));
            
            if (cashier.getAgency() == null) {
                throw new RuntimeException("Caissier non associé à une agence");
            }

            Map<String, Object> agencyInfo = Map.of(
                "name", cashier.getAgency().getName(),
                "id", cashier.getAgency().getId()
            );
            
            return ResponseEntity.ok(agencyInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
} 