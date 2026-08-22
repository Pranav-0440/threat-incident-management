package com.threatmgmt.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Reset token is required")
        String token,
        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String newPassword) {
}
