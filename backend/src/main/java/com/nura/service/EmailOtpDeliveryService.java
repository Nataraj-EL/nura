package com.nura.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Profile("prod")
public class EmailOtpDeliveryService implements OtpDeliveryService {

    private static final Logger logger = LoggerFactory.getLogger(EmailOtpDeliveryService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@nura.local}")
    private String fromEmail;

    public EmailOtpDeliveryService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendOtp(String recipient, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipient);
            message.setSubject("Nura Verification Code");
            message.setText("Your Nura verification code is: " + otp + "\n\nThis code will expire shortly. Do not share it with anyone.");

            mailSender.send(message);
            logger.info("Successfully sent OTP email to: {}", recipient);
        } catch (Exception e) {
            logger.error("Failed to send OTP email to {}: {}", recipient, e.getMessage(), e);
            throw new RuntimeException("Email delivery failed.");
        }
    }
}
