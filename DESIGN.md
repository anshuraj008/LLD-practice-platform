# Technical Design Document (DESIGN.md)

Low-Level Design Practice Platform — Architecture, Invariants, and Extensibility

---

## 1. Why Structured Text for the MVP?

Instead of requiring learners to submit full executable code, unstructured raw text, or hand-drawn UML images, this platform utilizes a **Structured Text Submission Format** divided into 6 distinct sections:
1. **Scope & Assumptions**
2. **Core Classes & Responsibilities (SRP Table)**
3. **Relationships, Interfaces & Encapsulation**
4. **Main Execution Flow (Step-by-Step)**
5. **Edge Cases & Concurrency**
6. **Trade-offs & Extensibility Points**

### Rationale:
- **Expressiveness & Speed**: Learners can articulate deep architectural models in 15–30 minutes without getting bogged down by boilerplate syntax or language-specific compiler quirks.
- **Evidence-Based Evaluation**: Structured sections provide direct textual evidence for the evaluator to cite, eliminating hallucinations and ensuring explainability.
- **Variation Point Isolation**: Classes and responsibilities are isolated as distinct data structures, enabling deterministic count and uniqueness checks before invoking AI.

### Authentication Scope
Authentication was intentionally excluded from the 2-day MVP because it does not improve the core LLD practice loop.

The domain model retains learner ownership so real authentication can be added without redesigning `Attempt` or `Evaluation`.

---

## 2. Core Entities & Boundary Responsibilities

| Entity / Aggregate | Primary Responsibility | What It Must NEVER Own |
| :--- | :--- | :--- |
| **`Problem`** | Problem statement, functional/non-functional requirements, difficulty rating, estimated time. | User progress, draft state, or evaluation results. |
| **`Attempt`** | Learner identity, problem reference, draft lifecycle, updated timestamps. | Rubric scoring logic or AI prompts. |
| **`Submission`** | Immutable snapshot of an attempt at a specific timestamp, content hash, UUID idempotency key. | Mutable editor state or autosave drafts. |
| **`Rubric`** | Ordered collection of criteria, percentage weights, evaluation guidelines, max scores. | Provider-specific AI prompt formulations. |
| **`Evaluation`** | Evaluation state machine (`QUEUED` $\to$ `EVALUATING` $\to$ `COMPLETED`/`FAILED`), retry counter, normalized score. | Submission mutations. |
| **`FeedbackItem`** | Single criterion score (0-5), cited direct evidence quotes, criterion strength, identified concerns, actionable suggestions, confidence score. | Overall submission workflow. |

---

## 3. State Machines & Invariants

### Attempt Lifecycle
```
                 ┌───────────────────────────┐
                 │           DRAFT           │
                 │   (Mutable via Autosave)  │
                 └─────────────┬─────────────┘
                               │
                               │ Submit Action (Atomic Transaction)
                               ▼
                 ┌───────────────────────────┐
                 │         SUBMITTED         │
                 │   (Immutable Snapshot)    │
                 └───────────────────────────┘
```
**Invariants**:
- An Attempt in `SUBMITTED` state cannot be mutated or autosaved.
- Transitions back from `SUBMITTED` to `DRAFT` are forbidden.

---

### Evaluation Lifecycle
```
     ┌───────────┐          Start Job         ┌──────────────┐
     │  QUEUED   │ ─────────────────────────► │  EVALUATING  │
     └─────▲─────┘                            └──────┬───────┘
           │                                         │
           │ Retry Action (Max 3)                    ├──────────────────┐
           │                                         ▼                  ▼
     ┌─────┴─────┐                            ┌─────────────┐    ┌────────────┐
     │  FAILED   │ ◄───────────────────────── │  COMPLETED  │    │   FAILED   │
     └───────────┘       Provider Error       │ (Terminal)  │    │ (Retriable)│
                                              └─────────────┘    └────────────┘
```
**Invariants**:
- Direct jumps (e.g. `QUEUED` $\to$ `COMPLETED`) throw `EvaluationLifecycleError`.
- Only `FAILED` evaluations can transition to `QUEUED` upon explicit retry.
- Retries are strictly capped at `MAX_EVALUATION_RETRIES = 3`.
- A provider failure transitions the evaluation to `FAILED` without deleting the immutable submission snapshot.

---

## 4. Evaluator & Submission Format Variation Points

### Change Test A: Submission Format Variation
*Requirement: Add support for JSON-based class diagrams or Mermaid UML syntax.*
- **Implementation**: Define a new variant `ClassDiagramSubmissionPayload` implementing `SubmissionPayload`. Create a `DiagramSubmissionValidator`.
- **Proof of Isolation**: `Attempt`, `Submission`, `Evaluation`, and application service orchestration remain 100% unchanged because they interact with the polymorphic `SubmissionPayload` interface.

### Change Test B: Evaluator Strategy Variation
*Requirement: Swap Google Gemini for a RuleBasedEvaluator or HumanReviewEvaluator.*
- **Implementation**: Create a new class implementing the `Evaluator` interface:
```typescript
interface Evaluator {
  readonly kind: string;
  readonly version: string;
  evaluate(input: EvaluatorInput): Promise<EvaluationResult>;
}
```
- **Proof of Isolation**: `EvaluationService` depends on `Evaluator`, not concrete provider SDKs. Swapping the evaluator is an additive change requiring zero modifications to the learner loop.

---

## 5. Why a Modular Monolith?

- **Zero Network Latency**: In-process service calls between domain, database, and evaluation layers eliminate distributed network serialization overhead and partial failure states.
- **Strict Boundary Enforcement**: Domain entities have zero dependencies on Next.js, databases, or AI SDKs.
- **Future Scalability**: If evaluation workload increases dramatically at scale, the `EvaluationDispatcher` can be swapped from `InProcessEvaluationDispatcher` to an external queue (e.g. Inngest / SQS / Redis) with zero domain layer refactoring.
