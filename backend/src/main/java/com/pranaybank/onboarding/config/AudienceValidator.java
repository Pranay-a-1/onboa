package com.pranaybank.onboarding.config;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Custom JWT validator that checks the "aud" (audience) claim of every
 * incoming token matches the expected API audience configured in
 * application.yml (pranaybank.auth0.audience).
 *
 * Why is this needed?
 * Auth0 issues tokens that can target multiple audiences. Without this check,
 * a token minted for a *different* Auth0 API (e.g. Auth0 Management API) could
 * pass Spring Security's default validation and make a successful call to our
 * endpoints. This validator closes that gap.
 */
public class AudienceValidator implements OAuth2TokenValidator<Jwt> {

    private final String audience;

    public AudienceValidator(String audience) {
        this.audience = audience;
    }

    /**
     * Called by Spring Security for every incoming JWT.
     *
     * @param jwt - the decoded, verified token
     * @return SUCCESS if the token's "aud" list contains our API audience;
     *         FAILURE (with an OAuth2Error) otherwise, which triggers a 401.
     */
    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        if (jwt.getAudience().contains(audience)) {
            return OAuth2TokenValidatorResult.success();
        }

        OAuth2Error error = new OAuth2Error(
                "invalid_token",
                "The required audience '" + audience + "' is missing from the token.",
                null);
        return OAuth2TokenValidatorResult.failure(error);
    }
}
