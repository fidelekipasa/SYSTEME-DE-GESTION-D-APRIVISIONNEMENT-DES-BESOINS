package com.example.bank.demo.controller;

import com.example.bank.demo.model.Account;
import com.example.bank.demo.model.TransferRequest;
import com.example.bank.demo.model.Transaction;
import com.example.bank.demo.model.User;
import com.example.bank.demo.model.VirementProgramme;
import com.example.bank.demo.model.BankCard;
import com.example.bank.demo.repository.BankCardRepository;
import com.example.bank.demo.service.AccountService;
import com.example.bank.demo.service.TransactionService;
import com.example.bank.demo.service.VirementProgrammeService;
import com.example.bank.demo.repository.UserRepository;
import com.example.bank.demo.service.UserService;
import com.example.bank.demo.repository.AccountRepository;
import com.example.bank.demo.service.NameMatchingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Base64;
import java.util.Map;
import java.util.Date;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowCredentials = "true")
public class AccountController {
    private static final Logger logger = LoggerFactory.getLogger(AccountController.class);

    @Autowired
    private AccountService accountService;
    @Autowired
    private TransactionService transactionService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private VirementProgrammeService virementProgrammeService;
    @Autowired
    private BankCardRepository bankCardRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private NameMatchingService nameMatchingService;

