# AGENTS.md

The agent instructions for this repo live at
[`_agents/AGENTS.md`](_agents/AGENTS.md).

They are kept there because `{workspace_root}/_agents/AGENTS.md` is the path
Jetski injects into the agent's system prompt at conversation start. A bare
repo-root `AGENTS.md` is only picked up lazily, when the agent happens to touch
a file in the tree — see `go/jetski-agent-rules`.

This stub exists so humans browsing the repo root can still find the docs.
