-- ==============================================================================
-- Hotel Management Multi-Tenant Application Database Schema
-- Target Database: PostgreSQL 16+ (Local / Neon)
-- ==============================================================================

-- 1. HOTELS (Tenant Partition Root)
CREATE TABLE IF NOT EXISTS hotels (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(80) NOT NULL,
    contact_email VARCHAR(150),
    contact_phone VARCHAR(40),
    address VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hotel_slug ON hotels (slug);

-- 2. DEPARTMENTS (Dynamic Hotel-Scoped Departments)
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

-- 3. USERS (Multi-Tenant Platform Admin, Staff, and Guests)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(32) NOT NULL,
    employee_code VARCHAR(40),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITHOUT TIME ZONE,
    token_version BIGINT NOT NULL DEFAULT 0,
    hotel_id BIGINT,
    department_id BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'GENERAL_MANAGER', 'SUPERVISOR', 'FRONT_DESK', 'FULFILLER', 'GUEST'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_user_hotel_id ON users (hotel_id);
CREATE INDEX IF NOT EXISTS idx_user_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_user_department_id ON users (department_id);
CREATE INDEX IF NOT EXISTS idx_user_employee_code ON users (employee_code);

-- 4. FLOORS (Hotel Floor Level Configuration)
CREATE TABLE IF NOT EXISTS floors (
    id BIGSERIAL PRIMARY KEY,
    floor_number INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    wing VARCHAR(120),
    hotel_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_floors_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE,
    CONSTRAINT uk_hotel_floor_number UNIQUE (hotel_id, floor_number)
);

CREATE INDEX IF NOT EXISTS idx_floor_hotel ON floors (hotel_id);

-- 5. ROOMS (Room Inventory & Live Stay Status)
CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    room_number VARCHAR(40) NOT NULL,
    floor INTEGER NOT NULL,
    type_tag VARCHAR(40),
    type_full VARCHAR(100),
    badge_status VARCHAR(60),
    readiness VARCHAR(60) NOT NULL DEFAULT 'ready',
    occupied BOOLEAN NOT NULL DEFAULT FALSE,
    vip BOOLEAN NOT NULL DEFAULT FALSE,
    vip_tier VARCHAR(60),
    dnd BOOLEAN NOT NULL DEFAULT FALSE,
    cleaner_assigned VARCHAR(120),
    cleaning_category VARCHAR(60),
    duration VARCHAR(60),
    pin VARCHAR(20),
    folio_balance VARCHAR(60),
    preferences VARCHAR(1000),
    guest_name VARCHAR(120),
    guest_email VARCHAR(160),
    guest_phone VARCHAR(60),
    guests_count INTEGER DEFAULT 1,
    check_in_date VARCHAR(60),
    check_out_date VARCHAR(60),
    booking_ref VARCHAR(80),
    hotel_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE,
    CONSTRAINT uk_hotel_room_number UNIQUE (hotel_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_room_hotel_floor ON rooms (hotel_id, floor);
