package dev.cloudstory.api.deployments;

import dev.cloudstory.api.config.CloudStoryProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.stereotype.Component;

/** Checks the bearer token CI uses to record deployments, in constant time. */
@Component
public class DeployTokenVerifier {

    private static final String PREFIX = "Bearer ";

    private final CloudStoryProperties properties;

    public DeployTokenVerifier(CloudStoryProperties properties) {
        this.properties = properties;
    }

    public boolean enabled() {
        return properties.deployEventsEnabled();
    }

    public boolean matches(String authorizationHeader) {
        if (!enabled() || authorizationHeader == null || !authorizationHeader.startsWith(PREFIX)) {
            return false;
        }
        byte[] given = authorizationHeader.substring(PREFIX.length()).trim().getBytes(StandardCharsets.UTF_8);
        byte[] expected = properties.deployEventToken().getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(given, expected);
    }
}
