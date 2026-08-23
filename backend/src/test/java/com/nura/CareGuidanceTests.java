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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class CareGuidanceTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    private final String testPhone = "+919876543211";
    private Cookie authCookie;

    @BeforeEach
    void setUp() {
        userSessionRepository.deleteAll();
        userRepository.deleteAll();

        User user = userRepository.save(new User(testPhone, "ACTIVE"));
        UserSession session = userSessionRepository.save(new UserSession("valid-care-token", user, LocalDateTime.now().plusDays(1)));
        authCookie = new Cookie("nura_session", session.getToken());
    }

    @Test
    void testEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/care/guidance")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/care/symptoms")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/care/safety")).andExpect(status().isUnauthorized());
    }

    @Test
    void testGuidanceEndpointResponseAndMetadata() throws Exception {
        mockMvc.perform(get("/api/care/guidance").cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contentVersion").value("1.0"))
                .andExpect(jsonPath("$.lastReviewed").value("2026-08-23"))
                .andExpect(jsonPath("$.category").value("GENERAL_INFORMATION"))
                .andExpect(jsonPath("$.medicalDisclaimer").isNotEmpty())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[0].category").value("GENERAL_INFORMATION"));
    }

    @Test
    void testSymptomsEndpointResponseAndMetadata() throws Exception {
        mockMvc.perform(get("/api/care/symptoms").cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contentVersion").value("1.0"))
                .andExpect(jsonPath("$.category").value("SELF_CARE"))
                .andExpect(jsonPath("$.items[0].title").isNotEmpty());
    }

    @Test
    void testSafetyEndpointResponseAndMetadata() throws Exception {
        mockMvc.perform(get("/api/care/safety").cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contentVersion").value("1.0"))
                .andExpect(jsonPath("$.category").value("URGENT_MEDICAL_ATTENTION"))
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void testAbsenceOfDiagnosticOrCausalWording() throws Exception {
        // Retrieve and test response text across all endpoints to ensure non-diagnostic/non-causal compliance
        String[] endpoints = {"/api/care/guidance", "/api/care/symptoms", "/api/care/safety"};
        
        for (String endpoint : endpoints) {
            MvcResult result = mockMvc.perform(get(endpoint).cookie(authCookie))
                    .andExpect(status().isOk())
                    .andReturn();
            
            String responseBody = result.getResponse().getContentAsString().toLowerCase();
            
            // Strictly check for absolute absence of clinic diagnostic/assertive causal words
            assertFalse(responseBody.contains("diagnose"), "Must not claim to diagnose in " + endpoint);
            assertFalse(responseBody.contains("cure"), "Must not suggest a cure in " + endpoint);
            assertFalse(responseBody.contains("caused by menstruation"), "Must not attribute cause definitively in " + endpoint);
            assertFalse(responseBody.contains("caused by your"), "Must not attribute cause definitively in " + endpoint);
            
            // Check that it does not claim to define a universal "normal cycle"
            assertFalse(responseBody.contains("normal cycle is 28 days"), "Must not define a single rigid normal standard in " + endpoint);
            assertFalse(responseBody.contains("normal cycle length"), "Must not define a single rigid normal standard in " + endpoint);
        }
    }
}
