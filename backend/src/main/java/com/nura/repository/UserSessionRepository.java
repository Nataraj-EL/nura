package com.nura.repository;

import com.nura.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, String> {
    Optional<UserSession> findByToken(String token);
}
