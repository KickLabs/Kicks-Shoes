# ECS Fargate Demo Checklist (10-15 Minutes)

## 1) Pre-flight (2 minutes)

- Verify AWS identity:
  - `aws sts get-caller-identity --profile default`
- Verify tools:
  - `docker version`
  - `terraform version`
- Confirm backend health endpoint exists:
  - `GET /api/health`

Pass criteria:

- AWS account is correct.
- Docker and Terraform commands run successfully.

## 2) Pull/Build/Push/Deploy (5 minutes)

- Run end-to-end script:
  - `./scripts/ecs-fargate-e2e.ps1 -AwsAccountId <ACCOUNT_ID> -AwsProfile default -AwsRegion ap-southeast-1 -EcrRepository kicks-shoes-backend -BaseTag latest`
- Capture outputs:
  - ALB URL
  - ECS cluster/service names
  - pushed image digest

Pass criteria:

- Script exits without errors.
- ECS service reaches stable state.
- `http://<ALB_DNS>/api/health` returns HTTP 200.

## 3) Trigger Scale-Out (5 minutes)

Option A (external load, easiest):

- `docker run --rm rcmorano/hey -z 8m -c 200 http://<ALB_DNS>/api/products`

Option B (alternative with k6 image):

- `docker run --rm -e TARGET_URL=http://<ALB_DNS>/api/products -v "$(Get-Location)/scripts:/scripts" grafana/k6 run /scripts/k6-loadtest.js`

Monitor scaling in parallel:

- `aws ecs describe-services --cluster <CLUSTER> --services <SERVICE> --region ap-southeast-1 --query "services[0].{desired:desiredCount,running:runningCount,pending:pendingCount}" --output table`
- `aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name CPUUtilization --dimensions Name=ClusterName,Value=<CLUSTER> Name=ServiceName,Value=<SERVICE> --start-time $(Get-Date).AddMinutes(-15).ToString("s") --end-time $(Get-Date).ToString("s") --period 60 --statistics Average --region ap-southeast-1`

Pass criteria:

- CPU average crosses around 60%.
- `desiredCount` increases above baseline (for example from 2 to 3+).

## 4) Verify Scale-In (3 minutes)

- Stop load test.
- Wait for scale-in cooldown (default 180 seconds).
- Re-check desired and running counts.

Pass criteria:

- Task count reduces toward baseline after cooldown.

## 5) Tech Lead Final Sign-off

- [ ] ECR image digest recorded for release.
- [ ] ECS tasks healthy behind ALB target group.
- [ ] Target tracking policy exists with CPU target = 60.
- [ ] Scale-out observed during load.
- [ ] Scale-in observed after load stops.
- [ ] Rollback command prepared:
  - `aws ecs update-service --cluster <CLUSTER> --service <SERVICE> --task-definition <PREVIOUS_TASK_DEF_ARN> --force-new-deployment --region ap-southeast-1`
