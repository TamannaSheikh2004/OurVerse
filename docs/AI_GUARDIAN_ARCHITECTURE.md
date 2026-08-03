# OurVerse AI Guardian Architecture & Technical Design Specification
**Milestone 3.1 Architectural Specification**  
**Document Version:** 1.0.0  
**Status:** Approved Technical Architecture (Architecture Only — Zero Implementation Code)

---

## Executive Summary

OurVerse is a privacy-first communication platform where users connect in mutual-consent, 1-on-1 **Shared Universes**. Milestone 3.1 defines the complete architectural blueprint for the **AI Guardian**—the core relationship intelligence engine of OurVerse.

The Guardian is **not a generic chatbot**. It is an autonomous, long-term relationship intelligence system that grows organically alongside a Shared Universe. Every Universe owns exactly **one Guardian** ($1 \text{ Universe} \leftrightarrow 1 \text{ Guardian}$). Guardians never cross Universe boundaries, never leak private memories between participants, and remain completely decoupled from underlying LLM vendors.

```
+-------------------------------------------------------------------------+
|                              SHARED UNIVERSE                            |
|                                                                         |
|   +------------------+                    +------------------+          |
|   |      User A      | <===============>  |      User B      |          |
|   +------------------+  Shared Chat Flow  +------------------+          |
|            ^                                       ^                    |
|            | Private                               | Private            |
|            v                                       v                    |
|   +----------------------------------------------------------+          |
|   |                        AI GUARDIAN                       |          |
|   |         (Dedicated 1:1 Relationship Intelligence)         |          |
|   +----------------------------------------------------------+          |
|                                |                                        |
|   +----------------------------+----------------------------+           |
|   |                            |                            |           |
|   v                            v                            v           |
| [ Shared Memory ]    [ Private Memory A ]         [ Private Memory B ]  |
| [ System Memory ]    [ Working Memory A ]         [ Working Memory B ]  |
+-------------------------------------------------------------------------+
```

---

## 1. Guardian Vision & Philosophical Framework

### 1.1 Core Purpose
The Guardian exists to strengthen human connection by understanding relationship dynamics, preserving shared memories, detecting communication patterns, reducing misunderstandings, celebrating milestones, and providing contextual guidance.

### 1.2 Non-Negotiable Axioms
1. **1:1 Strict Universe Ownership**: Every Universe automatically provisions exactly one Guardian. Guardians are isolated tenants; memories are never aggregated across different Universes.
2. **Support, Not Replacement**: The Guardian facilitates and enhances human-to-human communication. It never sends messages on behalf of a user or speaks for them in the Shared Universe.
3. **Strict Privacy Boundaries**: Private conversations between a user and the Guardian ($User_A \leftrightarrow Guardian$) are cryptographically isolated and never exposed to the other user ($User_B$).
4. **Provider Independence**: The core intelligence engine is abstracted from LLM vendors (OpenAI, Anthropic, Google, Ollama, etc.), preventing vendor lock-in and allowing modular model routing.
5. **Epistemic Honesty**: The Guardian clearly distinguishes facts from inferred patterns and advice. It never fabricates memories, pretends to read minds, or takes sides in disputes.

---

## 2. Functional Requirements (SRS)

### FR-1: Universe Lifecycle Provisioning
- **FR-1.1**: Upon `UniverseInvitation` status changing to `ACCEPTED`, the system shall initialize a dedicated Guardian instance and memory storage namespace.
- **FR-1.2**: Upon account deletion or Universe termination, the system shall execute cryptographic erasure of all associated Guardian memories.

### FR-2: Dual-Channel Observation & Interaction
- **FR-2.1 (Shared Observation)**: The Guardian shall ingest messages, reactions, and future media events occurring in the Shared Universe to construct the relationship narrative.
- **FR-2.2 (Private Dialogues)**: The Guardian shall provide independent, private 1-on-1 interfaces for $User_A$ and $User_B$.

### FR-3: Intent-Driven Question Resolution
The Guardian architecture supports 5 distinct query domains:

| Domain | Intent Target | Example User Query | Primary Memory Dependency |
| :--- | :--- | :--- | :--- |
| **Reflection** | Self-evaluation of recent interactions | *"Was I too harsh in our discussion today?"* | Working + Recent Shared + Private Memory |
| **Understanding** | Deeper analysis of relationship dynamics | *"Why did today's conversation become awkward?"* | Weekly/Monthly Summaries + Emotion Cadence |
| **Growth** | Actionable communication advice | *"How can I communicate better when we disagree?"* | Long-Term Patterns + Communication Habits |
| **Memory** | Retrieval of shared history | *"When did we first talk about traveling together?"* | Vector Index + System Memory Graph |
| **Celebration** | Acknowledging relationship milestones | *"What milestones have we reached this month?"* | Milestone Registry + Systems Statistics |

