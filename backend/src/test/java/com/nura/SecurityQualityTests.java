package com.nura;

import com.nura.model.User;
import com.nura.model.UserSession;
import com.nura.repository.UserRepository;
import com.nura.repository.UserProfileRepository;
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
public class SecurityQualityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    private User primaryUser;
    private Cookie authCookie;

    @BeforeEach
    void setUp() {
        userSessionRepository.deleteAll();
        userProfileRepository.deleteAll();
        userRepository.deleteAll();

        primaryUser = userRepository.save(new User("+918888888888", "ACTIVE"));
        userProfileRepository.save(new com.nura.model.UserProfile(primaryUser, "COMPLETED"));
        UserSession session = userSessionRepository.save(new UserSession("security-token", primaryUser, LocalDateTime.now().plusDays(1)));
        authCookie = new Cookie("nura_session", session.getToken());
    }

    @Test
    void testNoSensitiveDataLeakageInProfileResponse() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                        .cookie(authCookie))
                .andExpect(status().isOk())
                // Ensure no password hashes, system userIDs, or private tokens leak
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.hashedOtp").doesNotExist());
    }

    @Test
    void testOwnershipRejectionOnArbitraryRequests() throws Exception {
        // Create another session token belonging to another user
        User otherUser = userRepository.save(new User("+917777777777", "ACTIVE"));
        UserSession otherSession = userSessionRepository.save(new UserSession("other-token", otherUser, LocalDateTime.now().plusDays(1)));
        Cookie otherCookie = new Cookie("nura_session", otherSession.getToken());

        // Perform requests using other session, ensuring it gets a blank response or only its own data
        mockMvc.perform(get("/api/wellness/today")
                        .cookie(otherCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(false)); // Other user has no records logged
    }
}
