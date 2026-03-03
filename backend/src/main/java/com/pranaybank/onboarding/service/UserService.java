package com.pranaybank.onboarding.service;

import com.pranaybank.onboarding.entity.MerchantUser;
import com.pranaybank.onboarding.repository.MerchantUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final MerchantUserRepository merchantUserRepository;

    /**
     * Upserts a MerchantUser record based on the Auth0 subject identifier.
     * First call creates the record; subsequent calls with the same auth0Id
     * return the existing record unchanged (idempotent).
     *
     * Called from UserController on every POST /api/v1/users/sync hit
     * (which the frontend fires after Auth0 login completes).
     */
    @Transactional
    public MerchantUser syncUser(String auth0Id, String email, String role) {
        log.info("Syncing user auth0Id={} role={}", auth0Id, role);

        Optional<MerchantUser> existing = merchantUserRepository.findByAuth0Id(auth0Id);

        if (existing.isPresent()) {
            log.info("User already exists, returning existing record for auth0Id={}", auth0Id);
            return existing.get();
        }

        MerchantUser newUser = new MerchantUser();
        newUser.setAuth0Id(auth0Id);
        newUser.setEmail(email);
        newUser.setRole(role);
        newUser.setCreatedAt(LocalDateTime.now());

        try {
            // saveAndFlush forces SQL execution in this try block so unique-key
            // races are caught here instead of surfacing at transaction commit.
            MerchantUser saved = merchantUserRepository.saveAndFlush(newUser);
            log.info("Created new MerchantUser id={} for auth0Id={}", saved.getId(), auth0Id);
            return saved;
        } catch (DataIntegrityViolationException conflict) {
            // Handles concurrent sync calls (common in React StrictMode dev)
            // where both requests pass the exists-check and one hits the unique key.
            log.warn("User creation raced for auth0Id={}, returning existing record.", auth0Id);
            return merchantUserRepository.findByAuth0Id(auth0Id)
                    .orElseThrow(() -> conflict);
        }
    }

    /**
     * Fetches a MerchantUser by their Auth0 subject identifier.
     * Used by controllers to resolve the JWT principal to a local DB record.
     */
    @Transactional(readOnly = true)
    public Optional<MerchantUser> getUserByAuth0Id(String auth0Id) {
        return merchantUserRepository.findByAuth0Id(auth0Id);
    }
}
