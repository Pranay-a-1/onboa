package com.pranaybank.onboarding.service;

import com.pranaybank.onboarding.entity.MerchantUser;
import com.pranaybank.onboarding.entity.OnboardingApplication;
import com.pranaybank.onboarding.enums.ApplicationStatus;
import com.pranaybank.onboarding.repository.MerchantUserRepository;
import com.pranaybank.onboarding.repository.OnboardingApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class ApplicationServiceTests {

    private UUID appId;
    private MerchantUser owner;
    private OnboardingApplication application;
    private AtomicReference<OnboardingApplication> lastSaved;
    private ApplicationService applicationService;

    @BeforeEach
    void setUp() {
        appId = UUID.randomUUID();
        owner = MerchantUser.builder()
                .auth0Id("auth0|user-1")
                .email("user@e.com")
                .role("USER")
                .build();

        application = OnboardingApplication.builder()
                .id(appId)
                .merchantUser(owner)
                .status(ApplicationStatus.DRAFT)
                .currentStep(0)
                .build();

        lastSaved = new AtomicReference<>();
        OnboardingApplicationRepository applicationRepository = stubApplicationRepository();
        MerchantUserRepository merchantUserRepository = stubMerchantUserRepository();
        applicationService = new ApplicationService(applicationRepository, merchantUserRepository);
    }

    @Test
    void saveStepData_whenRejected_allowsEditAndReopensToDraft() {
        application.setStatus(ApplicationStatus.REJECTED);

        Map<String, Object> step1Data = Map.of(
                "legalName", "Demo Coffee Roasters LLC",
                "dbaName", "Demo Coffee",
                "ein", "30-1180175",
                "businessType", "LLC",
                "stateOfIncorporation", "CA",
                "dateOfFormation", "2019-12-04");

        OnboardingApplication saved = applicationService.saveStepData(appId, 1, step1Data, "auth0|user-1");

        assertNotNull(saved.getBusinessInfo());
        assertEquals("Demo Coffee Roasters LLC", saved.getBusinessInfo().getLegalName());
        assertEquals(ApplicationStatus.DRAFT, saved.getStatus());
        assertEquals(1, saved.getCurrentStep());
        assertEquals(ApplicationStatus.DRAFT, lastSaved.get().getStatus());
    }

    @Test
    void saveStepData_whenSubmitted_throwsConflictStateError() {
        application.setStatus(ApplicationStatus.SUBMITTED);

        Map<String, Object> step1Data = Map.of(
                "legalName", "Demo Coffee Roasters LLC",
                "ein", "30-1180175",
                "businessType", "LLC",
                "stateOfIncorporation", "CA");

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> applicationService.saveStepData(appId, 1, step1Data, "auth0|user-1"));

        assertTrue(ex.getMessage().contains("must be editable"));
        assertNull(lastSaved.get());
    }

    @Test
    void saveStepData_whenRejected_persistsDraftStatus() {
        application.setStatus(ApplicationStatus.REJECTED);

        Map<String, Object> step1Data = Map.of(
                "legalName", "Demo Coffee Roasters LLC",
                "ein", "30-1180175",
                "businessType", "LLC",
                "stateOfIncorporation", "CA");

        applicationService.saveStepData(appId, 1, step1Data, "auth0|user-1");

        assertNotNull(lastSaved.get());
        assertEquals(ApplicationStatus.DRAFT, lastSaved.get().getStatus());
    }

    @SuppressWarnings("unchecked")
    private OnboardingApplicationRepository stubApplicationRepository() {
        return (OnboardingApplicationRepository) Proxy.newProxyInstance(
                OnboardingApplicationRepository.class.getClassLoader(),
                new Class[] { OnboardingApplicationRepository.class },
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.of(application);
                    case "save" -> {
                        OnboardingApplication saved = (OnboardingApplication) args[0];
                        lastSaved.set(saved);
                        yield saved;
                    }
                    default -> throw new UnsupportedOperationException("Method not used in this test: " + method.getName());
                });
    }

    @SuppressWarnings("unchecked")
    private MerchantUserRepository stubMerchantUserRepository() {
        return (MerchantUserRepository) Proxy.newProxyInstance(
                MerchantUserRepository.class.getClassLoader(),
                new Class[] { MerchantUserRepository.class },
                (proxy, method, args) -> {
                    throw new UnsupportedOperationException("Method not used in this test: " + method.getName());
                });
    }
}
