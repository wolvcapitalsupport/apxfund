# APXFund WhatsApp Admin Reply Guide

## Purpose

The APXFund website chat bridge lets visitors send messages from the website widget to the administrator’s WhatsApp number. Administrators can reply from WhatsApp, and the reply is delivered back to the correct visitor’s website chat.

The bridge uses WhatsApp’s **Reply / Swipe-to-Reply context** to identify the visitor conversation. This is intentional: a reply must be tied to a specific visitor message so the system can route it safely. The system does **not** guess which visitor should receive a message and does not route messages based on the most recently active session.

## The most important rule

Always reply directly to the specific visitor message using WhatsApp’s **Swipe-to-Reply** or **Reply** action.

Do not start a new standalone message to the administrator number when you intend the message to reach a visitor. A standalone message has no `context.id`, so the bridge cannot determine which website chat should receive it.

If a message is sent without a valid reply context, the bridge places it in the unrouted admin-message review queue and sends this reminder back to the administrator:

> Reply not delivered—please use Swipe-to-Reply on a specific visitor message so the system knows which chat to route it to.

## What the workflow looks like

1. A visitor opens the APXFund chat widget.
2. The visitor provides their name and WhatsApp number, accepts the consent notice, and starts the chat.
3. The visitor sends a message through the website widget.
4. The message arrives in the configured administrator WhatsApp conversation.
5. The administrator swipes on, or selects Reply for, that exact visitor message.
6. The administrator types the response and sends it.
7. WhatsApp includes the original message’s message ID, called a `wamid`, as the reply context.
8. The bridge looks up that `wamid` in its database.
9. If it matches a stored visitor message, the response is saved as an admin message and appears in that visitor’s website widget.

## How to reply on Android

The exact labels can vary slightly by WhatsApp version, but the process is generally as follows:

1. Open the WhatsApp chat where APXFund visitor messages arrive.
2. Locate the specific visitor message you want to answer.
3. Swipe that message to the right until the reply indicator appears. Alternatively, press and hold the message and tap the **Reply** icon.
4. Confirm that the quoted message shown above the text field is the visitor’s message you intend to answer.
5. Type your response below the quoted message.
6. Tap **Send**.

Before sending, verify that the message composer visibly contains a quoted or referenced message. If no quoted message is shown, cancel the draft and use Reply again.

## How to reply on iPhone

1. Open the WhatsApp conversation containing the visitor message.
2. Swipe the visitor’s message to the right. You can also press and hold the message and choose **Reply**.
3. Check that WhatsApp displays the visitor’s message as a quoted reply above the composer.
4. Type the answer.
5. Tap the send button.

The quoted message is essential. The bridge uses the underlying WhatsApp reply context, not the visible text alone.

## How to reply on WhatsApp Web or Desktop

1. Open WhatsApp Web or the WhatsApp Desktop application.
2. Open the administrator conversation where visitor messages are received.
3. Hover over the visitor message you want to answer.
4. Select the message menu and choose **Reply**. Depending on the client version, this may appear as an arrow or under the three-dot menu.
5. Confirm that the visitor’s message appears as a quoted reply in the composer.
6. Type the response and press **Enter** or click **Send**.

If the composer does not show the quoted message, do not send the draft as a normal message. Select Reply again first.

## How to identify the correct visitor message

When several visitors are active, use the content and surrounding conversation to identify the correct message. The forwarded visitor message normally includes identifying context such as the visitor’s name and phone number in the message text.

Always reply to the exact message you are addressing. Do not reply to an unrelated earlier message merely because it belongs to the same WhatsApp conversation. The bridge routes using the selected message’s `wamid`.

If the visitor has sent several messages, replying to the latest relevant visitor message is usually the clearest approach. If you need to answer an earlier question specifically, use Reply on that earlier message.

## Correct and incorrect examples

### Correct

The visitor message appears in WhatsApp:

> `[Maria · +491234567890]`  
> I cannot complete my deposit.

The administrator swipes right on that message, sees it quoted in the composer, and sends:

> Hello Maria, I’ll help you check the deposit status.

This reply contains WhatsApp reply context, so the bridge can route it to Maria’s website chat.

### Incorrect

The administrator opens the WhatsApp conversation and types:

> Hello Maria, I’ll help you check the deposit status.

The administrator sends it without selecting Reply on a visitor message. This is a standalone message. It has no usable `context.id`, so the bridge will not deliver it to any visitor.

### Incorrect when multiple visitors are active

The administrator sees a message from Visitor A, then opens the composer and replies without quoting any message. Even if Visitor A was the most recent person to write, the bridge will not guess that the response belongs to Visitor A.

## Why standalone messages are not routed

