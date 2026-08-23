package com.nura;

import com.nura.model.User;
import com.nura.model.UserSession;
import com.nura.repository.UserRepository;
import com.nura.repository.UserSessionRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class BackendReliabilityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    private Cookie authCookie;

    @BeforeEach
    void setUp() {
        userSessionRepository.deleteAll();
        userRepository.deleteAll();

        User user = userRepository.save(new User("+919999999999", "ACTIVE"));
        UserSession session = userSessionRepository.save(new UserSession("test-reliability-token", user, LocalDateTime.now().plusDays(1)));
        authCookie = new Cookie("nura_session", session.getToken());
    }

    @Test
    void testValidationFailureStructuredError() throws Exception {
        // Post invalid cycle length (must be between 10 and 100)
        mockMvc.perform(put("/api/user/profile")
                        .cookie(authCookie)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"typicalCycleLength\": 5}")) // Under minimum limit of 10
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.details").isArray());
    }

    @Test
    void testUnauthenticatedAccessRejection() throws Exception {
        // Wellness list check without session
        mockMvc.perform(get("/api/wellness"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testMissingCsrfOnModifyingCall() throws Exception {
        // Wellness POST without csrf
        mockMvc.perform(put("/api/wellness/today")
                        .cookie(authCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"waterIntake\": 250}"))
                .andExpect(status().isForbidden());
    }
}
