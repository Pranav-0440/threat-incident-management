package com.threatmgmt.service;

public interface PasswordResetEmailSender {

    void send(String recipient, String resetUrl);
}
