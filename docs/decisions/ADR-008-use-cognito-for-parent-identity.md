# ADR-008: Use Cognito for Parent Identity

## Status

Proposed

## Context

The MVP requires parent authentication for pending approvals, approve/reject actions, child management context, and approval history. The backend architecture already identifies Cognito as the identity service.

The system needs managed authentication without building password storage, verification, token issuance, and session management from scratch.

## Decision

Use Amazon Cognito for MVP parent identity.

The backend maps Cognito user subjects to internal `Parent` records and authorizes access through backend family membership data. Cognito is responsible for parent sign-in and token issuance. DynamoDB remains the source of truth for application-specific family and approval permissions.

## Alternatives Considered

### Amazon Cognito

Pros:

- Native AWS integration.
- Avoids custom password and token infrastructure.
- Works with API Gateway and Lambda authorization patterns.
- Supports future MFA and social identity options.

Cons:

- Cognito configuration and UX can be awkward.
- Vendor coupling to AWS identity services.
- Application authorization still must be implemented in the backend.

### Custom Authentication

Pros:

- Full control over auth UX and data model.
- Easier to tailor to exact product requirements.

Cons:

- High security risk for MVP.
- Requires password storage, reset, verification, token, and session implementation.
- Increases compliance and maintenance burden.

### Third-Party Identity Provider

Pros:

- Strong developer experience depending on provider.
- Rich auth features and hosted UI options.

Cons:

- Adds another vendor outside the AWS stack.
- More integration and cost evaluation.
- Still requires backend authorization mapping.

## Consequences

- Parent app authentication integrates with Cognito-backed backend APIs.
- Backend must maintain a separate parent/family authorization model.
- Cognito subject IDs should be stable foreign keys into backend parent records.
- Future child authentication for the Telegram child app remains separate from parent Cognito identity.

## Implementation Notes

- Do not put family authorization rules solely in Cognito groups.
- Validate JWTs at API boundary.
- Enforce family access in backend domain/application services.
- Store parent profile and family membership in DynamoDB.
- Add MFA requirements in a later security specification if needed.
