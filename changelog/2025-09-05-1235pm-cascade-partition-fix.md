# Change: clarify partition defaults and cascade builder usage

- Date: 2025-09-05 12:35 PM PT
- Author/Agent: ChatGPT
- Scope: lib | docs | tests
- Type: fix
- Summary:
  - remove partition state from `CascadeBuilder` and note partition is provided via options
  - restrict default partition from `init` to queries, `findById`, and deletes by primary key
- Impact:
  - saves depend solely on entity partition fields; cascade operations accept partition through method options
- Follow-ups:
  - none
