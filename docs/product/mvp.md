# MVP

## Goal

Validate demand for parental approval of Telegram group and channel access.

## Child Application

Features:

- Telegram authentication
- Chat list
- Direct messaging
- Read channels
- Receive messages
- Send messages

Restricted actions:

- Join group
- Join channel

Restricted actions require parental approval.

## Parent Application

Deferred to V2.

Features:

- Authentication
- Pending approvals
- Approve request
- Reject request
- Approval history

The parent application is not part of the bot-first MVP. Use the Telegram Bot as the parent approval surface for MVP.

## Backend

Features:

- Parent authentication
- Child account management
- Approval workflow
- Notification delivery
- Audit trail

## Success Criteria

Parents can reliably approve or reject join requests.

Children cannot join groups or channels through the application without approval.
