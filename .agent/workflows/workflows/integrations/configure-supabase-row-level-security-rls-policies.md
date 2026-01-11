# Supabase Row Level Security (RLS)

**Tags:** Supabase, Database, Security, Postgres, Database, Postgres, Local Development, +1, Real-time, Supabase, WebSocket, Auth, NextAuth, Security, +1, Agentic AI, Security, Vulnerability, Agentic AI, Database, SQL, Python, Security, Cryptography

description: Define secure database policies to protect user data

1. **Enable RLS**:
   - Always enable RLS on every table you create.
     alter table profiles enable row level security;

2. **Create "Select" Policy**:
   - Allow users to see only their own profile.
     create policy "Users can view own profile"
     on profiles for select
     to authenticated
     using ( auth.uid() = id );

3. **Create "Update" Policy**:
   - Allow users to update only their own profile.
     create policy "Users can update own profile"
     on profiles for update
     to authenticated
     using ( auth.uid() = id );

4. **Pro Tips**:
   - Use the anon role for public data (like blog posts).
   - Test your policies in the Supabase dashboard using the "Impersonate User" feature.
