# Fix 'Too Many Re-renders' Error

**Tags:** React, Debugging, Performance, State, React, Performance, Debugging, React, Memory, Performance, +1, Performance, API, Profiling, +1, React, Performance, Optimization, Agentic AI, Debugging, Troubleshooting, Agentic AI, Performance, Optimization

description: Fix infinite render loops

1. **State Update During Render**:
   - ❌ setCount(count + 1) in render
   - ✅ Use useEffect

2. **Fix Dependencies**:
   const fetchData = useCallback(() => {
   return { data: 'value' };
   }, []);

3. **Fix Event Handlers**:
   - ❌ onClick={handleClick()}
   - ✅ onClick={handleClick}

4. **Pro Tips**:
   - Use React DevTools Profiler.
   - Enable Strict Mode.
