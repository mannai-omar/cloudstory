package dev.cloudstory.api.deployments;

import static org.assertj.core.api.Assertions.assertThat;

import dev.cloudstory.api.config.CloudStoryProperties;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class DeployTokenVerifierTest {

    private static DeployTokenVerifier verifierWithToken(String token) {
        return new DeployTokenVerifier(new CloudStoryProperties(
                "dev", "abc1234", "test", token, "", Duration.ofSeconds(1), Duration.ofSeconds(1)));
    }

    @Test
    void acceptsTheConfiguredToken() {
        assertThat(verifierWithToken("s3cret").matches("Bearer s3cret")).isTrue();
    }

    @Test
    void rejectsWrongMissingOrMalformedTokens() {
        DeployTokenVerifier verifier = verifierWithToken("s3cret");
        assertThat(verifier.matches("Bearer nope")).isFalse();
        assertThat(verifier.matches(null)).isFalse();
        assertThat(verifier.matches("s3cret")).isFalse();
    }

    @Test
    void isDisabledWhenNoTokenIsConfigured() {
        DeployTokenVerifier verifier = verifierWithToken("");
        assertThat(verifier.enabled()).isFalse();
        assertThat(verifier.matches("Bearer ")).isFalse();
    }
}
