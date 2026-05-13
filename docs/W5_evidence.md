# W5 Evidence Pack — Kicks Shoes

**Group:** Group 13  
**Members:** [Điền tên thành viên]  
**Repo:** https://github.com/KickLabs/Kicks-Shoes  
**W4 Evidence Pack:** [link]  
**Date:** 15-05-2026

> ⚠️ **Điền vào file này trong quá trình làm — đừng để đến tối Thứ Năm.**
> Template đầy đủ: `.AIDD/changes/002-w5-network-fortress/07-evidence-pack.md`

---

## 1. Cover

| Item | Value |
|------|-------|
| AWS Account ID | |
| Region | ap-southeast-1 |
| VPC ID | |
| ECS Cluster | kicks-shoes-dev-cluster |
| App URL | |

---

## 2. Application Carry-Forward Verification

<!-- Screenshot: ECS service RUNNING -->
<!-- Screenshot: Action 1 — product listing -->
<!-- Screenshot: Action 2 — AI chat -->
<!-- Architecture diagram -->

**Feedback W4 → W5 fix:**
- Feedback: 
- Fix: 

---

## 3. MH1 — Multi-VPC Connectivity

**Path:** Path C — Justified Single-VPC

<!-- Justification, subnet table, Flow Logs screenshots -->

---

## 4. MH2 — Network Firewall Hardening

**Path:** Path A — AWS Network Firewall

<!-- Firewall console, rule group, route table, allowed + blocked request screenshots -->

---

## 5. MH3 — File Storage + Backup Plan

<!-- EFS console, mount test, backup plan, restore job COMPLETED screenshots -->

---

## 6. MH4 — API Gateway trước Lambda

<!-- API Gateway console, curl 200, curl 403 screenshots -->

---

## 7. MH5 — Serverless Scaling Pattern

**Pattern:** Async Invocation + DLQ

<!-- Lambda DLQ config, DLQ message, CloudWatch errors screenshots -->

---

## 8. Negative Security Tests

<!-- Test 1: API GW 403, Test 2: Firewall block, Test 3: EFS SG block, Test 4: Flow Log REJECT -->
