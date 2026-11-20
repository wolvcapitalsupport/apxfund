# WhatsApp Cloud API bridge

Set these server-side variables in the deployment environment (never expose them through `NEXT_PUBLIC_*`): `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`, `ADMIN_WHATSAPP_NUMBER`, `WHATSAPP_ALERT_TEMPLATE_NAME`, and optionally `GRAPH_API_VERSION` (defaults to `v21.0`).

In Meta for Developers, configure the WhatsApp webhook callback URL as `https://YOUR_DOMAIN/api/webhooks/whatsapp`, use the verify token from `WHATSAPP_VERIFY_TOKEN`, and subscribe the WhatsApp Business Account to `messages`. The application validates `X-Hub-Signature-256` with `META_APP_SECRET`.

Apply the generated Prisma migration with `npx prisma migrate deploy` after reviewing it against the target database. The bridge intentionally does not apply migrations automatically. Visitor sessions expire after 30 days; the Delete Chat History action removes the session and all related messages. Replies from the admin are routed only through WhatsApp Reply/Swipe-to-Reply context IDs that match a stored outbound `wamid`; unmatched messages remain in the unrouted queue.