    @GetMapping
    public ResponseEntity<List<Account>> getAccounts(@RequestHeader("Authorization") String authHeader) {
        try {
            String base64Credentials = authHeader.substring("Basic".length()).trim();
            String credentials = new String(Base64.getDecoder().decode(base64Credentials));
            String[] values = credentials.split(":", 2);
            String username = values[0];
            
            List<Account> accounts = accountService.getAccountsByUsername(username);
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody Account account) {
        try {
            Account createdAccount = accountService.createAccount(account);
            return ResponseEntity.ok(createdAccount);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> transferMoney(@RequestBody TransferRequest request, @RequestHeader("Authorization") String authHeader) {
        try {
            logger.info("Received transfer request: {}", request);
            
            String username = extractUsername(authHeader);
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

            Account fromAccount = accountService.getAccountById(request.getFromAccountId())
                .orElseThrow(() -> new RuntimeException("Source account not found"));
            
            Account toAccount = accountService.findByAccountNumber(request.getToAccountNumber())
                .orElseThrow(() -> new RuntimeException("Compte destinataire non trouvé"));

            // Vérifier que le nom du bénéficiaire correspond
            if (!nameMatchingService.areNamesMatching(request.getBeneficiaryName(), toAccount.getUser().getFullName())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Le nom du bénéficiaire ne correspond pas au titulaire du compte"
                ));
            }

            if (!fromAccount.getUser().getId().equals(user.getId())) {
                logger.error("Unauthorized access: user {} trying to access account {}", username, request.getFromAccountId());
                throw new RuntimeException("Unauthorized access to account");
            }

            accountService.transferMoney(
                request.getFromAccountId(),
                request.getToAccountNumber(),
                request.getAmount(),
                request.getPassword(),
                request.getBeneficiaryName()
            );
            return ResponseEntity.ok().body(Map.of(
                "message", "Virement effectué avec succès"
            ));
        } catch (Exception e) {
            logger.error("Transfer error:", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{accountId}/transactions")
    public ResponseEntity<List<Transaction>> getAccountTransactions(
            @PathVariable Long accountId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String base64Credentials = authHeader.substring("Basic".length()).trim();
            String credentials = new String(Base64.getDecoder().decode(base64Credentials));
            String[] values = credentials.split(":", 2);
            String username = values[0];
            
            List<Transaction> transactions = transactionService.getTransactionsByAccountId(accountId);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getAccountStatistics(@RequestHeader("Authorization") String authHeader) {
        try {
            String base64Credentials = authHeader.substring("Basic".length()).trim();
            String credentials = new String(Base64.getDecoder().decode(base64Credentials));
            String[] values = credentials.split(":", 2);
            String username = values[0];
            
            Map<String, Object> statistics = accountService.getAccountStatistics(username);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/statistics/expenses")
    public ResponseEntity<?> getExpenseStatistics(@RequestHeader("Authorization") String authHeader) {
        try {
            String base64Credentials = authHeader.substring("Basic".length()).trim();
            String credentials = new String(Base64.getDecoder().decode(base64Credentials));
            String[] values = credentials.split(":", 2);
            String username = values[0];
            
            Map<String, Object> statistics = accountService.getExpenseStatistics(username);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/statistics/balance-history")
    public ResponseEntity<?> getBalanceHistory(@RequestHeader("Authorization") String authHeader) {
        try {
            String base64Credentials = authHeader.substring("Basic".length()).trim();
            String credentials = new String(Base64.getDecoder().decode(base64Credentials));
            String[] values = credentials.split(":", 2);
            String username = values[0];
            
            Map<String, Object> history = accountService.getBalanceHistory(username);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/transaction-statistics")
    public ResponseEntity<?> getTransactionStatistics(@RequestHeader("Authorization") String authHeader) {
        try {
            String base64Credentials = authHeader.substring("Basic".length()).trim();
            String credentials = new String(Base64.getDecoder().decode(base64Credentials));
            String[] values = credentials.split(":", 2);
            String username = values[0];
            
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            Map<String, Object> statistics = transactionService.getTransactionStatistics(user.getId());
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/transfer/programme")
    public ResponseEntity<?> programmerVirement(@RequestBody TransferRequest request, 
                                              @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

            Account fromAccount = accountService.getAccountById(request.getFromAccountId())
                .orElseThrow(() -> new RuntimeException("Source account not found"));
            
            Account toAccount = accountService.findByAccountNumber(request.getToAccountNumber())
                .orElseThrow(() -> new RuntimeException("Compte destinataire non trouvé"));

            // Vérifier que le nom du bénéficiaire correspond
            if (!nameMatchingService.areNamesMatching(request.getBeneficiaryName(), toAccount.getUser().getFullName())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Le nom du bénéficiaire ne correspond pas au titulaire du compte"
                ));
            }
            
            if (!fromAccount.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Unauthorized access to account");
            }

            LocalDateTime dateExecution = LocalDateTime.parse(request.getScheduledDateTime());

            VirementProgramme virement = virementProgrammeService.programmerVirement(
                fromAccount,
                request.getToAccountNumber(),
                request.getBeneficiaryName(),
                request.getAmount(),
                dateExecution
            );

            return ResponseEntity.ok().body(Map.of(
                "message", "Virement programmé avec succès",
                "virementId", virement.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/transfers/programmes")
    public ResponseEntity<?> getVirementsProgrammes(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

            List<VirementProgramme> virements = virementProgrammeService.getVirementsProgrammes(user.getId());
            return ResponseEntity.ok(virements);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{accountId}/cards")
    public ResponseEntity<List<BankCard>> getAccountCards(
        @PathVariable Long accountId,
        @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            Account account = accountService.getAccountById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            
            // Vérifier que le compte appartient bien à l'utilisateur
            if (!account.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).build();
            }
            
            List<BankCard> cards = bankCardRepository.findByAccountId(accountId);
            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/pay-bill")
    public ResponseEntity<?> payBill(@RequestBody Map<String, Object> request, @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

            Long accountId = Long.parseLong(request.get("accountId").toString());
            Double amount = Double.parseDouble(request.get("amount").toString());
            String serviceType = request.get("serviceType").toString();
            String reference = request.get("reference").toString();
            String password = request.get("password").toString();

            // Vérifier le mot de passe
            if (!userService.verifyPassword(user.getId(), password)) {
                return ResponseEntity.status(401).body(Map.of("error", "Mot de passe incorrect"));
            }

            // Récupérer le compte
            Account account = accountService.getAccountById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

            // Vérifier que le compte appartient à l'utilisateur
            if (!account.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access to account"));
            }

            // Vérifier le solde
            if (account.getBalance() < amount) {
                return ResponseEntity.status(400).body(Map.of("error", "Solde insuffisant"));
            }

            // Mettre à jour le solde
            account.setBalance(account.getBalance() - amount);
            accountRepository.save(account);

            // Créer la transaction
            Transaction transaction = new Transaction();
            transaction.setAccount(account);
            transaction.setAmount(amount);
            transaction.setType("BILL_PAYMENT");
            transaction.setDescription("Paiement " + serviceType + " - Réf: " + reference);
            transaction.setDate(new Date());
            transaction.setFromAccount(account.getAccountNumber());
            transaction.setToAccount(serviceType);
            transactionService.createTransaction(transaction);

            return ResponseEntity.ok(Map.of(
                "message", "Paiement effectué avec succès",
                "newBalance", account.getBalance()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/bills")
    public ResponseEntity<List<Map<String, Object>>> getPaidBills(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Récupérer les transactions de type facture
            List<Transaction> billTransactions = transactionService.getTransactionsByUserAndType(user.getId(), "BILL_PAYMENT");
            
            List<Map<String, Object>> paidBills = billTransactions.stream()
                .map(transaction -> {
                    Map<String, Object> bill = new HashMap<>();
                    bill.put("id", transaction.getId());
                    bill.put("serviceType", transaction.getToAccount()); // Le type de service est stocké dans toAccount
                    bill.put("amount", transaction.getAmount());
                    bill.put("reference", transaction.getDescription().split("Réf: ")[1]); // Extraire la référence
                    bill.put("date", transaction.getDate());
                    bill.put("status", "PAID");
                    bill.put("accountNumber", transaction.getFromAccount());
                    return bill;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(paidBills);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/transactions/all")
    public ResponseEntity<List<Transaction>> getAllTransactions(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Pour un caissier, on récupère toutes les transactions
            if (userService.isCashier(username)) {
                List<Transaction> allTransactions = transactionService.getAllTransactions();
                // Trier les transactions par date décroissante
                allTransactions.sort((t1, t2) -> t2.getDate().compareTo(t1.getDate()));
                return ResponseEntity.ok(allTransactions);
            }

            // Pour un utilisateur normal, on ne récupère que ses transactions
            List<Transaction> userTransactions = transactionService.getTransactionsByUserId(user.getId());
            return ResponseEntity.ok(userTransactions);
        } catch (Exception e) {
            logger.error("Error fetching all transactions:", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/transfers/programmes/{virementId}")
    public ResponseEntity<?> annulerVirementProgramme(
        @PathVariable Long virementId,
        @RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

            virementProgrammeService.annulerVirement(virementId, user.getId());
            
            return ResponseEntity.ok().body(Map.of(
                "message", "Virement programmé annulé avec succès"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    private String extractUsername(String authHeader) {
        String base64Credentials = authHeader.substring("Basic".length()).trim();
        String credentials = new String(Base64.getDecoder().decode(base64Credentials));
        String[] values = credentials.split(":", 2);
        return values[0];
    }
} 