A single WhatsApp inbox can receive messages from several website visitors. A standalone response does not reliably identify the intended visitor. Routing by time, phone number text, or most recent activity could send private information to the wrong person.

For that reason, the bridge requires the WhatsApp reply context supplied by the platform. The selected visitor message carries a `wamid`; the incoming admin reply carries the same value in `messages[].context.id`. The bridge routes only when that value matches a stored message.

## What happens if you forget to use Reply

If you send a standalone WhatsApp message, one of two things happens:

- The message is stored in the `UnroutedAdminMessage` review queue and is not displayed to a visitor.
- The bridge sends the administrator the reminder:

  > Reply not delivered—please use Swipe-to-Reply on a specific visitor message so the system knows which chat to route it to.

This behavior is a privacy and safety control. It is not a temporary delivery delay and it should not be bypassed by guessing which visitor was intended.

## What to do after an unrouted-message reminder

1. Do not assume the first standalone message reached the visitor.
2. Return to the WhatsApp conversation.
3. Locate the specific visitor message that needs an answer.
4. Use Swipe-to-Reply or Reply on that message.
5. Re-send the response as a quoted reply.
6. Confirm that the quoted visitor message is visible before tapping Send.

The original unrouted message may remain available to an administrator for review, but it should be treated as undelivered to the visitor unless the system confirms it through the normal reply flow.

## Replies to visitor messages versus new visitor messages

The bridge stores both visitor messages and admin replies in the visitor’s website chat history. An admin reply should always be sent as a WhatsApp reply to a stored visitor message.

When the visitor sends a new message later, reply to that new message if it is the subject of your answer. This keeps the conversation clear and provides a valid routing context for every response.

## Messages that should not be used for routing

Do not use any of the following as a substitute for Swipe-to-Reply:

- Typing the visitor’s phone number into a new message and sending it without Reply context.
- Replying to a different visitor’s message.
- Sending a message to the administrator number from another WhatsApp account without a quoted visitor message.
- Forwarding a visitor message and replying to the forwarded copy if WhatsApp does not preserve the original reply context.
- Copying and pasting the visitor’s text into a new message.
- Assuming the most recently active website session is the intended recipient.
- Replying from a notification preview without confirming the quoted message is attached.

## Troubleshooting checklist

### The reply was not delivered

Check whether the sent message contains a quoted visitor message. If it does not, resend using Reply.

### The wrong visitor message is quoted

Delete or ignore the draft, return to the intended visitor message, and select Reply on the correct message. Do not send a response quoted against an unrelated visitor message.

### The visitor says they did not receive the response

Ask the administrator to confirm all of the following:

1. The response was sent from the configured administrator WhatsApp number.
2. The response visibly quoted a visitor message.
3. The quoted message was the intended visitor’s message.
4. The response was not merely typed as a new standalone message.

If those checks pass and the response still does not appear, record the approximate time, the visitor’s name, and the relevant WhatsApp message details for technical review. Do not resend repeatedly without checking the context, because each resend should be tied to a clear visitor message.

### The WhatsApp conversation is crowded

Use the visitor name and phone details included in the forwarded message to locate the correct message. Work from the specific message rather than relying on the position of the conversation or the order of notifications.

### The 24-hour WhatsApp window has expired

The bridge may use the configured approved template fallback when a normal text message cannot be delivered under WhatsApp’s messaging-window rules. This does not change the routing requirement: the administrator’s reply must still be sent with Swipe-to-Reply context so the bridge knows which website session should receive it.

If the template is not configured or Meta rejects the message, the administrator should review the deployment configuration and WhatsApp Business template status.

## Privacy and confidentiality expectations

Only send a response to the visitor whose message you selected. Review the quoted message before sending, especially when handling account, withdrawal, identity-verification, or payment-related questions.

Do not copy personal information from one visitor into another visitor’s response. If a message is sent without a valid context, the bridge intentionally refuses to guess the recipient.

## Administrator quick reference

**Before typing:** locate the exact visitor message.  
**Before sending:** confirm the message is visibly quoted using Reply.  
**After sending:** if the bridge returns the Swipe-to-Reply reminder, treat the message as undelivered and resend it from the correct quoted visitor message.  
**Never:** send a standalone message and expect the bridge to infer the visitor.

## Technical reference for support staff

The bridge stores each outbound visitor message returned by Meta with its `wamid`. For an incoming admin reply, Meta supplies a `messages[].context.id` value when WhatsApp Reply/Swipe-to-Reply was used.

The routing rule is:

```text
incoming messages[].context.id
        matches
stored ChatMessage.wamid
        then
append the reply to that ChatMessage.sessionId
```

If `messages[].context.id` is missing or does not match a stored `wamid`, the bridge creates an `UnroutedAdminMessage` record and sends the administrator the exact reminder shown above. There is deliberately no most-recent-session fallback.
