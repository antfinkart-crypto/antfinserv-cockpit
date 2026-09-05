/**
 * ANTOS Claims Initial Document Checklists by Insurance Vertical
 * Practical Indian insurer claim submission checklists for advisors to share directly with clients.
 */

export interface ClaimChecklistItem {
  id: string;
  title: string;
  description: string;
  mandatory: boolean;
  category: 'IDENTITY_KYC' | 'MEDICAL_HOSPITAL' | 'VEHICLE_POLICE' | 'PROPERTY_FIRE' | 'DEATH_LEGAL' | 'FINANCIAL_NEFT';
}

export interface ProductClaimsChecklist {
  vertical: 'HEALTH' | 'MOTOR' | 'LIFE' | 'HOME_PROPERTY';
  claimSubtype: string;
  summary: string;
  intimationTimeline: string;
  items: ClaimChecklistItem[];
  whatsappTemplate: (clientName: string, policyNumber: string, insurerName: string) => string;
}

export const CLAIMS_CHECKLISTS: Record<string, ProductClaimsChecklist> = {
  health_reimbursement: {
    vertical: 'HEALTH',
    claimSubtype: 'Reimbursement Claim (Hospitalization & Daycare)',
    summary: 'Required documents when treatment was undertaken at a non-network hospital or reimbursement is claimed post-discharge.',
    intimationTimeline: 'Intimate within 24 hours of emergency admission or 48 hours prior to planned admission.',
    items: [
      {
        id: 'h1',
        title: 'Duly Filled & Signed Claim Form (Part A & Part B)',
        description: 'Part A completed and signed by Proposer; Part B completed, signed, and stamped by Hospital Treating Doctor & Medical Superintendent.',
        mandatory: true,
        category: 'MEDICAL_HOSPITAL'
      },
      {
        id: 'h2',
        title: 'Original Discharge Summary / Card',
        description: 'Must explicitly mention Admission Date & Time, Discharge Date & Time, Final Diagnosis, Clinical Course in Hospital, and Discharge Advice.',
        mandatory: true,
        category: 'MEDICAL_HOSPITAL'
      },
      {
        id: 'h3',
        title: 'Original Itemized Final Hospital Bill',
        description: 'Break-up of Room Rent, Nursing, Doctor Consultations, OT Charges, Medicine Costs, and Investigation Charges with Bill Number.',
        mandatory: true,
        category: 'MEDICAL_HOSPITAL'
      },
      {
        id: 'h4',
        title: 'Original Paid Receipts with Serial Numbers',
        description: 'Stamped advance receipts and final settlement receipt acknowledging payment received from client.',
        mandatory: true,
        category: 'FINANCIAL_NEFT'
      },
      {
        id: 'h5',
        title: 'All Diagnostic / Laboratory / Radiology Reports',
        description: 'Original Blood tests, X-Rays, ECG, CT Scan, MRI, Histopathology / Biopsy reports supporting the ailment and treatment.',
        mandatory: true,
        category: 'MEDICAL_HOSPITAL'
      },
      {
        id: 'h6',
        title: 'Doctor First Consultation Prescription',
        description: 'Pre-admission consultation paper by treating doctor recommending admission.',
        mandatory: true,
        category: 'MEDICAL_HOSPITAL'
      },
      {
        id: 'h7',
        title: 'Pharmacy Bills with Doctor Prescriptions',
        description: 'Itemized medicine cash memos corresponding to medications prescribed in Indoor Case Papers or Discharge Summary.',
        mandatory: true,
        category: 'MEDICAL_HOSPITAL'
      },
      {
        id: 'h8',
        title: 'Cancelled Cheque of Proposer with Printed Name',
        description: 'For direct NEFT claim disbursement into proposer bank account (or bank passbook copy attested by bank).',
        mandatory: true,
        category: 'FINANCIAL_NEFT'
      },
      {
        id: 'h9',
        title: 'Proposer & Patient KYC (Aadhaar & PAN)',
        description: 'Government photo ID and PAN card copy of proposer (mandatory for all claims above ₹1 Lakh).',
        mandatory: true,
        category: 'IDENTITY_KYC'
      },
      {
        id: 'h10',
        title: 'Implant Invoice / Sticker (if applicable)',
        description: 'Required for cardiac stents, orthopaedic implants, lens replacement, or robotic surgical consumables.',
        mandatory: false,
        category: 'MEDICAL_HOSPITAL'
      }
    ],
    whatsappTemplate: (clientName, polNo, insurer) => 
`Dear ${clientName},
Greetings from AntFinServ (ARN-94204).

To process your Health Insurance Reimbursement Claim under ${insurer} Policy #${polNo}, please keep the following original documents ready:

1. Duly signed Claim Form (Part A & Hospital Part B)
2. Original Discharge Summary with admission & discharge timestamps
3. Original Itemized Final Hospital Bill with detailed bill break-up
4. All Original Payment Receipts acknowledging payment
5. All Diagnostic & Lab Reports (Blood, X-Ray, CT, MRI, ECG, Biopsy)
6. Treating Doctor's Pre-admission Prescription Advice
7. Pharmacy Cash Memos with Prescriptions
8. Cancelled Cheque of Proposer (with pre-printed name)
9. KYC (PAN & Aadhaar of Proposer and Patient)

We are coordinating directly with the ${insurer} claims desk to ensure speedy settlement. Please WhatsApp scanned copies first for preliminary audit.
Best regards,
AntFinServ Advisory Desk`
  },

  motor_accident_od: {
    vertical: 'MOTOR',
    claimSubtype: 'Accidental Own Damage (OD) Repair Claim',
    summary: 'Checklist for vehicle accidental damage, body repair, cashless garage approval, or reimbursement.',
    intimationTimeline: 'Intimate immediately within 24-48 hours of accident before dismantling or commencing vehicle repairs.',
    items: [
      {
        id: 'm1',
        title: 'Duly Filled & Signed Motor Claim Form',
        description: 'Stating date, exact time, location, and factual description of accident.',
        mandatory: true,
        category: 'VEHICLE_POLICE'
      },
      {
        id: 'm2',
        title: 'Original Registration Certificate (RC Book / Smart Card)',
        description: 'Clear copy of RC showing registered owner name, chassis and engine number.',
        mandatory: true,
        category: 'VEHICLE_POLICE'
      },
      {
        id: 'm3',
        title: 'Driving License of Driver at Time of Incident',
        description: 'Valid driving license of person driving the vehicle during the accident, verified for vehicle class (LMV/MCWG).',
        mandatory: true,
        category: 'IDENTITY_KYC'
      },
      {
        id: 'm4',
        title: 'Current Policy Schedule Copy',
        description: 'Showing active Own Damage cover, NCB declaration, and add-on covers (Zero Dep, Engine Protect, Consumables).',
        mandatory: true,
        category: 'VEHICLE_POLICE'
      },
      {
        id: 'm5',
        title: 'Authorized Garage Repair Estimate',
        description: 'Detailed labor and parts estimate provided by the authorized workshop surveyor.',
        mandatory: true,
        category: 'VEHICLE_POLICE'
      },
      {
        id: 'm6',
        title: 'Photographs of Damaged Vehicle & Chassis Stamp',
        description: 'Clear photos showing registration plate, damaged panels, and chassis number stamped on frame.',
        mandatory: true,
        category: 'VEHICLE_POLICE'
      },
      {
        id: 'm7',
        title: 'Police FIR / GD Entry (if Third Party involved)',
        description: 'Mandatory if accident caused injury/death to any third party, damage to public property, or major highway pile-up.',
        mandatory: false,
        category: 'VEHICLE_POLICE'
      },
      {
        id: 'm8',
        title: 'Owner Cancelled Cheque & PAN Copy',
        description: 'For direct settlement in reimbursement cases or surveyor fee payment.',
        mandatory: true,
        category: 'FINANCIAL_NEFT'
      }
    ],
    whatsappTemplate: (clientName, polNo, insurer) =>
`Dear ${clientName},
Greetings from AntFinServ (ARN-94204).

For your Motor Accidental Claim under ${insurer} Policy #${polNo}, please share the following initial documents with us / authorized workshop:

1. Duly signed Motor Claim Form
2. Vehicle Registration Certificate (RC copy)
3. Driving License of person driving at time of accident
4. Copy of Insurance Policy Schedule
5. Workshop Repair Estimate
6. Spot photos of vehicle damage showing number plate
7. Cancelled Cheque & PAN copy of vehicle owner

*Important*: Do not authorize the garage to commence dismantling or repairs before the ${insurer} surveyor completes initial spot inspection.
Best regards,
AntFinServ Advisory Desk`
  },

  life_death_claim: {
    vertical: 'LIFE',
    claimSubtype: 'Life Insurance Death Claim (Term, Endowment & ULIP)',
    summary: 'Documentation required for nominee payout upon demise of the life assured.',
    intimationTimeline: 'Intimate as soon as municipal death certificate is issued.',
    items: [
      {
        id: 'l1',
        title: 'Original Policy Bond / Document',
        description: 'The physical policy bond issued by the insurer (or indemnity bond if lost).',
        mandatory: true,
        category: 'DEATH_LEGAL'
      },
      {
        id: 'l2',
        title: 'Original Municipal Death Certificate',
        description: 'Issued by local municipal corporation, Gram Panchayat, or registrar of births and deaths.',
        mandatory: true,
        category: 'DEATH_LEGAL'
      },
      {
        id: 'l3',
        title: 'Duly Completed Death Claim Intimation Form',
        description: 'Signed by official nominee registered in policy schedule or legal heir.',
        mandatory: true,
        category: 'DEATH_LEGAL'
      },
      {
        id: 'l4',
        title: 'KYC Documents of Nominee (Aadhaar, PAN & Photo)',
        description: 'Self-attested identity and residential address proof of the registered nominee.',
        mandatory: true,
        category: 'IDENTITY_KYC'
      },
      {
        id: 'l5',
        title: 'Cancelled Cheque / Bank Statement of Nominee',
        description: 'Showing account holder name, account number, and IFSC code for direct claim proceeds credit.',
        mandatory: true,
        category: 'FINANCIAL_NEFT'
      },
      {
        id: 'l6',
        title: 'Medical Attendant Certificate & Hospital Records (if illness)',
        description: 'Doctor certificate stating cause of death and hospital discharge/death summary if hospitalized.',
        mandatory: false,
        category: 'MEDICAL_HOSPITAL'
      },
      {
        id: 'l7',
        title: 'Police FIR, Panchnama & Post-Mortem Report (if unnatural/accidental)',
        description: 'Mandatory in case of road accidents, drowning, fire, murder, suicide, or sudden unattended death.',
        mandatory: false,
        category: 'DEATH_LEGAL'
      }
    ],
    whatsappTemplate: (clientName, polNo, insurer) =>
`Dear ${clientName},
Our heartfelt condolences during this difficult time. AntFinServ (ARN-94204) is here to fully assist you in processing the life insurance claim with ${insurer} (Policy #${polNo}).

Please keep the following initial documents ready for submission:

1. Original Policy Bond / Certificate
2. Original Death Certificate (issued by Municipal Corporation)
3. Death Claim Form signed by Nominee
4. Nominee KYC (PAN, Aadhaar copy)
5. Nominee Cancelled Cheque (with pre-printed name) for NEFT
6. Hospital Death Summary / Medical Records (if demise was in hospital)
7. FIR & Post-Mortem Report (only if accident/unnatural death)

We will personally handle the filing and follow-up with ${insurer} claims committee to ensure respectful and swift settlement.
Warm regards,
AntFinServ Advisory Team`
  },

  home_property_claim: {
    vertical: 'HOME_PROPERTY',
    claimSubtype: 'Home & Property Damage Claim (Fire, Burglary, STFI/Flood)',
    summary: 'Documentation for structure damage and contents loss under Bharat Griha Raksha or Home Insurance.',
    intimationTimeline: 'Intimate immediately within 24 hours of loss occurrence.',
    items: [
      {
        id: 'p1',
        title: 'Duly Signed Property Claim Form',
        description: 'Detailing date, time, cause of loss (fire, short circuit, flood water inundation, burglary).',
        mandatory: true,
        category: 'PROPERTY_FIRE'
      },
      {
        id: 'p2',
        title: 'Detailed Inventory of Damaged Structure & Contents',
        description: 'Itemized list with date of purchase, original purchase cost, estimated repair or replacement value.',
        mandatory: true,
        category: 'PROPERTY_FIRE'
      },
      {
        id: 'p3',
        title: 'Photographs & Videos of Damaged Premises',
        description: 'High-resolution pictures taken from multiple angles before clearing debris or water.',
        mandatory: true,
        category: 'PROPERTY_FIRE'
      },
      {
        id: 'p4',
        title: 'Fire Brigade Report (for Fire claims)',
        description: 'Official report issued by municipal fire station stating cause and time of fire.',
        mandatory: false,
        category: 'PROPERTY_FIRE'
      },
      {
        id: 'p5',
        title: 'Police FIR & Final Investigation Report (for Burglary / Theft)',
        description: 'Mandatory for housebreaking, theft, or malicious property damage.',
        mandatory: false,
        category: 'VEHICLE_POLICE'
      },
      {
        id: 'p6',
        title: 'Meteorological / IMD Weather Report (for Storm / Flood / Cyclone)',
        description: 'Official weather department rainfall/cyclone advisory or newspaper cuttings confirming natural peril.',
        mandatory: false,
        category: 'PROPERTY_FIRE'
      },
      {
        id: 'p7',
        title: 'Civil Contractor Repair Estimate for Structure',
        description: 'Quotation for civil repair, waterproofing, painting, or electrical rewiring.',
        mandatory: true,
        category: 'PROPERTY_FIRE'
      },
      {
        id: 'p8',
        title: 'Original Purchase Invoices for High-Value Contents',
        description: 'Bills for TV, electronics, appliances, furniture, or jewellery.',
        mandatory: false,
        category: 'FINANCIAL_NEFT'
      },
      {
        id: 'p9',
        title: 'Policyholder KYC & Cancelled Cheque',
        description: 'PAN card, Aadhaar, and cancelled cheque for claim disbursement.',
        mandatory: true,
        category: 'FINANCIAL_NEFT'
      }
    ],
    whatsappTemplate: (clientName, polNo, insurer) =>
`Dear ${clientName},
Greetings from AntFinServ (ARN-94204).

To expedite your Home Insurance claim with ${insurer} (Policy #${polNo}), please compile the following documents:

1. Signed Property Claim Form
2. Itemized inventory list of damaged structure & household contents
3. Clear photos/videos of damage before cleaning debris
4. Repair quotation from civil contractor / authorized technicians
5. Fire Brigade report (for fire) or Police FIR (for burglary/theft)
6. Purchase bills of damaged electronic/electrical appliances
7. Insured KYC (PAN, Aadhaar) & Cancelled Cheque

Please do not dispose of or clear damaged items until the ${insurer} surveyor completes physical inspection.
Best regards,
AntFinServ Advisory Desk`
  }
};
