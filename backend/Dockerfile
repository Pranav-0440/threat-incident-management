# Stage 1: Build stage
FROM maven:3-eclipse-temurin-24-alpine AS build
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the jar skipping tests for fast deployment
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a non-root user to run the application securely
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the compiled jar from the build stage
COPY --from=build /app/target/threat-incident-management-1.0.0.jar app.jar

# Document the port
EXPOSE 8080

# Run the Spring Boot application with container RAM optimization
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
