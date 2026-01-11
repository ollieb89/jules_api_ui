# Setup Supabase Realtime

**Tags:** Real-time, Supabase, WebSocket, Supabase, Database, Security, +1, Auth, NextAuth, Security, +1, Stripe, Payments, E-commerce, Next.js, Real-time, WebSockets, Agentic AI, Reasoning, Planning, Agentic AI, Prompt Engineering, LLM

description: Real-time data sync

1. **Enable Realtime**:
   - Go to Database → Replication in Supabase.

2. **Subscribe to Changes**:
   const channel = supabase
   .channel('messages')
   .on('postgres_changes', { event: '\*', schema: 'public', table: 'messages' }, (payload) => {
   if (payload.eventType === 'INSERT') {
   setMessages((prev) => [...prev, payload.new]);
   }
   })
   .subscribe();

3. **Implement Presence**:
   await channel.track({ user: 'John', online_at: new Date() });

4. **Pro Tips**:
   - Use RLS for security.
   - Combine with React Query.
