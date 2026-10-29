# Scripts

Utility scripts for the actuatorlist project.

## Scripts

- **serve_frontend.ts** - Server entrypoint (Dockerfile CMD, `bun run start`): serves `frontend/dist` and the agent routes
- **validate_actuators.ts** - Reports on the actuator and robot datasets
- **fetch_actuator_images.ts**, **fetch_robot_images.ts** - Self-host product photos from cited pages
- **optimize_actuator_images.ts** - Resizes self-hosted photos to WebP
- **citation-audit.ts** - CI gate for the supply-chain registry citations
- **check_ai_writing.ts** - Checks for em dashes in the codebase (AI writing detector)
- **validate-agents-md.ts** - Validates CLAUDE.md/AGENTS.md has required sections
- **sync_agent_config.ts** - Syncs Claude and Codex skills and subagents (`make sync-agent-config`)
- **check_folder_sizes.sh**, **check_large_files.sh** - Folder file-count and file line-count limits
- **check_docker_smoke.py** - Smokes a locally running production container
- **check_hero_layout.py** - Optional real-Chromium hero layout regression
