# --- Build Stage ---
FROM maven:3.8.5-openjdk-17-slim AS build
WORKDIR /app

# Copy pom.xml and resolve dependency caches
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build jar
COPY src ./src
RUN mvn package -DskipTests -B

# --- Run Stage ---
FROM eclipse-temurin:17-jre-alpine AS run
WORKDIR /app

# Add curl for healthcheck and non-root system user for runtime security
RUN apk add --no-cache curl && addgroup -S nura && adduser -S nura -G nura
USER nura

# Copy built JAR from build stage
COPY --from=build --chown=nura:nura /app/target/backend-*.jar app.jar

# Expose server port
EXPOSE 8080

# Environment defaults
ENV SPRING_PROFILES_ACTIVE=prod
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=nura
ENV DB_USER=nura
ENV DB_PASSWORD=nura

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]
