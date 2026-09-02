# AntFinserv Cockpit CRM — Progressive Web App (PWA) & Local COM Bridge
**Entity:** AntFinserv.com | AMFI-Registered Mutual Fund Distributor (ARN-94204)  
**Core Domain:** Wealth Management (Mutual Funds, LAMF), Protection (Health Family Floaters, Motor, Term), and B2B MSME Acquisition Pipeline.

---

## 1. Executive Summary & Architecture Overview
This project transforms the master desktop CRM (ANTFINSERV COCKPIT CRM.xlsm) into a modern, offline-first Progressive Web App (PWA) backed by a 100% free-tier cloud database (Supabase PostgreSQL) and a bidirectional Local Python Bridge Daemon (Windows COM / pywin32).

### Core Pillars:
1. **Zero Recurring SaaS Cost (\/month):** Built on Vite + React + TypeScript + Tailwind CSS (deployable on Vercel or Cloudflare Pages) + Supabase Free Tier + Local COM Daemon.
2. **Zero File-Locking Conflicts:** The local bridge attaches in-memory to the running Excel instance via Windows COM (win32com.client), allowing seamless two-way sync without file lock errors.
3. **Offline-First Resilience:** Pre-seeded with 156+ live active SIP folios, B2B merchant leads, and protection policies in IndexedDB. Works completely offline on mobile and desktop.
4. **Mobile Policy Upload & Document Capture:** Mobile camera/PDF document upload that automatically extracts Insurer, Plan, Policy No, Sum Insured, Net Premium, Renewal Date, and Covered Family Members with DOBs.
5. **Verified Business Rule Engines:**
   - **The 4-Day SIP Shield:** Pre-debit alerts on `Date + 4` with calendar-safe month-end rollover (28th-31st).
   - **Friday Weekend Offset Guardrail:** Scans Saturday (+1), Sunday (+2), Monday (+3), and Tuesday (+4) on Fridays to beat weekend banking cutoffs.
   - **Multi-SIP Client Grouping:** Consolidates multiple schemes debited on the same day for an investor into ONE message with itemized breakdown.
   - **Celebration Radar:** Prioritizes Primary Client personal birthday wishes and generates relationship-tailored family greetings (Spouse, Child) with real Unicode emojis (🎂, ✨, 🙏).
   - **Native WhatsApp Router:** Generates verified `https://api.whatsapp.com/send?phone=...` links with AMFI MFD ARN-94204 compliance footer.

---

## 2. Directory Structure
\\\
antfinserv-cockpit-pwa/
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Top bar, live clock, ARN badge, online/offline pill
│   │   ├── MobileBottomNav.tsx     # Native thumb navigation bar for smartphones
│   │   ├── QuickActionSheet.tsx    # Bottom drawer for Quick Add (+) button
│   │   ├── DashboardCockpit.tsx    # 4 Executive KPI cards matching Excel Dashboard
│   │   ├── SipShieldTab.tsx        # 4-Day SIP Shield with Friday simulator
│   │   ├── CelebrationsTab.tsx     # Birthday milestones & confetti greetings
│   │   ├── SipPortfolioManager.tsx # 156+ active SIP table & filter buckets
│   │   ├── LeadPipelineManager.tsx # B2B MSME Kanban & table pipeline
│   │   ├── ProtectionVault.tsx     # Relational insurance matrix & expiry tracker
│   │   ├── UploadPolicyModal.tsx   # Mobile document scanner & field extractor
│   │   ├── AddSipModal.tsx         # Mobile SIP mandate creation
│   │   ├── AddLeadModal.tsx        # Mobile B2B lead capture
│   │   ├── GlobalSearch.tsx        # Omni-search across Name, PAN, Mobile, Policy
│   │   ├── SettingsModal.tsx       # Supabase config & bridge status
│   │   └── InstallPrompt.tsx       # PWA home screen installation banner
│   ├── lib/
│   │   ├── sipShieldEngine.ts      # The 4-Day SIP Shield algorithm
│   │   ├── celebrationEngine.ts    # Primary vs Dependent birthday logic
│   │   ├── whatsAppRouter.ts       # Indian phone cleaning & deep-linking
│   │   ├── policyParser.ts         # PDF.js & regex document extraction
│   │   ├── indexedDB.ts            # Offline local storage & outbox queue
│   │   └── supabase.ts             # Cloud sync & real-time client
│   ├── types/
│   │   └── index.ts                # TypeScript data contracts
│   ├── data/
│   │   └── initialData.ts          # Pre-loaded 156 live SIPs from CRM workbook
│   ├── App.tsx                     # Master app container & routing
│   ├── main.tsx                    # React mount & Service Worker registration
│   └── index.css                   # Tailwind styles & luxury glassmorphism
├── public/
│   ├── manifest.json               # Web App Manifest
│   ├── sw.js                       # Service worker caching engine
│   └── logo.jpeg                   # Official AntFinserv logo
├── supabase/
│   ├── schema.sql                  # PostgreSQL DDL with RLS & indexes
│   └── seed.sql                    # SQL seed data from CRM workbook
├── bridge-daemon/
│   ├── bridge_daemon.py            # Local COM bridge daemon
│   ├── requirements.txt            # Python dependencies (pywin32, watchdog)
│   ├── run_bridge.bat              # 1-click batch launcher
│   └── test_com_bridge.py          # Diagnostic COM connection test
├── package.json
├── tsconfig.json
└── vite.config.ts
\\\

---

## 3. Quick Start Instructions for Mentor

### Run the PWA:
1. Open terminal in this directory:
   \\\ash
   npm install
   npm run dev
   \\\
2. Open \http://localhost:3000\ in any browser (or on your smartphone on the same Wi-Fi network).

### Run the Local Windows COM Bridge:
1. Navigate to \ridge-daemon/\
2. Double-click \un_bridge.bat\
3. It will automatically bind to the active \ANTFINSERV COCKPIT CRM.xlsm\ workbook and synchronize leads & policies in real time.

---
*Created for AntFinserv.com | AMFI Regd. Mutual Fund Distributor ARN-94204*
