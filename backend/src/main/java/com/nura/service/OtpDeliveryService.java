package com.nura.service;

public interface OtpDeliveryService {
    void sendOtp(String recipient, String otp);
}
