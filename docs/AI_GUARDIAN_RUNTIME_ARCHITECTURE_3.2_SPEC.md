# OurVerse AI Guardian Production Runtime Architecture Specification
**Milestone 3.2 Architectural Specification**  
**Document Version:** 3.0.0  
**Status:** Approved Enterprise Architecture (Architecture Only — Zero Implementation Code)

---

## Executive Summary

Milestones 3.1 (Memory Engine), 3.1.1 (Relationship Intelligence Engine), and 3.1.2 (Personality & Trust Engine) established the structural design of what the AI Guardian remembers, understands, and feels. Milestone 3.2 defines the **Complete Event-Driven Production Runtime Architecture** governing how the system operates asynchronously at enterprise scale.

The runtime architecture decouples real-time message delivery from background relationship analysis. End users experience zero latency degradation while asynchronous worker pools continuously update memories, extract habits, detect milestones, and tune Guardian identities.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LIVE SHARED UNIVERSE MESSAGING                   │
│          (Fast-Path Delivery: Message Store & Event Emitter)            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Async Events (MessageCreated)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       DISTRIBUTED EVENT BUS / QUEUE                     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐
│ Memory Worker Pool   │  │ RIE Analysis Pool    │  │ GPTE Persona Pool   │
│ • Daily Summarizer   │  │ • Habit Detector     │  │ • Directness Tuner  │
│ • Weekly Summarizer  │  │ • Milestone Extractor│  │ • Identity Updater  │
│ • Index Refresher    │  │ • Health Observer    │  │ • Receptivity Model │
└──────────────────────┘  └──────────────────────┘  └─────────────────────┘
                                     │
                                     v
┌─────────────────────────────────────────────────────────────────────────┐
│                  ENCRYPTED UNIVERSE TENANT MEMORY STORES                │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     │ Interactive Request Trigger
                                     v
┌─────────────────────────────────────────────────────────────────────────┐
│                   LIVE GUARDIAN REASONING PIPELINE                      │
│                                                                         │
│  [ Auth & Tenant Gate ] ──► [ Hybrid Memory Retrieval ]                 │
│                                           │                             │
│                                           ▼                             │
│  [ Multi-Model Router ] ◄─── [ Modular Prompt Orchestrator ]            │
│            │                              │                             │
│            ▼                              v                             │
│  [ Abstract Provider ] ──► [ 6-Stage Safety Validation ] ──► [ Response ]
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. High-Level Runtime & Event Lifecycle

### 1.1 Asynchronous Event Execution Flow
Live message transmission operates on a high-throughput, low-latency fast path. Background analysis occurs out-of-band via distributed event streams.

```
[ User Sends Message ]
          │
          ▼
[ Message Saved & Delivered to Peer ]  <─── Fast-Path Response (< 50ms)
          │
          ▼
[ Event Emitted: MessageCreated ]      <─── Asynchronous Pipeline Initiated
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Distributed Event Bus & Background Worker Pools                 │
├─────────────────────────────────────────────────────────────────┤
│ 1. Vector Indexer: Generates & stores message embedding         │
│ 2. Entity & Topic Extractor: Identifies keywords & inside jokes │
│ 3. Daily Summarizer: Aggregates day-end conversation logs       │
│ 4. Habit Detector: Checks temporal recurrence counters          │
│ 5. Milestone Classifier: Identifies key turning points          │
│ 6. RIE Updater: Recalibrates Relationship Profile               │
│ 7. GPTE Updater: Updates Guardian Identity Vector & Persona     │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
[ Guardian Knowledge & Persona Refreshed (Smarter Guardian) ]
```

---

## 2. End-to-End Live Guardian Request Pipeline

When a user initiates a direct private chat with the Guardian ($User_A \leftrightarrow Guardian$), the request passes through a 10-stage execution pipeline:

```
[ User Request ]
       │
       ▼
[ 1. Authentication Gate ]        ── Validate JWT token
       │
       ▼
[ 2. Universe Authorization ]     ── Verify membership in Universe
       │
       ▼
[ 3. Privacy & Scope Gate ]       ── Enforce SHARED vs PRIVATE_A scope
       │
       ▼
[ 4. Memory Retrieval Engine ]    ── Hybrid RAG (Vector + BM25 + Recency)
       │
       ▼
[ 5. RIE & GPTE State Hydration ] ── Fetch Profile & Guardian Identity Vector
       │
       ▼
[ 6. Prompt Orchestration ]       ── Assemble modular system blocks
       │
       ▼
[ 7. Multi-Model Router ]         ── Select optimal provider/capability
       │
       ▼
[ 8. Model Execution Layer ]      ── Abstract LLM Provider Stream
       │
       ▼
[ 9. Safety & Validation Gate ]   ── 6-Stage Response Audit
       │
       ▼
[ 10. Streaming Response ]        ── Emit to User Interface
```

