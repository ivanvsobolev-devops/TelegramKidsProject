# Deployment Architecture

## Infrastructure

AWS

## Infrastructure as Code

Terraform

## Services

API Layer:
- API Gateway

Compute:
- Lambda

Storage:
- DynamoDB
- S3

Identity:
- Cognito

Messaging:
- SNS
- EventBridge

Secrets:
- Secrets Manager

Monitoring:
- CloudWatch

## CI/CD

GitHub Actions

### Pull Request Pipeline

- Install
- Lint
- Test
- Build

### Main Branch Pipeline

- Test
- Build
- Terraform Apply
- Deploy Lambdas

### Release Pipeline

Triggered by tags:

vX.Y.Z

Artifacts:

- Android APK
- Android AAB

Publish artifacts into GitHub Releases.