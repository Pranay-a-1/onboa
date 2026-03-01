package com.pranaybank.onboarding.enums;

/**
 * Represents the lifecycle states of a merchant onboarding application.
 *
 * State transitions (per PRD §4.3):
 * DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED
 * → REJECTED → DRAFT (re-edit)
 */
public enum ApplicationStatus {
    DRAFT, // User started but hasn't submitted
    SUBMITTED, // User submitted, awaiting admin pickup
    UNDER_REVIEW, // Admin actively reviewing
    APPROVED, // Admin approved — triggers merchant ID generation
    REJECTED // Admin rejected — user can re-edit → DRAFT
}