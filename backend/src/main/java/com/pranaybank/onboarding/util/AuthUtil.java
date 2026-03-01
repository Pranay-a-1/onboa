package com.pranaybank.onboarding.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Helper that resolves the caller's auth0Id from either:
 * a) The real JWT subject (production / full Auth0 flow)
 * b) The X-Dev-Auth0Id request header (dev profile — no real JWT)
 *
 * This keeps controllers clean and avoid null-checks on the Jwt parameter.
 */
public class AuthUtil {

    private AuthUtil() {
    }

    /**
     * Returns the auth0Id for the current request.
     *
     * @param jwt     - the injected JWT principal (may be null in dev mode)
     * @param request - the HTTP request (used for the fallback dev header)
     * @return auth0Id string
     * @throws IllegalStateException if neither source provides an ID
     */
    public static String resolveAuth0Id(Jwt jwt, HttpServletRequest request) {
        if (jwt != null) {
            return jwt.getSubject();
        }

        String devId = request.getHeader("X-Dev-Auth0Id");
        if (devId != null && !devId.isBlank()) {
            return devId;
        }

        throw new IllegalStateException(
                "Cannot resolve auth0Id: no JWT principal and no X-Dev-Auth0Id header. " +
                        "In dev mode, pass -H 'X-Dev-Auth0Id: auth0|yourId' in your curl command.");
    }

    /**
     * Extracts the role from the JWT custom claim, falls back to "USER".
     * In dev mode (jwt == null), falls back to the X-Dev-Role header or "USER".
     */
    public static String resolveRole(Jwt jwt, HttpServletRequest request) {
        if (jwt != null) {
            Object rawClaim = jwt.getClaim("https://pranaybank.com/roles");
            if (rawClaim instanceof java.util.List<?> roles && !roles.isEmpty()) {
                return roles.get(0).toString();
            }
            return "USER";
        }

        String devRole = request.getHeader("X-Dev-Role");
        return (devRole != null && !devRole.isBlank()) ? devRole : "USER";
    }
}
