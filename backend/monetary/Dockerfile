# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace

# Copy build descriptors and the bundled system dependency for caching
COPY pom.xml ./
COPY lib ./lib

# Copy sources and build the bootable jar (include system-scope deps)
COPY src ./src
RUN mvn -B -DskipTests -Dspring-boot.repackage.includeSystemScope=true package

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Allow overriding through Render-provided env vars
ENV JAVA_OPTS="" \
    PORT=8080

# Copy the Spring Boot fat jar produced in the build stage
COPY --from=build /workspace/target/monetary-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

# Render sets PORT; fall back to 8080 locally
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
