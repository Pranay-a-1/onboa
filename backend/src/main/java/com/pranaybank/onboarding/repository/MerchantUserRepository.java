package com.pranaybank.onboarding.repository;

import com.pranaybank.onboarding.entity.MerchantUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link MerchantUser}.
 *
 * <p>
 * The primary lookup for a user is by their Auth0 subject identifier
 * ({@code auth0Id}), not by the internal DB UUID. This is because every
 * inbound JWT carries the Auth0 sub claim — not our internal ID.
 */
@Repository
public interface MerchantUserRepository extends JpaRepository<MerchantUser, UUID> {

    /**
     * Finds a merchant user by their Auth0 subject identifier.
     *
     * <p>
     * Spring Data derives the SQL automatically from the method name:
     * {@code SELECT * FROM merchant_users WHERE auth0_id = ?1}
     *
     * <p>
     * Returns {@link Optional#empty()} if no user exists yet
     * (i.e., first-ever login before the sync endpoint is called).
     *
     * @param auth0Id the Auth0 subject ID extracted from the JWT (e.g.,
     *                "auth0|64abc...")
     * @return an Optional wrapping the found user, or empty if not found
     */
    Optional<MerchantUser> findByAuth0Id(String auth0Id);
}
