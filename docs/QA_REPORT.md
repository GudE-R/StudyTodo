# QA & Improvement Report

**Date**: 2025-12-13
**Version**: v0.2.0 (Cloud Sync Beta)

## 1. Tested Scenarios

| ID | Scenario | Status | Notes |
|---|---|---|---|
| T1 | Auth: Sign Up / Login | [x] | Logic OK, Login requires Email Confirm. |
| T2 | Migration: Upload Local Data | [x] | UI verified. |
| T3 | Sync: Add Todo (Dual Write) | [x] | Verified (Skipped if not logged in). |
| T4 | Sync: Pull on Load | [x] | Verified (Skipped if not logged in). |
| T5 | UI: Settings Integration | [x] | Verified. |
| T6 | UI: Mobile Responsiveness | [ ] | **FAILED**. Layout broken. |

## 2. Identified Bugs

| ID | Severity | Description | Status |
|---|---|---|---|
| B1 | Medium | Settings UI: Auth button always says "Login" even if logged in. | Fixed |
| B2 | High | Mobile View: 3-Column layout does not stack. | Won't Fix (Native App planned) |


## 3. Improvement Proposals

| ID | Type | Proposal | Rationale |
|---|---|---|---|
| I1 | Reliability | Offline Sync Queue | Currently, if requests fail, they are lost. |
| I2 | Logic | Conflict Resolution | "Last Write Wins" is naive; potential data loss. |
| I3 | UX | Sync Indicator | No visual feedback when syncing is happening. |
