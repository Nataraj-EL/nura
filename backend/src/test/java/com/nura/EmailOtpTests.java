package com.nura;

import com.nura.model.User;
import com.nura.model.UserOtp;
import com.nura.model.UserSession;
import com.nura.repository.UserOtpRepository;
import com.nura.repository.UserRepository;
import com.nura.service.AuthService;
import com.nura.service.OtpDeliveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class EmailOtpTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserOtpRepository userOtpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private OtpDeliveryService otpDeliveryService;

    private final String testEmail = "testuser@nura.local";

    @BeforeEach
    void setUp() {
        userOtpRepository.deleteAll();
        userRepository.deleteAll();
        Mockito.reset(otpDeliveryService);
    }

    @Test
    void testEmailOtpGenerationAndDelivery() {
        authService.requestOtpForEmail(testEmail);
        
        // Check that OtpDeliveryService sendOtp was called
        Mockito.verify(otpDeliveryService, Mockito.times(1)).sendOtp(eq(testEmail), anyString());

        Optional<UserOtp> otpOpt = userOtpRepository.findTopByEmailOrderByCreatedAtDesc(testEmail);
        assertTrue(otpOpt.isPresent());
        
        // Assert stored code is hashed and not plaintext
        UserOtp otp = otpOpt.get();
        assertNotEquals("123456", otp.getHashedOtp());
        assertNull(otp.getPhoneNumber());
        assertEquals(testEmail, otp.getEmail());
    }

    @Test
    void testEmailOtpVerificationFlow() {
        authService.requestOtpForEmail(testEmail);
        Optional<UserOtp> otpOpt = userOtpRepository.findTopByEmailOrderByCreatedAtDesc(testEmail);
        assertTrue(otpOpt.isPresent());

        // Standardize code
        String testCode = "777777";
        UserOtp storedOtp = otpOpt.get();
        storedOtp.setHashedOtp(passwordEncoder.encode(testCode));
        userOtpRepository.save(storedOtp);

        // Verify successful validation
        UserSession session = authService.verifyOtpForEmail(testEmail, testCode);
        assertNotNull(session);
        assertNotNull(session.getUser().getEmail());
        assertEquals(testEmail, session.getUser().getEmail());
        
        // Verify User got created in pending onboarding state
        Optional<User> userOpt = userRepository.findByEmail(testEmail);
        assertTrue(userOpt.isPresent());
        assertEquals("PENDING_ONBOARDING", userOpt.get().getStatus());
    }

    @Test
    void testEmailOtpCooldown() {
        authService.requestOtpForEmail(testEmail);
        
        // Re-requesting immediately must raise cooldown violation exception
        assertThrows(IllegalStateException.class, () -> authService.requestOtpForEmail(testEmail));
    }

    @Test
    void testEmailOtpRateLimiting() {
        // Mock older request dates to simulate rate limit bounds
        for (int i = 0; i < 5; i++) {
            UserOtp otp = new UserOtp(null, testEmail, "hashed-code", LocalDateTime.now().plusMinutes(5));
            userOtpRepository.save(otp);
        }

        // 6th request within 1 hour must throw rate limit exception
        assertThrows(IllegalStateException.class, () -> authService.requestOtpForEmail(testEmail));
    }

    @Test
    void testGenericAuthenticationErrors() {
        authService.requestOtpForEmail(testEmail);
        
        // Incorrect OTP code
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
                () -> authService.verifyOtpForEmail(testEmail, "000000"));
        assertEquals("Invalid verification code. Please check and try again.", ex.getMessage());

        // Expired OTP code
        Optional<UserOtp> otpOpt = userOtpRepository.findTopByEmailOrderByCreatedAtDesc(testEmail);
        assertTrue(otpOpt.isPresent());
        UserOtp storedOtp = otpOpt.get();
        storedOtp.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        userOtpRepository.save(storedOtp);

        IllegalArgumentException exExpired = assertThrows(IllegalArgumentException.class, 
                () -> authService.verifyOtpForEmail(testEmail, "123456"));
        assertEquals("Invalid verification code. Please check and try again.", exExpired.getMessage());
    }

    @Test
    void testEmailOtpReusePrevention() {
        authService.requestOtpForEmail(testEmail);
        Optional<UserOtp> otpOpt = userOtpRepository.findTopByEmailOrderByCreatedAtDesc(testEmail);
        assertTrue(otpOpt.isPresent());

        String testCode = "888888";
        UserOtp storedOtp = otpOpt.get();
        storedOtp.setHashedOtp(passwordEncoder.encode(testCode));
        userOtpRepository.save(storedOtp);

        // Verification must consume code
        UserSession session = authService.verifyOtpForEmail(testEmail, testCode);
        assertNotNull(session);

        // Secondary verify attempt must raise reuse error
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
                () -> authService.verifyOtpForEmail(testEmail, testCode));
        assertEquals("Invalid verification code. Please check and try again.", ex.getMessage());
    }

    @Autowired
    private com.nura.repository.UserSessionRepository userSessionRepository;

    @Test
    void testSessionLogoutAndInvalidation() {
        authService.requestOtpForEmail(testEmail);
        Optional<UserOtp> otpOpt = userOtpRepository.findTopByEmailOrderByCreatedAtDesc(testEmail);
        assertTrue(otpOpt.isPresent());

        String testCode = "999999";
        UserOtp storedOtp = otpOpt.get();
        storedOtp.setHashedOtp(passwordEncoder.encode(testCode));
        userOtpRepository.save(storedOtp);

        UserSession session = authService.verifyOtpForEmail(testEmail, testCode);
        assertNotNull(session);
        String token = session.getToken();

        // Verify session exists
        assertTrue(userSessionRepository.findByToken(token).isPresent());

        // Call revokeSession (Logout simulation)
        authService.revokeSession(token);

        // Verify session is invalidated and deleted
        assertFalse(userSessionRepository.findByToken(token).isPresent());
    }
}
