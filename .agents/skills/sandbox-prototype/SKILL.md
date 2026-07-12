---
name: sandbox-prototype
description: Safe environment for prototyping features that can be easily previewed and reverted.
---

# Sandbox Prototyping Workflow

Use this skill when the user wants to try out a new feature or layout change in-situ (in the running app) but wants the option to easily discard the changes if they don't like the result.

## Workflow Steps

### 1. Preparation & Branching
Before making any changes, ensure we have a clean starting point.
1. Run `git status` to verify there are no uncommitted changes on the active branch.
2. If there are uncommitted changes, ask the user if they want to commit them or stash them before starting the prototype.
3. Create and switch to a new local branch dedicated to this prototype:
   ```bash
   git checkout -b prototype/<feature-name>
   ```
   *Replace `<feature-name>` with a short, descriptive name (e.g., `prototype/badge-animations`).*

### 2. Implementation
Implement the prototype feature on the new branch.
1. Make the necessary code edits in the workspace.
2. Update version numbers or state schemas only if strictly necessary for the prototype, keeping in mind that these might need migration if kept.

### 3. Local Verification & Review
Provide instructions for the user to view the changes.
1. Ensure the local server is running (e.g., `python3 -m http.server 8000`).
2. Ask the user to refresh their browser at `http://localhost:8000/` to test the prototype.
3. Present a summary of what was changed and ask the user for feedback:
   *   "Do you want to **keep** these changes, or **revert** them?"

### 4. Resolution

#### Option A: User Decides to Keep the Changes
If the user is happy with the prototype and wants to integrate it:
1. Switch back to the original development branch (usually `main`):
   ```bash
   git checkout main
   ```
2. Merge the prototype branch:
   ```bash
   git merge prototype/<feature-name>
   ```
3. Delete the local prototype branch:
   ```bash
   git branch -d prototype/<feature-name>
   ```
4. Confirm to the user that the changes have been successfully merged.
5. *Note: Do NOT push to GitHub yet, as per the session-wrapup rule.*

#### Option B: User Decides to Revert/Discard
If the user wants to discard the prototype:
1. Switch back to the original development branch:
   ```bash
   git checkout main
   ```
2. Force delete the prototype branch to discard all changes:
   ```bash
   git branch -D prototype/<feature-name>
   ```
3. Run `git status` to confirm the working directory is clean and matches the state before the prototype started.
4. Confirm to the user that the prototype has been discarded and the codebase has been restored to its previous state.
