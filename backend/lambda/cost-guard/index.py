"""
Cost Guard Lambda — W6 MH-COST-A
Stops EC2/RDS instances tagged Environment=dev and NOT tagged keep=true.

Triggers:
  1. EventBridge Scheduler — daily cron 20:00 UTC
  2. SNS from AWS Budgets (cost-driven path)

IAM: least-privilege — ec2:StopInstances + rds:StopDBInstance only
"""

import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.client("ec2")
rds = boto3.client("rds")


def handler(event, context):
    logger.info("Cost Guard triggered. Event: %s", json.dumps(event))

    stopped_resources = []

    # -------------------------------------------------------------------------
    # Stop EC2 instances tagged Environment=dev and NOT keep=true
    # -------------------------------------------------------------------------
    ec2_response = ec2.describe_instances(
        Filters=[
            {"Name": "instance-state-name", "Values": ["running"]},
            {"Name": "tag:Environment", "Values": ["dev"]},
        ]
    )

    for reservation in ec2_response["Reservations"]:
        for instance in reservation["Instances"]:
            instance_id = instance["InstanceId"]
            tags = {t["Key"]: t["Value"] for t in instance.get("Tags", [])}

            if tags.get("keep", "").lower() == "true":
                logger.info("Skipping EC2 %s (keep=true)", instance_id)
                continue

            logger.info("Stopping EC2 instance: %s", instance_id)
            ec2.stop_instances(InstanceIds=[instance_id])
            stopped_resources.append({"type": "EC2", "id": instance_id})

    # -------------------------------------------------------------------------
    # Stop RDS instances tagged Environment=dev and NOT keep=true
    # -------------------------------------------------------------------------
    rds_response = rds.describe_db_instances()

    for db in rds_response["DBInstances"]:
        if db["DBInstanceStatus"] != "available":
            continue

        db_id = db["DBInstanceIdentifier"]
        tags_response = rds.list_tags_for_resource(ResourceName=db["DBInstanceArn"])
        tags = {t["Key"]: t["Value"] for t in tags_response["TagList"]}

        if tags.get("Environment", "") == "dev" and tags.get("keep", "").lower() != "true":
            logger.info("Stopping RDS instance: %s", db_id)
            rds.stop_db_instance(DBInstanceIdentifier=db_id)
            stopped_resources.append({"type": "RDS", "id": db_id})

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
