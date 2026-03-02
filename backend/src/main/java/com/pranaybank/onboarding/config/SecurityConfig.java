package com.pranaybank.onboarding.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Central Spring Security configuration for the PranayBank Onboarding API.
 *
 * Responsibilities:
 * 1. Configures this service as a stateless OAuth2 Resource Server (JWT mode)
 * 2. Plugs in the custom AudienceValidator alongside standard issuer validation
 * 3. Extracts Auth0 custom roles from the JWT and maps them to Spring
 * authorities
 * 4. Enforces path-based access rules (ADMIN vs USER)
 * 5. Configures CORS for the three frontend origins
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Auth0 issuer URI — set via env var AUTH0_ISSUER_URI, e.g.
     * https://dev-xyz.auth0.com/
     */
    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuerUri;

    /**
     * Optional — when set (e.g. in the dev profile), the JwtDecoder is built
     * directly from this URL instead of doing OIDC discovery via issuer-uri.
     * This prevents a network call at startup when Auth0 is not yet configured.
     * Defaults to empty string (i.e. not set).
     */
    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}")
    private String jwkSetUri;

    /** Our own API audience registered in Auth0, e.g. https://pranaybank-api */
    @Value("${pranaybank.auth0.audience}")
    private String audience;

    /**
     * The namespace prefix used by Auth0 for custom claims added via an Auth0
     * Action.
     * The roles claim will be at: https://pranaybank.com/roles
     */
    private static final String ROLES_CLAIM = "https://pranaybank.com/roles";

    @Value("${pranaybank.cors.allowed-origins}")
    private String[] allowedOrigins;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Main Security Filter Chain
    // ─────────────────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────────────────
    // DEV: Open filter chain — only active when profile=dev
    // All requests permitted without a JWT so you can curl freely.
    // This bean is ABSENT in production (profile guard ensures it).
    // ─────────────────────────────────────────────────────────────────────────
    @Bean
    @Order(1)
    @Profile("dev")
    public SecurityFilterChain devSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRODUCTION: JWT-enforced filter chain
    // ─────────────────────────────────────────────────────────────────────────
    @Bean
    @Order(2)
    @Profile("!dev")
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // ── CSRF: disabled — this is a stateless REST API, no browser sessions ──
                .csrf(csrf -> csrf.disable())

                // ── CORS: delegate to the corsConfigurationSource bean below ──────────
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ── Session: STATELESS — no HttpSession, every request carries a JWT ──
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ── Path-based Authorization Rules ────────────────────────────────────
                .authorizeHttpRequests(auth -> auth
                        // Admin-only area — requires the ADMIN role (mapped from JWT)
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        // Merchant-facing endpoints — requires USER role
                        .requestMatchers("/api/v1/applications/**").hasRole("USER")
                        // User sync and profile — accessible to any authenticated party
                        .requestMatchers("/api/v1/users/**").authenticated()
                        // Everything else requires authentication (fail-safe default)
                        .anyRequest().authenticated())

                // ── OAuth2 Resource Server — JWT mode ─────────────────────────────────
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder())
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())));

        return http.build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. JWT Decoder — wires in both standard + audience validators
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Builds a NimbusJwtDecoder that:
     * a) Fetches Auth0's public keys from its JWKS endpoint (derived from
     * issuer-uri)
     * b) Validates the standard claims (issuer, expiry, etc.)
     * c) Applies our custom AudienceValidator
     *
     * DelegatingOAuth2TokenValidator chains multiple validators; ALL must pass.
     */
    @Bean
    @Profile("!dev")
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder decoder;

        if (jwkSetUri != null && !jwkSetUri.isBlank()) {
            // ── DEV MODE ─────────────────────────────────────────────────────────
            // Build directly from a static JWK Set URI — no OIDC discovery HTTP
            // call is made at startup. Tokens cannot be truly validated in this
            // mode (the JWK endpoint is fake), but the app starts fine.
            decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        } else {
            // ── PRODUCTION MODE ──────────────────────────────────────────────────
            // Performs OIDC discovery against the issuer-uri to fetch the real
            // JWKS endpoint. Requires Auth0 to be reachable at startup.
            decoder = JwtDecoders.fromOidcIssuerLocation(issuerUri);

            // Only apply validators in production — they reference the real issuer
            OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuerUri);
            OAuth2TokenValidator<Jwt> withAudience = new AudienceValidator(audience);
            OAuth2TokenValidator<Jwt> combined = new DelegatingOAuth2TokenValidator<>(withIssuer, withAudience);
            decoder.setJwtValidator(combined);
        }

        return decoder;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. JWT → Spring Authorities Converter
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Auth0 places custom roles under a namespaced claim (added via Auth0 Action):
     * "https://pranaybank.com/roles": ["ADMIN"] or ["USER"]
     *
     * Spring Security's default converter looks in the "scope" or "scp" claim.
     * We override this to read from our custom claim and apply the "ROLE_" prefix,
     * so hasRole("ADMIN") resolves correctly to the authority "ROLE_ADMIN".
     */
    @Bean
    @Profile("!dev")
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

        // Read from our custom namespaced claim instead of "scope"
        grantedAuthoritiesConverter.setAuthoritiesClaimName(ROLES_CLAIM);

        // Add the "ROLE_" prefix so Spring's hasRole("ADMIN") → "ROLE_ADMIN"
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return converter;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. CORS Configuration
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Permits the three frontend origins to call this API.
     * Origins come from application.yml: pranaybank.cors.allowed-origins
     * (localhost:3000, localhost:3001, localhost:3002, and the production URL)
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // needed for Authorization header with credentials

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // apply to all paths
        return source;
    }
}
