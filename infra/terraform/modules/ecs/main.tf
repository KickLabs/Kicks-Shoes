locals {
  secret_mappings = [
    for secret_key in var.app_config_secret_keys : {
      name      = secret_key
      valueFrom = "${var.app_config_secret_arn}:${secret_key}::"
    }
  ]
}

resource "aws_ecs_cluster" "this" {
  name = "${var.project_name}-cluster"

  tags = merge(var.tags, {
    Name = "${var.project_name}-cluster"
  })
}

resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-ecs-sg"
  description = "Allow only ALB traffic to ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecs-sg"
  })
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 14

  tags = var.tags
}

data "aws_iam_policy_document" "ecs_task_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task_execution" {
  name               = "${var.project_name}-ecs-task-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "task_execution_managed" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "task_execution_secret_access" {
  statement {
    sid       = "ReadAppSecrets"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.app_config_secret_arn]
  }
}

resource "aws_iam_role_policy" "task_execution_secret_access" {
  name   = "${var.project_name}-execution-secret-read"
  role   = aws_iam_role.task_execution.id
  policy = data.aws_iam_policy_document.task_execution_secret_access.json
}

resource "aws_iam_role" "task" {
  name               = "${var.project_name}-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "task_dynamodb_access" {
  statement {
    sid = "DynamoDbAccess"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem"
    ]
    resources = [var.dynamodb_table_arn]
  }
}

resource "aws_iam_role_policy" "task_dynamodb_access" {
  name   = "${var.project_name}-task-dynamodb-access"
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task_dynamodb_access.json
}

resource "aws_ecs_task_definition" "this" {
  family                   = "${var.project_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = var.container_image
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]
      secrets = local.secret_mappings
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = var.tags
}

resource "aws_ecs_service" "this" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "app"
    container_port   = var.container_port
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  depends_on = [
    aws_iam_role_policy_attachment.task_execution_managed,
    aws_iam_role_policy.task_execution_secret_access
  ]

  tags = var.tags
}
