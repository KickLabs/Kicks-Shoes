# ECS Fargate Terraform Quickstart

## Terraform module layout

- `infra/terraform/modules/network`
- `infra/terraform/modules/alb`
- `infra/terraform/modules/ecs`
- `infra/terraform/modules/autoscaling`
- `infra/terraform/environments/demo`

## Copy-paste PowerShell workflow

```powershell
# 1) End-to-end pull/build/push/deploy
./scripts/ecs-fargate-e2e.ps1 `
  -AwsAccountId 123456789012 `
  -AwsProfile default `
  -AwsRegion ap-southeast-1 `
  -EcrRepository kicks-shoes-backend `
  -BaseTag latest `
  -NamePrefix kicks-fargate-demo

# 2) Open service
# Replace with output from script
$ALB_DNS = "<ALB_DNS>"
Invoke-WebRequest -Uri "http://$ALB_DNS/api/health" -UseBasicParsing

# 3) Demo load to trigger autoscaling
# Change endpoint to a CPU-heavier route if needed

docker run --rm rcmorano/hey -z 8m -c 200 "http://$ALB_DNS/api/products"

# Optional: k6 load profile from repo script
docker run --rm -e TARGET_URL="http://$ALB_DNS/api/products" -v "$(Get-Location)/scripts:/scripts" grafana/k6 run /scripts/k6-loadtest.js
```

## Decision notes

- If only app code changed: build new image, push, then terraform apply with updated `container_image`.
- If infrastructure changed: terraform plan/apply.
- If only re-rollout same task definition is needed: use ECS `--force-new-deployment`.
