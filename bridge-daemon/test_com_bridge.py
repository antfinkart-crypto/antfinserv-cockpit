import os
import sys
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
from bridge_daemon import ExcelComBridge, EXCEL_PATH

print("Testing Windows COM Client connection to AntFinserv Excel Workbook...")
bridge = ExcelComBridge(EXCEL_PATH)
kpis = bridge.read_kpis()

if kpis:
    print("\n[SUCCESS] Live Excel COM Bridge Connected:")
    for k, v in kpis.items():
        print(f"  • {k}: {v}")
else:
    print("[ERROR] Could not read KPIs from workbook.")