### FR-4: Controlled Internal Privacy Guidance
- **FR-4.1**: The Guardian MAY utilize insights from $User_A$'s private memory to offer advice to $User_A$ on how to communicate with $User_B$.
- **FR-4.2**: The Guardian SHALL NEVER reveal confidential facts from $User_A$'s private memory to $User_B$, nor reveal that $User_A$ engaged in a private discussion about the topic.

---

## 3. Non-Functional Requirements (NFR)

### NFR-1: Security & Privacy
- **NFR-1.1 (Zero Cross-Tenant Leakage)**: Vector indices and memory databases MUST enforce hard tenant isolation keys (`universeId`).
- **NFR-1.2 (Cryptographic Encryption at Rest)**: All memory partitions MUST be encrypted using AES-GCM-256 with distinct keys per scope (`SHARED`, `PRIVATE_USER_A`, `PRIVATE_USER_B`).

### NFR-2: Latency & Performance SLAs
- **NFR-2.1 (Interactive Responses)**: Private Guardian chat responses MUST return time-to-first-token within $< 1.2\text{s}$ and complete within $< 4.0\text{s}$.
- **NFR-2.2 (Asynchronous Summarization)**: Hierarchical memory consolidation MUST run as a background task without blocking live messaging.

### NFR-3: Model Provider Agnosticism
- **NFR-3.1**: The system MUST utilize an abstract LLM Provider Adapter interface (`ILLMProviderAdapter`), supporting seamless switching between cloud providers (e.g. OpenAI, Claude, Gemini) and local self-hosted models (e.g. Ollama, vLLM).

---

## 4. Guardian Lifecycle Architecture

```
  +--------------------------------------------------------------------+
  |                     STAGE 1: PROVISIONING                          |
  |  Trigger: UniverseInvitation ACCEPTED                               |
  |  Actions: Allocate Universe ID, Keys, Memory Stores                |
  +--------------------------------------------------------------------+
                                   |
                                   v
  +--------------------------------------------------------------------+
  |                      STAGE 2: COLD START                           |
  |  State: Zero prior history                                         |
  |  Actions: Neutral greeting, initial baseline observations          |
  +--------------------------------------------------------------------+
                                   |
                                   v
  +--------------------------------------------------------------------+
  |                   STAGE 3: ACTIVE ACCUMULATION                     |
  |  State: Continuous processing                                      |
  |  Actions: Hierarchical summarization, pattern extraction           |
  +--------------------------------------------------------------------+
                                   |
                                   v
  +--------------------------------------------------------------------+
  |                  STAGE 4: MATURE INTELLIGENCE                      |
  |  State: Rich long-term relationship memory                         |
  |  Actions: High-confidence guidance, milestone celebrations         |
  +--------------------------------------------------------------------+
                                   |
                                   v
  +--------------------------------------------------------------------+
  |                    STAGE 5: CRYPTOGRAPHIC ERASURE                  |
  |  Trigger: Account Deletion / Universe Termination                  |
  |  Actions: Key destruction, vector index purge                      |
  +--------------------------------------------------------------------+
```

---

## 5. Memory Architecture & Privacy Classifications

The memory system is partitioned into **4 distinct memory types** enforced by strict database access controls and cryptographic boundaries.

```
+-----------------------------------------------------------------------------------+
|                                 MEMORY ARCHITECTURE                               |
+-------------------+--------------------+-------------------+----------------------+
| 1. SHARED MEMORY  | 2. PRIVATE MEMORY  | 3. SYSTEM MEMORY  | 4. WORKING MEMORY    |
+-------------------+--------------------+-------------------+----------------------+
| • Inside Jokes    | • Isolated User A  | • Embeddings      | • Ephemeral Prompt   |
| • Milestones      |   Insecurities     | • Entity Graph    |   Context Window     |
| • Shared Goals    | • Isolated User B  | • Sentiment Stats | • Erased Post-       |
| • Favorite Topics |   Surprises        | • Summaries       |   Generation         |
+-------------------+--------------------+-------------------+----------------------+
| Access: A, B, AI  | Access: User + AI  | Access: AI Internal| Access: Transient    |
+-------------------+--------------------+-------------------+----------------------+
```

### 5.1 Memory Types & Data Contracts

#### Type 1: Shared Memory (`SHARED`)
- **Definition**: Mutual facts, shared history, and agreed milestones derived from the Shared Universe.
- **Storage Scope**: Accessible by $User_A$, $User_B$, and the Guardian.
- **Data Attributes**: `sharedId`, `universeId`, `category` (JOYS, MILESTONES, HABITS, GOALS), `content`, `confidenceScore`, `lastVerified`.

