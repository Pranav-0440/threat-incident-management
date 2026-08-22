package com.threatmgmt.exception;

public class PasswordResetTokenException extends RuntimeException {

    public PasswordResetTokenException() {
        super("The password reset link is invalid or has expired.");
    }
}
