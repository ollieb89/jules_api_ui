# Undo a "Bad" Public Push

**Tags:** Git, Revert, Safety, Emergency, Debugging, Git, Dependencies, +1, Git, Debugging, Bisect, +1, Git, Open Source, Fork, +1, TypeScript, Safety, Configuration, Workflows, Git, Version Control, Ethics, Responsible AI, Bias

description: Safely revert a pushed commit without breaking history

1. **Find the Bad Commit Hash**:
   - Identify the commit that caused the issue.
     // turbo
   - Run git log --oneline -n 5

2. **Revert the Commit**:
   - Use git revert to create a _new_ commit that is the exact opposite of the bad one. Replace [hash] with the actual commit hash.
     // turbo
   - Run git revert [hash]

3. **Push the Fix**:
   - Push the new revert commit to the remote repository.
     // turbo
   - Run git push origin HEAD

4. **Pro Tips**:
   - If you haven't pushed yet, you can just use git reset --soft HEAD~1 to undo the commit locally.
   - git revert is safe for shared branches because it only adds history, never deletes it.
