package com.nura.security;

import com.nura.model.UserSession;
import com.nura.repository.UserSessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final UserSessionRepository sessionRepository;

    public TokenAuthenticationFilter(UserSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String token = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("nura_session".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token != null) {
            Optional<UserSession> sessionOpt = sessionRepository.findByToken(token);
            if (sessionOpt.isPresent()) {
                UserSession session = sessionOpt.get();
                if (session.getExpiresAt().isAfter(LocalDateTime.now())) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            session.getUser(),
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    // Invalidate and delete expired session
                    try {
                        sessionRepository.delete(session);
                    } catch (Exception e) {
                        // Ignore concurrent deletions
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
