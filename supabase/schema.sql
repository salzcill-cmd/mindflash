-- ============================================================
-- MindFlash — Skema Database + Row Level Security (RLS)
-- ============================================================
-- Cara pakai:
--   1. Buka https://supabase.com → buat project baru
--   2. Buka menu "SQL Editor" → New query
--   3. Salin seluruh file ini, jalankan (Run)
--   4. Isi .env dengan URL & anon key projectmu (Settings → API)
--
-- Semua tabel memakai RLS: user hanya bisa akses data miliknya.
-- Data ber-`is_public = true` bisa dibaca publik tanpa login (untuk fitur share).
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Helper: perbarui updated_at otomatis
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- TABEL: profiles
-- id = id user dari Supabase Auth
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Trigger: buat baris profil otomatis saat user mendaftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- ------------------------------------------------------------
-- TABEL: mindmaps
-- ------------------------------------------------------------
create table if not exists public.mindmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Mindmap Baru',
  mode text not null default 'freeform' check (mode in ('freeform', 'auto-layout')),
  data jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mindmaps enable row level security;

drop trigger if exists mindmaps_updated_at on public.mindmaps;
create trigger mindmaps_updated_at
  before update on public.mindmaps
  for each row execute function public.set_updated_at();

create policy "mindmaps_select_own" on public.mindmaps
  for select using (auth.uid() = user_id);

create policy "mindmaps_select_public" on public.mindmaps
  for select using (is_public = true);

create policy "mindmaps_insert_own" on public.mindmaps
  for insert with check (auth.uid() = user_id);

create policy "mindmaps_update_own" on public.mindmaps
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mindmaps_delete_own" on public.mindmaps
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- TABEL: flashcard_decks
-- ------------------------------------------------------------
create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Deck Baru',
  color text not null default 'violet',
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.flashcard_decks enable row level security;

create policy "decks_select_own" on public.flashcard_decks
  for select using (auth.uid() = user_id);

create policy "decks_select_public" on public.flashcard_decks
  for select using (is_public = true);

create policy "decks_insert_own" on public.flashcard_decks
  for insert with check (auth.uid() = user_id);

create policy "decks_update_own" on public.flashcard_decks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "decks_delete_own" on public.flashcard_decks
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- TABEL: flashcards
-- Kepemilikan ditentukan lewat deck-nya (subquery).
-- ------------------------------------------------------------
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  front_text text not null default '',
  back_text text not null default '',
  image_url text,
  order_index int not null default 0
);

alter table public.flashcards enable row level security;

create policy "flashcards_select_own" on public.flashcards
  for select using (
    exists (
      select 1 from public.flashcard_decks d
      where d.id = deck_id and d.user_id = auth.uid()
    )
    or exists (
      select 1 from public.flashcard_decks d
      where d.id = deck_id and d.is_public = true
    )
  );

create policy "flashcards_insert_own" on public.flashcards
  for insert with check (
    exists (
      select 1 from public.flashcard_decks d
      where d.id = deck_id and d.user_id = auth.uid()
    )
  );

create policy "flashcards_update_own" on public.flashcards
  for update using (
    exists (
      select 1 from public.flashcard_decks d
      where d.id = deck_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.flashcard_decks d
      where d.id = deck_id and d.user_id = auth.uid()
    )
  );

create policy "flashcards_delete_own" on public.flashcards
  for delete using (
    exists (
      select 1 from public.flashcard_decks d
      where d.id = deck_id and d.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- TABEL: flashcard_progress (SM-2)
-- ------------------------------------------------------------
create table if not exists public.flashcard_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  ease_factor double precision not null default 2.5,
  interval_days int not null default 0,
  next_review_at timestamptz,
  last_reviewed_at timestamptz,
  unique (user_id, flashcard_id)
);

alter table public.flashcard_progress enable row level security;

create policy "progress_select_own" on public.flashcard_progress
  for select using (auth.uid() = user_id);

create policy "progress_insert_own" on public.flashcard_progress
  for insert with check (auth.uid() = user_id);

create policy "progress_update_own" on public.flashcard_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "progress_delete_own" on public.flashcard_progress
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- STORAGE: bucket "avatars" untuk foto profil (opsional)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_own_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_own_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_own_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ------------------------------------------------------------
-- CATATAN HAPUS AKUN PENUH:
-- Menghapus baris profiles menghapus semua data user lewat
-- foreign key ON DELETE CASCADE. Untuk menghapus user Auth
-- itu sendiri (bukan hanya datanya), deploy Supabase Edge
-- Function berikut lalu panggil dari aplikasi:
--
--   supabase/functions/delete-account/index.ts
--   ------------------------------------------
--   import { createClient } from 'jsr:@supabase/supabase-js@2'
--
--   Deno.serve(async (req) => {
--     const supabase = createClient(
--       Deno.env.get('SUPABASE_URL')!,
--       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
--       { auth: { persistSession: false } },
--     )
--     const authHeader = req.headers.get('Authorization')!
--     const { data: { user } } = await supabase.auth.getUser(authHeader)
--     if (!user) return new Response('Unauthorized', { status: 401 })
--     await supabase.from('profiles').delete().eq('id', user.id)
--     const { error } = await supabase.auth.admin.deleteUser(user.id)
--     if (error) return new Response(error.message, { status: 500 })
--     return new Response('OK', { status: 200 })
--   })
-- ------------------------------------------------------------
