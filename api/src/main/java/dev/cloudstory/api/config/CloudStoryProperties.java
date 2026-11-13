package dev.cloudstory.api.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "cloudstory")
public record CloudStoryProperties(
        @DefaultValue("dev") String version,
        @DefaultValue("unknown") String commit,
        @DefaultValue("local") String environment,
        @DefaultValue("") String deployEventToken,
        @DefaultValue("") String prometheusUrl,
        @DefaultValue("2s") Duration prometheusTimeout,
        @DefaultValue("15s") Duration metricsCacheTtl) {

    public boolean deployEventsEnabled() {
        return deployEventToken != null && !deployEventToken.isBlank();
    }

    public boolean prometheusConfigured() {
        return prometheusUrl != null && !prometheusUrl.isBlank();
    }
}
