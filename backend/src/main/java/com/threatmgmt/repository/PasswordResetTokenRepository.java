package com.threatmgmt.repository;

import com.threatmgmt.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("delete from PasswordResetToken token where token.user = :user")
    void deleteByUser(@Param("user") com.threatmgmt.model.User user);

    @Modifying
    @Query("delete from PasswordResetToken token where token.expiresAt < :cutoff or token.used = true")
    int deleteExpiredOrUsed(@Param("cutoff") LocalDateTime cutoff);
}
