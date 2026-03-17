-- Create profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'client',
  region text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Add RLS policies
create policy "Users can view own profile"
on profiles
for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on profiles
for insert
with check (auth.uid() = id);

-- Create profile trigger for new users
create function create_profile_for_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure create_profile_for_user();
