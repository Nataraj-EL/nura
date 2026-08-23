package com.nura;

import com.nura.model.User;
import com.nura.model.UserOtp;
import com.nura.model.UserProfile;
import com.nura.model.UserSession;
import com.nura.repository.UserOtpRepository;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.UserRepository;
import com.nura.repository.UserSessionRepository;
import com.nura.service.AuthService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class NuraBackendApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AuthService authService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private UserProfileRepository userProfileRepository;

	@Autowired
	private UserOtpRepository userOtpRepository;

	@Autowired
	private UserSessionRepository userSessionRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	private final String testPhone = "+919876543210";

	@BeforeEach
	void setUp() {
		userSessionRepository.deleteAll();
		userOtpRepository.deleteAll();
		userProfileRepository.deleteAll();
		userRepository.deleteAll();
	}

	@Test
	void contextLoads() {
		// Verify context boots up correctly
	}

	@Test
	void testPhoneValidation() {
		// Valid E.164 formats
		assertEquals("+919876543210", authService.normalizePhoneNumber("+919876543210"));
		assertEquals("+919876543210", authService.normalizePhoneNumber("98765 43210")); // India default region
		
		// Invalid formats
		assertThrows(IllegalArgumentException.class, () -> authService.normalizePhoneNumber("12345"));
		assertThrows(IllegalArgumentException.class, () -> authService.normalizePhoneNumber("invalid-phone"));
	}

	@Test
	void testOtpGenerationAndCooldown() {
		authService.requestOtp(testPhone);
		Optional<UserOtp> otpOpt = userOtpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(testPhone);
		assertTrue(otpOpt.isPresent());
		
		// Verify cooldown: requesting again immediately should throw an error
		assertThrows(IllegalStateException.class, () -> authService.requestOtp(testPhone));
	}

	@Test
	void testOtpVerificationFlow() {
		// Force request OTP
		authService.requestOtp(testPhone);
		Optional<UserOtp> otpOpt = userOtpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(testPhone);
		assertTrue(otpOpt.isPresent());
		
		// Extract generated OTP code for test (need to use reflection or check hashed code matches, 
		// but since it's random, let's create a test OTP directly with known code to test verification logic)
		String rawCode = "999999";
		UserOtp testOtp = otpOpt.get();
		testOtp.setHashedOtp(passwordEncoder.encode(rawCode));
		userOtpRepository.save(testOtp);

		// Verify OTP
		UserSession session = authService.verifyOtp(testPhone, rawCode);
		assertNotNull(session);
		assertNotNull(session.getToken());
		assertEquals(testPhone, session.getUser().getPhoneNumber());

		// Verify user was created in pending onboarding state
		Optional<User> userOpt = userRepository.findByPhoneNumber(testPhone);
		assertTrue(userOpt.isPresent());
		assertEquals("PENDING_ONBOARDING", userOpt.get().getStatus());
	}

	@Test
	void testInvalidOtp() {
		authService.requestOtp(testPhone);
		Optional<UserOtp> otpOpt = userOtpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(testPhone);
		assertTrue(otpOpt.isPresent());

		// Test verify with wrong code
		assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(testPhone, "000000"));
	}

	@Test
	void testOtpAttemptLimit() {
		authService.requestOtp(testPhone);
		Optional<UserOtp> otpOpt = userOtpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(testPhone);
		assertTrue(otpOpt.isPresent());
		
		UserOtp otp = otpOpt.get();
		otp.setHashedOtp(passwordEncoder.encode("123456"));
		userOtpRepository.save(otp);

		// Perform 3 failed attempts
		assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(testPhone, "000001"));
		assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(testPhone, "000002"));
		assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(testPhone, "000003"));

		// 4th attempt should complain about max attempts
		IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(testPhone, "123456"));
		assertTrue(ex.getMessage().contains("attempts exceeded") || ex.getMessage().contains("expired"));
	}

	@Test
	void testOtpReusePrevention() {
		authService.requestOtp(testPhone);
		Optional<UserOtp> otpOpt = userOtpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(testPhone);
		assertTrue(otpOpt.isPresent());

		UserOtp otp = otpOpt.get();
		otp.setHashedOtp(passwordEncoder.encode("123456"));
		userOtpRepository.save(otp);

		// Successfully verify
		UserSession session = authService.verifyOtp(testPhone, "123456");
		assertNotNull(session);

		// Attempt reuse should fail
		assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(testPhone, "123456"));
	}

	@Test
	void testSessionRevocationOnLogout() {
		User user = userRepository.save(new User(testPhone, "ACTIVE"));
		UserSession session = userSessionRepository.save(new UserSession("test-token-123", user, LocalDateTime.now().plusDays(1)));

		assertTrue(userSessionRepository.findByToken("test-token-123").isPresent());
		
		authService.revokeSession("test-token-123");
		assertFalse(userSessionRepository.findByToken("test-token-123").isPresent());
	}

	@Test
	void testProtectedEndpointAccess() throws Exception {
		// Access without session cookie should return 401
		mockMvc.perform(get("/api/user/profile"))
				.andExpect(status().isUnauthorized());

		// Access with session cookie
		User user = userRepository.save(new User(testPhone, "ACTIVE"));
		userProfileRepository.save(new UserProfile(user, "COMPLETED"));
		UserSession session = userSessionRepository.save(new UserSession("valid-session-token", user, LocalDateTime.now().plusDays(1)));

		mockMvc.perform(get("/api/user/profile")
						.cookie(new Cookie("nura_session", "valid-session-token")))
				.andExpect(status().isOk());
	}

	@Test
	void testCsrfBehavior() throws Exception {
		User user = userRepository.save(new User(testPhone, "ACTIVE"));
		userProfileRepository.save(new UserProfile(user, "COMPLETED"));
		UserSession session = userSessionRepository.save(new UserSession("valid-session-token", user, LocalDateTime.now().plusDays(1)));

		// PUT modifying request without CSRF should fail with 403 Forbidden
		mockMvc.perform(put("/api/user/profile")
						.cookie(new Cookie("nura_session", "valid-session-token"))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"age\": 25, \"typicalCycleLength\": 28, \"typicalPeriodDuration\": 5, \"timezone\": \"UTC\"}"))
				.andExpect(status().isForbidden());

		// PUT modifying request with CSRF should succeed
		mockMvc.perform(put("/api/user/profile")
						.cookie(new Cookie("nura_session", "valid-session-token"))
						.with(csrf())
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"age\": 25, \"typicalCycleLength\": 28, \"typicalPeriodDuration\": 5, \"timezone\": \"UTC\"}"))
				.andExpect(status().isOk());
	}

	@Test
	void testOnboardingResumePartialUpdate() throws Exception {
		User user = userRepository.save(new User(testPhone, "PENDING_ONBOARDING"));
		userProfileRepository.save(new UserProfile(user, "PENDING"));
		userSessionRepository.save(new UserSession("valid-session-token", user, LocalDateTime.now().plusDays(1)));

		// Step 1: Initialize status to IN_PROGRESS
		mockMvc.perform(put("/api/user/profile")
						.cookie(new Cookie("nura_session", "valid-session-token"))
						.with(csrf())
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"onboardingStatus\": \"IN_PROGRESS\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.onboardingStatus").value("IN_PROGRESS"))
				.andExpect(jsonPath("$.waterGoal").value(2000));

		// Step 2: Update water goal and age
		mockMvc.perform(put("/api/user/profile")
						.cookie(new Cookie("nura_session", "valid-session-token"))
						.with(csrf())
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"age\": 30, \"waterGoal\": 2500}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.age").value(30))
				.andExpect(jsonPath("$.waterGoal").value(2500))
				.andExpect(jsonPath("$.onboardingStatus").value("IN_PROGRESS"));

		// Retrieve profile and verify values are persisted
		mockMvc.perform(get("/api/user/profile")
						.cookie(new Cookie("nura_session", "valid-session-token")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.age").value(30))
				.andExpect(jsonPath("$.waterGoal").value(2500))
				.andExpect(jsonPath("$.onboardingStatus").value("IN_PROGRESS"));
	}

	@Test
	void testOnboardingCompletion() throws Exception {
		User user = userRepository.save(new User(testPhone, "PENDING_ONBOARDING"));
		userProfileRepository.save(new UserProfile(user, "IN_PROGRESS"));
		userSessionRepository.save(new UserSession("valid-session-token", user, LocalDateTime.now().plusDays(1)));

		// Complete onboarding
		mockMvc.perform(put("/api/user/profile")
						.cookie(new Cookie("nura_session", "valid-session-token"))
						.with(csrf())
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"age\": 28, \"typicalCycleLength\": 30, \"typicalPeriodDuration\": 6, \"timezone\": \"Asia/Kolkata\", \"onboardingStatus\": \"COMPLETED\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.onboardingStatus").value("COMPLETED"))
				.andExpect(jsonPath("$.timezone").value("Asia/Kolkata"));

		// Verify user status is now ACTIVE
		User updatedUser = userRepository.findById(user.getId()).orElseThrow();
		assertEquals("ACTIVE", updatedUser.getStatus());
	}
}
