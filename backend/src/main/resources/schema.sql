-- ==============================================================================
-- Hotel Management Multi-Tenant Application Database Schema
-- Target Database: PostgreSQL 16+ (Hosted on Neon AWS ap-southeast-1)
-- ==============================================================================

-- 1. HOTELS (Tenant Partition Root)
CREATE TABLE IF NOT EXISTS hotels (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hotel_slug ON hotels (slug);

-- 2. USERS (Multi-Tenant Staff, Admins, and Guests)
-- Note: Global platform ADMIN users have hotel_id = NULL.
-- Tenant-specific roles (GENERAL_MANAGER, SUPERVISOR, FRONT_DESK, FULFILLER, GUEST) have hotel_id referencing hotels(id).
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(160) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(40) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    hotel_id BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE,
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'GENERAL_MANAGER', 'SUPERVISOR', 'FRONT_DESK', 'FULFILLER', 'GUEST'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_user_hotel_id ON users (hotel_id);
CREATE INDEX IF NOT EXISTS idx_user_role ON users (role);

-- 3. FLOORS (Hotel Floor Level Configuration)
CREATE TABLE IF NOT EXISTS floors (
    id BIGSERIAL PRIMARY KEY,
    floor_number INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    wing VARCHAR(80),
    hotel_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_floors_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE,
    CONSTRAINT uk_hotel_floor_number UNIQUE (hotel_id, floor_number)
);

CREATE INDEX IF NOT EXISTS idx_floor_hotel ON floors (hotel_id);

-- 4. ROOMS (Room Inventory & Live Stay Status)
CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    room_number VARCHAR(40) NOT NULL,
    floor INTEGER NOT NULL,
    type_tag VARCHAR(40),
    type_full VARCHAR(100),
    badge_status VARCHAR(60),
    readiness VARCHAR(60) NOT NULL DEFAULT 'READY',
    occupied BOOLEAN NOT NULL DEFAULT FALSE,
    vip BOOLEAN NOT NULL DEFAULT FALSE,
    vip_tier VARCHAR(60),
    dnd BOOLEAN NOT NULL DEFAULT FALSE,
    cleaner_assigned VARCHAR(120),
    cleaning_category VARCHAR(60),
    duration VARCHAR(60),
    pin VARCHAR(20),
    folio_balance VARCHAR(60),
    preferences VARCHAR(255),
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
