package com.nura;

import com.nura.model.*;
import com.nura.repository.*;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class PrivacyLifecycleTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private PeriodRecordRepository periodRecordRepository;

    @Autowired
    private WellnessRecordRepository wellnessRecordRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private UserOtpRepository userOtpRepository;

    private User user;
    private Cookie authCookie;

    @BeforeEach
    void setUp() {
        notificationPreferenceRepository.deleteAll();
        notificationRepository.deleteAll();
        wellnessRecordRepository.deleteAll();
        periodRecordRepository.deleteAll();
        userSessionRepository.deleteAll();
        userProfileRepository.deleteAll();
        userOtpRepository.deleteAll();
        userRepository.deleteAll();

        user = userRepository.save(new User("+918888888888", "ACTIVE"));
        userProfileRepository.save(new UserProfile(user, "COMPLETED"));
        
        // Notification preferences default setup
        NotificationPreference pref = new NotificationPreference(user);
        notificationPreferenceRepository.save(pref);

        // Active Session setup
        UserSession session = userSessionRepository.save(new UserSession("privacy-token", user, LocalDateTime.now().plusDays(1)));
        authCookie = new Cookie("nura_session", session.getToken());
    }

    @Test
    void testExportDataCompleteness() throws Exception {
        // Log some fake period record
        PeriodRecord period = new PeriodRecord(user, LocalDate.now().minusDays(5), LocalDate.now().minusDays(1));
        periodRecordRepository.save(period);

        // Log wellness records
        WellnessRecord wellness = new WellnessRecord(user, LocalDate.now());
        wellness.setWaterIntake(1500);
        wellness.setMood("HAPPY");
        wellness.setSymptoms(Collections.singletonList("BLOATING"));
        wellnessRecordRepository.save(wellness);

        mockMvc.perform(get("/api/user/export")
                        .cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phoneNumber").value("+918888888888"))
                .andExpect(jsonPath("$.periods").isArray())
                .andExpect(jsonPath("$.periods[0].startDate").exists())
                .andExpect(jsonPath("$.wellness").isArray())
                .andExpect(jsonPath("$.wellness[0].waterIntake").value(1500))
                .andExpect(jsonPath("$.wellness[0].mood").value("HAPPY"))
                .andExpect(jsonPath("$.notificationPreferences").exists());
    }

    @Test
    void testDeleteAccountCascading() throws Exception {
        // Log period, wellness, session
        PeriodRecord period = new PeriodRecord(user, LocalDate.now().minusDays(2), null);
        periodRecordRepository.save(period);

        WellnessRecord wellness = new WellnessRecord(user, LocalDate.now());
        wellnessRecordRepository.save(wellness);

        // Create user OTP history
        UserOtp otp = new UserOtp(user.getPhoneNumber(), "hashed-otp-code", LocalDateTime.now().plusMinutes(5));
        userOtpRepository.save(otp);

        assertEquals(1, periodRecordRepository.count());
        assertEquals(1, wellnessRecordRepository.count());
        assertEquals(1, userOtpRepository.count());

        mockMvc.perform(delete("/api/user")
                        .cookie(authCookie)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account deleted successfully."));

        // Verify cascading cleanup
        assertEquals(0, periodRecordRepository.count());
        assertEquals(0, wellnessRecordRepository.count());
        assertEquals(0, userSessionRepository.count());
        assertEquals(0, userOtpRepository.count());
        assertEquals(0, userProfileRepository.count());
        assertEquals(0, userRepository.count());
    }
}
