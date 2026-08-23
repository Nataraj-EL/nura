CREATE TABLE users (
    id UUID PRIMARY KEY,
    phone_number VARCHAR(30) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_phone ON users(phone_number);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    age INT,
    typical_cycle_length INT,
    typical_period_duration INT,
    timezone VARCHAR(50),
    onboarding_status VARCHAR(30) NOT NULL
);

CREATE TABLE user_otps (
    id UUID PRIMARY KEY,
    phone_number VARCHAR(30) NOT NULL,
    hashed_otp VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    attempt_count INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_user_otps_phone ON user_otps(phone_number);

CREATE TABLE user_sessions (
    token VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL
);
