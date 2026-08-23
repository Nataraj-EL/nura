CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    period_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    period_started_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    wellness_checkin_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    water_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    insight_available_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    scheduled_time TIME NOT NULL DEFAULT '20:00:00',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(500) NOT NULL,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    delivery_channel VARCHAR(50) NOT NULL DEFAULT 'IN_APP',
    next_delivery_time TIMESTAMP,
    read_at TIMESTAMP,
    expires_at TIMESTAMP,
    record_date DATE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_notifications_dedup ON notifications (user_id, category, record_date) WHERE record_date IS NOT NULL;
