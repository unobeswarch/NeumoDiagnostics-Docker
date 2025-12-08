# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO ALB - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

output "alb_id" {
  description = "ID del ALB"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "ARN del ALB"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name del ALB"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID del ALB (para Route 53)"
  value       = aws_lb.main.zone_id
}

output "security_group_id" {
  description = "ID del security group del ALB"
  value       = aws_security_group.alb.id
}

output "http_listener_arn" {
  description = "ARN del listener HTTP"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "ARN del listener HTTPS"
  value       = length(aws_lb_listener.https) > 0 ? aws_lb_listener.https[0].arn : null
}

output "target_group_arns" {
  description = "ARNs de los target groups"
  value       = { for k, v in aws_lb_target_group.services : k => v.arn }
}

output "target_group_names" {
  description = "Nombres de los target groups"
  value       = { for k, v in aws_lb_target_group.services : k => v.name }
}

# Resource label para auto-scaling
output "alb_resource_labels" {
  description = "Resource labels para auto-scaling de ECS"
  value = {
    for k, v in aws_lb_target_group.services : k => "${aws_lb.main.arn_suffix}/${v.arn_suffix}"
  }
}

