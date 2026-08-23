package com.nura.repository;

import com.nura.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, String> {
    Optional<UserSession> findByToken(String token);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM UserSession us WHERE us.user.id = :userId")
    void deleteByUserId(@org.springframework.data.repository.query.Param("userId") java.util.UUID userId);
}