---

## 3. Event-Driven Architecture Catalog

The runtime system uses an explicit schema for domain events:

| Event Type | Event Source Trigger | Downstream Worker Action |
| :--- | :--- | :--- |
| `UniverseCreated` | `UniverseInvitation` ACCEPTED | Provision Guardian identity vector, initial keys, and memory buckets. |
| `UniverseDeleted` | Account purge / Universe deletion | Execute cryptographic erasure of all associated tenant indices. |
| `MessageCreated` | Shared Universe chat event | Ingest text, trigger vector indexing, update active conversation buffer. |
| `MessageDeleted` | User deletes message | Purge matching embedding vector, queue summary recalculation. |
| `DailySummaryCreated` | End of day (00:00 UTC) | Ingest daily text summary into Weekly Summarizer input queue. |
| `WeeklySummaryCreated`| 7-day boundary | Run RIE trend analysis, check habit promotion thresholds. |
| `MonthlySummaryCreated`| 30-day boundary | Recalibrate Long-Term Relationship Profile and Milestone Timeline. |
| `MilestoneDetected` | High-significance event classifier | Promote event to permanent Relationship Narrative storage. |
| `HabitDetected` | Recurrence counter match | Update Relationship Profile habit node. |
| `RelationshipProfileUpdated`| RIE calculation cycle | Trigger GPTE Persona Matrix recalibration. |
| `GuardianPersonalityUpdated`| GPTE calculation cycle | Re-compile default Guardian system instruction prompt block. |

---

## 4. Background Worker Architecture

