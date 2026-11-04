/**
 * creditService.js - Single Source of Truth for Credits, Allowances & Ledger
 * Shared server-side credit service for Nexus Hub.
 *
 * Rules:
 * 1. Stored unit: Credits. Fixed conversion: 10 credits = 1.0 hour.
 * 2. Reset per calendar month. Only bookings that start in that month debit from it.
 * 3. Bucket consumption order:
 *      1) Plan credits first (expire at month end)
 *      2) Top-up credits second (configurable validity, default 90 days)
 *      3) Overage billed third (₹1,500/hr = ₹150/credit; vs top-up ₹500/hr = ₹50/credit)
 * 4. Ledger reconciliation:
 *      openingCredits + sum(topUps) - sum(debits) + sum(refunds) = currentBalance
 * 5. Direction: USED. Color: Green (<80%), Amber (80-99%), Red (>=100%).
 */

const CREDITS_PER_HOUR = 10;
const HOURLY_OVERAGE_RATE = 1500; // ₹1,500 / hr
const CREDIT_OVERAGE_RATE = 150;  // ₹150 / credit
const HOURLY_TOPUP_RATE = 500;    // ₹500 / hr
const CREDIT_TOPUP_RATE = 50;     // ₹50 / credit
const DEFAULT_TOPUP_VALIDITY_DAYS = 90;

/**
 * Standardized Top-Up Pack Pricing Table
 * Stores explicit pack discounts, rates per 10 cr, base, GST (18%), and totals.
 */
const PACK_PRICING = [
  {
    id: 'pack_starter',
    name: 'Starter Pack',
    credits: 50,
    hours: 5.0,
    ratePer10Cr: 500,
    discountPercent: 0,
    baseAmount: 2500,
    gstRatePercent: 18,
    gstAmount: 450,
    totalAmount: 2950,
    validityDays: 90,
    tag: 'Pay As You Go'
  },
  {
    id: 'pack_growth',
    name: 'Growth Pack',
    credits: 100,
    hours: 10.0,
    ratePer10Cr: 450, // Discounted from ₹500
    discountPercent: 10,
    baseAmount: 4500,
    gstRatePercent: 18,
    gstAmount: 810,
    totalAmount: 5310, // Exactly ₹5,310 (₹4,500 base + 18% GST)
    validityDays: 90,
    tag: 'Most Popular (Save 10%)'
  },
  {
    id: 'pack_scale',
    name: 'Scale-Up Pack',
    credits: 200,
    hours: 20.0,
    ratePer10Cr: 400, // Discounted from ₹500
    discountPercent: 20,
    baseAmount: 8000,
    gstRatePercent: 18,
    gstAmount: 1440,
    totalAmount: 9440,
    validityDays: 90,
    tag: 'Best Value (Save 20%)'
  }
];

/**
 * Single Source of Truth for Plan Credit Expiry Policies
 * Generated wording is shared across Quota cards, Ledger, Modals and Alerts.
 */
const CREDIT_EXPIRY_POLICIES = {
  startup: {
    planKey: 'startup',
    planName: 'Startup Plan',
    monthlyAllowanceCredits: 150,
    monthlyAllowanceHours: 15.0,
    planCreditsRule: 'expire_at_month_end',
    planCreditsExpiryDays: null,
    planCreditsWording: 'Plan allowance resets at calendar month-end. Unused monthly hours do not rollover.',
    topUpCreditsValidityDays: 90,
    topUpCreditsWording: 'Top-up credits are valid for 90 days from purchase date across billing cycles.',
    pausedPlanRule: 'freeze_and_preserve',
    pausedPlanWording: 'When subscription is paused, unused plan credits are frozen and preserved until reactivation.'
  },
  growth: {
    planKey: 'growth',
    planName: 'Growth / Scale-up Venture',
    monthlyAllowanceCredits: 300,
    monthlyAllowanceHours: 30.0,
    planCreditsRule: 'expire_at_month_end',
    planCreditsExpiryDays: null,
    planCreditsWording: 'Plan allowance resets at calendar month-end. Unused monthly hours do not rollover.',
    topUpCreditsValidityDays: 90,
    topUpCreditsWording: 'Top-up credits are valid for 90 days from purchase date across billing cycles.',
    pausedPlanRule: 'freeze_and_preserve',
    pausedPlanWording: 'When subscription is paused, unused plan credits are frozen and preserved until reactivation.'
  },
  enterprise: {
    planKey: 'enterprise',
    planName: 'Enterprise Accelerator',
    monthlyAllowanceCredits: 600,
    monthlyAllowanceHours: 60.0,
    planCreditsRule: 'rollover_max_30_days',
    planCreditsExpiryDays: 30,
    planCreditsWording: 'Up to 50 hours rollover into next calendar month; remainder resets.',
    topUpCreditsValidityDays: 180,
    topUpCreditsWording: 'Enterprise top-up credits are valid for 180 days across billing cycles.',
    pausedPlanRule: 'freeze_and_preserve',
    pausedPlanWording: 'All credits frozen and preserved during subscription pause.'
  }
};

