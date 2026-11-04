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
  if (!existingInvoices || !Array.isArray(existingInvoices)) return null;
  const targetKey = (serviceDesc || 'workspace').replace(/\s+/g, ' ').trim().toLowerCase();

  return existingInvoices.find(inv => {
    if (inv.status === 'Void' || inv.status === 'Cancelled') return false;
    if (inv.startupId !== startupId) return false;
    if (inv.billingPeriod !== billingPeriod) return false;

    const invDesc = (inv.lineItems && inv.lineItems.length > 0)
      ? inv.lineItems[0].desc.replace(/\s+/g, ' ').trim().toLowerCase()
      : 'workspace';

    return invDesc === targetKey || invDesc.includes(targetKey) || targetKey.includes(invDesc);
  });
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
  getFinancialYear,
  generateNextInvoiceNumber,
  numberToWordsIndian,
  calculateGST,
  checkDuplicateInvoice,
  evaluateInvoiceStatus,
  voidInvoice,
  validateGSTIN,
  sanitizeCSVCell
};

if (typeof window !== 'undefined') {
  window.billingService = billingService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = billingService;
}