Workers operate as stateless, distributed micro-services scaling independently based on queue depth:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     BACKGROUND WORKER ORCHESTRATION                     │
+────────────────--------+------------------------+-----------------------+
| SUMMARIZATION POOL     | INTELLIGENCE POOL      | MAINTENANCE POOL      |
| • Daily Summarizer     | • Habit Detector       | • Memory Compressor   |
| • Weekly Summarizer    | • Milestone Extractor  | • Index Refresher     |
| • Monthly Summarizer   | • Topic & Joke Extractor| • Crypto Key Rotator  |
| • Memory Aggregator    | • Health Observer      | • Garbage Collector   |
+------------------------+------------------------+-----------------------+
| Scaling Trigger: Queue | Scaling Trigger: Msg   | Scaling Trigger: Cron |
| Backlog Depth          | Ingestion Rate         | Scheduled Windows     |
+------------------------+------------------------+-----------------------+
```

### 4.1 Orchestration & Retry Policy
- **At-Least-Once Delivery**: Workers process idempotent payloads.
- **Exponential Backoff with Jitter**: Max 5 retries on transient AI service outages ($2^n \times 100\text{ms} + \text{jitter}$).
- **Dead-Letter Queue (DLQ)**: Poison messages are routed to DLQ after 5 failed attempts for administrative inspection.

---

## 5. Guardian Reasoning Engine (GRE)

The GRE is a stateless, pure-reasoning component that combines memory, context, and privacy constraints to determine **how** a query should be answered.

```
+-----------------------------------------------------------------------+
|                    GUARDIAN REASONING ENGINE (GRE)                    |
+-----------------------------------------------------------------------+
| INPUT STREAMS                                                         |
|  1. Working Memory Context (Current Prompt)                           |
|  2. Retrieved Long-Term Shared & Private Memories                     |
|  3. Synthesized Relationship Profile (RIE Signals)                     |
|  4. Guardian Identity & Adapted Persona Vector (GPTE Signals)         |
|  5. Active Privacy & Scope Boundaries                                 |
+-----------------------------------------------------------------------+
| PROCESSING STRATEGY                                                   |
|  • Step A: Intent Classification & Query Disambiguation               |
|  • Step B: Epistemic Uncertainty Assessment (Check Evidence Density)  |
|  • Step C: Non-Attribution Enforcement (Filter User B attribution)    |
|  • Step D: Dynamic Prompt Assembly                                    |
+-----------------------------------------------------------------------+
| OUTPUT STREAM                                                         |
|  • Fully Formatted Modular System Prompt Ready for LLM Provider Stream  |
+-----------------------------------------------------------------------+
```

---

## 6. Modular Prompt Orchestrator

Instead of monolithic system prompts, the Prompt Orchestrator dynamically compiles standardized context blocks:

```
+-------------------------------------------------------------------+
| MODULAR PROMPT BLOCK STACK                                         |
+-------------------------------------------------------------------+
| Block 1: Master System & Non-Negotiable Privacy Rules (Static)    |
+-------------------------------------------------------------------+
| Block 2: Guardian Identity Vector & Stage Metadata (Dynamic)      |
+-------------------------------------------------------------------+
| Block 3: Adapted Persona Matrix (Warmth, Humor, Directness)       |
+-------------------------------------------------------------------+
| Block 4: Active Privacy Boundaries & Non-Attribution Constraints  |
+-------------------------------------------------------------------+
| Block 5: Retrieved RIE Profile, Habits & Semantic Milestones      |
+-------------------------------------------------------------------+
| Block 6: Filtered Memory Retrieval Slice (Token-Budgeted)          |
+-------------------------------------------------------------------+
| Block 7: Active Conversation Buffer & User Query                   |
+-------------------------------------------------------------------+
| Block 8: Output Format Guide (Observation/Pattern/Confidence/Rec) |
+-------------------------------------------------------------------+
```

---

## 7. Memory Retrieval Engine (Hybrid RAG)

The Memory Retrieval Engine dynamically selects search modalities based on query intent:

```
                             [ Input User Query ]
                                      │
                                      ▼
                      ┌──────────────────────────────┐
                      │    Intent Classification     │
                      └──────────────┬───────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
  [ Intent: Specific Event ] [ Intent: Emotional Trend ] [ Intent: General Chat ]
  • High BM25 Lexical Weight • High Vector Cosine Weight • High Recency Weight
  • Date & Keyword Filter    • RIE Summary Cluster Search• Active Buffer Search
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │ Temporal Recency Reranking   │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │ Token Budgeting & Deduplication│
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      [ Final Context Retrieval Slice ]
```

---

## 8. AI Provider Abstraction Layer

The application core imports abstract interfaces. Zero LLM vendor code exists inside business logic.

```
+-----------------------------------------------------------------------+
|                  AI PROVIDER ABSTRACTION INTERFACES                   |
+-----------------------------------------------------------------------+
|  • ILLMProvider           :: generateCompletion(), streamCompletion() |
|  • IEmbeddingProvider     :: generateEmbeddings(), batchEmbeddings()  |
|  • IModerationProvider    :: evaluateSafety(), checkPrivacyLeaks()    |
|  • ISpeechProvider        :: transcribeAudio(), synthesizeSpeech()    |
|  • IVisionProvider        :: analyzeMedia(), extractVisualEntities()  |
|  • ITranslationProvider   :: translateText(), detectLanguage()        |
|  • ISummarizationProvider :: compressContext(), extractEntities()     |
+-----------------------------------------------------------------------+
```

---

## 9. Multi-Model Orchestration Strategy

The runtime intelligently routes requests based on task complexity and execution speed:

```
+-----------------------------------------------------------------------+
|                       MULTI-MODEL ROUTING MATRIX                      |
+--------------------+------------------------+-------------------------+
| Task Category      | Target Model Capability| SLA Target              |
+--------------------+------------------------+-------------------------+
| Interactive Chat   | High-Speed Reasoner    | TTFT < 800ms            |
| Deep Guidance      | Deep Reasoning Model   | TTFT < 1.5s             |
| Daily Summaries    | Cost-Effective Summary | Async Background        |
| Vector Indexing    | Dense Embedding Model  | Async Background        |
| Safety Gate        | Lightweight Classifier | Execution < 100ms       |
+--------------------+------------------------+-------------------------+
```

---

## 10. Cost Optimization Strategy

1. **Hierarchical Summary Reuse**: Summaries are generated once and re-used, avoiding re-indexing raw text streams.
2. **Context-Window Pruning**: Retrieval caps results to strict token budgets (e.g. max 3,000 tokens for retrieval context).
3. **Prompt Caching**: Static blocks (System Rules, Persona Frameworks) utilize edge prompt caching.
4. **Lazy Retrieval**: Conversational turns that do not require historical memory skip RAG vector lookups.

---

## 11. Observability & Telemetry Framework

The runtime emits structured metric events to operational dashboards:

```
+-----------------------------------------------------------------------+
|                        RUNTIME TELEMETRY METRICS                      |
+-----------------------+-----------------------------------------------+
| Metric Category       | Telemetry Indicators                          |
+-----------------------+-----------------------------------------------+
| Latency Metrics       | Time-to-First-Token (TTFT), Total Generation  |
|                       | Time, Worker Queue Dwell Time.                |
| Quality Metrics       | RAG Retrieval Precision, Confidence Distribution|
|                       | (High/Med/Low ratio), Fallback Rate.          |
| Cost & Usage Metrics  | Token Consumption (Input/Output), Cache Hit   |
|                       | Rate, AI Call Dollar Cost per Universe.       |
| System Health         | Queue Depth, DLQ Event Rate, Worker Crash Rate|
+-----------------------+-----------------------------------------------+
```

---

## 12. Security & Tenant Isolation Architecture

```
+-----------------------------------------------------------------------+
|                  SECURITY & TENANT ISOLATION MODEL                    |
+-----------------------+-----------------------------------------------+
| Layer                 | Security Mechanism                            |
+-----------------------+-----------------------------------------------+
| Transport             | TLS 1.3 End-to-End                            |
| Storage Encryption    | Envelope Encryption (AES-GCM-256) per Scope   |
| Tenant Isolation      | Hard Query Filters (`where universeId = X`)   |
| Injection Guard       | Prompt Sanitization & Delimiter Escaping      |
| Access Authorization  | JWT Scope Verification per Request            |
| Audit Logging         | Immutable event logs for security auditing    |
+-----------------------+-----------------------------------------------+
```

---

## 13. 6-Stage Safety & Validation Pipeline

Every output generated by an LLM model must pass through 6 automated gates before emission:

```
[ Raw LLM Output Stream ]
           │
           ▼