/**
 * Helper to calculate booking duration in hours from "HH:MM" start/end
 */
function calculateDurationHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return mins > 0 ? Number((mins / 60).toFixed(2)) : 0;
}

/**
 * Format 24h time "15:00" to 12h IST "03:00 PM"
 */
function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Format date "2026-11-03" to "03 Nov 2026"
 */
function formatDateIndian(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[monthIdx] || parts[1]} ${year}`;
}

/**
 * Format currency in Indian numbering system (e.g. ₹56,168)
 */
function formatRupees(amount) {
  const n = Math.round(Number(amount) || 0);
  return '₹' + n.toLocaleString('en-IN');
}

/**
 * Get monthly allowance and usage breakdown for a startup in a target calendar month
 *
 * @param {Object} startup Startup record
 * @param {Array} allRooms Meeting rooms with bookings
 * @param {string} targetMonth YYYY-MM (defaults to current month in IST)
 * @param {Array} topUps Array of top-up purchases
 */
function getMonthlyAllowance(startup, allRooms = [], targetMonth = null, topUps = []) {
  if (!startup) {
    startup = { id: 'STP-XYZ', name: 'XYZ Technologies', subscriptionPlan: 'Startup Plan', includedMeetingHours: 15 };
  }

  // Determine target month in IST (YYYY-MM)
  let mStr = targetMonth;
  if (!mStr) {
    const nowIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).format(new Date());
    mStr = nowIST.substring(0, 7);
  }

  const [yStr, mNumStr] = mStr.split('-');
  const year = parseInt(yStr, 10);
  const monthNum = parseInt(mNumStr, 10);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[monthNum - 1] || mStr;
  const monthLabel = `${monthShort[monthNum - 1] || mStr} ${year}`;

  // Month boundary dates
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const monthStartDate = `${mStr}-01`;
  const monthEndDate = `${mStr}-${String(daysInMonth).padStart(2, '0')}`;
  const planExpiryDate = monthEndDate;

  // Single plan record
  const planName = startup.subscriptionPlan || startup.plan || 'Startup Plan';
  const includedHours = Number(startup.includedMeetingHours !== undefined ? startup.includedMeetingHours : 15);
  const planCredits = includedHours * CREDITS_PER_HOUR;

  // Filter top-ups active in this month
  const startupTopUps = (topUps || startup.topUps || []).filter(t => {
    if (!t) return false;
    const pDate = (t.purchasedAt || t.date || '').substring(0, 10);
    const expDate = (t.expiresAt || '').substring(0, 10);
    // Active if purchased on/before month end, and expires on/after month start
    if (pDate > monthEndDate) return false;
    if (expDate && expDate < monthStartDate) return false;
    return true;
  });

  const totalTopUpCredits = startupTopUps.reduce((acc, t) => acc + (Number(t.credits) || 0), 0);
  const totalAvailableCredits = planCredits + totalTopUpCredits;
  const totalAvailableHours = Number((totalAvailableCredits / CREDITS_PER_HOUR).toFixed(1));

  // Collect all bookings starting in this month for this startup
  const monthBookings = [];
  const roomUsageMap = {};

  (allRooms || []).forEach(r => {
    (r.bookings || []).forEach(b => {
      if (!b || b.status === 'Cancelled') return;
      const isMine = (b.startupId === startup.id || (b.startupName && startup.name && b.startupName.toLowerCase() === startup.name.toLowerCase()));
      if (!isMine) return;

      // STRICT CALENDAR MONTH SEGREGATION: only bookings starting in this calendar month
      if (b.date && String(b.date).startsWith(mStr)) {
        const dur = (b.duration !== undefined && !isNaN(Number(b.duration)) && Number(b.duration) > 0)
          ? Number(b.duration)
          : calculateDurationHours(b.startTime, b.endTime);

        const bookingItem = {
          ...b,
          roomId: r.id,
          roomName: r.name,
          roomType: r.roomType || r.type || 'Meeting Space',
          duration: dur,
          credits: Math.round(dur * CREDITS_PER_HOUR)
        };

        monthBookings.push(bookingItem);

        // Aggregate room consumption
        const rName = r.name || 'Meeting Space';
        if (!roomUsageMap[rName]) {
          roomUsageMap[rName] = {
            roomId: r.id,
            name: rName,
            hours: 0,
            credits: 0,
            count: 0
          };
        }
        roomUsageMap[rName].hours += dur;
        roomUsageMap[rName].credits += Math.round(dur * CREDITS_PER_HOUR);
        roomUsageMap[rName].count += 1;
      }
    });
  });

  // Sort bookings chronologically
  monthBookings.sort((a, b) => {
    const da = `${a.date} ${a.startTime}`;
    const db = `${b.date} ${b.startTime}`;
    return da.localeCompare(db);
  });

  // Calculate consumed totals
  const totalConsumedHours = Number(monthBookings.reduce((acc, b) => acc + b.duration, 0).toFixed(1));
  const totalConsumedCredits = monthBookings.reduce((acc, b) => acc + b.credits, 0);

  // Consume buckets: 1) Plan credits first, 2) Top-up credits second, 3) Overage
  let remainingPlanCredits = planCredits;
  let remainingTopUpCredits = totalTopUpCredits;
  let overageCredits = 0;

  monthBookings.forEach(b => {
    let needed = b.credits;
    if (remainingPlanCredits >= needed) {
      remainingPlanCredits -= needed;
      b.debitedFrom = 'plan';
    } else {
      const fromPlan = remainingPlanCredits;
      needed -= fromPlan;
      remainingPlanCredits = 0;

      if (remainingTopUpCredits >= needed) {
        remainingTopUpCredits -= needed;
        b.debitedFrom = fromPlan > 0 ? 'split_plan_topup' : 'topup';
      } else {
        const fromTopUp = remainingTopUpCredits;
        needed -= fromTopUp;
        remainingTopUpCredits = 0;
        overageCredits += needed;
        b.debitedFrom = 'overage';
        b.overageCredits = needed;
      }
    }
  });

  const currentCreditBalance = remainingPlanCredits + remainingTopUpCredits;
  const currentHourBalance = Number((currentCreditBalance / CREDITS_PER_HOUR).toFixed(1));
  const overageHours = Number((overageCredits / CREDITS_PER_HOUR).toFixed(1));
  const overageFee = Math.round(overageCredits * CREDIT_OVERAGE_RATE); // ₹1,500/hr

  // Usage progress and direction: SHOW USED
  const pctUsed = totalAvailableCredits > 0
    ? Math.min(100, Math.round((totalConsumedCredits / totalAvailableCredits) * 100))
    : (totalConsumedCredits > 0 ? 100 : 0);

  // Status and color scheme: Green (<80%), Amber (80-99%), Red (>=100%)
  let status = 'normal';
  let statusColor = '#10B981'; // Green
  let statusLabel = 'On Track';

  if (pctUsed >= 100 || overageCredits > 0) {
    status = 'danger';
    statusColor = '#EF4444'; // Red
    statusLabel = 'Quota Exceeded';
  } else if (pctUsed >= 80) {
    status = 'warning';
    statusColor = '#F59E0B'; // Amber
    statusLabel = 'Approaching Limit';
  }

  // Format Room Breakdown list and verify sum
  const roomBreakdown = Object.values(roomUsageMap).map(r => ({
    ...r,
    hours: Number(r.hours.toFixed(1))
  })).sort((a, b) => b.hours - a.hours);

  // Reconciled Ledger
  const ledger = buildReconciledLedger({
    monthStr: mStr,
    monthName,
    planName,
    planCredits,
    includedHours,
    planExpiryDate,
    topUps: startupTopUps,
    bookings: monthBookings
  });

  return {
    startupId: startup.id,
    startupName: startup.name,
    planName,
    month: mStr,
    monthName,
    monthLabel,
    monthStartDate,
    monthEndDate,
    planExpiryDate,
    // Unified credit & hour metrics (10 credits = 1 hr)
    includedHours,
    planCredits,
    openingCredits: planCredits,
    totalTopUpCredits,
    topUpCredits: totalTopUpCredits,
    totalAvailableCredits,
    totalAvailableHours,
    usedCredits: totalConsumedCredits,
    consumedCredits: totalConsumedCredits,
    usedHours: totalConsumedHours,
    remainingCredits: currentCreditBalance,
    currentBalanceCredits: currentCreditBalance,
    refundedCredits: 0,
    remainingHours: currentHourBalance,
    remainingPlanCredits,
    remainingTopUpCredits,
    overageCredits,
    overageHours,
    overageFee,
    hourlyOverageRate: HOURLY_OVERAGE_RATE,
    creditOverageRate: CREDIT_OVERAGE_RATE,
    hourlyTopUpRate: HOURLY_TOPUP_RATE,
    creditTopUpRate: CREDIT_TOPUP_RATE,
    // Progress metrics (Direction: USED)
    pctUsed,
    status,
    statusColor,
    statusLabel,
    showOverageWarning: pctUsed >= 80 || overageCredits > 0,
    // Room breakdown strictly for this month
    roomBreakdown,
    bookingsCount: monthBookings.length,
    bookings: monthBookings,
    // Complete Reconciled Ledger
    ledger
  };
}

/**
 * Builds the fully reconciled ledger for a startup in a month.
 * Equation: openingCredits + sum(topUps) - sum(debits) + sum(refunds) = currentBalance
 */
function buildReconciledLedger({
  monthStr,
  monthName,
  planName,
  planCredits,
  includedHours,
  planExpiryDate,
  topUps = [],
  bookings = []
}) {
  const entries = [];
  let runningBalance = 0;

  // 1. Opening Entry: Monthly Plan Allowance
  runningBalance += planCredits;
  entries.push({
    id: `LEDGER-OPEN-${monthStr}`,
    date: `${monthStr}-01`,
    displayDate: `01 ${monthName.substring(0, 3)} ${monthStr.substring(0, 4)}`,
    time: '12:00 AM',
    displayDateTime: `01 ${monthName.substring(0, 3)} ${monthStr.substring(0, 4)}, 12:00 AM`,
    type: 'credit',
    typeLabel: 'Plan Credit',
    description: `Monthly Incubator Plan Quota Credited (${planName})`,
    bookingRef: null,
    creditsChange: planCredits,
    hoursChange: includedHours,
    creditsDisplay: `+${planCredits} credits`,
    hoursDisplay: `+${includedHours.toFixed(1)} hrs`,
    runningBalanceCredits: runningBalance,
    runningBalanceHours: Number((runningBalance / CREDITS_PER_HOUR).toFixed(1)),
    expiresAt: formatDateIndian(planExpiryDate),
    isPositive: true
  });

  // 2. Combine top-ups and bookings chronologically
  const txItems = [];

  (topUps || []).forEach(t => {
    const tDate = (t.purchasedAt || t.date || `${monthStr}-01`).substring(0, 10);
    if (tDate.startsWith(monthStr)) {
      txItems.push({
        kind: 'topup',
        sortKey: `${tDate} ${t.time || '10:00'}`,
        data: t
      });
    }
  });

  (bookings || []).forEach(b => {
    txItems.push({
      kind: 'booking',
      sortKey: `${b.date} ${b.startTime || '09:00'}`,
      data: b
    });
  });

  txItems.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  txItems.forEach(item => {
    if (item.kind === 'topup') {
      const t = item.data;
      const tCredits = Number(t.credits) || 50;
      const tHours = Number((tCredits / CREDITS_PER_HOUR).toFixed(1));
      runningBalance += tCredits;

      entries.push({
        id: t.id || `LEDGER-TOPUP-${item.sortKey.replace(/[^0-9]/g, '')}`,
        date: (t.purchasedAt || t.date || monthStr).substring(0, 10),
        displayDate: formatDateIndian((t.purchasedAt || t.date || monthStr).substring(0, 10)),
        time: formatTime12h(t.time || '10:00'),
        displayDateTime: `${formatDateIndian((t.purchasedAt || t.date || monthStr).substring(0, 10))}, ${formatTime12h(t.time || '10:00')}`,
        type: 'top-up',
        typeLabel: 'Credit Top-Up',
        description: `Extra Credit Top-Up (${t.packTitle || 'Top-Up Pack'})`,
        bookingRef: null,
        invoiceId: t.invoiceId || null,
        paymentRef: t.paymentRef || null,
        credits: tCredits,
        creditsChange: tCredits,
        hoursChange: tHours,
        creditsDisplay: `+${tCredits} credits`,
        hoursDisplay: `+${tHours.toFixed(1)} hrs`,
        runningBalanceCredits: runningBalance,
        runningBalanceHours: Number((runningBalance / CREDITS_PER_HOUR).toFixed(1)),
        expiresAt: t.expiresAt ? formatDateIndian(t.expiresAt) : '90 Days',
        isPositive: true
      });
    } else if (item.kind === 'booking') {
      const b = item.data;
      const dur = b.duration || calculateDurationHours(b.startTime, b.endTime);
      const bCredits = Math.round(dur * CREDITS_PER_HOUR);
      runningBalance = Math.max(0, runningBalance - bCredits);

      const timeRange = `${formatTime12h(b.startTime)} – ${formatTime12h(b.endTime)}`;

      entries.push({
        id: `LEDGER-BKG-${b.id}`,
        date: b.date,
        displayDate: formatDateIndian(b.date),
        time: formatTime12h(b.startTime),
        displayDateTime: `${formatDateIndian(b.date)}, ${timeRange}`,
        type: 'debit',
        typeLabel: 'Room Reservation',
        description: `Session in ${b.roomName || 'Meeting Room'} (${b.purpose || b.title || 'Team Session'})`,
        bookingRef: b.id,
        roomId: b.roomId,
        roomName: b.roomName,
        timeRange,
        creditsChange: -bCredits,
        hoursChange: -dur,
        creditsDisplay: `-${bCredits} credits`,
        hoursDisplay: `-${dur.toFixed(1)} hrs`,
        runningBalanceCredits: runningBalance,
        runningBalanceHours: Number((runningBalance / CREDITS_PER_HOUR).toFixed(1)),
        expiresAt: null,
        isPositive: false
      });
    }
  });

  return entries;
}

/**
 * Validates whether a proposed booking will incur overage, and calculates savings with top-up
 */
function evaluateBookingCost(startup, allRooms, { roomId, date, startTime, endTime }) {
  const dur = calculateDurationHours(startTime, endTime);
  const neededCredits = Math.round(dur * CREDITS_PER_HOUR);
  const bMonth = (date || '').substring(0, 7);

  const allowance = getMonthlyAllowance(startup, allRooms, bMonth);
  const availableCredits = allowance.remainingCredits;

  if (availableCredits >= neededCredits) {
    return {
      willCauseOverage: false,
      coveredByAllowance: true,
      durationHours: dur,
      neededCredits,
      overageHours: 0,
      overageFee: 0,
      topUpCostToCover: 0,
      savingsWithTopUp: 0
    };
  }

  const shortageCredits = neededCredits - availableCredits;
  const overageHours = Number((shortageCredits / CREDITS_PER_HOUR).toFixed(1));
  const overageFee = Math.round(overageHours * HOURLY_OVERAGE_RATE); // ₹1,500/hr

  // Cost if user buys credits instead (₹500/hr)
  const topUpCostToCover = Math.round(overageHours * HOURLY_TOPUP_RATE);
  const savingsWithTopUp = Math.max(0, overageFee - topUpCostToCover);

  return {
    willCauseOverage: true,
    coveredByAllowance: false,
    durationHours: dur,
    neededCredits,
    availableCredits,
    shortageCredits,
    overageHours,
    overageFee,
    hourlyOverageRate: HOURLY_OVERAGE_RATE,
    hourlyTopUpRate: HOURLY_TOPUP_RATE,
    topUpCostToCover,
    savingsWithTopUp,
    recommendedPackCredits: Math.ceil(shortageCredits / 50) * 50
  };
}

const creditService = {
  CREDITS_PER_HOUR,
  HOURLY_OVERAGE_RATE,
  CREDIT_OVERAGE_RATE,
  HOURLY_TOPUP_RATE,
  CREDIT_TOPUP_RATE,
  DEFAULT_TOPUP_VALIDITY_DAYS,
  PACK_PRICING,
  CREDIT_EXPIRY_POLICIES,
  calculateDurationHours,
  formatTime12h,
  formatDateIndian,
  formatRupees,
  getMonthlyAllowance,
  buildReconciledLedger,
  evaluateBookingCost
};

if (typeof window !== 'undefined') {
  window.creditService = creditService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = creditService;
}
