package com.example.bank.demo.repository;

import com.example.bank.demo.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByAccountNumber(String accountNumber);
    List<Account> findByUserId(Long userId);
    void deleteByUserId(Long userId);
    
    @Query("SELECT a FROM Account a WHERE a.user.agency.id = :agencyId AND a.status != 'CLOSED'")
    List<Account> findActiveAccountsByAgencyId(@Param("agencyId") Long agencyId);
} 