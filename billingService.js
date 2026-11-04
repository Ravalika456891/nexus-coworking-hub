/**
 * billingService.js - GST-Compliant Invoicing, Numbering, Duplicate Prevention & Tax Calculations
 * Server-side Billing & Invoice Service for Nexus Hub.
 *
 * Rules:
 * 1. Financial Year Invoice Numbering: INV/YYYY-YY/XXXX (consecutive, unique, never reused).
 * 2. Duplicate Invoice Prevention: unique check on (startupId, serviceKey, billingPeriod).
 * 3. GST Calculation:
 *    - Intra-State (State code 29 - Karnataka): CGST 9% + SGST 9%
 *    - Inter-State (State code != 29): IGST 18%
 *    - SAC Code: 997212
 * 4. Statuses: Paid, Pending, Overdue (auto when past dueDate), Void.
 * 5. Admin Void: Sets status = 'Void', records reason & audit log, never hard-deletes.
 */

const SELLER_INFO = {
  legalName: 'Nexus Hub Co-Working & Incubation Spaces LLP',
  tradeName: 'Nexus Hub Co-Working',
  gstin: '29AAACN8820M1Z5',
  stateCode: '29',
  stateName: 'Karnataka',
  address: 'Level 4-6, Nexus Tower, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
  email: 'billing@nexushub.io',
  phone: '+91 80 4920 8800',
  pan: 'AAACN8820M',
  sacCode: '997212'
};

const AUDIT_LOGS = [];

/**
 * Determine Financial Year string (e.g. "2026-27") for a given date
 */
