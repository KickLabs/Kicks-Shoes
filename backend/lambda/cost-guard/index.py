"""
Cost Guard Lambda — W6 MH-COST-A (Bonus Optimized)
Scales ECS Fargate service desiredCount to 0 to save compute costs.

Triggers:
  1. EventBridge Scheduler — daily cron 20:00 UTC
  2. SNS from AWS Budgets (cost-driven path)

IAM: least-privilege — ecs:UpdateService + application-autoscaling:RegisterScalableTarget
"""

import boto3
import json
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ecs = boto3.client("ecs")
app_autoscaling = boto3.client("application-autoscaling")
budgets = boto3.client("budgets")

CLUSTER_NAME = os.environ.get("ECS_CLUSTER_NAME")
SERVICE_NAME = os.environ.get("ECS_SERVICE_NAME")
BUDGET_NAME = os.environ.get("BUDGET_NAME")
ACCOUNT_ID = os.environ.get("ACCOUNT_ID")


def check_budget_exceeded():
    """Returns True if ActualSpend >= Limit, False otherwise."""
    if not BUDGET_NAME or not ACCOUNT_ID:
        logger.warning("BUDGET_NAME or ACCOUNT_ID not set. Assuming budget is fine.")
        return False

    try:
        response = budgets.describe_budget(
            AccountId=ACCOUNT_ID,
            BudgetName=BUDGET_NAME
        )
        budget = response.get('Budget', {})
        actual_spend = float(budget.get('CalculatedSpend', {}).get('ActualSpend', {}).get('Amount', '0'))
        limit_amount = float(budget.get('BudgetLimit', {}).get('Amount', '0'))

        logger.info("Budget check: ActualSpend=$%.2f, Limit=$%.2f", actual_spend, limit_amount)
        if actual_spend >= limit_amount:
            logger.warning("🚨 Budget exceeded ($%.2f >= $%.2f). Staying offline to save money.", actual_spend, limit_amount)
            return True
        return False
    except Exception as e:
        logger.error("Failed to check budget: %s", str(e))
        return False


def handler(event, context):
    logger.info("Cost Guard triggered. Event: %s", json.dumps(event))

    if not CLUSTER_NAME or not SERVICE_NAME:
        logger.error("Missing ECS_CLUSTER_NAME or ECS_SERVICE_NAME env vars.")
        return {"statusCode": 500, "message": "Missing config"}

    source = event.get('source', '')
    processed_resources = []
    resource_id = f"service/{CLUSTER_NAME}/{SERVICE_NAME}"

    if source == "scheduled-morning":
        logger.info("🌅 Morning Wake-up routine initiated.")
        if check_budget_exceeded():
            return {"statusCode": 200, "message": "Budget exceeded. Kept offline."}
        
        # Wake up Fargate
        try:
            app_autoscaling.register_scalable_target(
                ServiceNamespace="ecs",
                ResourceId=resource_id,
                ScalableDimension="ecs:service:DesiredCount",
                MinCapacity=1
            )
            ecs.update_service(
                cluster=CLUSTER_NAME,
                service=SERVICE_NAME,
                desiredCount=1
            )
            logger.info("✅ Successfully woke up ECS Fargate Service %s", SERVICE_NAME)
            processed_resources.append({"type": "ECS Service", "id": SERVICE_NAME, "action": "ScaleUp"})
        except Exception as e:
            logger.error("Failed to scale up: %s", str(e))

    else:
        logger.info("🌙 Night routine initiated (or SNS trigger).")
        # 1. Update Application Auto Scaling MinCapacity to 0
        try:
            app_autoscaling.register_scalable_target(
                ServiceNamespace="ecs",
                ResourceId=resource_id,
                ScalableDimension="ecs:service:DesiredCount",
                MinCapacity=0
            )
            logger.info("Successfully updated Auto Scaling MinCapacity to 0 for %s", resource_id)
        except Exception as e:
            logger.error("Failed to update Auto Scaling Target: %s", str(e))

        # 2. Update ECS Service desiredCount to 0
        try:
            ecs.update_service(
                cluster=CLUSTER_NAME,
                service=SERVICE_NAME,
                desiredCount=0
            )
            logger.info("Successfully updated desiredCount to 0 for ECS Service %s", SERVICE_NAME)
            processed_resources.append({"type": "ECS Service", "id": SERVICE_NAME, "action": "ScaleDown"})
        except Exception as e:
            logger.error("Failed to update ECS service: %s", str(e))

    result = {
        "statusCode": 200,
        "processed": processed_resources,
        "count": len(processed_resources),
    }
    logger.info("Cost Guard complete. Result: %s", result)
    return result
