# Telegram Kids Terraform

Terraform scaffold for MVP AWS infrastructure.

## Scope

This directory contains a minimal infrastructure shell. It does not create production resources yet.

## Layout

```text
environments/
  dev/
  staging/
  prod/
modules/
```

## Commands

```bash
terraform -chdir=infra/terraform fmt -recursive
terraform -chdir=infra/terraform/environments/dev init -backend=false
terraform -chdir=infra/terraform/environments/dev validate
```
