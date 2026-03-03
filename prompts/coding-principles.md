# Coding Principles

## Core Philosophy

- Keep It Simple, Elegant, and Clear
Strive for simplicity. The most elegant solution is often the simplest one that works correctly. Avoid clever tricks that obscure intent.

- You Aren’t Gonna Need It (YAGNI)
Don’t add functionality until it’s actually needed. Premature abstraction or optimization increases complexity.

- Don’t Repeat Yourself (DRY)
Every significant piece of logic should have a single, authoritative implementation. Consolidate duplications into reusable utilities or abstractions.

- Leave Code Cleaner Than You Found It
Each edit should improve clarity, consistency, and structure. Reduce technical debt incrementally.

## Structure & Design

### Modularity

- Single Responsibility Principle (SRP)
Each module, class, or function should do one thing well. Keep interfaces minimal and cohesive.

- Encapsulation & Abstraction
Hide implementation details. Expose only what is essential to external components.

- Composition Over Inheritance
Prefer combining smaller, composable units rather than relying on deep inheritance trees.

- Minimal Coupling
Components should depend on abstractions rather than concrete implementations. Each unit should be easy to replace, test, and reuse.

### Scalability & Maintainability

- Design for readability before performance. Optimize only after measuring.

- Keep functions short and modules focused. Large units indicate poor separation of concerns.

- Use predictable data flow: avoid global state, implicit side effects, and circular dependencies.

## Naming & Style

### Naming Conventions

- Files & Modules: snake_case

- Functions & Variables: snake_case

- Types, Structs, Traits, Enums, Classes: PascalCase

- Constants: UPPER_SNAKE_CASE

- Enums for UI or application state: e.g. AppState, ThemeMode

### General Style

- Clarity over brevity: short names are fine, but not at the cost of meaning.
e.g. user_count > uc, format_iso_timestamp > fmt_t

- Consistency is non-negotiable. Follow established patterns and conventions.

- Use automatic formatters (cargo fmt, eslint, prettier, etc.) to ensure style uniformity.

## Documentation & Readability

- Comment why, not what.
Code should explain what it does by itself; comments should clarify why it’s done that way.

- Readable structure > clever tricks.
If you must choose between conciseness and clarity, favor clarity that aids maintainability.

- Docstrings / Type hints (where applicable)
Use type hints or doc comments to express interfaces clearly, not as decoration.

## Testing & Reliability

- Test Behavior, Not Implementation.
Focus on verifying outcomes and contracts, not internal workings.

- Automate Early.
Establish minimal CI or test workflows as soon as there’s testable logic.

- Fail Fast.
Write defensive checks and assertions where they prevent silent bugs.

## Performance & Efficiency

- Measure before optimizing.
Avoid speculative optimization. Profile, then act.

- Prefer readability until proven costly.
Clean code is easier to refactor when performance tuning becomes necessary.

- Leverage built-in or standard utilities first.
Don’t reimplement what standard libraries already handle elegantly.

## Aesthetic Integrity

- Code should read like prose.
Every function should tell a story with logical flow and minimal distraction.

- Elegance through restraint.
Minimal code that communicates intent clearly is more valuable than verbose perfection.

- Consistency breeds trust.
Small aesthetic choices (indentation, naming rhythm, doc tone) accumulate into a coherent system.