package dev.cloudstory.api.status;

import com.fasterxml.jackson.databind.JsonNode;
import dev.cloudstory.api.config.CloudStoryProperties;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Reads a few headline numbers from Prometheus. If Prometheus is not configured or not reachable,
 * the result says so: nothing is ever estimated or invented.
 */
@Component
public class PrometheusClient {

    private static final Logger log = LoggerFactory.getLogger(PrometheusClient.class);

    private final CloudStoryProperties properties;
    private final String baseUrl;
    private final String application;
    private final RestClient http;
    private final Clock clock;

    private volatile MetricsSnapshot cached;

    public PrometheusClient(
            CloudStoryProperties properties,
            RestClient.Builder builder,
            @Value("${spring.application.name}") String application) {
        this.properties = properties;
        this.baseUrl = properties.prometheusUrl() == null ? "" : properties.prometheusUrl().replaceAll("/+$", "");
        this.application = application;
        this.clock = Clock.systemUTC();

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.prometheusTimeout());
        requestFactory.setReadTimeout(properties.prometheusTimeout());
        this.http = builder.requestFactory(requestFactory).build();
    }

    public MetricsSnapshot snapshot() {
        if (!properties.prometheusConfigured()) {
            return MetricsSnapshot.unavailable("Prometheus is not connected (PROMETHEUS_URL is not set).");
        }
        MetricsSnapshot current = cached;
        Instant now = clock.instant();
        if (current != null && current.collectedAt() != null
                && current.collectedAt().plus(properties.metricsCacheTtl()).isAfter(now)) {
            return current;
        }
        MetricsSnapshot fresh = fetch(now);
        cached = fresh;
        return fresh;
    }

    private MetricsSnapshot fetch(Instant now) {
        String selector = "{application=\"" + application + "\"}";
        String errorSelector = "{application=\"" + application + "\",status=~\"5..\"}";
        try {
            Optional<Double> requestRate =
                    query("sum(rate(http_server_requests_seconds_count" + selector + "[5m]))");
            Optional<Double> errorRatio = query("sum(rate(http_server_requests_seconds_count" + errorSelector
                    + "[5m])) / sum(rate(http_server_requests_seconds_count" + selector + "[5m]))");
            Optional<Double> p95Seconds = query("histogram_quantile(0.95, sum by (le) (rate(http_server_requests_seconds_bucket"
                    + selector + "[5m])))");
            Optional<Double> podsUp = query("count(process_uptime_seconds" + selector + ")");

            return new MetricsSnapshot(
                    true,
                    null,
                    requestRate.orElse(null),
                    errorRatio.orElse(null),
                    p95Seconds.map(s -> s * 1000).orElse(null),
                    podsUp.map(Double::intValue).orElse(null),
                    now);
        } catch (RuntimeException e) {
            log.warn("Prometheus query failed: {}", e.getMessage());
            return new MetricsSnapshot(false, "Prometheus did not respond.", null, null, null, null, now);
        }
    }

    /** Runs an instant query; empty when the result has no samples or is NaN (e.g. no traffic yet). */
    private Optional<Double> query(String promql) {
        JsonNode body = http.get()
                .uri(baseUrl + "/api/v1/query?query={q}", promql)
                .retrieve()
                .body(JsonNode.class);

        if (body == null || !"success".equals(body.path("status").asText())) {
            throw new IllegalStateException("Unexpected Prometheus response");
        }
        JsonNode result = body.path("data").path("result");
        if (!result.isArray() || result.isEmpty()) {
            return Optional.empty();
        }
        double value = Double.parseDouble(result.get(0).path("value").get(1).asText());
        return Double.isNaN(value) || Double.isInfinite(value) ? Optional.empty() : Optional.of(value);
    }

    public record MetricsSnapshot(
            boolean available,
            String reason,
            Double requestsPerSecond,
            Double errorRatio,
            Double p95LatencyMs,
            Integer podsUp,
            Instant collectedAt) {

        static MetricsSnapshot unavailable(String reason) {
            return new MetricsSnapshot(false, reason, null, null, null, null, null);
        }
    }
}
