package dev.cloudstory.api.content;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Read-only story content. Changes are shipped as Flyway migrations, so content is versioned like code. */
@RestController
@RequestMapping("/api")
public class ContentController {

    public record JourneyStep(int position, String name, String tool, String description) {}

    public record InfraComponent(
            String slug, String name, String layer, String tool, String description, String why, int position) {}

    private final JdbcClient jdbc;

    public ContentController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/journey")
    public List<JourneyStep> journey() {
        return jdbc.sql("select position, name, tool, description from journey_step order by position")
                .query(JourneyStep.class)
                .list();
    }

    @GetMapping("/components")
    public List<InfraComponent> components() {
        return jdbc.sql("""
                        select slug, name, layer, tool, description, why, position
                        from infra_component
                        order by position
                        """)
                .query(InfraComponent.class)
                .list();
    }
}
