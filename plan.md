

# WhatsApp Bridge Implementation

## Product and privacy decisions

The bridge uses a custom floating widget with a required visitor name, WhatsApp number, and explicit consent before creating a chat session. Tawk.to loads only after the visitor has accepted the site's analytics/tracking consent. The widget explains WhatsApp forwarding and Tawk.to analytics and links to `/policies`.

Chat sessions retain `consentAcceptedAt` and a 30-day `expiresAt` value. Session deletion removes the session and messages through an authenticated token-based endpoint. WhatsApp replies are routed only when Meta supplies a `context.id` matching a stored outbound message; otherwise an `UnroutedAdminMessage` record is created and an explanatory reminder is sent to the admin number.

## Project structure

- `prisma/schema.prisma` and `prisma/migrations/...`: chat persistence and unrouted-message queue.
- `lib/whatsapp.ts`: Graph API send helpers and webhook signature verification.
- `app/api/chat/session/route.ts`: create/resume/delete visitor sessions.
- `app/api/chat/messages/route.ts`: history, visitor forwarding, and retention checks.
- `app/api/webhooks/whatsapp/route.ts`: Meta verification, HMAC validation, deduplication, strict context routing.
- `components/WhatsAppChatWidget.tsx`: consent gate, launcher, polling, deletion control.
- `components/TawkChat.tsx`: consent-gated Tawk.to loader.
- `app/layout.tsx`: global widget and tracking components.
