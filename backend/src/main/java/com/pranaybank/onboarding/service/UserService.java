package com.pranaybank.onboarding.service;

import com.pranaybank.onboarding.entity.MerchantUser;
import com.pranaybank.onboarding.repository.MerchantUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

        MerchantUser saved = merchantUserRepository.save(newUser);
        log.info("Created new MerchantUser id={} for auth0Id={}", saved.getId(), auth0Id);
        return saved;
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
