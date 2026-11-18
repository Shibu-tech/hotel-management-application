-- ==============================================================================
-- Migration V1: Multi-Tenant Auth Hardening, Departments & Employee Accounts
-- Non-destructive, idempotent SQL migration for PostgreSQL 16+ (Neon / Local)
-- Preserves all existing hotels, users, floors, and rooms records.
-- ==============================================================================

-- 1. Optional hotel contact metadata on hotels table
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(40);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS address VARCHAR(255);

-- 2. Hotel-scoped dynamic departments table
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    hotel_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_departments_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE,
    CONSTRAINT uk_department_hotel_name UNIQUE (hotel_id, name)
);

CREATE INDEX IF NOT EXISTS idx_department_hotel ON departments (hotel_id);

-- 3. Employee identity, department link, lockout, and session revocation columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code VARCHAR(40);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version BIGINT NOT NULL DEFAULT 0;

-- Add foreign key for users.department_id safely if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_department'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT fk_users_department
            FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_department_id ON users (department_id);
CREATE INDEX IF NOT EXISTS idx_user_employee_code ON users (employee_code);
