package dev.cloudstory.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Runs the whole API against a real PostgreSQL. Needs Docker (available on GitHub-hosted runners). */
@Testcontainers
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"management.server.port=0", "cloudstory.deploy-event-token=test-token"})
class ApiIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    TestRestTemplate rest;

    @Test
    void servesTheSeededJourney() {
        ResponseEntity<List> response = rest.getForEntity("/api/journey", List.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(6);
    }

    @Test
    void servesInfrastructureComponents() {
        ResponseEntity<List> response = rest.getForEntity("/api/components", List.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotEmpty();
    }

    @Test
    void refusesDeploymentEventsWithoutToken() {
        ResponseEntity<String> response = rest.postForEntity("/api/deployments", event(), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void recordsAndListsDeploymentEvents() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth("test-token");
        ResponseEntity<Map> created =
                rest.postForEntity("/api/deployments", new HttpEntity<>(event(), headers), Map.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<List> listed = rest.getForEntity("/api/deployments", List.class);
        assertThat(listed.getBody()).isNotEmpty();
    }

    @Test
    void rejectsInvalidDeploymentEvents() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth("test-token");
        Map<String, Object> bad = Map.of("service", "API!", "commitSha", "not-a-sha");
        ResponseEntity<String> response =
                rest.postForEntity("/api/deployments", new HttpEntity<>(bad, headers), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void statusReportsDatabaseAndHonestlyMissingMetrics() {
        ResponseEntity<Map> response = rest.getForEntity("/api/status", Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("database", "up");
        Map<?, ?> metrics = (Map<?, ?>) response.getBody().get("metrics");
        assertThat(metrics.get("available")).isEqualTo(false);
        assertThat(metrics.get("requestsPerSecond")).isNull();
    }

    private static Map<String, Object> event() {
        return Map.of(
                "service", "cloudstory-api",
                "version", "0.1.0",
                "commitSha", "a1b2c3d",
                "environment", "dev",
                "status", "succeeded",
                "triggeredBy", "github-actions");
    }
}
