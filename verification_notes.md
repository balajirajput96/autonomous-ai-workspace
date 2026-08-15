# Verification Notes

- Authenticated owner view rendered the dark dashboard without client console errors on 2026-08-15.
- Sidebar navigation rendered Overview, AI Chat, Image Studio, Code Assistant, Workflows, and Activity Log.
- AI Chat screen rendered the empty private-conversation state with title input and New conversation actions.
- Further authenticated functional checks require creating content through the owner account; scheduled jobs remain intentionally unavailable until the application is published.
- Image Studio rendered prompt entry, generation action, and empty private-gallery state.
- Code Assistant rendered Generate, Explain, and Debug controls, language selection, code editor, and the syntax-highlighted output area.
- Workflow panel rendered the six-field UTC scheduling explanation, creation control, and deployed-app requirement before activation.
- Activity Log rendered its timestamped-history layout and clear empty state without console errors.
- Mobile verification confirmed the dashboard retains readable cards, clear call-to-action buttons, and accessible sidebar trigger at 375px width.
- The browser session remained authenticated on the development preview after publishing, while the visible banner confirms that schedule activation targets the published URL rather than the preview.
- The published domain is live at `autonomai-zqssrlvr.manus.space` and correctly requires a separate Manus OAuth session before private workflow controls are shown.
- The non-owner logout defect was corrected: selecting Sign out now invokes the OAuth logout mutation and redirects the browser away from the restricted session.
- Production verification is currently blocked by a non-owner Manus OAuth session: the workflow controls are denied before any data or scheduler action is exposed.
- The non-owner production session was signed out successfully; the published workspace now displays the unauthenticated Manus OAuth sign-in screen.

- The deployment has a configured OWNER_OPEN_ID whose prefix matches the first registered OAuth identity; that database row has no stored email and a legacy `user` role. The owner mapping fix deliberately uses the canonical openId, so the correct OAuth account—not the email label—must be used for production access.
