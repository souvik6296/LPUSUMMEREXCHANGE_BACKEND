-- ============================================================
-- LPU Summer Exchange — Supabase SQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  photo_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  plan       TEXT NOT NULL,         -- 'basic' | 'explorer' | 'best_value'
  courses    TEXT[] NOT NULL,       -- array of course slugs
  amount     INT NOT NULL,
  utr        TEXT,                  -- 12-digit UPI UTR
  status     TEXT DEFAULT 'pending_payment',
  -- 'pending_payment' | 'pending_verification' | 'active' | 'completed'
  receipt_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS) — keep tables accessible from service role
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (backend uses service key, bypasses RLS)
-- No anon policies needed since all requests go through the Express backend.
