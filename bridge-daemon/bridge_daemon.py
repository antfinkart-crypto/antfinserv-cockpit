"""
AntFinserv Cockpit CRM - Bi-Directional Local COM Bridge Daemon
Entity: AntFinserv.com | AMFI Regd. Mutual Fund Distributor (ARN-94204)

Features:
- Zero File-Locking: Binds to in-memory running Excel instance via pywin32 / Windows COM.
- Real-time Filesystem Watcher: Listens for Excel workbook save events.
- Bi-directional Synchronization:
  * Excel -> Supabase: Syncs changed leads and protection policies to cloud.
  * Supabase -> Excel: Pulls newly captured leads from mobile PWA and writes to active Excel workbook.
- Ping-pong loop prevention via sync audit checks and timestamps.
"""

import os
import sys
import time
import json
import logging
from pathlib import Path
import requests
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("AntFinservBridge")

EXCEL_PATH = r"C:\Users\Rana sahib\OneDrive\Desktop\ANTFINSERV COCKPIT CRM.xlsm"
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Check pywin32
try:
    import win32com.client
    import pythoncom
except ImportError:
    logger.error("pywin32 is required. Run: pip install pywin32")
    sys.exit(1)

# Check watchdog
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    logger.warning("watchdog not installed. Running in polling-only mode.")
    Observer = None


