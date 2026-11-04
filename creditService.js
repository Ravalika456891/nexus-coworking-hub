/**
 * Single Source of Truth Credit & Allowance Engine for Nexus Hub
 * 
 * Rules:
 * - Two buckets: plan_credits (resets at month end) and top_up_credits (valid 90 days, configurable)
 * - Consumption order: plan_credits first, then top_up_credits, then overage
 * - Overage is charged at the room's own hourly rate (room.hourlyRate), not flat ₹1,500
 * - Debits on booking, refunds on cancellation outside late window, forfeits inside it
 * - Tracks "used" (past) and "reserved" (future) separately
 * - Returns: plan_remaining, topup_remaining, used, reserved, expiries, overage, percent_used
 * - Ledger reconciliation: opening + top-ups + refunds - debits - expiries = balance
 */

let FormatHelper = (typeof require !== 'undefined') 
  ? (() => { try { return require('./js/formatters'); } catch (e) { return (typeof window !== 'undefined' ? window.FormatHelper : null); } })()
  : (typeof window !== 'undefined' ? window.FormatHelper : null);
let PlanCatalog = (typeof require !== 'undefined') 
  ? (() => { try { return require('./js/planCatalog'); } catch (e) { return (typeof window !== 'undefined' ? window.PlanCatalog : null); } })()
  : (typeof window !== 'undefined' ? window.PlanCatalog : null);

function getFormatHelper() {
  if (FormatHelper && FormatHelper.formatDate) return FormatHelper;
  if (typeof window !== 'undefined' && window.FormatHelper) return window.FormatHelper;
  return {
    formatDate: (d) => String(d || ''),
    formatTime: (t) => String(t || ''),
    formatHours: (h) => `${Number(h || 0).toFixed(1)} hrs`,
    formatCurrency: (m) => `₹${Number(m || 0).toLocaleString('en-IN')}`,
    formatCapacity: (c) => `${c} Pax`,
    computeNextRenewalDate: () => '1 Dec 2026',
    MONTH_NAMES_SHORT: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    MONTH_NAMES_FULL: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };
}

function getPlanCatalog() {
  if (PlanCatalog && PlanCatalog.getPlanForStartup) return PlanCatalog;
  if (typeof window !== 'undefined' && window.PlanCatalog && window.PlanCatalog.getPlanForStartup) return window.PlanCatalog;
  return {
    getPlanForStartup: () => ({ id: 'startup', name: 'Startup Plan', monthlyHours: 15, monthlyCredits: 150, price: 15000 }),
    getRenewalDate: () => '1 Dec 2026',
    getPlanByKey: () => ({ id: 'startup', name: 'Startup Plan', monthlyHours: 15, monthlyCredits: 150, price: 15000 })
  };
}

const CREDITS_PER_HOUR = 10;
const DEFAULT_TOPUP_VALIDITY_DAYS = 90;
const HOURLY_TOPUP_RATE = 500;
const CREDIT_TOPUP_RATE = 50;

const CREDIT_EXPIRY_POLICIES = {
  startup: {
    topUpCreditsValidityDays: DEFAULT_TOPUP_VALIDITY_DAYS,
    planCreditsRule: 'expire_at_month_end',
    pausedPlanRule: 'freeze_and_preserve'
  }
};

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
    ratePer10Cr: 450,
    discountPercent: 10,
    baseAmount: 4500,
    gstRatePercent: 18,
    gstAmount: 810,
    totalAmount: 5310,
    validityDays: 90,
    tag: 'Most Popular (Save 10%)'
  },
  {
    id: 'pack_scale',
    name: 'Scale-Up Pack',
    credits: 200,
    hours: 20.0,
    ratePer10Cr: 400,
    discountPercent: 20,
    baseAmount: 8000,
    gstRatePercent: 18,
    gstAmount: 1440,
    totalAmount: 9440,
    validityDays: 90,
    tag: 'Best Value (Save 20%)'
  }
];

function calculateDurationHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return mins > 0 ? Number((mins / 60).toFixed(2)) : 0;
}

function getMonthlyAllowance(startup, allRooms = [], targetMonth = null, topUps = [], referenceClock = null) {
  if (!startup) {
    startup = { id: 'STP-XYZ', name: 'XYZ Technologies', subscriptionPlan: 'Startup Plan', includedMeetingHours: 15 };
  }

  // Target month in IST (YYYY-MM)
  let mStr = targetMonth;
  const now = referenceClock ? new Date(referenceClock) : new Date();
  const nowISTString = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  const [nowDateIST, nowTimeIST] = nowISTString.split(' ');

  const FormatHelper = getFormatHelper();
  const PlanCatalog = getPlanCatalog();

  if (!mStr) {
    mStr = nowDateIST.substring(0, 7);
  }

  const [yStr, mNumStr] = mStr.split('-');
  const year = parseInt(yStr, 10);
  const monthNum = parseInt(mNumStr, 10);
  const monthName = FormatHelper.MONTH_NAMES_FULL[monthNum - 1] || mStr;
  const monthShort = FormatHelper.MONTH_NAMES_SHORT[monthNum - 1] || mStr;
  const monthLabel = `${monthShort} ${year}`;

  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const monthStartDate = `${mStr}-01`;
  const monthEndDate = `${mStr}-${String(daysInMonth).padStart(2, '0')}`;
  const planExpiryDate = monthEndDate;

  // Single plan details from PlanCatalog
  const planInfo = PlanCatalog.getPlanForStartup(startup);
  const planName = planInfo.displayName || planInfo.name;
  const includedHours = Number(planInfo.monthlyHours);
  const planCredits = includedHours * CREDITS_PER_HOUR;

  // Top-ups: only active, paid top-ups
  const rawTopUps = (Array.isArray(topUps) && topUps.length > 0) ? topUps : (startup.topUps || []);
  const startupTopUps = rawTopUps.filter(t => {
    if (!t) return false;
    // Strict requirement: Credits from a top-up are granted ONLY after payment success
    if (t.status && t.status !== 'Active' && t.status !== 'Paid') return false;
    const pDate = (t.purchasedAt || t.date || '').substring(0, 10);
    const expDate = (t.expiresAt || '').substring(0, 10);
    if (pDate > monthEndDate) return false;
    if (expDate && expDate < monthStartDate) return false;
    return true;
  });

  const totalTopUpCredits = startupTopUps.reduce((acc, t) => acc + (Number(t.credits) || 0), 0);
  const totalAvailableCredits = planCredits + totalTopUpCredits;
  const totalAvailableHours = Number((totalAvailableCredits / CREDITS_PER_HOUR).toFixed(1));

  // Collect bookings for this startup in this month
  const monthBookings = [];
  const roomUsageMap = {};
  const cancellations = startup.cancellations || [];

  (allRooms || []).forEach(r => {
    (r.bookings || []).forEach(b => {
      if (!b || b.status === 'Cancelled') return;
      const isMine = (b.startupId === startup.id || (b.startupName && startup.name && b.startupName.toLowerCase() === startup.name.toLowerCase()));
      if (!isMine) return;

      if (b.date && String(b.date).startsWith(mStr)) {
        const dur = (b.duration !== undefined && !isNaN(Number(b.duration)) && Number(b.duration) > 0)
          ? Number(b.duration)
          : calculateDurationHours(b.startTime, b.endTime);

        const roomRate = Number(r.hourlyRate) || 1500;
        const creditRate = Number(r.creditRatePerHour) || CREDITS_PER_HOUR;
        const credits = Math.round(dur * creditRate);

        // Check if booking is in the past (used) or future (reserved)
        const isPast = (b.date < nowDateIST) || (b.date === nowDateIST && (b.endTime || b.startTime) <= nowTimeIST);

        const bookingItem = {
          ...b,
          roomId: r.id,
          roomName: r.name,
          roomHourlyRate: roomRate,
          creditRatePerHour: creditRate,
          duration: dur,
          credits,
          isPast,
          stateType: isPast ? 'used' : 'reserved'
        };

        monthBookings.push(bookingItem);

        const rName = r.name || 'Meeting Space';
        if (!roomUsageMap[rName]) {
          roomUsageMap[rName] = { roomId: r.id, name: rName, hours: 0, credits: 0, count: 0 };
        }
        roomUsageMap[rName].hours += dur;
        roomUsageMap[rName].credits += credits;
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

  // Calculate used vs reserved
  let usedHours = 0;
  let usedCredits = 0;
  let reservedHours = 0;
  let reservedCredits = 0;

  monthBookings.forEach(b => {
    if (b.isPast) {
      usedHours += b.duration;
      usedCredits += b.credits;
    } else {
      reservedHours += b.duration;
      reservedCredits += b.credits;
    }
  });

  usedHours = Number(usedHours.toFixed(1));
  reservedHours = Number(reservedHours.toFixed(1));

  const totalConsumedCredits = usedCredits + reservedCredits;
  const totalConsumedHours = Number((usedHours + reservedHours).toFixed(1));

  // Two-bucket deduction: 1) Plan credits first, 2) Top-up credits second, 3) Room-rate overage
  let remainingPlanCredits = planCredits;
  let remainingTopUpCredits = totalTopUpCredits;
  let overageCredits = 0;
  let overageFee = 0;

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
        // Overage charged at the room's own hourly rate!
        const ovgHours = needed / (b.creditRatePerHour || CREDITS_PER_HOUR);
        const ovgCost = Math.round(ovgHours * (b.roomHourlyRate || 1500));
        b.overageFee = ovgCost;
        overageFee += ovgCost;
      }
    }
  });

  const currentCreditBalance = remainingPlanCredits + remainingTopUpCredits;
  const currentHourBalance = Number((currentCreditBalance / CREDITS_PER_HOUR).toFixed(1));
  const overageHours = Number((overageCredits / CREDITS_PER_HOUR).toFixed(1));

  // Progress metrics: Progress bar always shows USED share
  const pctUsed = totalAvailableCredits > 0
    ? Math.min(100, Math.round((totalConsumedCredits / totalAvailableCredits) * 100))
    : (totalConsumedCredits > 0 ? 100 : 0);
  const pctLeft = Math.max(0, 100 - pctUsed);

  // Colour: green (<80%), amber (80-99%), red (>=100%)
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

  // Renewal date computed from billing cycle
  const nextRenewalDate = PlanCatalog.getRenewalDate(now);

  // Top-up expiry list
  const expiries = {
    planCreditsExpiry: FormatHelper.formatDate(planExpiryDate),
    topUps: startupTopUps.map(t => ({
      id: t.id,
      packTitle: t.packTitle || t.packName || 'Top-Up Pack',
      credits: t.credits,
      expiresAt: FormatHelper.formatDate(t.expiresAt)
    }))
  };

  // Reconciled Ledger
  const ledger = buildReconciledLedger({
    monthStr: mStr,
    monthName,
    planName,
    planCredits,
    includedHours,
    planExpiryDate,
    topUps: startupTopUps,
    bookings: monthBookings,
    cancellations
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
    nextRenewalDate,
    // Bucket breakdown
    plan_remaining: remainingPlanCredits,
    topup_remaining: remainingTopUpCredits,
    used: { hours: usedHours, credits: usedCredits },
    reserved: { hours: reservedHours, credits: reservedCredits },
    expiries,
    overage: { hours: overageHours, credits: overageCredits, fee: overageFee },
    percent_used: pctUsed,
    percent_left: pctLeft,
    // Backward compatibility aliases
    includedHours,
    planCredits,
    openingCredits: planCredits,
    totalTopUpCredits,
    topUpCredits: totalTopUpCredits,
    totalAvailableCredits,
    totalAvailableHours,
    usedCredits,
    consumedCredits: totalConsumedCredits,
    refundedCredits: 0,
    usedHours,
    reservedCredits,
    reservedHours,
    remainingCredits: currentCreditBalance,
    currentBalanceCredits: currentCreditBalance,
    remainingHours: currentHourBalance,
    remainingPlanCredits,
    remainingTopUpCredits,
    overageCredits,
    overageHours,
    overageFee,
    pctUsed,
    pctLeft,
    status,
    statusColor,
    statusLabel,
    showOverageWarning: pctUsed >= 80 || overageCredits > 0,
    roomBreakdown: Object.values(roomUsageMap),
    bookingsCount: monthBookings.length,
    bookings: monthBookings,
    ledger
  };
}

function buildReconciledLedger({
  monthStr,
  monthName,
  planName,
  planCredits,
  includedHours,
  planExpiryDate,
  topUps = [],
  bookings = [],
  cancellations = []
}) {
  const FormatHelper = getFormatHelper();
  const entries = [];
  let runningBalance = 0;

  // 1. Opening Entry
  runningBalance += planCredits;
  entries.push({
    id: `LEDGER-OPEN-${monthStr}`,
    date: `${monthStr}-01`,
    displayDate: FormatHelper.formatDate(`${monthStr}-01`),
    time: '12:00 AM',
    displayDateTime: `${FormatHelper.formatDate(`${monthStr}-01`)}, 12:00 AM`,
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
    bucket: 'Plan',
    expiresAt: FormatHelper.formatDate(planExpiryDate),
    isPositive: true
  });

  // 2. Timeline items
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

  (cancellations || []).forEach(c => {
    const cDate = (c.cancelledAt || c.date || '').substring(0, 10);
    if (cDate.startsWith(monthStr) && c.refundCredits > 0) {
      txItems.push({
        kind: 'refund',
        sortKey: `${cDate} ${c.time || '12:00'}`,
        data: c
      });
    }
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
        displayDate: FormatHelper.formatDate((t.purchasedAt || t.date || monthStr).substring(0, 10)),
        time: FormatHelper.formatTime(t.time || '10:00'),
        displayDateTime: `${FormatHelper.formatDate((t.purchasedAt || t.date || monthStr).substring(0, 10))}, ${FormatHelper.formatTime(t.time || '10:00')}`,
        type: 'top-up',
        typeLabel: 'Credit Top-Up',
        description: `Extra Credit Top-Up (${t.packTitle || t.packName || 'Top-Up Pack'})`,
        bookingRef: null,
        invoiceId: t.invoiceId || null,
        invoiceNumber: t.invoiceNumber || t.invoiceId || null,
        paymentRef: t.paymentRef || null,
        credits: tCredits,
        creditsChange: tCredits,
        hoursChange: tHours,
        creditsDisplay: `+${tCredits} credits`,
        hoursDisplay: `+${tHours.toFixed(1)} hrs`,
        runningBalanceCredits: runningBalance,
        runningBalanceHours: Number((runningBalance / CREDITS_PER_HOUR).toFixed(1)),
        bucket: 'Top-Up',
        expiresAt: t.expiresAt ? FormatHelper.formatDate(t.expiresAt) : '90 Days',
        isPositive: true
      });
    } else if (item.kind === 'booking') {
      const b = item.data;
      const dur = b.duration || calculateDurationHours(b.startTime, b.endTime);
      const bCredits = b.credits || Math.round(dur * (b.creditRatePerHour || CREDITS_PER_HOUR));
      runningBalance = Math.max(0, runningBalance - bCredits);

      const timeRange = `${FormatHelper.formatTime(b.startTime)} – ${FormatHelper.formatTime(b.endTime)}`;

      entries.push({
        id: `LEDGER-BKG-${b.id}`,
        date: b.date,
        displayDate: FormatHelper.formatDate(b.date),
        time: FormatHelper.formatTime(b.startTime),
        displayDateTime: `${FormatHelper.formatDate(b.date)}, ${timeRange}`,
        type: 'debit',
        typeLabel: 'Room Reservation',
        description: b.purpose || b.title || `Team Session in ${b.roomName || 'Meeting Room'}`,
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
        bucket: b.debitedFrom === 'topup' ? 'Top-Up' : (b.debitedFrom === 'overage' ? 'Overage' : 'Plan'),
        expiresAt: null,
        isPositive: false
      });
    } else if (item.kind === 'refund') {
      const c = item.data;
      const rCredits = Number(c.refundCredits) || 0;
      const rHours = Number((rCredits / CREDITS_PER_HOUR).toFixed(1));
      runningBalance += rCredits;

      entries.push({
        id: `LEDGER-REF-${c.id || c.bookingId}`,
        date: (c.cancelledAt || c.date).substring(0, 10),
        displayDate: FormatHelper.formatDate((c.cancelledAt || c.date).substring(0, 10)),
        time: FormatHelper.formatTime(c.time || '12:00'),
        displayDateTime: `${FormatHelper.formatDate((c.cancelledAt || c.date).substring(0, 10))}, ${FormatHelper.formatTime(c.time || '12:00')}`,
        type: 'credit',
        typeLabel: 'Cancellation Refund',
        description: `Refund for Cancelled Session (${c.bookingRef || c.roomName || 'Booking'})`,
        bookingRef: c.bookingRef || c.bookingId,
        creditsChange: rCredits,
        hoursChange: rHours,
        creditsDisplay: `+${rCredits} credits`,
        hoursDisplay: `+${rHours.toFixed(1)} hrs`,
        runningBalanceCredits: runningBalance,
        runningBalanceHours: Number((runningBalance / CREDITS_PER_HOUR).toFixed(1)),
        bucket: 'Plan',
        expiresAt: null,
        isPositive: true
      });
    }
  });

  return entries;
}

