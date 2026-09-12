# Market Research & Product Direction (RESEARCH.md)

Competitive Analysis of Low-Level Design Learning Platforms and Strategic Positioning.

---

## 1. The Core Learner Problem

Low-Level Design (LLD) and Object-Oriented Design (OOD) interviews test a candidate's ability to model real-world business domains into maintainable, scalable, and loosely coupled software components. 

Unlike Data Structures & Algorithms (DSA), Low-Level Design:
1. **Lacks Binary Correctness**: There is no single "correct" answer; software architecture is about evaluating trade-offs.
2. **Suffers from Feedback Deficit**: Learners can read textbooks and solutions, but when they draft their own designs, they have no automated mechanism to identify god classes, leaky abstractions, or missing concurrency guards.
3. **Lacks Progress Visibility**: Learners cannot easily compare Attempt 1 vs Attempt 2 to see if their refactoring resolved identified concerns.

---

## 2. Competitive Landscape & Existing Tools

| Platform / Tool | Core Value Proposition | Strengths | Critical Gaps |
| :--- | :--- | :--- | :--- |
| **Educative.io** *(Grokking the OOD Interview)* | Reading-heavy curriculum covering 15+ canonical design problems (Parking Lot, Movie Ticket Booking). | Detailed UML diagrams, Java code examples, and structured requirements breakdown. | Passive consumption; no interactive practice workspace or automated design evaluation. |
| **DesignGurus.io** | Video and text walkthroughs of classic system design questions. | Clear explanations of SOLID principles and pattern choices. | One-way instructional format with zero feedback on learner-authored designs. |
| **LLDCanvas / Excalidraw** | Whiteboard diagramming tool for system architecture. | Freeform canvas for drawing class boxes and arrows. | No automated validation, rubric scoring, or trade-off analysis. |
| **Open-Source LLD Arena** | Interactive editor with test suites. | Provides coding environments for specific language implementations. | High barrier to entry; forces candidate to write 500+ lines of syntax boilerplate rather than focusing on high-level architecture and trade-offs. |

---

## 3. The Product Gap

Existing platforms either **show you the answer** (passive tutorials) or **make you write hundreds of lines of code** (heavy code execution). 

**The Unmet Need**: A lightweight, deliberate practice platform centered around a tight loop:
$$\text{Choose Problem} \longrightarrow \text{Author Structured Architecture} \longrightarrow \text{Receive Objective Evidence-Backed Rubric Feedback} \longrightarrow \text{Iterate \& Compare}$$

---

## 4. Product Direction & Strategic Hypothesis

By constraining the input format to a **6-Section Structured Design Editor** and evaluating against an **8-Criterion Weighted Rubric**:
1. Learners can complete a full architectural practice session in **under 30 minutes**.
2. Feedback is **explainable, defensible, and cited directly** from the candidate's submission text.
3. The platform provides **concrete delta tracking** between attempts, building learner confidence in trade-off discussions.