#### Type 2: Private Memory (`PRIVATE_USER_A` / `PRIVATE_USER_B`)
- **Definition**: Individual reflections, vulnerabilities, or planned surprises shared during private Guardian chats.
- **Storage Scope**: Isolated to the specific user and the Guardian. **Strictly inaccessible to the other user.**
- **Data Attributes**: `privateId`, `universeId`, `ownerUserId`, `content`, `emotionalState`, `createdAt`.

#### Type 3: System Memory (`SYSTEM`)
- **Definition**: Machine-readable analytical models, vector embeddings, sentiment cadences, and entity-relationship graphs.
- **Storage Scope**: Internal Guardian access only. Invisible to both users in raw form.
- **Data Attributes**: `systemId`, `universeId`, `vectorEmbedding`, `clusterId`, `decayFactor`, `nodeGraph`.

#### Type 4: Working Memory (`WORKING`)
- **Definition**: Ephemeral in-memory context buffer constructed during prompt execution.
- **Storage Scope**: Volatile memory (RAM / Redis cache). Automatically destroyed after token generation completes.

---

## 6. Hierarchical Memory Model & Summarization Pipeline

To process high-volume messaging without exceeding token context limits or incurring exponential costs, memories are structured in a 5-layer hierarchy:

```
[ Layer 1: Raw Messages ]
       │  (Ingestion stream: Full text, timestamp, sender)
       ▼
[ Layer 2: Daily Summary ]
       │  (Extracts key events, sentiment polarity, notable topics)
       ▼
[ Layer 3: Weekly Summary ]
       │  (Identifies weekly communication cadence, emerging friction/harmony)
       ▼
[ Layer 4: Monthly Summary ]
       │  (Consolidates relationship progression, major milestones, goal tracking)
       ▼
[ Layer 5: Long-Term Relationship Memory ]
       (Permanent semantic graph: Core values, communication profile, history)
```

### 6.1 Summarization Strategy & Thresholds

| Layer | Trigger Threshold | Extraction Strategy | Retention Policy |
| :--- | :--- | :--- | :--- |
| **Raw Messages** | Real-time ingest | Exact message text + metadata | Retained based on user settings; vectorized immediately |
| **Daily Summary** | End of day (00:00 UTC) or 50 messages | Extracted entities, emotional mood, key topics | 30 days active cache; permanent summary |
| **Weekly Summary** | Every 7 days | Communication balance, unresolved topics, pattern shifts | 90 days active cache; permanent summary |
| **Monthly Summary**| Every 30 days | Relationship trends, milestone consolidation | Permanent system storage |
| **Long-Term Graph**| Ongoing synthesis | Core relationship traits, attachment styles, inside jokes | Permanent system memory |

---

## 7. Context Retrieval Strategy (Hybrid RAG)

When generating responses, the Guardian uses a multi-stage **Hybrid Retrieval-Augmented Generation (RAG)** pipeline to pull relevant memories into the Working Memory.

```
                            [ User Query ]
                                  │
                                  ▼
                   +------------------------------+
                   |  Intent & Privacy Classifier  |
                   +------------------------------+
                                  │
                 +----------------+----------------+
                 │                                 │
                 v                                 v
    [ Vector Dense Search ]           [ Lexical Sparse Search ]
    (Cosine Similarity on             (BM25 Keyword Matching on
     Embeddings)                       Entities & Dates)
                 │                                 │
                 +----------------+----------------+
                                  │
                                  v
                   +------------------------------+
                   |   Temporal Recency Decay     |
                   |   Score Reranking            |
                   +------------------------------+
                                  │
                                  v
                   +------------------------------+
                   |  Privacy Filter & Token      |
                   |  Budget Allocator            |
                   +------------------------------+
                                  │
                                  v
                   [ Assembled Working Memory ]
```

### 7.1 Dynamic Token Budget Allocation
For an available context window (e.g. 8,192 tokens), the working memory is strictly partitioned:

```
+-------------------------------------------------------------------+
| Dynamic Context Window (8192 Tokens)                               |
+--------------------+-------------------+--------------------------+
| System Instruction | Active User Query | Retrieved Shared Memory  |
| & Persona (15%)    | & Buffer (10%)    | & History (40%)          |
+--------------------+-------------------+--------------------------+
| User Private Context (If Private Chat) | Safety & Synthesis Rules |
| (25%)                                  | (10%)                    |
+----------------------------------------+--------------------------+
```

---

## 8. Guardian Response Pipeline Architecture