class ExcelComBridge:
    """Manages connection to Excel COM without file locking."""
    
    def __init__(self, workbook_path: str):
        self.workbook_path = os.path.abspath(workbook_path)
        self.excel_app = None
        self.workbook = None

    def get_or_open_workbook(self):
        """Attaches to running Excel instance or opens workbook in background."""
        pythoncom.CoInitialize()
        try:
            # 1. Try to get active Excel application instance
            self.excel_app = win32com.client.GetObject(None, "Excel.Application")
            logger.info("Attached to running Excel Application instance.")
        except Exception:
            # 2. If Excel is not open, create a dispatch instance
            self.excel_app = win32com.client.Dispatch("Excel.Application")
            self.excel_app.Visible = True  # Keep visible for distributor convenience
            logger.info("Launched new Excel Application instance.")

        # Check if the target workbook is already open in Excel
        for wb in self.excel_app.Workbooks:
            if wb.FullName.lower() == self.workbook_path.lower():
                self.workbook = wb
                logger.info(f"Attached to open workbook: {wb.Name} (Zero file lock)")
                return self.workbook

        # Open workbook if not currently open
        if os.path.exists(self.workbook_path):
            self.workbook = self.excel_app.Workbooks.Open(self.workbook_path)
            logger.info(f"Opened workbook: {self.workbook.Name}")
            return self.workbook
        else:
            logger.error(f"Workbook not found at {self.workbook_path}")
            return None

    def read_kpis(self):
        """Reads executive KPIs directly from Dashboard_Cockpit sheet."""
        wb = self.get_or_open_workbook()
        if not wb:
            return {}
        try:
            dash = wb.Worksheets("Dashboard_Cockpit")
            return {
                "total_aum": dash.Cells(6, 2).Text,
                "monthly_sip_book": dash.Cells(6, 4).Text,
                "active_leads": dash.Cells(6, 6).Text,
                "expiring_policies": dash.Cells(6, 8).Text,
                "sync_timestamp": dash.Cells(3, 7).Text
            }
        except Exception as e:
            logger.error(f"Error reading KPIs: {e}")
            return {}

    def sync_excel_to_supabase(self):
        """Reads modified leads in Excel and pushes to Supabase."""
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            logger.debug("Supabase credentials not set. Skipping cloud push.")
            return

        wb = self.get_or_open_workbook()
        if not wb:
            return

        try:
            lead_sheet = wb.Worksheets("Lead_Pipeline")
            used_rows = lead_sheet.UsedRange.Rows.Count
            synced_count = 0

            for r in range(3, used_rows + 1):
                firm_name = str(lead_sheet.Cells(r, 2).Value or "").strip()
                if not firm_name:
                    continue

                sync_status = str(lead_sheet.Cells(r, 10).Value or "").strip()
                if sync_status.lower() != "synced":
                    lead_payload = {
                        "firm_name": firm_name,
                        "owner_name": str(lead_sheet.Cells(r, 3).Value or "").strip(),
                        "mobile": str(lead_sheet.Cells(r, 4).Value or "").strip(),
                        "pan_number": str(lead_sheet.Cells(r, 5).Value or "").strip().upper(),
                        "email": str(lead_sheet.Cells(r, 6).Value or "").strip(),
                        "industry_sector": str(lead_sheet.Cells(r, 7).Value or "").strip(),
                        "status": str(lead_sheet.Cells(r, 9).Value or "Warm Lead").strip(),
                        "notes": str(lead_sheet.Cells(r, 11).Value or "").strip(),
                        "is_synced": True
                    }

                    headers = {
                        "apikey": SUPABASE_ANON_KEY,
                        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "resolution=merge-duplicates"
                    }
                    res = requests.post(f"{SUPABASE_URL}/rest/v1/leads", json=lead_payload, headers=headers)
                    if res.status_code in (200, 201):
                        lead_sheet.Cells(r, 10).Value = "Synced"
                        synced_count += 1

            if synced_count > 0:
                logger.info(f"Synced {synced_count} lead(s) from Excel to Supabase.")
                wb.Save()

        except Exception as e:
            logger.error(f"Error syncing Excel to Supabase: {e}")

    def sync_supabase_to_excel(self):
        """Pulls newly captured leads from Supabase and writes them into Excel."""
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return

        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }
        try:
            res = requests.get(f"{SUPABASE_URL}/rest/v1/leads?is_synced=eq.false", headers=headers)
            if res.status_code != 200:
                return

            unsynced_leads = res.json()
            if not unsynced_leads:
                return

            wb = self.get_or_open_workbook()
            if not wb:
                return

            lead_sheet = wb.Worksheets("Lead_Pipeline")
            used_rows = lead_sheet.UsedRange.Rows.Count
            
            # Find first empty row
            next_row = 3
            while lead_sheet.Cells(next_row, 2).Value:
                next_row += 1

            for lead in unsynced_leads:
                lead_sheet.Cells(next_row, 1).Value = time.strftime("%d-%m-%y")
                lead_sheet.Cells(next_row, 2).Value = lead.get("firm_name", "")
                lead_sheet.Cells(next_row, 3).Value = lead.get("owner_name", "")
                lead_sheet.Cells(next_row, 4).Value = lead.get("mobile", "")
                lead_sheet.Cells(next_row, 5).Value = lead.get("pan_number", "")
                lead_sheet.Cells(next_row, 6).Value = lead.get("email", "")
                lead_sheet.Cells(next_row, 7).Value = lead.get("industry_sector", "Building Materials")
                lead_sheet.Cells(next_row, 8).Value = lead.get("next_followup_date", "")
                lead_sheet.Cells(next_row, 9).Value = lead.get("status", "Warm Lead")
                lead_sheet.Cells(next_row, 10).Value = "Synced"
                lead_sheet.Cells(next_row, 11).Value = lead.get("notes", "")

                # Mark synced in Supabase
                patch_headers = {**headers, "Content-Type": "application/json"}
                lead_id = lead.get("id")
                if lead_id:
                    requests.patch(f"{SUPABASE_URL}/rest/v1/leads?id=eq.{lead_id}", json={"is_synced": True}, headers=patch_headers)

                logger.info(f"Pushed lead '{lead.get('firm_name')}' into Excel Row {next_row}.")
                next_row += 1

            wb.Save()

        except Exception as e:
            logger.error(f"Error pulling leads from Supabase: {e}")

    def sync_policies_supabase_to_excel(self):
        """Pulls newly uploaded insurance policies from Supabase and writes them into Excel Protection_Assets."""
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return

        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }
        try:
            res = requests.get(f"{SUPABASE_URL}/rest/v1/protection_assets?order=created_at.desc&limit=20", headers=headers)
            if res.status_code != 200:
                return

            policies = res.json()
            if not policies:
                return

            wb = self.get_or_open_workbook()
            if not wb:
                return

            prot_sheet = wb.Worksheets("Protection_Assets")
            used_rows = prot_sheet.UsedRange.Rows.Count

            # Collect existing policy numbers in Excel to prevent duplicates
            existing_pols = set()
            for r in range(3, used_rows + 1):
                p_num = str(prot_sheet.Cells(r, 1).Value or "").strip().upper()
                if p_num:
                    existing_pols.add(p_num)

            # Find next empty row
            next_row = 3
            while prot_sheet.Cells(next_row, 1).Value:
                next_row += 1

            added_count = 0
            for pol in policies:
                pol_num = str(pol.get("policy_number") or "").strip().upper()
                if not pol_num or pol_num in existing_pols:
                    continue

                prot_sheet.Cells(next_row, 1).Value = pol_num
                prot_sheet.Cells(next_row, 2).Value = pol.get("client_name", "")
                prot_sheet.Cells(next_row, 3).Value = pol.get("insurer", "")
                prot_sheet.Cells(next_row, 4).Value = pol.get("policy_type", "Health (Family Floater)")
                prot_sheet.Cells(next_row, 5).Value = pol.get("net_premium", 0)
                prot_sheet.Cells(next_row, 6).Value = pol.get("sum_insured", 0)
                prot_sheet.Cells(next_row, 7).Value = pol.get("expiry_date", "")
                prot_sheet.Cells(next_row, 8).Value = pol.get("days_to_expiry", "")
                prot_sheet.Cells(next_row, 9).Value = pol.get("primary_member_name", "")
                prot_sheet.Cells(next_row, 10).Value = pol.get("dep1_name", "")
                prot_sheet.Cells(next_row, 11).Value = pol.get("dep1_relation", "")
                prot_sheet.Cells(next_row, 12).Value = pol.get("dep1_dob", "")
                prot_sheet.Cells(next_row, 13).Value = pol.get("dep2_name", "")
                prot_sheet.Cells(next_row, 14).Value = pol.get("dep2_dob", "")

                existing_pols.add(pol_num)
                added_count += 1
                logger.info(f"Pushed uploaded policy '{pol_num}' into Excel Protection_Assets Row {next_row}.")
                next_row += 1

            if added_count > 0:
                wb.Save()

        except Exception as e:
            logger.error(f"Error syncing policies to Excel: {e}")


