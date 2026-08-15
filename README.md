# Autonomous AI Workspace

Autonomous AI Workspace is a private, dark-themed AI dashboard for one Manus OAuth owner. It brings chat, image creation, code assistance, recurring AI workflows, activity logging, and owner notifications into one application.

## Included modules

| Module | Capability |
| --- | --- |
| AI Chat | Persisted conversations with server-proxied streamed Markdown responses. |
| Image Studio | Prompt-to-image generation, durable object-storage copy, and private gallery. |
| Code Assistant | Generate, explain, and debug modes with Markdown and syntax-highlighted source output. |
| Workflows | Create, enable/disable, and delete scheduled AI workflow definitions using six-field UTC expressions. |
| Activity Log | Timestamped status history for AI work and automation outcomes. |

## Privacy and security

The normal Manus OAuth flow is provided by the application template. The application separately checks the authenticated user’s `openId` against the platform-provided owner identifier on every private procedure and server-side streamed chat request. A signed-in non-owner receives a `FORBIDDEN` response before any workspace data is queried.

Generated image bytes are copied into the project’s managed object storage. Database records retain only the storage key, display URL, prompt, and metadata. AI provider credentials remain on the server and are never exposed to browser code.

## Scheduled workflows

The workflow screen accepts six-field UTC cron expressions, such as `0 0 9 * * *` for 09:00 UTC daily. Enabling a saved workflow creates a platform-managed recurring job with a protected callback at `/api/scheduled/workflow`. The callback is idempotent in the presence of disabled or orphaned workflows, records the execution outcome, and sends the project owner a completion or failure notification.

> The application must be published before a workflow can be enabled. The scheduler invokes the published URL, not the development preview.

## Local checks

```bash
pnpm check
pnpm test
pnpm build
```

## Publish and activation

Create a checkpoint from Manus, then use the **Publish** button in the management interface. After the published URL is available, open **Workflows**, create a workflow, and enable it. The UI is intentionally designed to avoid scheduling against a preview URL.

## Owner access troubleshooting

Workspace access is intentionally tied to the platform-provided `OWNER_OPEN_ID`, not a mutable database role or an email address. If a signed-in account sees **Access restricted**, sign out and use the exact Manus OAuth account that originally created the workspace. The application does not store an owner email address and should not be changed to grant owner access based on an unverified email label.

The live verification of workflow execution and owner notifications is performed only after the canonical owner can enter the production dashboard. Until then, the relevant procedure, callback, notification call, and automated lifecycle coverage remain available in source and tests, but no production schedule is enabled.
