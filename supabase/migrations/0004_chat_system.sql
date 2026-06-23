-- ============================================================
-- MIGRATION: 0004_chat_system.sql
-- Database schema alterations for the Realtime Chat System on Rishtajodo
-- ============================================================

-- 1. Upgrade message_type Enum values
alter type public.message_type add value if not exists 'emoji';
alter type public.message_type add value if not exists 'system_message';
alter type public.message_type add value if not exists 'voice_message';
alter type public.message_type add value if not exists 'video_message';

-- 2. Alter chat_rooms table to add required columns
alter table public.chat_rooms 
  add column if not exists type text not null default 'user_to_user' check (type in ('user_to_user', 'user_to_associate', 'associate_to_admin')),
  add column if not exists created_by_id uuid references public.profiles(id) on delete set null,
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

-- 3. Alter chat_room_participants table to add required columns
alter table public.chat_room_participants 
  add column if not exists last_read_at timestamptz not null default now(),
  add column if not exists is_muted boolean not null default false,
  add column if not exists is_pinned boolean not null default false,
  add column if not exists pinned_at timestamptz;

-- 4. Alter messages table to add required columns
alter table public.messages 
  add column if not exists status text not null default 'sent' check (status in ('sent', 'delivered', 'read', 'failed', 'recalled')),
  add column if not exists metadata jsonb,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists recalled_at timestamptz;

-- 5. Alter message_attachments table to add required columns
alter table public.message_attachments
  add column if not exists virus_scan_status text not null default 'pending' check (virus_scan_status in ('pending', 'clean', 'flagged'));

-- 6. Create chat_blocks table
create table if not exists public.chat_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_blocker_blocked unique (blocker_id, blocked_id)
);

-- 7. Create chat_reports table
create table if not exists public.chat_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid references public.chat_rooms(id) on delete set null,
  message_id uuid, -- since messages is partitioned, we won't put a strict FK constraints without message_created_at
  message_created_at timestamptz,
  reason text not null check (reason in ('spam', 'abuse', 'harassment', 'fake_profile', 'inappropriate_content', 'scam')),
  description text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_reported_message_partitioned foreign key (message_id, message_created_at) references public.messages(id, created_at) on delete set null
);

-- 8. Create chat_archives table
create table if not exists public.chat_archives (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_profile_room_archive unique (profile_id, room_id)
);

-- 9. Create chat_settings table
create table if not exists public.chat_settings (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  hide_online_status boolean not null default false,
  hide_last_seen boolean not null default false,
  restrict_media_download boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
create index if not exists idx_chat_blocks_blocker on public.chat_blocks(blocker_id);
create index if not exists idx_chat_reports_status on public.chat_reports(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
alter table public.chat_blocks enable row level security;
alter table public.chat_reports enable row level security;
alter table public.chat_archives enable row level security;
alter table public.chat_settings enable row level security;

-- Drop old policies to prevent collision and replace with updated ones
drop policy if exists "Participants view rooms" on public.chat_rooms;
drop policy if exists "Participants join rooms" on public.chat_room_participants;
drop policy if exists "Room participants view messages" on public.messages;
drop policy if exists "Room participants send messages" on public.messages;
drop policy if exists "Participants manage reads" on public.message_reads;
drop policy if exists "Participants view attachments" on public.message_attachments;

-- Rooms Policy
create policy "Rooms select policy" on public.chat_rooms
  for select using (
    exists (
      select 1 from public.chat_room_participants
      where chat_room_participants.room_id = id
      and chat_room_participants.profile_id = auth.uid()
    )
    or (select role from public.profiles where id = auth.uid()) = 'super_admin'
  );

create policy "Rooms insert policy" on public.chat_rooms
  for insert with check (auth.uid() is not null);

create policy "Rooms update policy" on public.chat_rooms
  for update using (
    exists (
      select 1 from public.chat_room_participants
      where chat_room_participants.room_id = id
      and chat_room_participants.profile_id = auth.uid()
    )
    or (select role from public.profiles where id = auth.uid()) = 'super_admin'
  );

-- Participants Policy
create policy "Participants select policy" on public.chat_room_participants
  for select using (
    exists (
      select 1 from public.chat_room_participants as cp
      where cp.room_id = room_id
      and cp.profile_id = auth.uid()
    )
    or (select role from public.profiles where id = auth.uid()) = 'super_admin'
  );

create policy "Participants insert policy" on public.chat_room_participants
  for insert with check (auth.uid() is not null);

create policy "Participants update policy" on public.chat_room_participants
  for update using (profile_id = auth.uid());

-- Messages Policy
create policy "Messages select policy" on public.messages
  for select using (
    exists (
      select 1 from public.chat_room_participants
      where chat_room_participants.room_id = room_id
      and chat_room_participants.profile_id = auth.uid()
    )
    or (select role from public.profiles where id = auth.uid()) = 'super_admin'
  );

create policy "Messages insert policy" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_room_participants
      where chat_room_participants.room_id = room_id
      and chat_room_participants.profile_id = auth.uid()
    )
  );

