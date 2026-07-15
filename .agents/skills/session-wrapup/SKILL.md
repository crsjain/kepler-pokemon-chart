---
name: session-wrapup
description: Performs end-of-session tasks: runs tests, updates README, commits/pushes to GitHub, and creates a progress checkpoint.
---

# Session Wrap-up Workflow

Use this skill when the user wants to wrap up the current programming session, verify quality, document changes, and prepare for a new conversation thread.

## Workflow Steps

Execute the following steps in order:

### 1. Run the Test Suite
Verify that all tests pass before committing.
1. Start the local server if not already running (typically `python3 -m http.server 8000` in the workspace root).
2. Since tests run in the browser, ask the user to load `http://localhost:8000/?runTests=true` and confirm that all tests pass (green success dialog).
3. If they fail, fix the issues before proceeding.

### 2. Update the README
Review the changes made during the session and update the `README.md` if:
*   New features were added that need documentation.
*   System requirements or configuration steps changed (e.g. new passwords, new dependency files).
*   Deprecated features were removed (ensure outdated instructions are cleaned up).

### 3. Create a Progress Checkpoint
Generate a new checkpoint markdown file to allow the next session to initialize from this exact state.
1. Determine the next checkpoint number by checking the existing checkpoints in the project's `docs/` directory. If the last checkpoint was `checkpoint_10.md` (or the highest numbered one), the new one will be `checkpoint_11.md`.
2. Create a new markdown file in the project's `docs/` directory: `docs/checkpoint_<N>.md` (absolute path: `/usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_<N>.md`).
3. The checkpoint file MUST follow this structure:

```markdown
# CHECKPOINT <N>

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for Kepler's Pokémon Training Chart app. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests
[List of requests from this session and their status, e.g., - [x] Done, - [ ] Pending]

---

## 2. User & Project Metadata
*   **Admin Password**: "[current password]"
*   **Target Audience**: Kepler (7 years old)
*   **Local Server URL**: \`http://localhost:8000/\`
*   **Git Policy**: [Commit status, e.g., All changes pushed to remote origin main]
*   **Sprites Repository**: Official PokéAPI assets fetched from GitHub Raw.
*   **Audio volume**: [Current audio settings/volume details]

---

## 3. Active V[Version] State Schema
\\\`\\\`\\\`javascript
[Insert the current state object schema from state.js, including any new fields added in this session]
\\\`\\\`\\\`

---

## 4. Work Accomplished
[Detailed chronological bulleted list of all modifications, fixes, and additions made in this session]

---

## 5. Files and Code
### Edited Files
*   \`[filename](file:///path/to/file)\`: [Brief summary of changes in this file]

---

## 6. Validation Instructions
[Step-by-step instructions for the user to manually verify the new features/fixes]
```

### 4. Publish to GitHub
Commit and push all verified changes and the new checkpoint to the remote repository, and merge to `main` if the app is hosted on GitHub Pages:
1. Run `git status` to identify modified, untracked, and checkpoint files.
2. Stage changes: `git add .` (this will automatically stage the new checkpoint in `docs/`).
3. Commit with a descriptive message summarizing the session's work: `git commit -m "feat: <summary of work> and checkpoint <N>"`
4. Push to the active development branch: `git push origin <branch-name>`
5. If using GitHub Pages for live hosting, perform the deployment sequence:
   a. Switch to the main branch: `git checkout main`
   b. Merge the development branch: `git merge <branch-name>`
   c. Push the merged main branch: `git push origin main`
   d. Switch back to the development branch: `git checkout <branch-name>`

Once the checkpoint is created and pushed, present the path of the new checkpoint file in the `docs/` directory to the user so they can use it to initialize the next session.
