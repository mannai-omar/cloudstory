create table journey_step (
    position    integer primary key,
    name        varchar(80)  not null,
    tool        varchar(80)  not null,
    description text         not null
);

create table infra_component (
    slug        varchar(40)  primary key,
    name        varchar(80)  not null,
    layer       varchar(20)  not null check (layer in ('source', 'delivery', 'aws', 'cluster', 'observability')),
    tool        varchar(80)  not null,
    description text         not null,
    why         text         not null,
    position    integer      not null
);

create table deployment_event (
    id           bigserial    primary key,
    service      varchar(64)  not null,
    version      varchar(64)  not null,
    commit_sha   varchar(40)  not null,
    environment  varchar(32)  not null,
    status       varchar(16)  not null check (status in ('started', 'succeeded', 'failed', 'rolled-back')),
    triggered_by varchar(100),
    run_url      varchar(500),
    created_at   timestamptz  not null default now()
);

create index deployment_event_created_at_idx on deployment_event (created_at desc);
