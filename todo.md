# Project TODO

- [x] Restrict all workspace routes and data procedures to the Manus OAuth owner.
- [x] Create database schema and access helpers for conversations, messages, image generations, workflows, workflow runs, and activity events.
- [x] Build dark professional dashboard shell with sidebar navigation and responsive module overview.
- [x] Implement persisted streaming AI Chat with Markdown rendering and conversation history.
- [x] Implement image-generation prompt flow, object storage persistence, and generation gallery.
- [x] Implement Code Assistant with input, generation, explanation, debugging, and syntax-highlighted output.
- [x] Implement Workflow manager with create, enable/disable, delete, status, trigger, and action controls.
- [x] Configure built-in recurring jobs to execute enabled workflows and record outcomes after publication.
- [x] Send owner-only notifications after scheduled workflow success or failure.
- [x] Build timestamped activity log with clear task and automation status indicators.
- [x] Add unit tests for privacy guardrails, core procedures, and workflow scheduling behavior.
- [x] Verify layout visually on desktop and mobile, run tests and type checks, then prepare GitHub handoff.
- [x] Add isolated automated coverage for AI procedure input validation and workflow lifecycle behavior.
- [ ] Publish the application, enable a workflow in the deployed workspace, and verify a Heartbeat run plus owner notification.
- [x] Create a private GitHub repository handoff with the completed workspace source and deployment notes.
- [ ] Publish and verify the non-owner access-screen Sign out fix against the production domain.
- [x] Expose a canonical owner flag from the server and use it in the UI so access is based on OWNER_OPEN_ID rather than a mutable role field.
- [x] Add tests covering owner and non-owner auth identity responses.

- [ ] Re-publish the owner mapping fix and verify production owner access plus workflow controls.
