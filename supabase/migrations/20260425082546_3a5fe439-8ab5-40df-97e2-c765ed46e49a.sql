
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  counter int := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  if base_username = '' or base_username is null then
    base_username := 'user';
  end if;
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', final_username)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- POSTS
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 500 and char_length(content) > 0),
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;
create index posts_user_id_idx on public.posts(user_id);
create index posts_created_at_idx on public.posts(created_at desc);

create policy "Posts viewable by authenticated"
  on public.posts for select to authenticated using (true);
create policy "Users can create own posts"
  on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own posts"
  on public.posts for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own posts"
  on public.posts for delete to authenticated using (auth.uid() = user_id);

-- LIKES
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.likes enable row level security;
create index likes_post_id_idx on public.likes(post_id);

create policy "Likes viewable by authenticated"
  on public.likes for select to authenticated using (true);
create policy "Users can like as themselves"
  on public.likes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can unlike own likes"
  on public.likes for delete to authenticated using (auth.uid() = user_id);

-- COMMENTS
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 500 and char_length(content) > 0),
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
create index comments_post_id_idx on public.comments(post_id);

create policy "Comments viewable by authenticated"
  on public.comments for select to authenticated using (true);
create policy "Users can create own comments"
  on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own comments"
  on public.comments for delete to authenticated using (auth.uid() = user_id);

-- FOLLOWS
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
alter table public.follows enable row level security;
create index follows_following_idx on public.follows(following_id);

create policy "Follows viewable by authenticated"
  on public.follows for select to authenticated using (true);
create policy "Users can follow as themselves"
  on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "Users can unfollow own follows"
  on public.follows for delete to authenticated using (auth.uid() = follower_id);

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 2000 and char_length(content) > 0),
  read boolean not null default false,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
alter table public.messages enable row level security;
create index messages_pair_idx on public.messages(sender_id, recipient_id, created_at);
create index messages_recipient_idx on public.messages(recipient_id);

create policy "Users can read own messages"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Users can send messages as themselves"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);
create policy "Recipients can mark messages as read"
  on public.messages for update to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);
