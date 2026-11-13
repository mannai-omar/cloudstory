package dev.cloudstory.api.deployments;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/deployments")
public class DeploymentController {

    private static final String COLUMNS =
            "id, service, version, commit_sha, environment, status, triggered_by, run_url, created_at";

    private final JdbcClient jdbc;
    private final DeployTokenVerifier tokenVerifier;

    public DeploymentController(JdbcClient jdbc, DeployTokenVerifier tokenVerifier) {
        this.jdbc = jdbc;
        this.tokenVerifier = tokenVerifier;
    }

    @GetMapping
    public List<DeploymentEvent> recent(@RequestParam(defaultValue = "20") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return jdbc.sql("select " + COLUMNS + " from deployment_event order by created_at desc, id desc limit :limit")
                .param("limit", safeLimit)
                .query(DeploymentEvent.class)
                .list();
    }

    @PostMapping
    public ResponseEntity<?> record(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody NewDeploymentEvent event) {

        if (!tokenVerifier.enabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ApiError("Recording deployments is disabled: DEPLOY_EVENT_TOKEN is not set."));
        }
        if (!tokenVerifier.matches(authorization)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError("Invalid or missing token."));
        }

        DeploymentEvent saved = jdbc.sql("""
                        insert into deployment_event
                            (service, version, commit_sha, environment, status, triggered_by, run_url)
                        values (:service, :version, :commitSha, :environment, :status, :triggeredBy, :runUrl)
                        returning %s
                        """.formatted(COLUMNS))
                .param("service", event.service())
                .param("version", event.version())
                .param("commitSha", event.commitSha())
                .param("environment", event.environment())
                .param("status", event.status())
                .param("triggeredBy", event.triggeredBy())
                .param("runUrl", event.runUrl())
                .query(DeploymentEvent.class)
                .single();

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    public record ApiError(String message) {}
}
