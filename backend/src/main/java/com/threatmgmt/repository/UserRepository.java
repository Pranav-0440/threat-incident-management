package com.threatmgmt.repository;

import com.threatmgmt.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
