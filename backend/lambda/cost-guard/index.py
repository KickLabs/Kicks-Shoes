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

CLUSTER_NAME = os.environ.get("ECS_CLUSTER_NAME")
SERVICE_NAME = os.environ.get("ECS_SERVICE_NAME")


def handler(event, context):
    logger.info("Cost Guard triggered. Event: %s", json.dumps(event))

    if not CLUSTER_NAME or not SERVICE_NAME:
        logger.error("Missing ECS_CLUSTER_NAME or ECS_SERVICE_NAME env vars.")
        return {"statusCode": 500, "message": "Missing config"}

    stopped_resources = []

    # 1. Update Application Auto Scaling MinCapacity to 0
    # Must do this first, otherwise Application Auto Scaling will scale it back up to MinCapacity=1
    resource_id = f"service/{CLUSTER_NAME}/{SERVICE_NAME}"
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

    # 2. Update ECS Service desiredCount to 0 to stop all running tasks
    try:
        ecs.update_service(
            cluster=CLUSTER_NAME,
            service=SERVICE_NAME,
            desiredCount=0
        )
        logger.info("Successfully updated desiredCount to 0 for ECS Service %s", SERVICE_NAME)
        stopped_resources.append({"type": "ECS Service", "id": SERVICE_NAME})
    except Exception as e:
        logger.error("Failed to update ECS service: %s", str(e))

    result = {
        "statusCode": 200,
        "stopped": stopped_resources,
        "count": len(stopped_resources),
    }
    logger.info(
        "Cost Guard complete. Stopped %d resources: %s",
        len(stopped_resources),
        stopped_resources,
    )
    return result

