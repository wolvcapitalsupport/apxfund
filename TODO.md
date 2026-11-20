

## WhatsApp Bridge

- [ ] Add `ChatSession`, `ChatMessage`, and `UnroutedAdminMessage` Prisma models, including consent timestamp, 30-day retention expiry, wamid references, and migration SQL.
- [ ] Implement WhatsApp Cloud API helpers with server-only credentials, HMAC webhook verification, Graph API forwarding, and optional 24-hour template fallback.
- [ ] Implement `/api/chat/session` create/resume/delete behavior with token ownership, consent fields, expiry cleanup, and personal-data deletion.
- [ ] Implement `/api/chat/messages` history and visitor-send behavior with strict session/retention checks and wamid persistence.
- [ ] Implement `/api/webhooks/whatsapp` GET verification and POST handling with wamid deduplication, context-only routing, unrouted queue creation, and admin reminder.
- [ ] Add the consent-gated floating WhatsApp widget with pre-chat gate, privacy notice, polling, unread state, sound cue, and Delete Chat History control.
- [ ] Gate Tawk.to loading behind existing/local tracking consent and document required environment variables and Meta webhook setup.
- [ ] Validate schema, TypeScript, lint, production build, and push the implementation without applying a production database migration automatically.