[ 1. Privacy Scope Gate ]     ── Ensure no User B private memory leaked
           │
           ▼
[ 2. Non-Attribution Check ]  ── Verify private facts are un-attributed
           │
           ▼
[ 3. Honesty & Hallucination ] ── Check facts against RAG grounding context
           │
           ▼
[ 4. Neutrality Gate ]        ── Ensure Guardian takes no sides in conflict
           │
           ▼
[ 5. Policy & Boundaries ]    ── Verify no medical/legal/financial claims
           │
           ▼
[ 6. Format Validator ]       ── Confirm Observation/Pattern/Confidence format
           │
           ▼
[ Clean Safe Response ]
```

---

## 14. Scalability Architecture

- **Stateless Application Tier**: Express API servers and Reasoning Engines carry zero local session state.
- **Horizontal Pod Autoscaling (HPA)**: Worker pools scale dynamically based on Queue Message Volume ($Q_{depth}$).
- **Distributed Caching**: Redis cluster for volatile Working Memory context windows.

---

## 15. Graceful Degradation & Failure Recovery

| Failure Scenario | Fallback & Recovery Mechanism |
| :--- | :--- |
| **Primary LLM Provider Outage**| Auto-switch to secondary provider via `ILLMProviderAdapter` fallback chain. |
| **Worker Queue Backlog** | Pause non-critical monthly summarization; prioritize daily messaging events. |
| **Vector DB Degraded** | Fall back to BM25 sparse keyword & temporal recency search. |
| **Model Timeout** | Return safe fallback phrasing: *"I am currently processing your request. Please try again in a moment."* |

---

## 16. Future Extensibility Roadmap

- **Sprint 4 (Multimodal Processing)**: Ingestion of voice transcripts, shared photos, and media via `ISpeechProvider` and `IVisionProvider`.
- **Sprint 5 (Wearable & Life Sync)**: Ambient integration with shared calendars, location memories, and biometric stress indicators.

---

## 17. Production Readiness Assessment

| Readiness Category | Status | Verification Criteria |
| :--- | :--- | :--- |
| **Architectural Completeness** | APPROVED | All 17 architectural domains fully specified. |
| **Provider Independence** | APPROVED | 100% decoupled abstraction interface layer. |
| **Privacy & Security Framework**| APPROVED | Strict envelope encryption & non-attribution pipelines. |
| **Implementation Prerequisites**| READY | Ready for Milestone 4 (Implementation & LLM Integration). |

---

## Conclusion

Milestone 3.2 completes the enterprise runtime architecture for the OurVerse AI Guardian. By combining asynchronous event processing, modular prompt orchestration, hybrid RAG retrieval, multi-model routing, and a 6-stage safety pipeline, OurVerse establishes a resilient, production-ready foundation capable of supporting millions of Shared Universes for years to come.
