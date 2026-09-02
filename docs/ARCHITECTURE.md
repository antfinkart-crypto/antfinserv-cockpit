# ANTFINSERV WEALTH OS (ANTOS) — MASTER ARCHITECTURE
**Architecture Version:** 1.0  
**Target Platform:** Web, PWA, Mobile, Desktop, Offline-First

---

## 1. High-Level Architectural Flow
```
                    +---------------------------------------+
                    |                 ANTOS                 |
                    |          AI OPERATING SYSTEM          |
                    +---------------------------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |          ANTFINSERV COCKPIT           |
                    |   Wealth & Business Operating System  |
                    +---------------------------------------+
                                        |
      +-------------------+-------------+-------------+--------------------+
      |                   |                           |                    |
      v                   v                           v                    v
+---------------+ +-------------------+       +---------------+   +------------------+
|  Client 360   | | Mutual Fund Intel |       |   Insurance   |   |   Acquisition    |
| & Family CRM  | | & Portfolio X-Ray |       | Intelligence  |   | & Content Studio |
+---------------+ +-------------------+       +---------------+   +------------------+
      |                   |                           |                    |
      +-------------------+-------------+-------------+--------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |       Unified Service Layer           |
                    |  (Provider Pattern Abstractions)      |
                    +---------------------------------------+
                         |                     |
            +------------+-------+      +------+-------------+
            |                    |      |                    |
            v                    v      v                    v
     [Local IndexedDB]     [Supabase] [Local COM Bridge]  [WhatsApp Router]
     (Offline-First PWA)  (Cloud DB)  (Excel Sync)        (Click-to-Chat)
```

---

## 2. Core Architectural Principles
1. **Client / Family Centricity:** The central primary key of the entire system is the Client / Household. Mutual Funds, SIPs, Insurance Policies, Home Loans, Documents, Tasks, and Opportunities attach to the client.
2. **Provider Abstraction Layer:** All external integrations (Market Data, OCR, WhatsApp, Document Storage, Portfolio Ingestion) are hidden behind abstract service interfaces. Free local/mock providers operate by default with zero monthly SaaS costs.
3. **Human-in-the-Loop Advisory:**
   - WhatsApp messages are generated in preview/edit modals and dispatched via Click-to-Chat; the advisor proofreads and manually taps SEND.
   - Portfolio X-Ray and switching analyses generate analytical flags (Green, Amber, Red) for Advisor Review, never autonomous black-box trading.
4. **Zero File-Locking Bridge:** The transitional Windows COM bridge binds in-memory to running Excel instances, ensuring no sharing violations or locked file errors.
5. **Brand Integrity & Content Safety:** Strict rules prevent AI modules from hallucinating returns, interest rates, or regulatory guarantees.
