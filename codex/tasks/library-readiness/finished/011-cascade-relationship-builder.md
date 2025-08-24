# Task: CascadeRelationshipBuilder and save cascade docs

Original Task:
```
save cascade has a specific syntax `field:Type(target, source)`, we need to add documentation for this in the README.  And I would like to create a CascadeRelationshipBuilder that works like this: 

programsCascade = db.cascadeBuilder()
                                         .graph("programs")
                                         .graphType("StreamingChannel").targetField('channelId")
                                         .sourceField("id") // this is the field on StreamingChannel


   const newChannel:StreamingChannel = await db     .cascade(programsCascade)     .save(tables.StreamingChannel, {       id: 'news_003',       category: 'news',       name: 'News 24',       updatedAt: new Date(),       programs: [program]   }) as StreamingChannel; 

We need to document this in the README.md along with the save examples
```

## Plan
1. Introduce `CascadeRelationshipBuilder` with chainable methods: `graph`, `graphType`, `targetField`, `sourceField` returning the cascade string.
2. Export a `cascadeBuilder()` method on `IOnyxDatabase` that returns the new builder.
3. Implement builder in `src/builders/cascade-relationship-builder.ts` and wire into `src/impl/onyx.ts`.
4. Document cascade syntax `field:Type(target, source)` and builder usage in `README.md`.
5. Add unit tests covering the builder output.
6. Regenerate docs and update `docs/README.md`.
7. Add changelog entry.
8. Run `npm run typecheck`, `npm test`, and `npm run build`.

## Acceptance Criteria
- [x] `CascadeRelationshipBuilder` constructs cascade strings like `programs:StreamingProgram(channelId, id)`.
- [x] `IOnyxDatabase` exposes `cascadeBuilder()`.
- [x] README documents save cascade syntax and builder usage.
- [x] Tests cover the builder.
- [x] Typecheck, build, and tests pass.
- [x] Changelog entry exists.
