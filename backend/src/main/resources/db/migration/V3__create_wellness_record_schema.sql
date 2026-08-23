CREATE TABLE wellness_records (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    water_intake INTEGER,
    mood VARCHAR(50),
    energy_level INTEGER,
    sleep_duration_minutes INTEGER,
    symptoms JSONB,
    note VARCHAR(1000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_wellness_records_user_date ON wellness_records(user_id, record_date);
