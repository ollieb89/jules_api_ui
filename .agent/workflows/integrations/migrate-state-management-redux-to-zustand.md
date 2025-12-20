# Migrate Redux to Zustand

**Tags:** State, Redux, Zustand, Auth, NextAuth, Security, +1, Stripe, Payments, E-commerce, Supabase, Database, Security, +1, Next.js, State Management, Zustand, Agentic AI, Reasoning, Planning, Agentic AI, Prompt Engineering, LLM

description: Simplify state management

1. **Install Zustand**:
   // turbo
   - Run npm install zustand

2. **Convert Store**:
   import { create } from 'zustand';

   export const useStore = create((set) => ({
   count: 0,
   increment: () => set((state) => ({ count: state.count + 1 }))
   }));

3. **Use in Components**:
   const count = useStore((state) => state.count);
   const increment = useStore((state) => state.increment);

4. **Pro Tips**:
   - 10x smaller than Redux.
   - No providers needed.
