# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: APPLICATION LOAD BALANCER
# ═══════════════════════════════════════════════════════════════════════════════
# Reemplaza el reverse-proxy Nginx de Docker
# Implementa el Escenario 1: Hot Spare con health checks
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# SECURITY GROUP PARA ALB
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-${var.alb_name}-sg"
  description = "Security group for ${var.alb_name} ALB"
  vpc_id      = var.vpc_id

  # HTTP (redirect a HTTPS o acceso directo en dev)
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${var.alb_name}-sg"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# APPLICATION LOAD BALANCER
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_lb" "main" {
  name               = "${var.name_prefix}-${var.alb_name}"
  internal           = var.internal
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.subnet_ids

  enable_deletion_protection = var.enable_deletion_protection

  # Access logs (opcional)
  dynamic "access_logs" {
    for_each = var.access_logs_bucket != null ? [1] : []
    content {
      bucket  = var.access_logs_bucket
      prefix  = var.alb_name
      enabled = true
    }
  }

  tags = merge(var.tags, {
    Name     = "${var.name_prefix}-${var.alb_name}"
    Pattern  = "HotSpare"
    Scenario = "1-Replication"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# HTTP LISTENER (Redirect a HTTPS o puerto 80 directo)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = var.redirect_to_https ? "redirect" : "fixed-response"

    dynamic "redirect" {
      for_each = var.redirect_to_https ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    dynamic "fixed_response" {
      for_each = var.redirect_to_https ? [] : [1]
      content {
        content_type = "text/plain"
        message_body = "OK"
        status_code  = "200"
      }
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${var.alb_name}-http"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# HTTPS LISTENER (con certificado ACM)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_lb_listener" "https" {
  count = var.certificate_arn != null ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy
  certificate_arn   = var.certificate_arn

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${var.alb_name}-https"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# TARGET GROUPS
# Un target group por cada servicio que requiera balanceo
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_lb_target_group" "services" {
  for_each = var.target_groups

  name        = "${var.name_prefix}-${each.key}-tg"
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"  # Fargate usa IPs, no instance IDs

  # ═══════════════════════════════════════════════════════════════════════════
  # HEALTH CHECKS - Críticos para Hot Spare (Escenario 1)
  # Si una tarea falla el health check, ALB deja de enviarle tráfico
  # ═══════════════════════════════════════════════════════════════════════════
  health_check {
    enabled             = true
    healthy_threshold   = 2       # 2 checks exitosos = healthy
    unhealthy_threshold = 3       # 3 fallos = unhealthy
    timeout             = 5
    interval            = 30      # Cada 30 segundos
    path                = each.value.health_check_path
    matcher             = each.value.health_check_matcher
    protocol            = "HTTP"
  }

  # Deregistration delay (tiempo para drenar conexiones)
  deregistration_delay = var.deregistration_delay

  # Stickiness (opcional, para sesiones)
  dynamic "stickiness" {
    for_each = each.value.stickiness_enabled ? [1] : []
    content {
      type            = "lb_cookie"
      cookie_duration = each.value.stickiness_duration
      enabled         = true
    }
  }

  tags = merge(var.tags, {
    Name     = "${var.name_prefix}-${each.key}-tg"
    Service  = each.key
    Pattern  = "HotSpare"
    Scenario = "1-Replication"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# LISTENER RULES
# Enrutan tráfico a los target groups según path o host
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_lb_listener_rule" "services" {
  for_each = { for k, v in var.target_groups : k => v if v.path_patterns != null }

  listener_arn = var.certificate_arn != null ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  # Condición por path
  dynamic "condition" {
    for_each = each.value.path_patterns != null ? [1] : []
    content {
      path_pattern {
        values = each.value.path_patterns
      }
    }
  }

  # Condición por host (opcional)
  dynamic "condition" {
    for_each = each.value.host_headers != null ? [1] : []
    content {
      host_header {
        values = each.value.host_headers
      }
    }
  }

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-${each.key}-rule"
    Service = each.key
  })
}

