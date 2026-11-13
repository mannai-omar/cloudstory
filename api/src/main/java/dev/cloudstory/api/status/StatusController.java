package dev.cloudstory.api.status;

import dev.cloudstory.api.config.CloudStoryProperties;
import java.lang.management.ManagementFactory;
import java.time.Duration;
import java.time.Instant;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** What the Operations Room shows. Every field is measured, never assumed. */
@RestController
public class StatusController {

    private final CloudStoryProperties properties;
    private final JdbcClient jdbc;
    private final PrometheusClient prometheus;

    public StatusController(CloudStoryProperties properties, JdbcClient jdbc, PrometheusClient prometheus) {
        this.properties = properties;
        this.jdbc = jdbc;
        this.prometheus = prometheus;
    }

    @GetMapping("/api/status")
    public Status status() {
        Instant startedAt = Instant.ofEpochMilli(ManagementFactory.getRuntimeMXBean().getStartTime());
        return new Status(
                "cloudstory-api",
                properties.version(),
                properties.commit(),
                properties.environment(),
                System.getenv().getOrDefault("HOSTNAME", "unknown"),
                startedAt,
                Duration.between(startedAt, Instant.now()).toSeconds(),
                databaseStatus(),
                prometheus.snapshot(),
                Instant.now());
    }

    private String databaseStatus() {
        try {
            jdbc.sql("select 1").query(Integer.class).single();
            return "up";
        } catch (RuntimeException e) {
            return "down";
        }
    }

    public record Status(
            String service,
            String version,
            String commit,
            String environment,
            String pod,
            Instant startedAt,
            long uptimeSeconds,
            String database,
            PrometheusClient.MetricsSnapshot metrics,
            Instant checkedAt) {}
}
