package dev.cloudstory.api.deployments;

import java.time.OffsetDateTime;

public record DeploymentEvent(
        long id,
        String service,
        String version,
        String commitSha,
        String environment,
        String status,
        String triggeredBy,
        String runUrl,
        OffsetDateTime createdAt) {}
