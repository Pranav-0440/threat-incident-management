# Multi-stage production build for Spring Boot 3.3 (Java 21)
FROM maven:3.9.15-eclipse-temurin-26 AS build
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Package application jar with batch mode to prevent verbose download logs
RUN mvn clean package -DskipTests --batch-mode

# Production runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-privileged group and user (SonarQube docker:S6471 compliance)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built JAR from build stage
COPY --from=build /app/target/threat-incident-management-1.0.0.jar app.jar
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose default port
EXPOSE 8080

# Run Spring Boot app with dynamic PORT binding and container memory limits
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -jar app.jar"]
