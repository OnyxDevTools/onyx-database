# Change: make audit log seeding deterministic

- Date: 2025-09-05 03:13 PM PT
- Author/Agent: OpenAI Assistant
- Scope: examples
- Type: fix
- Summary:
  - seedAuditLogs now inserts 10 static records with fixed ids
  - compound query example awaits seeding for consistent results
- Impact:
  - examples produce consistent audit log data across runs
- Follow-ups:
  - n/a
