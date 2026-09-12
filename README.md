# LLD Practice Platform

A production-grade, highly focused learner practice platform for **Low-Level Design (LLD)**. Built for the **CipherSchools Selection Assignment (September 2026)**.

---

## 🎯 Problem Statement & Learner Journey

Traditional platforms for software engineering preparation focus heavily on algorithmic problems with binary pass/fail test cases. However, Low-Level Design (LLD) is inherently open-ended with multiple valid architectural choices. Learners struggle with:
1. Lack of objective, evidence-backed feedback on class responsibilities, coupling, and design patterns.
2. Inability to visualize iterative architectural improvement between attempts.
3. Overly complex LMS platforms that obscure the core practice loop.

**The 5-Step Learner Practice Loop:**
```
Choose Problem ──► Author Structured Design ──► Submit Idempotently ──► Explainable Rubric AI Feedback ──► Review History & Compare
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server & Client Components)
- **Language**: TypeScript 5.7 (Strict Mode, zero `any` in core domain)
- **Styling & UI**: Tailwind CSS + Custom Dark Slate Glassmorphism Design System + Lucide Icons
- **Validation**: Zod (unified schema contract for API requests, drafts, and LLM output)
- **Database & Storage**: Relational in-memory transactional database with atomic disk persistence (`data/database.json`), ACID submit transactions, and foreign key relations
- **AI Evaluation**: Google Gemini (`@google/generative-ai` with `gemini-1.5-flash`) via Google AI Studio API key + high-fidelity deterministic offline fallback
- **Testing**: Vitest 3.0 (Unit, Domain State Machines, Integration, and Evaluator Contract suites)

---

## 🏛️ Architecture (Modular Monolith)

The application is structured as a **Modular Monolith** adhering to Clean Architecture principles:

```
src/
├── domain/                  # Pure TypeScript domain core (ZERO framework/db dependencies)
│   ├── types/               # Problem, Attempt, Submission, Rubric, Evaluation, Feedback
│   ├── interfaces/          # Evaluator Strategy, SubmissionValidator, EvaluationDispatcher
│   └── state-machines/      # AttemptLifecycle, EvaluationLifecycle, ScoreCalculator
├── services/                # Business workflows (AttemptService, SubmissionService, HistoryService)
├── adapters/                # Infrastructure & External Integrations
│   ├── db/                  # Relational database with atomic transactions & disk persistence
│   ├── ai/                  # GeminiEvaluator, DeterministicValidator, MockEvaluator, HybridEvaluator
│   └── dispatcher/          # InProcessEvaluationDispatcher (asynchronous job runner)
├── schemas/                 # Zod validation schemas for requests, drafts, and AI responses
├── app/                     # Next.js App Router (Pages & API route handlers)
└── components/              # Memoized, accessible React UI components
```

---

## ⚖️ Evaluation Approach (Deterministic vs AI Split)

| Evaluation Stage | Responsibilities & Checks |
| :--- | :--- |
| **Stage 1: Deterministic Validation** | Structural completeness, non-empty assumptions, at least 2 distinct classes with non-empty responsibilities, unique class naming, valid state transitions, idempotency deduplication. |
| **Stage 2: Gemini AI Rubric Evaluation** | Single Responsibility Principle (SRP) adherence, loose coupling & high cohesion, interface encapsulation, justified design pattern usage (Strategy, Factory, State), extensibility under future requirements, and concurrency/edge-case handling. |

### 8-Dimension Rubric Weights:
1. **Requirement Understanding**: 15%
2. **Class Responsibilities & Cohesion (SRP)**: 20%
3. **Coupling & Cohesion**: 15%
4. **Encapsulation & Interfaces**: 15%
5. **Design Patterns & Abstractions**: 10%
6. **Extensibility & Change Resilience**: 10%
7. **Edge Cases & Testability**: 10%
8. **Explanation & Trade-off Quality**: 5%
*Total: 100% Normalized Score*

---

## 🚀 Local Setup & Quickstart

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd "LLD practice platform"
npm install
```

### 2. Configure Environment Variables (Optional for Offline Review)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
```env
DATABASE_URL=file:./lld_platform.db
GEMINI_API_KEY=your_google_ai_studio_api_key_here
NODE_ENV=development
```
> **Note**: If `GEMINI_API_KEY` is not set, the platform automatically switches to the high-fidelity `MockEvaluator`. Reviewers can immediately test the entire application offline without an external API key!

### 3. Seed Demo Data
```bash
npm run db:seed
```
*Seeds 4 core problems (Parking Lot, Vending Machine, Elevator System, Library Management) and 3 small historical attempts for Alice.*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

Run the complete Vitest test suite:
```bash
npm run test
```
Typecheck verification:
```bash
npm run typecheck
```

---

## 👥 Demo User Personas

Use the Persona Switcher in the top right of the navigation header:
1. **Alice Developer** (`user_alice`): Contains two Parking Lot attempts (63% and 91%) plus one Vending Machine attempt (78%) to demonstrate score trends without an artificially large history. Elevator System and Library Management remain unattempted.
2. **Bob Systems** (`user_bob`): Clean profile for starting fresh attempts from scratch.

---

## 🛡️ Failure Handling & Reliability

- **Asynchronous Execution**: Submissions return immediately (`status = QUEUED`), and evaluation runs in the background. The client polls every 2.5s until completion.
- **Safe Failure & Retry**: If the AI evaluation times out or encounters invalid JSON, the evaluation transitions to `FAILED` with a safe error message. The submission snapshot is never lost, and the learner can click **Retry Evaluation** (capped at 3 retries).
- **Idempotency Guard**: All submissions require a unique `Idempotency-Key` to prevent duplicate submissions on double-clicks or unstable networks.
- **Prompt Injection Defense**: Learner input is isolated inside `<learner_submission>` XML delimiters with explicit instructions to ignore prompt injection attempts.

---

## 📈 What I Would Build Next

1. **UML Class Diagram & Flowchart Generator**: Render real-time Mermaid.js class diagrams derived from the learner's structured class inputs.
2. **Interactive Rubric Follow-Up Chat**: Allow learners to ask clarifying questions directly on individual feedback suggestions.
3. **Multi-User Collaborative Review**: Allow peers or mentors to leave inline code annotations on submitted designs.
