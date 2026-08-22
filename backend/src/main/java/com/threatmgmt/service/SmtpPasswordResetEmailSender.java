package com.threatmgmt.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.password-reset", name = "mail-enabled", havingValue = "true")
@RequiredArgsConstructor
public class SmtpPasswordResetEmailSender implements PasswordResetEmailSender {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${app.password-reset.mail-from:no-reply@threatguard.local}")
    private String mailFrom;

    @Override
    public void send(String recipient, String resetUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(recipient);
        message.setSubject("ThreatGuard password reset");
        message.setText("Use this link to reset your ThreatGuard password. The link expires in 15 minutes and can be used once:\n\n"
                + resetUrl + "\n\nIf you did not request this, you can ignore this email.");
        mailSender.send(message);
    }
}
