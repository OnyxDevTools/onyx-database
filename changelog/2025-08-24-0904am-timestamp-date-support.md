# Change: support Date timestamps and ISO serialization

- Date: 2025-08-24 09:04 AM PT
- Author/Agent: ChatGPT
- Scope: lib | cli | docs
- Type: feat
- Summary:
  - allow codegen to emit Date-typed timestamp fields
  - serialize Date values to ISO strings before sending requests
  - document Date timestamp option in README
- Impact:
  - enables working with Date objects while maintaining API compatibility
- Follow-ups:
  - parse ISO strings to Date objects on reads