function getFinancialYear(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  if (month >= 4) {
    // April to December
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    // January to March
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}

/**
 * Generate next consecutive invoice number based on existing invoices
 * Format: INV/YYYY-YY/0001
 */
function generateNextInvoiceNumber(existingInvoices = [], dateStr = null) {
  const fy = getFinancialYear(dateStr);
  const prefix = `INV/${fy}/`;

  let maxSeq = 0;
  existingInvoices.forEach(inv => {
    if (!inv || !inv.id) return;
    if (inv.id.startsWith(prefix)) {
      const numPart = parseInt(inv.id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    } else {
      // Also check legacy formats like INV-2026-080
      const match = inv.id.match(/INV[-/](?:2026(?:-27)?)[-/](\d+)/);
      if (match) {
        const numPart = parseInt(match[1], 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Convert number to Indian Rupees words
 * e.g. 29500 -> "Rupees Twenty-Nine Thousand Five Hundred Only"
 */
function numberToWordsIndian(num) {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Rupees Zero Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(val) {
    if (val < 20) return a[val];
    const tens = b[Math.floor(val / 10)];
    const ones = a[val % 10];
    return ones ? `${tens} ${ones}` : tens;
  }

  function convertThreeDigits(val) {
    const hundred = Math.floor(val / 100);
    const rest = val % 100;
    let res = '';
    if (hundred > 0) {
      res += `${a[hundred]} Hundred`;
      if (rest > 0) res += ' ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  if (crore > 0) words += `${convertThreeDigits(crore)} Crore `;
  if (lakh > 0) words += `${convertThreeDigits(lakh)} Lakh `;
  if (thousand > 0) words += `${convertThreeDigits(thousand)} Thousand `;
  if (remainder > 0) words += `${convertThreeDigits(remainder)} `;

  return `Rupees ${words.trim()} Only`;
}

/**
 * Calculate GST based on buyer GSTIN (intra-state vs inter-state)
 */
function calculateGST(taxableAmount, buyerGstin = '', buyerStateCode = null) {
  const base = Math.round(Number(taxableAmount) || 0);
  let stateCode = buyerStateCode;

  if (!stateCode && buyerGstin && buyerGstin.length >= 2) {
    stateCode = buyerGstin.substring(0, 2);
  }

  // Default to Seller state (29 - Karnataka) if not specified
  stateCode = stateCode || SELLER_INFO.stateCode;

  const isIntraState = stateCode === SELLER_INFO.stateCode; // 29 === 29

  if (isIntraState) {
    const cgstRate = 9;
    const sgstRate = 9;
    const cgstAmount = Math.round(base * 0.09);
    const sgstAmount = Math.round(base * 0.09);
    const totalGst = cgstAmount + sgstAmount;
    return {
      taxType: 'INTRA_STATE',
      stateCode,
      placeOfSupply: 'Karnataka (29)',
      cgstRate: 9,
      cgstAmount,
      sgstRate: 9,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      totalGst,
      totalAmount: base + totalGst
    };
  } else {
    const igstRate = 18;
    const igstAmount = Math.round(base * 0.18);
    return {
      taxType: 'INTER_STATE',
      stateCode,
      placeOfSupply: `State Code ${stateCode}`,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 18,
      igstAmount,
      totalGst: igstAmount,
      totalAmount: base + igstAmount
    };
  }
}

/**
 * Validate unique invoice constraint: (customer, service, billing period)
 */
function checkDuplicateInvoice(existingInvoices, startupId, serviceDesc, billingPeriod) {
  if (!existingInvoices || !Array.isArray(existingInvoices)) return { isDuplicate: false, existingInvoice: null };
  const targetKey = (serviceDesc || 'workspace').replace(/\s+/g, ' ').trim().toLowerCase();

  const found = existingInvoices.find(inv => {
    if (inv.status === 'Void' || inv.status === 'Cancelled') return false;
    if (inv.startupId !== startupId) return false;
    if (inv.billingPeriod !== billingPeriod) return false;

    const invDesc = (inv.lineItems && inv.lineItems.length > 0)
      ? inv.lineItems[0].desc.replace(/\s+/g, ' ').trim().toLowerCase()
      : (inv.description || inv.serviceKey || 'workspace').toLowerCase();

    return invDesc === targetKey || invDesc.includes(targetKey) || targetKey.includes(invDesc);
  });

  if (!found) {
    return {
      isDuplicate: false,
      existingInvoice: null,
      existingInvoiceId: null
    };
  }

  const result = Object.assign(found, {
    isDuplicate: true,
    existingInvoice: found,
    existingInvoiceId: found.invoiceNumber || found.id
  });
  return result;
}

/**
 * Compute auto-status (e.g. auto 'Overdue' when past due date)
 */
function evaluateInvoiceStatus(invoice, todayStr = null) {
  if (!invoice) return 'Pending';
  if (invoice.status === 'Paid' || invoice.status === 'Void' || invoice.status === 'Cancelled') {
    return invoice.status;
  }

  let istToday = todayStr;
  if (!istToday) {
    istToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  if (invoice.dueDate && invoice.dueDate < istToday) {
    return 'Overdue';
  }

  return invoice.status || 'Pending';
}

/**
 * Void an existing invoice (Admin-only with reason)
 */
function voidInvoice(invoice, reason, userRole, performedBy = 'Administrator') {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'finance_admin' || userRole === 'incubator_admin';
  if (!isAdmin) {
    return { success: false, message: 'Forbidden: Only staff or administrator can void invoices.' };
  }

  if (!reason || String(reason).trim().length < 5) {
    return { success: false, message: 'A specific reason (minimum 5 characters) is required to void an invoice.' };
  }

  if (invoice.status === 'Void') {
    return { success: false, message: `Invoice #${invoice.id} is already void.` };
  }

  const oldStatus = invoice.status;
  invoice.status = 'Void';
  invoice.voidReason = String(reason).trim();
  invoice.voidedAt = new Date().toISOString();
  invoice.voidedBy = performedBy;

  // Add to audit trail
  const auditEntry = {
    id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action: 'VOID_INVOICE',
    entityType: 'invoice',
    entityId: invoice.id,
    performedBy,
    userRole,
    oldValue: { status: oldStatus },
    newValue: { status: 'Void', reason: invoice.voidReason },
    note: `Invoice ${invoice.id} voided: ${invoice.voidReason}`
  };
  AUDIT_LOGS.unshift(auditEntry);

  return { success: true, invoice, auditEntry };
}

/**
 * Validate GSTIN format
 */
function validateGSTIN(gstin) {
  if (!gstin || typeof gstin !== 'string') return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.trim().toUpperCase());
}

/**
 * Configurable TDS Sections & Classification Engine
 * Note: TDS is applied strictly on Base Amount (excluding GST).
 */
const TDS_CONFIG = {
  sections: [
    {
      code: '194-I_building',
      section: 'Section 194-I',
      nature: 'Rent of Land, Building or Furniture',
      ratePercent: 10,
      thresholdAnnual: 240000,
      description: 'Standard 10% TDS on commercial office rent'
    },
    {
      code: '194-I_machinery',
      section: 'Section 194-I',
      nature: 'Rent of Plant & Machinery / Equipment',
      ratePercent: 2,
      thresholdAnnual: 240000,
      description: '2% TDS for co-working equipment and infrastructure'
    },
    {
      code: '194-C_company',
      section: 'Section 194-C',
      nature: 'Contractual Facility Services (Company)',
      ratePercent: 2,
      thresholdAnnual: 100000,
      description: '2% TDS on service charges for corporate entities'
    },
    {
      code: '194-J_tech',
      section: 'Section 194-J',
      nature: 'Fees for Technical / Incubation Services',
      ratePercent: 2,
      thresholdAnnual: 30000,
      description: '2% TDS for software, incubation and technical advisory'
    }
  ],
  quarters: ['Q1 (Apr - Jun)', 'Q2 (Jul - Sep)', 'Q3 (Oct - Dec)', 'Q4 (Jan - Mar)']
};

/**
 * Calculate TDS on base taxable amount (strictly excluding GST)
 */
function calculateTDS(baseAmount, sectionCode = '194-I_building') {
  const sec = TDS_CONFIG.sections.find(s => s.code === sectionCode) || TDS_CONFIG.sections[0];
  const rate = sec.ratePercent;
  const tdsAmount = Math.round((baseAmount * rate) / 100);
  return {
    sectionCode: sec.code,
    section: sec.section,
    nature: sec.nature,
    ratePercent: rate,
    baseAmount,
    tdsAmount,
    netPayableAfterTDS: Math.max(0, baseAmount - tdsAmount)
  };
}

/**
 * Calculate Net Payable for an invoice after applying credit notes & approved TDS
 */
function calculateNetPayable(invoice, creditNotes = []) {
  if (!invoice) return { invoiceTotal: 0, appliedCreditNotes: [], totalCreditsApplied: 0, approvedTdsAmount: 0, netPayable: 0 };
  const targetId = invoice.id;
  const targetNo = invoice.invoiceNumber;
  const appliedNotes = (creditNotes || []).filter(cn => cn.targetInvoiceId === targetId || cn.targetInvoiceNumber === targetNo || (cn.invoiceRef && (cn.invoiceRef === targetId || cn.invoiceRef === targetNo)));
  const totalCreditsApplied = appliedNotes.reduce((sum, cn) => sum + (cn.amount || 0), 0);
  const approvedTdsAmount = (invoice.tds && invoice.tds.status === 'Approved') ? (invoice.tds.tdsAmount || 0) : 0;
  const netPayable = Math.max(0, (invoice.total || 0) - totalCreditsApplied - approvedTdsAmount);
  return {
    invoiceTotal: invoice.total || 0,
    appliedCreditNotes: appliedNotes,
    totalCreditsApplied,
    approvedTdsAmount,
    netPayable
  };
}

/**
 * Compute Next Auto-Renew Charge
 * Adjusts against credit notes marked as 'next_invoice_adjustment'
 */
function calculateNextAutoRenewCharge(basePlanAmount, creditNotes = []) {
  const unadjustedNotes = (creditNotes || []).filter(cn => cn.settlementType === 'next_invoice_adjustment' && !cn.isAdjusted);
  const totalAdjustment = unadjustedNotes.reduce((sum, cn) => sum + (cn.amount || 0), 0);
  const netCharge = Math.max(0, basePlanAmount - totalAdjustment);
  return {
    standardCharge: basePlanAmount,
    adjustments: totalAdjustment,
    unadjustedNotes,
    netCharge
  };
}

/**
 * Validate PAN format and verify that characters 3-10 match GSTIN
 */
function validatePANAgainstGSTIN(pan, gstin) {
  if (!pan || typeof pan !== 'string') return { valid: false, message: 'PAN is required' };
  const cleanPAN = pan.trim().toUpperCase();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(cleanPAN)) {
    return { valid: false, message: 'Invalid PAN format. Must be 10 characters (e.g. AAACX9920M).' };
  }
  if (gstin && typeof gstin === 'string') {
    const cleanGSTIN = gstin.trim().toUpperCase();
    if (cleanGSTIN.length >= 12) {
      const extractedPAN = cleanGSTIN.substring(2, 12);
      if (extractedPAN !== cleanPAN) {
        return {
          valid: false,
          message: `PAN (${cleanPAN}) does not match characters 3-12 of GSTIN (${extractedPAN}).`
        };
      }
    }
  }
  return { valid: true, pan: cleanPAN };
}

/**
 * Generate GSTR-1 Compliant CSV Export
 */
function generateGSTR1CSV(invoices) {
  const headers = [
    'GSTIN/UIN of Recipient',
    'Receiver Name',
    'Invoice Number',
    'Invoice date',
    'Invoice Value',
    'Place Of Supply',
    'Reverse Charge',
    'Applicable % of Tax Rate',
    'Invoice Type',
    'E-Commerce GSTIN',
    'Rate',
    'Taxable Value',
    'Cess Amount'
  ];

  const rows = [headers.join(',')];
  (invoices || []).forEach(inv => {
    const rate = inv.gstRatePercent || 18;
    const taxableVal = inv.baseAmount || inv.taxableAmount || Math.round((inv.total || 0) / 1.18);
    const row = [
      sanitizeCSVCell(inv.buyerDetails?.gstin || inv.gstin || '29AAACX9920M1Z4'),
      sanitizeCSVCell(inv.buyerDetails?.legalName || inv.startupName || 'Recipient'),
      sanitizeCSVCell(inv.invoiceNumber || inv.id),
      sanitizeCSVCell(inv.issueDate || '2026-10-15'),
      sanitizeCSVCell((inv.total || 0).toFixed(2)),
      sanitizeCSVCell(inv.buyerDetails?.placeOfSupply || '29-Karnataka'),
      sanitizeCSVCell('N'),
      sanitizeCSVCell(''),
      sanitizeCSVCell('Regular B2B'),
      sanitizeCSVCell(''),
      sanitizeCSVCell(rate),
      sanitizeCSVCell(taxableVal.toFixed(2)),
      sanitizeCSVCell('0.00')
    ];
    rows.push(row.join(','));
  });
  return rows.join('\n');
}

/**
 * Sanitize cell content for CSV Export to prevent formula injection (=, +, -, @)
 */
function sanitizeCSVCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Formula injection defense: prefix with single quote if starts with dangerous characters
  if (/^[\=\+\-\@\t\r]/.test(str)) {
    str = "'" + str;
  }
  // Escape internal double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

const billingService = {
  SELLER_INFO,
  AUDIT_LOGS,
  TDS_CONFIG,
  getFinancialYear,
  generateNextInvoiceNumber,
  numberToWordsIndian,
  calculateGST,
  calculateTDS,
  calculateNetPayable,
  calculateNextAutoRenewCharge,
  validatePANAgainstGSTIN,
  checkDuplicateInvoice,
  evaluateInvoiceStatus,
  voidInvoice,
  validateGSTIN,
  generateGSTR1CSV,
  sanitizeCSVCell
};

if (typeof window !== 'undefined') {
  window.billingService = billingService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = billingService;
}
