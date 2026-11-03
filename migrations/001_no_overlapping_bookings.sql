-- ============================================================================
-- Migration: 001_no_overlapping_bookings.sql
-- Description: Prevent overlapping meeting room bookings via PostgreSQL Exclusion Constraint
-- Engine: PostgreSQL 12+ (Requires btree_gist extension)
-- ============================================================================

-- 1. Enable btree_gist extension for mixing scalar (room_id) and range (tstzrange)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Ensure meeting rooms and bookings tables exist
CREATE TABLE IF NOT EXISTS meeting_rooms (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
  floor VARCHAR(32) NOT NULL DEFAULT '1F',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
  startup_id VARCHAR(64) NOT NULL,
  startup_name VARCHAR(128),
  booked_by VARCHAR(128) NOT NULL,
  title VARCHAR(255) NOT NULL,
  purpose VARCHAR(255),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  duration NUMERIC(4, 2) NOT NULL,
  attendees INT NOT NULL,
  credit_hours_used NUMERIC(4, 2) NOT NULL DEFAULT 0,
  overage_hours NUMERIC(4, 2) NOT NULL DEFAULT 0,
  cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) NOT NULL DEFAULT 'Confirmed',
  series_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

-- 3. Add Exclusion Constraint to guarantee zero double-bookings at database level:
-- Back-to-back bookings (e.g. 10:00-11:00 and 11:00-12:00) are allowed because
-- upper bound is exclusive '[)'. Overlaps are strictly prevented.
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS no_overlapping_bookings;

ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  room_id WITH =,
  tstzrange(start_datetime, end_datetime, '[)') WITH &&
) WHERE (status != 'Cancelled');

-- 4. Index for fast monthly allowance lookups per startup
CREATE INDEX IF NOT EXISTS idx_bookings_startup_month 
ON bookings (startup_id, date) 
WHERE (status != 'Cancelled');
