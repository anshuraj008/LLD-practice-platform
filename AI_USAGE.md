# AI Usage & Architectural Decisions (AI_USAGE.md)

This document transparently documents how AI was utilized, provider selections, and key architectural suggestions that were accepted or rejected during development.

---

## 1. Provider Choice & Boundary Decision

> **Selected Google Gemini (via Google AI Studio `@google/generative-ai`) for the MVP and rejected adding OpenAI or a multi-provider switcher.**
>
> **Rationale**: Adding multiple LLM providers or complex client-side provider switchers adds accidental complexity and secret leakage risks without improving the core learner loop. Instead, the architecture encapsulates all AI evaluation behind a provider-neutral `Evaluator` interface (`GeminiEvaluator`, `MockEvaluator`, `HybridEvaluator`), allowing future evaluator implementations to remain clean, additive changes.

When `GEMINI_API_KEY` is configured, provider errors remain visible as a failed evaluation so the saved submission can be retried. When no key is configured, the application uses `MockEvaluator` as an explicit offline development path. The opt-in live contract is covered by `tests/integration/gemini-live.test.ts`.

---

## 2. Key Architectural Decisions (Accepted vs. Rejected)

### Decision 1: Domain Purity vs. Direct ORM Entities
- **AI Suggestion**: Use Drizzle ORM model types directly inside the domain state machines to reduce boilerplate.
- **Decision**: **REJECTED**.
- **Reasoning**: Coupling the pure domain layer to a database ORM violates Clean Architecture. The domain entities (`Attempt`, `Submission`, `Evaluation`, `Rubric`) must remain framework-independent TypeScript with zero external dependencies to ensure fast, isolated unit testing.

### Decision 2: Single Arbitrary 0–100 Score vs. Weighted Multi-Criterion Rubric
- **AI Suggestion**: Ask Gemini to output a single overall numeric score between 0 and 100 with general comments.
- **Decision**: **REJECTED**.
- **Reasoning**: Unconstrained 0–100 LLM scores lack explainability and variance stability. Instead, we enforce a strict 8-criterion rubric where the model scores discrete sub-criteria (0–5), cites direct text evidence, and the normalized 0–100 score is computed deterministically by `ScoreCalculator`.

### Decision 3: Deterministic Structural Validation Stage
- **AI Suggestion**: Send all incoming submissions directly to Gemini for validation and grading.
- **Decision**: **ACCEPTED & IMPLEMENTED**.
- **Reasoning**: Validating structural constraints (e.g. minimum class count, non-empty responsibilities, required sections) deterministically in `DeterministicSubmissionValidator` catches invalid attempts instantly without consuming AI API quota or risking prompt hallucinations on empty submissions.

### Decision 4: Global React State Store (Redux / Zustand) vs. Local Section Isolation
- **AI Suggestion**: Implement a global Redux/Zustand store to hold the active editor keystroke draft across all tabs.
- **Decision**: **REJECTED**.
- **Reasoning**: A global store causes unnecessary root re-renders on every keystroke. Keeping state local to individual editor sections combined with an 800ms debounced server sync provides superior typing performance with zero UI jank.

### Decision 5: Prompt Injection Isolation Delimiters
- **AI Suggestion**: Inject the learner's raw text directly into the system instructions prompt.
- **Decision**: **ACCEPTED & REFINED**.
- **Reasoning**: Learner text is untrusted user input. We isolate the submission inside explicit `<learner_submission>...</learner_submission>` delimiters and instruct the model explicitly to treat it purely as passive data and ignore any system prompt override attempts.
