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

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(TokenAuthenticationFilter.class);
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
                logger.info("Found cookie: {} = {}", cookie.getName(), cookie.getValue());
                if ("nura_session".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        } else {
            logger.info("No cookies found in request: {}", request.getRequestURI());
        }

        if (token != null) {
            logger.info("Extracted nura_session token: {}", token);
            Optional<UserSession> sessionOpt = sessionRepository.findByToken(token);
            if (sessionOpt.isPresent()) {
                UserSession session = sessionOpt.get();
                logger.info("Session found in DB. Expires at: {}, Current time: {}", session.getExpiresAt(), LocalDateTime.now());
                if (session.getExpiresAt().isAfter(LocalDateTime.now())) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            session.getUser(),
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    logger.info("Successfully set Authentication in SecurityContext for user: {}", session.getUser().getEmail());
                } else {
                    logger.warn("Session token is expired. Deleting session.");
                    // Invalidate and delete expired session
                    try {
                        sessionRepository.delete(session);
                    } catch (Exception e) {
                        // Ignore concurrent deletions
                    }
                }
            } else {
                logger.warn("Session token not found in database: {}", token);
            }
        }

        filterChain.doFilter(request, response);
    }
}
