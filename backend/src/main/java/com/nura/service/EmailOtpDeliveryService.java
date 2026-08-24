package com.nura.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Profile("prod")
public class EmailOtpDeliveryService implements OtpDeliveryService {

    private static final Logger logger = LoggerFactory.getLogger(EmailOtpDeliveryService.class);

    private final JavaMailSender mailSender;

    @Value("${nura.mail.from-email:noreply@nura.local}")
    private String fromEmail;

    @Value("${nura.mail.from-name:Nura}")
    private String fromName;

    public EmailOtpDeliveryService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendOtp(String recipient, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");
            
            helper.setFrom(fromEmail, fromName);
            helper.setTo(recipient);
            helper.setSubject("Nura Verification Code");
            helper.setText("Your Nura verification code is: " + otp + "\n\nThis code will expire shortly. Do not share it with anyone.");

            mailSender.send(message);
            logger.info("Successfully sent OTP email.");
        } catch (Exception e) {
            logger.error("Failed to send OTP email: {}", e.getMessage());
            throw new RuntimeException("Email delivery failed.");
        }
    }
}
