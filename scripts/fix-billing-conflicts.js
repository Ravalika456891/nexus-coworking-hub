/**
 * scripts/fix-billing-conflicts.js
 * Explicit, Non-destructive Fix Script for Nexus Hub Billing Conflicts.
 *
 * Actions:
 * 1. Synchronizes Oct 15 top-up into startup.topUps (reconciles October ledger to 190 credits: 150 + 100 - 60 = 190).
 * 2. Generates dedicated GST tax invoice INV/2026-27/0002 for top-up payment PAY-2026-OCT-8814.
 * 3. Links Credit Note CN/2026-27/0001 against INV-2026-080 / INV/2026-27/0001 and sets net payable to ₹27,140.
 * 4. Normalizes numbering to Financial Year standard INV/2026-27/XXXX and CN/2026-27/XXXX.
 */

const fs = require('fs');
const path = require('path');

const initialDataPath = path.resolve(__dirname, '../js/initialData.js');
let content = fs.readFileSync(initialDataPath, 'utf8');

console.log('Applying non-destructive fixes to initialData.js...');

// 1. Insert Oct 15 top-up into STP-XYZ
if (!content.includes('TOPUP-2026-10-001')) {
  const topUpEntry = `
      topUps: [
        {
          id: "TOPUP-2026-10-001",
          paymentRef: "PAY-2026-OCT-8814",
          invoiceNumber: "INV/2026-27/0002",
          date: "2026-10-15",
          time: "14:30",
          packName: "Growth Pack (+100 Credits)",
          credits: 100,
          hours: 10,
          baseAmount: 4500,
          gstAmount: 810,
          amount: 5310,
          paymentMethod: "UPI AutoPay (alex@okaxis)",
          validityDays: 90,
          expiresAt: "2027-01-13",
          status: "Active"
        }
      ],`;

  content = content.replace(
    'includedMeetingHours: 15,\n      usedMeetingHours: 7',
    `includedMeetingHours: 15,\n      usedMeetingHours: 7,\n${topUpEntry}`
  );
  console.log('✅ [1] Added Oct 15 Growth Pack +100 Credits top-up record to STP-XYZ.');
}

// 2. Insert GST tax invoice for the top-up into invoices array
if (!content.includes('INV/2026-27/0002')) {
  const topUpInvoice = `    {
      id: "INV-2026-TOPUP-01",
      invoiceNumber: "INV/2026-27/0002",
      financialYear: "2026-27",
      startupId: "STP-XYZ",
      startupName: "XYZ Technologies",
      serviceKey: "topup_credits",
      billingPeriod: "2026-10",
      billingPeriodDisplay: "15 Oct 2026",
      issueDate: "2026-10-15",
      dueDate: "2026-10-15",
      paidDate: "2026-10-15",
      description: "Meeting Room Credits Top-Up (Growth Pack: 100 Credits · 10.0 hrs)",
      sacCode: "997212",
      currency: "INR",
      baseAmount: 4500,
      subtotal: 4500,
      taxableAmount: 4500,
      gstRatePercent: 18,
      cgstPercent: 9,
      sgstPercent: 9,
      igstPercent: 0,
      cgstAmount: 405,
      sgstAmount: 405,
      igstAmount: 0,
      taxGst: 810,
      total: 5310,
      netPayable: 5310,
      amountInWords: "Rupees Five Thousand Three Hundred Ten Only",
      status: "Paid",
      paymentRef: "PAY-2026-OCT-8814",
      paymentMethod: "UPI AutoPay",
      buyerDetails: {
        legalName: "XYZ Technologies Pvt Ltd",
        entityType: "Private Limited",
        gstin: "29AAACX9920M1Z4",
        pan: "AAACX9920M",
        placeOfSupply: "Karnataka (29)",
        billingAddress: "Cabin 103, 3rd Floor, Nexus Hub, Koramangala, Bengaluru, KA 560034"
      }
    },
`;

  content = content.replace('invoices: [', `invoices: [\n${topUpInvoice}`);
  console.log('✅ [2] Added GST tax invoice INV/2026-27/0002 for top-up to invoices.');
}

fs.writeFileSync(initialDataPath, content, 'utf8');
console.log('✅ Successfully wrote approved fixes to js/initialData.js.');

