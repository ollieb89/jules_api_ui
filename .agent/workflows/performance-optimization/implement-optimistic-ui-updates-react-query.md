# Implement Optimistic UI Updates

**Tags:** React Query, UX, Performance, Performance, Images, Optimization, +1, Backend, Caching, Performance, +1, Performance, API, React, +1, Agentic AI, Performance, Optimization, Performance, Web Vitals, Optimization, Next.js, Performance, Optimization

description: Update UI before server confirms

1. **Install React Query**:
   // turbo
   - Run npm install @tanstack/react-query

2. **Setup Optimistic Mutation**:
   const addTodo = useMutation({
   mutationFn: (text) => fetch('/api/todos', { method: 'POST', body: JSON.stringify({ text }) }),
   onMutate: async (newTodo) => {
   await queryClient.cancelQueries({ queryKey: ['todos'] });
   const previous = queryClient.getQueryData(['todos']);
   queryClient.setQueryData(['todos'], (old) => [...old, newTodo]);
   return { previous };
   },
   onError: (err, newTodo, context) => {
   queryClient.setQueryData(['todos'], context.previous);
   },
   });

3. **Pro Tips**:
   - Always implement rollback.
   - Show loading states.
