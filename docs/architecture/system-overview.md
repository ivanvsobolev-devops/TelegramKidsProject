# System Overview

## Architecture

Child App
    |
    v
Backend API
    |
    +---- Parent Android App
    |
    +---- Telegram Bot
    |
    +---- Telegram API

## Principle

Backend is the single source of truth.

All approval decisions are enforced by backend services.

## Core Domains

### Family

- Parent
- Child
- Family

### Approval

- ApprovalRequest
- ApprovalDecision

### Telegram

- TelegramAccount
- GroupJoinRequest
- ChannelJoinRequest

## Future Scalability

Design for:

- Multiple children per family
- Multiple parents per family
- Multiple approval interfaces