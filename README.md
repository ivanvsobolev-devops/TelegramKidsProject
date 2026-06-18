# Telegram Kids Project

Repository bootstrap for the Telegram Kids MVP.

## Repository Layout

```text
apps/
  child_app/        Flutter child Telegram client shell
services/
  backend/          TypeScript backend shell
  telegram_bot/     Parent Telegram Bot shell
infra/
  terraform/        Terraform infrastructure shell
docs/               Product, architecture, specs, and ADRs
scripts/            Local build and validation scripts
.github/workflows/  GitHub Actions workflows
```

## Prerequisites

- Flutter SDK
- Node.js 24 or compatible current LTS
- npm
- Terraform

## Common Commands

```bash
./scripts/bootstrap.sh
./scripts/format.sh
./scripts/lint.sh
./scripts/test.sh
./scripts/build.sh
```

## MVP Components

- Child app: Flutter scaffold in `apps/child_app`.
- Backend: TypeScript scaffold in `services/backend`.
- Parent Telegram Bot: Node.js scaffold in `services/telegram_bot`.
- Infrastructure: Terraform scaffold in `infra/terraform`.

No business logic is implemented yet.
