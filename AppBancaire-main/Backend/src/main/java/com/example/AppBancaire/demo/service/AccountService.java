package com.example.bank.demo.service;

import com.example.bank.demo.model.Account;
import com.example.bank.demo.model.Transaction;
import com.example.bank.demo.model.User;
import com.example.bank.demo.repository.AccountRepository;
import com.example.bank.demo.repository.UserRepository;
import com.example.bank.demo.repository.BankCardRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.TreeMap;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;

@Service
public class AccountService {
    private static final Logger logger = LoggerFactory.getLogger(AccountService.class);

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private NameMatchingService nameMatchingService;

    @Autowired
    private BankCardRepository bankCardRepository;

    @Transactional(readOnly = true)
    public List<Account> getAccountsByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return accountRepository.findByUserId(user.getId());
    }

    public boolean hasActiveAccounts(String username) {
        List<Account> accounts = getAccountsByUsername(username);
        return accounts.stream()
            .anyMatch(account -> !"CLOSED".equals(account.getStatus()));
    }

    public Account createAccount(Account account) {
        if (account.getUser() != null && account.getUser().getId() != null) {
            User user = userRepository.findById(account.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
            account.setUser(user);
        }
        return accountRepository.save(account);
    }

    @Transactional
    public void transferMoney(Long fromAccountId, String toAccountNumber, Double amount, String password, String beneficiaryName) {
        try {
            Account fromAccount = accountRepository.findById(fromAccountId)
                .orElseThrow(() -> new RuntimeException("Source account not found"));
            
            Account toAccount = accountRepository.findByAccountNumber(toAccountNumber)
                .orElseThrow(() -> new RuntimeException("Destination account not found"));

            // Vérifier le mot de passe
            if (!userService.verifyPassword(fromAccount.getUser().getId(), password)) {
                throw new RuntimeException("Invalid password");
            }

            // Vérifier le solde
            if (fromAccount.getBalance() < amount) {
                throw new RuntimeException("Solde insuffisant");
            }

            // Effectuer le transfert immédiat uniquement pour les virements non programmés
            fromAccount.setBalance(fromAccount.getBalance() - amount);
            toAccount.setBalance(toAccount.getBalance() + amount);
            
            accountRepository.save(fromAccount);
            accountRepository.save(toAccount);

            // Créer les transactions
            createTransactionPair(fromAccount, toAccount, amount);

        } catch (Exception e) {
            logger.error("Error during transfer", e);
            throw e;
        }
    }

    // Cette méthode sera utilisée uniquement pour les virements programmés
    @Transactional
    public void executeScheduledTransfer(Account fromAccount, Account toAccount, Double amount, Date executionDate) {
        // Vérifier le solde au moment de l'exécution
        if (fromAccount.getBalance() < amount) {
            throw new RuntimeException("Solde insuffisant");
        }

        // Effectuer le transfert
        fromAccount.setBalance(fromAccount.getBalance() - amount);
        toAccount.setBalance(toAccount.getBalance() + amount);
        
        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        // Créer les transactions avec la date d'exécution programmée
        Transaction debitTransaction = new Transaction();
        debitTransaction.setAccount(fromAccount);
        debitTransaction.setAmount(amount);
        debitTransaction.setType("DEBIT");
        debitTransaction.setDescription("Virement programmé vers " + toAccount.getAccountNumber());
        debitTransaction.setFromAccount(fromAccount.getAccountNumber());
        debitTransaction.setToAccount(toAccount.getAccountNumber());
        debitTransaction.setDate(executionDate);
        transactionService.createTransaction(debitTransaction);

        Transaction creditTransaction = new Transaction();
        creditTransaction.setAccount(toAccount);
        creditTransaction.setAmount(amount);
        creditTransaction.setType("CREDIT");
        creditTransaction.setDescription("Virement programmé depuis " + fromAccount.getAccountNumber());
        creditTransaction.setFromAccount(fromAccount.getAccountNumber());
        creditTransaction.setToAccount(toAccount.getAccountNumber());
        creditTransaction.setDate(executionDate);
        transactionService.createTransaction(creditTransaction);
    }

    private void createTransactionPair(Account fromAccount, Account toAccount, Double amount) {
        // Transaction de débit
        Transaction debitTransaction = new Transaction();
        debitTransaction.setAccount(fromAccount);
        debitTransaction.setAmount(amount);
        debitTransaction.setType("DEBIT");
        debitTransaction.setDescription("Virement vers " + toAccount.getAccountNumber());
        debitTransaction.setFromAccount(fromAccount.getAccountNumber());
        debitTransaction.setToAccount(toAccount.getAccountNumber());
        debitTransaction.setDate(new Date());
        transactionService.createTransaction(debitTransaction);

        // Transaction de crédit
        Transaction creditTransaction = new Transaction();
        creditTransaction.setAccount(toAccount);
        creditTransaction.setAmount(amount);
        creditTransaction.setType("CREDIT");
        creditTransaction.setDescription("Virement depuis " + fromAccount.getAccountNumber());
        creditTransaction.setFromAccount(fromAccount.getAccountNumber());
        creditTransaction.setToAccount(toAccount.getAccountNumber());
        creditTransaction.setDate(new Date());
        transactionService.createTransaction(creditTransaction);
    }

    public Account updateBalance(Long accountId, Double newBalance) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("Account not found"));
        account.setBalance(newBalance);
        return accountRepository.save(account);
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Optional<Account> getAccountById(Long id) {
        return accountRepository.findById(id);
    }

    // Méthodes pour les statistiques
    public Map<String, Object> getAccountStatistics(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Account> userAccounts = accountRepository.findByUserId(user.getId());
        List<Transaction> recentTransactions = transactionService.getRecentTransactionsByUserId(user.getId());
        
        Map<String, Object> statistics = new HashMap<>();
        
        double totalBalance = userAccounts.stream()
            .mapToDouble(Account::getBalance)
            .sum();
        
        int transactionsThisMonth = recentTransactions.size();
        
        Optional<Transaction> lastTransaction = recentTransactions.stream()
            .max(Comparator.comparing(Transaction::getDate));
        
        statistics.put("totalBalance", totalBalance);
        statistics.put("accountCount", userAccounts.size());
        statistics.put("transactionsThisMonth", transactionsThisMonth);
        statistics.put("lastTransactionDate", lastTransaction.map(Transaction::getDate).orElse(null));
        
        return statistics;
    }

    public Map<String, Object> getExpenseStatistics(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Transaction> transactions = transactionService.getTransactionsByUserId(user.getId());
        
        Map<String, Double> expensesByCategory = transactions.stream()
            .filter(t -> t.getType().equals("DEBIT"))
            .filter(t -> t.getCategory() != null)
            .collect(Collectors.groupingBy(
                t -> t.getCategory().getName(),
                Collectors.summingDouble(Transaction::getAmount)
            ));
        
        Map<String, Object> result = new HashMap<>();
        result.put("labels", expensesByCategory.keySet());
        result.put("data", expensesByCategory.values());
        
        return result;
    }

    public Map<String, Object> getBalanceHistory(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Récupérer toutes les transactions de l'utilisateur, triées par date
        List<Transaction> transactions = transactionService.getTransactionsByUserId(user.getId());
        
        // Créer des listes pour les dates et les soldes
        List<String> dates = new ArrayList<>();
        List<Double> balances = new ArrayList<>();
        
        // Calculer le solde actuel total de l'utilisateur
        double currentBalance = user.getAccounts().stream()
            .mapToDouble(Account::getBalance)
            .sum();

        // Format pour les dates
        SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy");
        
        // Créer un Map pour regrouper les transactions par date
        Map<String, Double> dailyBalances = new LinkedHashMap<>();
        
        // Parcourir les transactions en ordre chronologique inverse
        for (int i = transactions.size() - 1; i >= 0; i--) {
            Transaction transaction = transactions.get(i);
            String date = dateFormat.format(transaction.getDate());
            
            // Mettre à jour le solde en fonction du type de transaction
            if (transaction.getType().equals("CREDIT")) {
                currentBalance -= transaction.getAmount();
            } else {
                currentBalance += transaction.getAmount();
            }
            
            // Stocker le solde pour cette date
            dailyBalances.put(date, currentBalance);
        }
        
        // Ajouter le solde actuel
        dailyBalances.put(dateFormat.format(new Date()), currentBalance);
        
        // Convertir le Map en deux listes (dates et soldes)
        dates.addAll(dailyBalances.keySet());
        balances.addAll(dailyBalances.values());

        // Créer et retourner le résultat
        Map<String, Object> result = new HashMap<>();
        result.put("dates", dates);
        result.put("balances", balances);
        
        return result;
    }

    @Transactional(readOnly = true)
    public Optional<Account> findByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber);
    }

    @Transactional
    public void createTransactionPair(Account fromAccount, Account toAccount, Double amount, String description) {
        // Transaction de débit
        Transaction debitTransaction = new Transaction();
        debitTransaction.setAccount(fromAccount);
        debitTransaction.setAmount(amount);
        debitTransaction.setType("DEBIT");
        debitTransaction.setDescription(description + " vers " + toAccount.getAccountNumber());
        debitTransaction.setFromAccount(fromAccount.getAccountNumber());
        debitTransaction.setToAccount(toAccount.getAccountNumber());
        debitTransaction.setDate(new Date());
        transactionService.createTransaction(debitTransaction);

        // Transaction de crédit
        Transaction creditTransaction = new Transaction();
        creditTransaction.setAccount(toAccount);
        creditTransaction.setAmount(amount);
        creditTransaction.setType("CREDIT");
        creditTransaction.setDescription(description + " depuis " + fromAccount.getAccountNumber());
        creditTransaction.setFromAccount(fromAccount.getAccountNumber());
        creditTransaction.setToAccount(toAccount.getAccountNumber());
        creditTransaction.setDate(new Date());
        transactionService.createTransaction(creditTransaction);
    }

    @Transactional
    public Account updateAccount(Account account) {
        return accountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public List<Account> getActiveAccounts() {
        List<Account> accounts = accountRepository.findAll();
        logger.info("Nombre total de comptes trouvés: {}", accounts.size());
        
        List<Account> activeAccounts = accounts.stream()
            .filter(account -> !"CLOSED".equals(account.getStatus()))
            .collect(Collectors.toList());
        
        logger.info("Nombre de comptes actifs: {}", activeAccounts.size());
        
        return activeAccounts;
    }

    @Transactional
    public Account updateAccountStatus(Long accountId, String status) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("Account not found"));
        
        account.setStatus(status);
        return accountRepository.save(account);
    }

    @Transactional
    public void deleteAccount(Long accountId) {
        Account account = getAccountById(accountId)
            .orElseThrow(() -> new RuntimeException("Compte non trouvé"));

        // Récupérer l'utilisateur associé au compte
        User user = account.getUser();

        // Supprimer d'abord les transactions associées
        transactionService.deleteTransactionsByAccountId(accountId);

        // Supprimer le compte
        accountRepository.deleteById(accountId);

        // Vérifier si l'utilisateur a d'autres comptes
        List<Account> remainingAccounts = accountRepository.findByUserId(user.getId());
        if (remainingAccounts.isEmpty() || remainingAccounts.size() == 1) {
            // Si c'était le dernier compte de l'utilisateur, supprimer l'utilisateur aussi
            userRepository.delete(user);
        }
    }
} 