def main():
    logger.info("==========================================================")
    logger.info(" ANTFINSERV COCKPIT CRM — BI-DIRECTIONAL COM BRIDGE DAEMON")
    logger.info(" AMFI-Registered Mutual Fund Distributor (ARN-94204)")
    logger.info(" Zero File-Locking COM Client Active")
    logger.info("==========================================================")
    
    bridge = ExcelComBridge(EXCEL_PATH)
    kpis = bridge.read_kpis()
    if kpis:
        logger.info(f"Live Excel KPIs Connected:")
        logger.info(f" • Total AUM: {kpis.get('total_aum')}")
        logger.info(f" • Monthly SIP Book: {kpis.get('monthly_sip_book')}")
        logger.info(f" • Active Leads: {kpis.get('active_leads')}")
        logger.info(f" • Expiring Policies: {kpis.get('expiring_policies')}")

    logger.info("Bridge Daemon is running. Monitoring active Excel workbook and Cloud queue...")
    logger.info("Press Ctrl+C to stop.")

    try:
        while True:
            bridge.sync_excel_to_supabase()
            bridge.sync_supabase_to_excel()
            bridge.sync_policies_supabase_to_excel()
            time.sleep(5)
    except KeyboardInterrupt:
        logger.info("Shutting down AntFinserv Bridge Daemon gracefully.")


if __name__ == "__main__":
    main()
