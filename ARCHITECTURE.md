# System Architecture & Layer Boundaries

This document outlines the architectural boundaries, dependency directions, and variation points of the **LLD Practice Platform (CipherSchools Hiring Assignment)**.

```
       ┌─────────────────────────────────────────────────────────────┐
       │                   Presentation Layer (UI)                   │
       │ Next.js 15 App Router + React Server / Client Components    │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                 Application Services Layer                  │
       │   AttemptService, SubmissionService, EvaluationService      │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
┌───────────────────────────────────┐    ┌───────────────────────────────────┐
│     Domain Core (Pure TS)         │    │       Infrastructure Adapters     │
│  - Entities (Problem, Attempt,    │    │  - Relational Database (ACID)     │
│    Submission, Rubric, Evaluation)│    │  - GeminiEvaluator (Google AI)    │
│  - Guarded State Machines         │    │  - MockEvaluator & HybridEvaluator│
│  - Core Interfaces (Evaluator,    │    │  - InProcessEvaluationDispatcher  │
│    SubmissionValidator)           │    │  - Zod Schemas & DTO Mappers      │
└───────────────────────────────────┘    └───────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. Domain Layer (`src/domain/`)
- **Purity Rule**: Zero external framework, database, or SDK dependencies.
- **Core Entities**:
  - `Problem`: Domain requirements, functional/non-functional constraints, and difficulty.
  - `Attempt`: Lifecycle tracker (`DRAFT` $\to$ `SUBMITTED`) and active draft state.
  - `Submission`: Immutable snapshot of an attempt with content hash and UUID idempotency key.
  - `Rubric`: 8 weighted criteria defining the industry evaluation standard.
  - `Evaluation`: Evaluation state machine (`QUEUED` $\to$ `EVALUATING` $\to$ `COMPLETED` / `FAILED`, and `FAILED` $\to$ `QUEUED` on explicit retry).
  - `FeedbackItem`: Criterion-level score (0-5), cited direct evidence quotes, concerns, concrete suggestions, and confidence score.
- **State Machines**:
  - `AttemptLifecycle`: Enforces draft mutability and submitted immutability.
  - `EvaluationLifecycle`: Enforces linear evaluation progress and retry caps (maximum 3 retries).
  - `ScoreCalculator`: Computes normalized 0-100 score based on criterion weights.

### 2. Application Services Layer (`src/services/`)
- Orchestrates business workflows across domain entities and adapters.
- **`AttemptService`**: Manages draft creation, autosave sync, and ownership verification.
- **`SubmissionService`**: Executes atomic database transactions (creates immutable Submission snapshot, transitions Attempt to `SUBMITTED`, queues Evaluation) and dispatches background evaluation.
- **`EvaluationService`**: Orchestrates evaluation execution, rubric scoring, and persistence.
- **`HistoryService`**: Aggregates attempt history, progression analytics, and side-by-side attempt comparisons.

### 3. Infrastructure & Adapters Layer (`src/adapters/`)
- **`RelationalDatabase`**: In-memory relational engine with atomic disk persistence (`data/database.json`), unique constraints, and ACID transactions.
- **`GeminiEvaluator`**: Google Gemini API adapter utilizing server-side API keys, prompt-injection isolation delimiters (`<learner_submission>`), and strict Zod validation.
- **`MockEvaluator`**: High-fidelity offline fallback evaluator for zero-configuration local review and automated testing.
- **`HybridEvaluator`**: Two-stage evaluation combining deterministic structural validation and AI rubric scoring.
- **`InProcessEvaluationDispatcher`**: Non-blocking asynchronous job runner with deduplication guard.

### 4. Presentation & UI Layer (`src/app/`, `src/components/`)
- Built with **Next.js 15 App Router** and **Tailwind CSS** in dark slate palette.
- **Local State Isolation**: Editor keystroke state remains local to individual section components with an 800ms debounced autosave, eliminating unnecessary React re-renders.
- **Server Components**: Used for problem listings, detail overviews, and history aggregations.
- **Client Components**: Used for interactive practice workspace, real-time feedback polling, and side-by-side comparison sliders.

---

## Architectural Extensibility (Change Tests)

1. **Change Test A (Submission Format Variation)**:
   - To support a new submission format (e.g., UML diagram or JSON schema), define a new variant in `SubmissionPayload` and implement a corresponding `SubmissionValidator`. The core practice workflow and Evaluation aggregate remain untouched.
2. **Change Test B (Evaluator Strategy Swap)**:
   - To introduce a new evaluation engine (e.g., `RuleBasedEvaluator` or `HumanReviewEvaluator`), implement the `Evaluator` interface. Application services depend on the `Evaluator` abstraction, allowing seamless provider swapping.
