package com.nura.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber;
import com.nura.model.User;
import com.nura.model.UserOtp;
import com.nura.model.UserProfile;
import com.nura.model.UserSession;
import com.nura.repository.UserOtpRepository;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.UserRepository;
import com.nura.repository.UserSessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserOtpRepository userOtpRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;
    private final OtpDeliveryService otpDeliveryService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${nura.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${nura.otp.cooldown-seconds:60}")
    private int otpCooldownSeconds;

    public AuthService(UserRepository userRepository,
                       UserProfileRepository userProfileRepository,
                       UserOtpRepository userOtpRepository,
                       UserSessionRepository userSessionRepository,
                       PasswordEncoder passwordEncoder,
                       Environment environment,
                       OtpDeliveryService otpDeliveryService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userOtpRepository = userOtpRepository;
        this.userSessionRepository = userSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
        this.otpDeliveryService = otpDeliveryService;
    }

    /**
     * Parse and validate a phone number. Returns it in E.164 format.
     */
    public String normalizePhoneNumber(String rawPhoneNumber) {
        if (rawPhoneNumber == null || rawPhoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number is required");
        }

        PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();
        try {
            // Assume "IN" (India) as the default country if no leading "+" is provided
            String defaultRegion = rawPhoneNumber.trim().startsWith("+") ? "ZZ" : "IN";
            Phonenumber.PhoneNumber parsedNumber = phoneUtil.parse(rawPhoneNumber.trim(), defaultRegion);
            
            if (!phoneUtil.isValidNumber(parsedNumber)) {
                throw new IllegalArgumentException("Please enter a valid phone number");
            }
            
            return phoneUtil.format(parsedNumber, PhoneNumberUtil.PhoneNumberFormat.E164);
        } catch (NumberParseException e) {
            throw new IllegalArgumentException("Invalid phone number format: " + e.getMessage());
        }
    }

    /**
     * Request a new OTP for the normalized phone number.
     */
    @Transactional
    public void requestOtp(String normalizedPhone) {
        // Enforce rate limiting: max 5 requests per hour
        List<UserOtp> recentOtps = userOtpRepository.findByPhoneNumberAndCreatedAtAfter(normalizedPhone, LocalDateTime.now().minusHours(1));
        if (recentOtps.size() >= 5) {
            throw new IllegalStateException("Too many verification attempts. Please try again later.");
        }

        // Enforce resend cooldown
        Optional<UserOtp> latestOtpOpt = userOtpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(normalizedPhone);
        if (latestOtpOpt.isPresent()) {
            UserOtp latestOtp = latestOtpOpt.get();
            if (latestOtp.getCreatedAt().plusSeconds(otpCooldownSeconds).isAfter(LocalDateTime.now())) {
                throw new IllegalStateException("Please wait before requesting another verification code.");
            }
        }

        // Invalidate previous active OTPs for this phone number
        List<UserOtp> activeOtps = userOtpRepository.findByPhoneNumberAndConsumedAtIsNullAndExpiresAtAfter(normalizedPhone, LocalDateTime.now());
        for (UserOtp activeOtp : activeOtps) {
            activeOtp.setExpiresAt(LocalDateTime.now()); // Expire immediately
            userOtpRepository.save(activeOtp);
        }

        // Generate a cryptographically secure random 6-digit OTP
        int code = 100000 + secureRandom.nextInt(900000);
        String rawOtp = String.valueOf(code);

        // Print to console strictly if running under dev environment
        if (Arrays.asList(environment.getActiveProfiles()).contains("dev")) {
            System.out.println("\n--- [DEV ONLY - FOR DEMO] ---");
            System.out.println("OTP code for " + normalizedPhone + " is: " + rawOtp);
            System.out.println("-----------------------------\n");
        }

        // Hash the OTP and store
        String hashedOtp = passwordEncoder.encode(rawOtp);
        UserOtp userOtp = new UserOtp(normalizedPhone, hashedOtp, LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        userOtpRepository.save(userOtp);
    }

    /**
     * Request a new OTP for the email recipient.
     */
    @Transactional
    public void requestOtpForEmail(String email) {
        // Enforce rate limiting: max 5 requests per hour
        List<UserOtp> recentOtps = userOtpRepository.findByEmailAndCreatedAtAfter(email, LocalDateTime.now().minusHours(1));
        if (recentOtps.size() >= 5) {
            throw new IllegalStateException("Too many verification attempts. Please try again later.");
        }

        // Enforce resend cooldown
        Optional<UserOtp> latestOtpOpt = userOtpRepository.findTopByEmailOrderByCreatedAtDesc(email);
        if (latestOtpOpt.isPresent()) {
            UserOtp latestOtp = latestOtpOpt.get();
            if (latestOtp.getCreatedAt().plusSeconds(otpCooldownSeconds).isAfter(LocalDateTime.now())) {
                throw new IllegalStateException("Please wait before requesting another verification code.");
            }
        }

        // Invalidate previous active OTPs for this email
        List<UserOtp> activeOtps = userOtpRepository.findByEmailAndConsumedAtIsNullAndExpiresAtAfter(email, LocalDateTime.now());
        for (UserOtp activeOtp : activeOtps) {
            activeOtp.setExpiresAt(LocalDateTime.now()); // Expire immediately
            userOtpRepository.save(activeOtp);
        }

        // Generate a cryptographically secure random 6-digit OTP
        int code = 100000 + secureRandom.nextInt(900000);
        String rawOtp = String.valueOf(code);

        // Print to console strictly if running under dev environment
        if (Arrays.asList(environment.getActiveProfiles()).contains("dev")) {
            System.out.println("\n--- [DEV ONLY - FOR DEMO] ---");
            System.out.println("OTP code for " + email + " is: " + rawOtp);
            System.out.println("-----------------------------\n");
        }

        // Send real OTP if configured
        otpDeliveryService.sendOtp(email, rawOtp);

        // Hash the OTP and store
        String hashedOtp = passwordEncoder.encode(rawOtp);
        UserOtp userOtp = new UserOtp(null, email, hashedOtp, LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        userOtpRepository.save(userOtp);
    }

    /**
     * Verify the OTP code and return an authenticated UserSession.
     */
    @Transactional
    public UserSession verifyOtp(String normalizedPhone, String rawOtp) {
        Optional<UserOtp> latestOtpOpt = userOtpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(normalizedPhone);
        if (latestOtpOpt.isEmpty()) {
            throw new IllegalArgumentException("No verification code was requested for this phone number.");
        }

        UserOtp userOtp = latestOtpOpt.get();

        // Check if expired
        if (userOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("The verification code has expired. Please request a new code.");
        }

        // Check if consumed
        if (userOtp.getConsumedAt() != null) {
            throw new IllegalArgumentException("This verification code has already been used. Please request a new code.");
        }

        // Check if attempt count is exceeded
        if (userOtp.getAttemptCount() >= 3) {
            userOtp.setExpiresAt(LocalDateTime.now()); // Invalidate OTP
            userOtpRepository.save(userOtp);
            throw new IllegalArgumentException("Maximum verification attempts exceeded. Please request a new code.");
        }

        // Increment attempts
        userOtp.setAttemptCount(userOtp.getAttemptCount() + 1);
        userOtpRepository.save(userOtp);

        // Compare OTP
        if (!passwordEncoder.matches(rawOtp, userOtp.getHashedOtp())) {
            if (userOtp.getAttemptCount() >= 3) {
                userOtp.setExpiresAt(LocalDateTime.now()); // Invalidate OTP
                userOtpRepository.save(userOtp);
                throw new IllegalArgumentException("Maximum verification attempts exceeded. Please request a new code.");
            }
            throw new IllegalArgumentException("Invalid verification code. Please check and try again.");
        }

        // Invalidate OTP after success
        userOtp.setConsumedAt(LocalDateTime.now());
        userOtp.setExpiresAt(LocalDateTime.now()); // Double secure invalidation
        userOtpRepository.save(userOtp);

        // Find or create User
        User user = userRepository.findByPhoneNumber(normalizedPhone)
                .orElseGet(() -> {
                    User newUser = new User(normalizedPhone, "PENDING_ONBOARDING");
                    User savedUser = userRepository.save(newUser);
                    
                    // Create default profile mapping
                    UserProfile profile = new UserProfile(savedUser, "PENDING");
                    userProfileRepository.save(profile);
                    
                    return savedUser;
                });

        // Create secure session token
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String sessionToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        // Expiration (7 days)
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
        UserSession session = new UserSession(sessionToken, user, expiresAt);
        
        return userSessionRepository.save(session);
    }

    /**
     * Verify the OTP code for email and return an authenticated UserSession.
     */
    @Transactional
    public UserSession verifyOtpForEmail(String email, String rawOtp) {
        Optional<UserOtp> latestOtpOpt = userOtpRepository.findTopByEmailOrderByCreatedAtDesc(email);
        if (latestOtpOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid verification code. Please check and try again.");
        }

        UserOtp userOtp = latestOtpOpt.get();

        // Check if expired or consumed
        if (userOtp.getExpiresAt().isBefore(LocalDateTime.now()) || userOtp.getConsumedAt() != null) {
            throw new IllegalArgumentException("Invalid verification code. Please check and try again.");
        }

        // Check if attempt count is exceeded
        if (userOtp.getAttemptCount() >= 3) {
            userOtp.setExpiresAt(LocalDateTime.now()); // Invalidate OTP
            userOtpRepository.save(userOtp);
            throw new IllegalArgumentException("Maximum verification attempts exceeded. Please request a new code.");
        }

        // Increment attempts
        userOtp.setAttemptCount(userOtp.getAttemptCount() + 1);
        userOtpRepository.save(userOtp);

        // Compare OTP
        if (!passwordEncoder.matches(rawOtp, userOtp.getHashedOtp())) {
            if (userOtp.getAttemptCount() >= 3) {
                userOtp.setExpiresAt(LocalDateTime.now()); // Invalidate OTP
                userOtpRepository.save(userOtp);
                throw new IllegalArgumentException("Maximum verification attempts exceeded. Please request a new code.");
            }
            throw new IllegalArgumentException("Invalid verification code. Please check and try again.");
        }

        // Invalidate OTP after success
        userOtp.setConsumedAt(LocalDateTime.now());
        userOtp.setExpiresAt(LocalDateTime.now()); // Double secure invalidation
        userOtpRepository.save(userOtp);

        // Find or create User
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User(null, email, "PENDING_ONBOARDING");
                    User savedUser = userRepository.save(newUser);
                    
                    // Create default profile mapping
                    UserProfile profile = new UserProfile(savedUser, "PENDING");
                    userProfileRepository.save(profile);
                    
                    return savedUser;
                });

        // Create secure session token
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String sessionToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        // Expiration (7 days)
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
        UserSession session = new UserSession(sessionToken, user, expiresAt);
        
        return userSessionRepository.save(session);
    }

    /**
     * Revoke the session by token
     */
    @Transactional
    public void revokeSession(String token) {
        if (token != null) {
            userSessionRepository.findById(token).ifPresent(userSessionRepository::delete);
        }
    }
}