create policy "Messages update policy" on public.messages
  for update using (
    sender_id = auth.uid()
    or exists (
      select 1 from public.chat_room_participants
      where chat_room_participants.room_id = room_id
      and chat_room_participants.profile_id = auth.uid()
    )
  );

-- Message Reads Policy
create policy "Message reads policy" on public.message_reads
  for all using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.chat_room_participants as cp
      join public.messages as m on m.room_id = cp.room_id
      where m.id = message_id and cp.profile_id = auth.uid()
    )
  );

-- Attachments Policy
create policy "Attachments policy" on public.message_attachments
  for all using (
    exists (
      select 1 from public.chat_room_participants as cp
      join public.messages as m on m.room_id = cp.room_id
      where m.id = message_id and cp.profile_id = auth.uid()
    )
  );

-- Blocks Policy
create policy "Blocks policy" on public.chat_blocks
  for all using (blocker_id = auth.uid() or blocked_id = auth.uid());

-- Reports Policy
create policy "Reports select policy" on public.chat_reports
  for select using ((select role from public.profiles where id = auth.uid()) = 'super_admin');
  
create policy "Reports update policy" on public.chat_reports
  for update using ((select role from public.profiles where id = auth.uid()) = 'super_admin');

create policy "Reports insert policy" on public.chat_reports
  for insert with check (reporter_id = auth.uid());

-- Archives Policy
create policy "Archives policy" on public.chat_archives
  for all using (profile_id = auth.uid());

-- Settings Policy
create policy "Settings policy" on public.chat_settings
  for all using (profile_id = auth.uid() or (select role from public.profiles where id = auth.uid()) = 'super_admin');

-- ============================================================
-- AUTO-SETTINGS CREATION ON SIGN-UP
-- ============================================================
create or replace function public.handle_new_chat_settings()
returns trigger as $$
begin
  insert into public.chat_settings (profile_id, hide_online_status, hide_last_seen, restrict_media_download)
  values (new.id, false, false, false)
  on conflict (profile_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_profile_created_chat_settings
  after insert on public.profiles
  for each row execute procedure public.handle_new_chat_settings();

-- Seed settings for existing profiles
insert into public.chat_settings (profile_id, hide_online_status, hide_last_seen, restrict_media_download)
select id, false, false, false from public.profiles
on conflict (profile_id) do nothing;

-- ============================================================
-- STORAGE BUCKETS SETUP & SECURITY
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments', 
  'chat-attachments', 
  false, 
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

drop policy if exists "Attachments select storage policy" on storage.objects;
create policy "Attachments select storage policy" on storage.objects
  for select using (
    bucket_id = 'chat-attachments'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.chat_room_participants
      where chat_room_participants.room_id = (split_part(storage.objects.name, '/', 1))::uuid
      and chat_room_participants.profile_id = auth.uid()
    )
  );

drop policy if exists "Attachments insert storage policy" on storage.objects;
create policy "Attachments insert storage policy" on storage.objects
  for insert with check (
    bucket_id = 'chat-attachments'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.chat_room_participants
      where chat_room_participants.room_id = (split_part(storage.objects.name, '/', 1))::uuid
      and chat_room_participants.profile_id = auth.uid()
    )
  );

-- ============================================================
-- SUPABASE REALTIME CONFIGURATION
-- ============================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- Safely add if not already in publication
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;

    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and tablename = 'chat_rooms'
    ) then
      alter publication supabase_realtime add table public.chat_rooms;
    end if;

    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and tablename = 'chat_room_participants'
    ) then
      alter publication supabase_realtime add table public.chat_room_participants;
    end if;
  end if;
end;
$$;
