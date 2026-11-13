package dev.cloudstory.api.deployments;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Body CI sends after a deployment step. Only real pipeline runs create these. */
public record NewDeploymentEvent(
        @NotBlank @Size(max = 64) @Pattern(regexp = "[a-z0-9-]+") String service,
        @NotBlank @Size(max = 64) String version,
        @NotBlank @Pattern(regexp = "[0-9a-f]{7,40}") String commitSha,
        @NotBlank @Size(max = 32) @Pattern(regexp = "[a-z0-9-]+") String environment,
        @NotBlank @Pattern(regexp = "started|succeeded|failed|rolled-back") String status,
        @Size(max = 100) String triggeredBy,
        @Size(max = 500) @Pattern(regexp = "https://.*") String runUrl) {}