Every Guardian response strictly follows the **Observation $\rightarrow$ Pattern $\rightarrow$ Confidence $\rightarrow$ Suggestion** decision framework.

```
       [ Input Input Event / User Query ]
                       │
                       ▼
       +-------------------------------+
       |  Step 1: Intent & Safety Gate |
       +-------------------------------+
                       │
                       ▼
       +-------------------------------+
       | Step 2: Context Retrieval     |
       +-------------------------------+
                       │
                       ▼
       +-------------------------------+
       | Step 3: Synthesis Engine      |
       |  • Observation (Fact)         |
       |  • Pattern (Inferred)         |
       |  • Confidence (Low/Med/High)  |
       |  • Suggestion (Actionable)    |
       +-------------------------------+
                       │
                       ▼
       +-------------------------------+
       | Step 4: Non-Attribution Filter|
       +-------------------------------+
                       │
                       ▼
       [ Final Structured Output Response ]
```

### 8.1 Output Format Specification
The response generator must separate its response into four distinct components:

1. **Observation (Facts)**: Directly observable data points or shared events (*"You both discussed weekend plans on Tuesday."*).
2. **Pattern (Inferences)**: Recurring communication dynamics (*"Conversations tend to be brief during busy weekday mornings."*).
3. **Confidence Level**: Explicit uncertainty rating (`HIGH`, `MEDIUM`, `LOW`) based on supporting data volume.
4. **Suggestion (Actionable)**: Constructive, neutral guidance (*"Consider checking in this evening when schedule permits."*).

---

## 9. Guardian Limitations & Guardrail Architecture

```
+-----------------------------------------------------------------------+
|                    GUARDIAN SAFETY & LIMITATION MATRIX                |
+-----------------------+-----------------------------------------------+
| Prohibition Category  | Enforcement Mechanism                         |
+-----------------------+-----------------------------------------------+
| Memory Fabrication    | Strict RAG grounding; zero ungrounded facts   |
| Privacy Leakage       | Automated token-level non-attribution filter  |
| Taking Sides          | Neutral third-party persona validation system |
| Out-of-Bounds Advice  | Rejection filter for medical/legal/financial  |
| Inter-Universe Leak   | Hard DB tenant partitioning by universeId     |
+-----------------------+-----------------------------------------------+
```

---

## 10. Security, Privacy, and Decoupled Architecture

### 10.1 LLM Provider Independence Layer
The architecture isolates all AI vendor APIs behind an abstraction boundary.

```
+----------------------------------------------------------------------+
|                     OURVERSE GUARDIAN CORE API                       |
+----------------------------------------------------------------------+
                                   │
                                   v
+----------------------------------------------------------------------+
|                    ILLMProviderAdapter Interface                     |
|  • generateCompletion(PromptPayload)                                 |
|  • generateEmbeddings(TextPayload)                                   |
|  • streamResponse(PromptPayload)                                     |
+----------------------------------------------------------------------+
        │                          │                         │
        v                          v                         v
+---------------+          +---------------+         +---------------+
| OpenAI        |          | Anthropic     |         | Local Ollama  |
| Adapter       |          | Adapter       |         | Adapter       |
+---------------+          +---------------+         +---------------+
```

### 10.2 Cryptographic Isolation Schema
- Memory entries are encrypted using **Envelope Encryption**.
- Key hierarchy:
  - `Master Key` $\rightarrow$ `Universe Key` $\rightarrow$ `Scope Key (Shared / Private A / Private B)`.
- Re-keying is triggered dynamically if a user updates their identity credentials.

---

## 11. Scalability and Future Expansion Strategy

### 11.1 Event-Driven Processing
- Live messaging is decoupled from memory consolidation via asynchronous event streams.
- Heavy tasks (summarization, embedding generation, graph updating) run in background worker pools.

### 11.2 Multimodal & Future Expansion Roadmap
- **Sprint 3 (Real-Time Chat & Guardian V1)**: Implementation of live messaging, basic RAG, and private Guardian dialogues.
- **Sprint 4 (Multimodal Ingestion)**: Image analysis, voice transcript ingestion, and automatic media memory tagging.
- **Sprint 5 (Proactive Guidance & Milestone Engine)**: Gentle ambient interventions, celebratory anniversary triggers, and proactive relationship health reports.

---

## Conclusion

This document establishes the architecture for the OurVerse AI Guardian. By strictly separating memory scopes, enforcing hierarchical summarization, guaranteeing provider independence, and adhering to the **Observation $\rightarrow$ Pattern $\rightarrow$ Confidence $\rightarrow$ Suggestion** pipeline, OurVerse ensures a privacy-first, scalable, and deeply meaningful relationship intelligence system.
