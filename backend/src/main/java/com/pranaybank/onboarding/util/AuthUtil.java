package com.pranaybank.onboarding.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.jwt.Jwt;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Helper that resolves the caller's auth0Id from either:
 * a) The real JWT subject (production / full Auth0 flow)
 * b) The X-Dev-Auth0Id request header (dev profile — no real JWT)
 *
 * This keeps controllers clean and avoid null-checks on the Jwt parameter.
 */
public class AuthUtil {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};
    private static final String ROLES_CLAIM = "https://pranaybank.com/roles";

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

        String tokenSub = getBearerClaimAsString(request, "sub");
        if (tokenSub != null && !tokenSub.isBlank()) {
            return tokenSub;
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
            Object rawClaim = jwt.getClaim(ROLES_CLAIM);
            if (rawClaim instanceof java.util.List<?> roles && !roles.isEmpty()) {
                return roles.get(0).toString();
            }
            return "USER";
        }

        List<String> tokenRoles = getBearerClaimAsStringList(request, ROLES_CLAIM);
        if (!tokenRoles.isEmpty()) {
            return tokenRoles.get(0);
        }

        String devRole = request.getHeader("X-Dev-Role");
        return (devRole != null && !devRole.isBlank()) ? devRole : "USER";
    }

    private static String getBearerClaimAsString(HttpServletRequest request, String claimKey) {
        Object claimValue = getBearerClaims(request).get(claimKey);
        return claimValue instanceof String ? (String) claimValue : null;
    }

    private static List<String> getBearerClaimAsStringList(HttpServletRequest request, String claimKey) {
        Object claimValue = getBearerClaims(request).get(claimKey);
        if (!(claimValue instanceof List<?> values)) {
            return Collections.emptyList();
        }

        return values.stream()
                .map(String::valueOf)
                .filter(v -> !v.isBlank())
                .toList();
    }

    private static Map<String, Object> getBearerClaims(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Collections.emptyMap();
        }

        String token = authHeader.substring("Bearer ".length()).trim();
        if (token.isBlank()) {
            return Collections.emptyMap();
        }

        String[] tokenParts = token.split("\\.");
        if (tokenParts.length < 2) {
            return Collections.emptyMap();
        }

        try {
            byte[] decodedPayload = Base64.getUrlDecoder().decode(tokenParts[1]);
            String payload = new String(decodedPayload, StandardCharsets.UTF_8);
            return OBJECT_MAPPER.readValue(payload, MAP_TYPE);
        } catch (Exception ignored) {
            return Collections.emptyMap();
        }
    }
}
