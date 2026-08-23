package com.nura.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile({"dev", "test", "default"})
public class DevOtpDeliveryService implements OtpDeliveryService {

    private static final Logger logger = LoggerFactory.getLogger(DevOtpDeliveryService.class);

    @Override
    public void sendOtp(String recipient, String otp) {
        System.out.println("\n--- [DEV ONLY - FOR DEMO] ---");
        System.out.println("OTP code for " + recipient + " is: " + otp);
        System.out.println("-----------------------------\n");
        logger.info("Sent Dev OTP to recipient {}: {}", recipient, otp);
    }
}
