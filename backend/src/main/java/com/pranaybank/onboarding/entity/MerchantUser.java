package com.pranaybank.onboarding.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a locally-synced Auth0 user.
 * Created on first login via POST /api/v1/users/sync.
 */
@Entity
@Table(name = "merchant_users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /**
     * The Auth0 user subject identifier (e.g., "auth0|64abc...").
     * Used as the stable foreign key between Auth0 JWTs and local DB records.
     */
    @Column(name = "auth0_id", unique = true, nullable = false)
    private String auth0Id;

    @Column(nullable = false)
    private String email;

    /**
     * Role extracted from JWT claim "https://pranaybank.com/roles".
     * Values: "ADMIN" or "USER".
     */
    @Column(nullable = false)
    private String role;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
