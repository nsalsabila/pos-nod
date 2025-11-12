```markdown
<!-- 
SYNC IMPACT REPORT
==================
Version Change: 0.0.0 → 1.0.0 (MINOR: Initial constitution with 5 SOLID principles)

New Principles (5):
- I. Single Responsibility Principle (SRP)
- II. Open/Closed Principle (OCP)
- III. Liskov Substitution Principle (LSP)
- IV. Interface Segregation Principle (ISP)
- V. Dependency Inversion Principle (DIP)

New Sections (2):
- Architecture & Design Standards (module organization, abstraction layers, versioning)
- Development Workflow (code review checklist, TDD mandate, refactoring triggers)

Template Update Status:
- ✅ plan-template.md: Updated Constitution Check section references SOLID principles
- ✅ spec-template.md: Verified requirement quality gates align with principles
- ✅ tasks-template.md: Verified task categorization includes SOLID-driven types (contract tests, unit isolation)

Ratification: 2025-11-12
Amendment Procedure: Documented in Governance section
Next Review: Before any breaking changes to existing architecture
-->

# pos-nod Constitution

## Core Principles

### I. Single Responsibility Principle (SRP)
Each module, service, and class must have exactly one reason to change. A component owns one business capability. Benefits: faster testing cycles, reduced defects, easier refactoring, clear code ownership.

**Requirements**:
- Every file must serve a single purpose; split if exceeds 300 lines of business logic
- Naming must declare responsibility (e.g., `OrderProcessor`, `PaymentValidator`, `InventoryService`)
- Dependencies injected, not created internally

### II. Open/Closed Principle (OCP)
Software must be open for extension, closed for modification. Features added via composition, inheritance, or configuration—not code changes to existing modules.

**Requirements**:
- Use abstraction layers (interfaces/base classes) for extension points
- New business rules added through strategy patterns or plugins
- Public APIs must remain stable across feature additions
- Breaking changes require MAJOR version bump and migration guide

### III. Liskov Substitution Principle (LSP)
Derived classes must safely substitute their base types. Subtypes honor parent contracts; polymorphism must work correctly.

**Requirements**:
- Overridden methods must accept same (or wider) input ranges
- Overridden methods must return compatible output types
- No uncaught exceptions introduced by subtypes
- Contract tests verify LSP compliance for all implementations

### IV. Interface Segregation Principle (ISP)
Clients must not depend on methods they don't use. Prefer focused interfaces over bloated general-purpose contracts.

**Requirements**:
- Each interface serves one client concern (e.g., `PaymentProcessor`, `InventoryReader`, not `PosSystem`)
- Max 5-7 methods per interface; split if larger
- Remove unused interface methods before refactoring

### V. Dependency Inversion Principle (DIP)
High-level modules depend on abstractions, not low-level implementations. This enables swapping implementations without affecting callers.

**Requirements**:
- All external dependencies (DB, APIs, file systems) injected at construction
- Services receive interfaces, not concrete classes
- Mocks must work transparently for testing
- Configuration drives concrete implementations

## Architecture & Design Standards

### Module Organization
- **src/** contains domain layers: models, services, repositories, handlers
- **tests/** mirrors src structure: unit/, integration/, contract/
- Each domain layer has single responsibility (payment ≠ inventory ≠ auth)
- Cross-cutting concerns (logging, config, utils) isolated in shared modules

### Abstraction Layers
- Repository pattern isolates data access (enable DB swaps without changing services)
- Service layer encapsulates business logic (testable in isolation via mock repositories)
- Handler/Controller layer thin—delegates to services
- Dependency injection container wires all dependencies

### API Contracts & Versioning
- All APIs documented via OpenAPI/GraphQL schemas committed to repo
- Contract tests verify input/output schemas before implementation
- Endpoint changes trigger version bump per semantic versioning
- Deprecated endpoints supported for 2 major versions with warnings

## Development Workflow

### Code Review Checklist - SOLID Compliance
- [ ] Does each class/module have one, clear responsibility?
- [ ] Could this be extended without modifying existing code (OCP)?
- [ ] Are all dependencies injected, not constructed internally (DIP)?
- [ ] Would a derived class safely substitute here (LSP)?
- [ ] Is this interface focused or bloated (ISP)?
- [ ] Are contract tests present and passing?
- [ ] Is error handling explicit and logged?

### Test-First (Non-Negotiable)
- **TDD mandatory**: Write tests → Watch fail → Implement → Tests pass → Refactor
- **Contract tests** verify API schemas (run before implementation)
- **Unit tests** cover each service in isolation with mocks
- **Integration tests** cover service chains with real DB (separate test DB required)
- **Minimum coverage**: 80% for critical paths (payment, auth, inventory)

### Refactoring Triggers
- Any class exceeding 300 lines of business logic
- Any interface with >7 methods
- Any service with >3 responsibilities (detected via constructor parameters)
- Circular dependencies detected
- Same data flow repeated in 3+ places

## Governance

### Constitutional Authority
- SOLID principles are non-negotiable architectural law
- Every architectural decision must justify alignment with at least one SOLID principle
- Code violating SOLID must be refactored or rejected in review
- Exceptions require documented justification + team consensus before merge

### Versioning Policy
- Format: MAJOR.MINOR.PATCH (e.g., 1.2.3)
- MAJOR: Backward-incompatible API changes, principle removals/redefinitions
- MINOR: New principles, sections, or materially expanded guidance
- PATCH: Clarifications, wording, typo fixes, non-semantic refinements

### Amendment Process
1. Propose amendment with rationale (why change needed)
2. Impact analysis: which code/practices affected
3. Draft migration strategy for existing code
4. Team review + consensus required
5. Document: old→new principle mapping, effective date, migration deadline
6. Update all dependent templates (plan-template.md, spec-template.md, tasks-template.md)
7. Version bump per policy above

### Compliance Review
- All PRs must pass SOLID compliance checklist (Code Review Checklist above)
- Complexity deviations require documented justification in PR comments
- Integration tests gate merges (must cover service chains + error cases)
- Contract tests must pass before any implementation tests run

**Version**: 1.0.0 | **Ratified**: 2025-11-12 | **Last Amended**: 2025-11-12