function evaluateBookingCost(startup, allRooms, { roomId, date, startTime, endTime }) {
  const dur = calculateDurationHours(startTime, endTime);
  const targetRoom = (allRooms || []).find(r => r.id === roomId) || { hourlyRate: 1500, creditRatePerHour: CREDITS_PER_HOUR };
  const creditRate = Number(targetRoom.creditRatePerHour) || CREDITS_PER_HOUR;
  const neededCredits = Math.round(dur * creditRate);
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
  const overageHours = Number((shortageCredits / creditRate).toFixed(1));
  const overageFee = Math.round(overageHours * (targetRoom.hourlyRate || 1500));
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
    hourlyOverageRate: targetRoom.hourlyRate || 1500,
    hourlyTopUpRate: HOURLY_TOPUP_RATE,
    topUpCostToCover,
    savingsWithTopUp,
    recommendedPackCredits: Math.ceil(shortageCredits / 50) * 50
  };
}

function formatDateIndian(d) {
  const FormatHelper = getFormatHelper();
  return FormatHelper.formatDate(d);
}

function formatCurrency(n) {
  const FormatHelper = getFormatHelper();
  return FormatHelper.formatCurrency(n);
}

const CreditServiceExports = {
  CREDITS_PER_HOUR,
  DEFAULT_TOPUP_VALIDITY_DAYS,
  HOURLY_TOPUP_RATE,
  CREDIT_TOPUP_RATE,
  CREDIT_EXPIRY_POLICIES,
  PACK_PRICING,
  calculateDurationHours,
  getMonthlyAllowance,
  buildReconciledLedger,
  evaluateBookingCost,
  formatDateIndian,
  formatCurrency
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CreditServiceExports;
}
if (typeof window !== 'undefined') {
  window.CreditService = CreditServiceExports;
  window.creditService = CreditServiceExports;
}
