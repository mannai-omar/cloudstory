# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src

# Download dependencies in their own layer so code changes don't re-download the world.
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -B -q dependency:go-offline

COPY src ./src
# Tests run in CI (they need Docker for Testcontainers), so the image build skips them.
RUN --mount=type=cache,target=/root/.m2 mvn -B -q package -DskipTests \
 && java -Djarmode=tools -jar target/cloudstory-api.jar extract --layers --launcher --destination /extracted

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre-alpine

ARG APP_VERSION=dev
ARG GIT_COMMIT=unknown
ENV APP_VERSION=${APP_VERSION} \
    GIT_COMMIT=${GIT_COMMIT} \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

LABEL org.opencontainers.image.title="cloudstory-api" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

RUN addgroup -S app && adduser -S -G app -u 10001 app
WORKDIR /app

# Layers ordered from least to most frequently changed.
COPY --from=build /extracted/dependencies/ ./
COPY --from=build /extracted/spring-boot-loader/ ./
COPY --from=build /extracted/snapshot-dependencies/ ./
COPY --from=build /extracted/application/ ./

USER 10001
EXPOSE 8080 8081
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
