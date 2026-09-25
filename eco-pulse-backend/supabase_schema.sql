-- ============================================================
-- EcoPulse – Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── USERS ─────────────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,
  password_hash text not null,
  full_name     text,
  role          text default 'viewer',   -- 'admin' | 'viewer'
  created_at    timestamptz default now()
);

-- ── AUDIT RESULTS ─────────────────────────────────────────────
create table if not exists public.audit_results (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid references public.users(id) on delete cascade,
  inputs             jsonb,
  net_tons           numeric,
  gross_tons         numeric,
  solar_offset_tons  numeric,
  tree_offset_tons   numeric default 28,
  per_capita_kg      numeric,
  naac_score         numeric,
  naac_grade         text,
  breakdown          jsonb,
  notes              text,
  created_at         timestamptz default now()
);

-- ── PREDICTIONS ───────────────────────────────────────────────
-- Model: RandomForestRegressor trained on 3,652-row daily campus dataset
-- Features: 19 (campus context, energy, fuel, resources, scope 1/2/3, lag features)
create table if not exists public.predictions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references public.users(id) on delete cascade,
  inputs              jsonb,                 -- full 19-field PredictionInput snapshot
  daily_tons_co2e     numeric,               -- model output: daily CO2e (tonnes)
  monthly_estimate    numeric,               -- daily_tons_co2e * 30 (convenience field)
  confidence          numeric,               -- model confidence (%)
  peak_risk           text,                  -- 'low' | 'moderate' | 'high'
  cost_estimate_lakhs numeric,               -- monthly_estimate * 0.78
  created_at          timestamptz default now()
);

-- ── Row-Level Security (optional but recommended) ─────────────
alter table public.users         enable row level security;
alter table public.audit_results enable row level security;
alter table public.predictions   enable row level security;

-- Allow service role full access (FastAPI uses service key → bypasses RLS)
-- No extra policies needed when using service_role key in the backend.
