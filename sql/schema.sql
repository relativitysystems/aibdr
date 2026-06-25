-- Add website scraping columns to ai_bdr_leads
-- Run these against your Supabase project SQL editor

alter table ai_bdr_leads
add column if not exists website_scrape jsonb;

alter table ai_bdr_leads
add column if not exists website_text text;
