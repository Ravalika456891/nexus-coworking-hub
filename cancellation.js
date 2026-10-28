/**
 * cancellation.js - Single Shared Cancellation & Refund Policy
 * Shared between Server (Node.js) and Browser (NEXUS HUB UI)
 *
 * Policy:
 * 1. Cancelling is allowed only when at least 1 hour (>= 60 mins) remains before meeting start.
 * 2. Refund % by whole hours left:
 *    - < 1h  : Disallowed (0%)
 *    - 1h    : 20%  (60 - 119 mins)
 *    - 2h    : 30%  (120 - 179 mins)
 *    - 3h    : 40%  (180 - 239 mins)
 *    - 4h    : 50%  (240 - 299 mins)
 *    - 5h    : 60%  (300 - 359 mins)
 *    - 6h    : 70%  (360 - 419 mins)
 *    - >= 7h : 80%  (>= 420 mins)
 * 3. Amounts are integer paise; refund = Math.floor(amountPaise * pct / 100).
 * 4. All time computations use Asia/Kolkata IST (+05:30) and the server clock.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.CancellationPolicy = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Parse booking date and time into UTC timestamp representing IST (+05:30)
   * @param {string} dateStr 'YYYY-MM-DD'
   * @param {string} timeStr 'HH:mm'
   * @returns {number} epoch timestamp in ms
   */
  function parseBookingStartIST(dateStr, timeStr) {
    if (!dateStr || !timeStr) return 0;
    const cleanDate = dateStr.trim();
    const cleanTime = timeStr.trim().length === 5 ? timeStr.trim() : timeStr.trim().padStart(5, '0');
    // Construct ISO string with explicit IST offset (+05:30)
    const isoString = `${cleanDate}T${cleanTime}:00+05:30`;
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  /**
   * Compute minutes remaining before meeting start based on IST (+05:30)
   * @param {string} dateStr 'YYYY-MM-DD'
   * @param {string} timeStr 'HH:mm'
   * @param {Date|number|string} [currentClock] Optional clock override
   * @returns {number} integer minutes remaining
   */
  function computeMinsBeforeStart(dateStr, timeStr, currentClock) {
    const startMs = parseBookingStartIST(dateStr, timeStr);
    if (!startMs) return -999999;
    const nowMs = currentClock ? new Date(currentClock).getTime() : Date.now();
    return Math.floor((startMs - nowMs) / (60 * 1000));
  }

  /**
   * Get refund percentage based on whole hours left
   * Tier table:
   *   < 1h  -> 0 (not allowed)
   *   1h    -> 20%
   *   2h    -> 30%
   *   3h    -> 40%
   *   4h    -> 50%
   *   5h    -> 60%
   *   6h    -> 70%
   *   >= 7h -> 80%
   * @param {number} minsBeforeStart
   * @returns {{ allowed: boolean, refundPct: number, wholeHours: number }}
   */
  function getRefundTier(minsBeforeStart) {
    if (minsBeforeStart < 60) {
      return { allowed: false, refundPct: 0, wholeHours: Math.max(0, Math.floor(minsBeforeStart / 60)) };
    }
    const wholeHours = Math.floor(minsBeforeStart / 60);
    let refundPct = 80;
    if (wholeHours === 1) refundPct = 20;
    else if (wholeHours === 2) refundPct = 30;
    else if (wholeHours === 3) refundPct = 40;
    else if (wholeHours === 4) refundPct = 50;
    else if (wholeHours === 5) refundPct = 60;
    else if (wholeHours === 6) refundPct = 70;
    else refundPct = 80; // 7h or more

    return { allowed: true, refundPct, wholeHours };
  }

  /**
   * Calculate complete refund quote for a booking
   * @param {Object} booking
   * @param {Date|number|string} [currentClock]
   * @returns {Object} Quote details
   */
  function calculateRefundQuote(booking, currentClock) {
    if (!booking) {
      return {
        allowed: false,
        reason: 'Invalid booking record',
        minsBeforeStart: 0,
        wholeHours: 0,
        refundPct: 0,
        amountPaise: 0,
        refundPaise: 0,
        feePaise: 0
      };
    }

    if (booking.status === 'Cancelled') {
      return {
        allowed: false,
        alreadyCancelled: true,
        reason: 'Booking is already cancelled',
        minsBeforeStart: 0,
        wholeHours: 0,
        refundPct: 0,
        amountPaise: 0,
        refundPaise: 0,
        feePaise: 0
      };
    }

    const minsBeforeStart = computeMinsBeforeStart(booking.date, booking.startTime, currentClock);
    const tier = getRefundTier(minsBeforeStart);

    // Calculate booking duration in hours for plan credit restoration
    const sH = parseFloat((booking.startTime || '00:00').split(':')[0]) + parseFloat((booking.startTime || '00:00').split(':')[1] || '0') / 60;
    const eH = parseFloat((booking.endTime || '00:00').split(':')[0]) + parseFloat((booking.endTime || '00:00').split(':')[1] || '0') / 60;
    const durationHours = Math.max(0.25, Math.round((eH - sH) * 100) / 100);

    // Amounts in integer paise
    const costRupees = Number(booking.cost) || 0;
    const amountPaise = booking.amountPaise !== undefined ? Number(booking.amountPaise) : Math.round(costRupees * 100);
    const refundPaise = tier.allowed ? Math.floor((amountPaise * tier.refundPct) / 100) : 0;
    const feePaise = amountPaise - refundPaise;
    const isPlanCovered = amountPaise === 0;

    return {
      allowed: tier.allowed,
      reason: tier.allowed ? null : 'Cancelling is allowed only when at least 1 hour remains before the meeting starts.',
      minsBeforeStart,
      wholeHours: tier.wholeHours,
      refundPct: tier.refundPct,
      amountPaise,
      refundPaise,
      feePaise,
      amountRupees: amountPaise / 100,
      refundRupees: refundPaise / 100,
      feeRupees: feePaise / 100,
      isPlanCovered,
      durationHours,
      paymentMethod: booking.paymentMethod || (isPlanCovered ? 'Plan Credit' : 'Razorpay'),
      paymentGateway: booking.paymentGateway || (booking.razorpayPaymentId ? 'Razorpay' : null),
      razorpayPaymentId: booking.razorpayPaymentId || null
    };
  }

  /**
   * Format integer paise into INR string format (e.g. ₹900.00)
   * @param {number} paise
   * @returns {string}
   */
  function formatPaiseToINR(paise) {
    const rupees = (Number(paise) || 0) / 100;
    return '₹' + rupees.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * UI Helper: Render HTML string for the "Cancellation" column cell
   * @param {Object} booking
   * @param {Object} myStartup Current logged-in / active startup
   * @param {string} [currentRole='founder'] 'founder' | 'admin'
   * @param {Date|number|string} [currentClock] Optional clock
   * @returns {string} Safe HTML string for the table cell
   */
  function cancellationCell(booking, myStartup, currentRole, currentClock) {
    if (!booking) return '<td style="text-align: center;">-</td>';

    const isMine = myStartup && (booking.startupId === myStartup.id || (booking.startupName && booking.startupName.toLowerCase() === myStartup.name.toLowerCase()));
    const isAdmin = currentRole === 'admin' || (typeof window !== 'undefined' && window.__currentRole === 'admin');

    // Only booking owner or admin can cancel
    if (!isMine && !isAdmin) {
      return `
        <td style="white-space: nowrap; text-align: center;">
          <span style="font-size: 11px; color: var(--text-muted); font-style: italic;">Locked</span>
        </td>
      `;
    }

    if (booking.status === 'Cancelled') {
      return `
        <td style="white-space: nowrap; text-align: center;">
          <span class="badge" style="font-size: 10.5px; background: rgba(100, 116, 139, 0.12); color: #64748b; border: 1px solid rgba(100, 116, 139, 0.25); font-weight: 600;">
            Cancelled
          </span>
        </td>
      `;
    }

    const quote = calculateRefundQuote(booking, currentClock);

    if (!quote.allowed) {
      const remainingLabel = quote.minsBeforeStart > 0 ? `${quote.minsBeforeStart}m left` : 'Started / Past';
      return `
        <td style="white-space: nowrap; text-align: center;" title="Cancellation closed: less than 1 hour remains before meeting start">
          <div style="display: inline-flex; flex-direction: column; align-items: center; gap: 2px;">
            <button class="btn btn-outline btn-sm" disabled style="font-size: 10.5px; padding: 3px 8px; opacity: 0.5; cursor: not-allowed; border-color: #cbd5e1; color: #94a3b8; border-radius: 6px;">
              🔒 Closed (&lt;1h)
            </button>
            <span style="font-size: 9.5px; color: var(--text-muted);">${remainingLabel}</span>
          </div>
        </td>
      `;
    }

    // Allowed: show refund pill & cancellation trigger
    const refundTag = quote.isPlanCovered
      ? `${quote.durationHours}h credit`
      : `${quote.refundPct}% refund (${formatPaiseToINR(quote.refundPaise)})`;

    return `
      <td style="white-space: nowrap; text-align: center;">
        <button class="btn btn-outline btn-sm btn-cancellation-trigger" 
                style="font-size: 11px; padding: 4px 10px; color: #dc2626; border-color: rgba(220, 38, 38, 0.4); font-weight: 700; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; border-radius: 6px; background: rgba(239, 68, 68, 0.05); transition: all 0.15s ease;"
                onclick="MeetingRoomsModule.openCancellationModal('${booking.roomId}', '${booking.id}')"
                title="Cancel reservation • ${refundTag}">
          <span>❌</span>
          <span>Cancel (${quote.refundPct}%)</span>
        </button>
      </td>
    `;
  }

  return {
    parseBookingStartIST,
    computeMinsBeforeStart,
    getRefundTier,
    calculateRefundQuote,
    formatPaiseToINR,
    cancellationCell
  };
});
