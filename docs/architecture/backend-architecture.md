# Backend Architecture

## Architectural Style

Serverless

## Technology Stack

- TypeScript
- Node.js
- AWS Lambda
- API Gateway
- DynamoDB
- EventBridge
- SNS
- Cognito
- S3
- Secrets Manager

## Design Principles

- Clean Architecture
- Domain-driven design concepts where appropriate
- Event-driven integrations
- Backend ownership of business rules

## Events

Examples:

- JoinRequestCreated
- JoinRequestApproved
- JoinRequestRejected

## Consumers

- Push Notifications
- Telegram Bot
- Audit Logging
- Analytics