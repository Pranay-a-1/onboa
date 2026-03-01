package com.pranaybank.onboarding.controller;

import com.pranaybank.onboarding.entity.MerchantUser;
import com.pranaybank.onboarding.service.UserService;
import com.pranaybank.onboarding.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * POST /api/v1/users/sync
     * Upserts the MerchantUser record in the local DB.
     *
     * Dev usage:
     * curl -X POST http://localhost:8080/api/v1/users/sync \
     * -H "X-Dev-Auth0Id: auth0|user001" \
     * -H "X-Dev-Role: USER"
     */
    @PostMapping("/sync")
    public ResponseEntity<MerchantUser> syncUser(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        String auth0Id = AuthUtil.resolveAuth0Id(jwt, request);
        String email = (jwt != null)
                ? jwt.getClaimAsString("email")
                : request.getHeader("X-Dev-Email") != null
                        ? request.getHeader("X-Dev-Email")
                        : auth0Id + "@dev.local";
        String role = AuthUtil.resolveRole(jwt, request);

        MerchantUser user = userService.syncUser(auth0Id, email, role);
        return ResponseEntity.ok(user);
    }

    /**
     * GET /api/v1/users/me
     * Returns the caller's local DB profile.
     *
     * Dev usage:
     * curl http://localhost:8080/api/v1/users/me \
     * -H "X-Dev-Auth0Id: auth0|user001"
     */
    @GetMapping("/me")
    public ResponseEntity<MerchantUser> getMe(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        String auth0Id = AuthUtil.resolveAuth0Id(jwt, request);
        return userService.getUserByAuth0Id(auth0Id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
