/**
 * cancellation.js - Single Shared Cancellation & Refund Policy
 * Shared between Server (Node.js) and Browser (NEXUS HUB UI)
 *
 * Policy:
 * 1. Cancelling is allowed anytime.
 * 2. Refund is 100% full amount (zero cancellation fee).
 * 3. Plan-covered bookings restore 100% of duration credit hours.
 * 4. Paid bookings receive 100% full refund in paise (refundPaise = amountPaise, feePaise = 0).
 * 5. All time computations use Asia/Kolkata IST (+05:30) and the server clock.
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
   * Parse booking end date and time into UTC timestamp representing IST (+05:30)
   * @param {string} dateStr 'YYYY-MM-DD'
   * @param {string} endTimeStr 'HH:mm'
   * @returns {number} epoch timestamp in ms
   */
  function parseBookingEndIST(dateStr, endTimeStr) {
    return parseBookingStartIST(dateStr, endTimeStr);
  }

  /**
   * Determine whether a booking has already completed based on IST (+05:30)
   * @param {Object} booking
   * @param {Date|number|string} [currentClock] Optional clock override
   * @returns {boolean}
   */
  function isBookingCompleted(booking, currentClock) {
    if (!booking) return false;
    if (booking.status === 'Completed') return true;
    if (booking.status === 'Cancelled') return false;
    if (!booking.date || !booking.endTime) return false;
    const endMs = parseBookingEndIST(booking.date, booking.endTime);
    if (!endMs) return false;
    const nowMs = currentClock ? new Date(currentClock).getTime() : Date.now();
    return nowMs >= endMs;
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
   * Policy: 100% full amount refund anytime
   * @param {number} minsBeforeStart
   * @returns {{ allowed: boolean, refundPct: number, wholeHours: number }}
   */
  function getRefundTier(minsBeforeStart) {
    const wholeHours = Math.max(0, Math.floor(minsBeforeStart / 60));
    return { allowed: true, refundPct: 100, wholeHours };
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

    if (isBookingCompleted(booking, currentClock)) {
      return {
        allowed: false,
        isCompleted: true,
        reason: 'Cannot cancel a completed meeting.',
        minsBeforeStart,
        wholeHours: 0,
        refundPct: 0,
        amountPaise: 0,
        refundPaise: 0,
        feePaise: 0,
        amountRupees: 0,
        refundRupees: 0,
        feeRupees: 0
      };
    }

    const tier = getRefundTier(minsBeforeStart);

    // Calculate booking duration in hours for plan credit restoration
    const sH = parseFloat((booking.startTime || '00:00').split(':')[0]) + parseFloat((booking.startTime || '00:00').split(':')[1] || '0') / 60;
    const eH = parseFloat((booking.endTime || '00:00').split(':')[0]) + parseFloat((booking.endTime || '00:00').split(':')[1] || '0') / 60;
    const durationHours = Math.max(0.25, Math.round((eH - sH) * 100) / 100);

    // Amounts in integer paise: 100% full refund (0 fee)
    const costRupees = Number(booking.cost) || 0;
    const amountPaise = booking.amountPaise !== undefined ? Number(booking.amountPaise) : Math.round(costRupees * 100);
    const refundPaise = amountPaise;
    const feePaise = 0;
    const isPlanCovered = amountPaise === 0;

    return {
      allowed: true,
      reason: null,
      minsBeforeStart,
      wholeHours: tier.wholeHours,
      refundPct: 100,
      amountPaise,
      refundPaise,
      feePaise,
      amountRupees: amountPaise / 100,
      refundRupees: refundPaise / 100,
      feeRupees: 0,
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
    const isAdmin = currentRole === 'admin' || currentRole === 'super_admin' || (typeof currentRole === 'string' && currentRole.includes('admin')) || (typeof window !== 'undefined' && (window.__currentRole === 'admin' || (window.store && window.store.currentRole && window.store.currentRole.includes('admin'))));

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

    if (isBookingCompleted(booking, currentClock)) {
      return `
        <td style="white-space: nowrap; text-align: center;">
          <button class="btn btn-outline btn-sm" disabled
                  style="font-size: 11px; padding: 4px 10px; color: #64748b; border-color: rgba(100, 116, 139, 0.3); font-weight: 600; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; border-radius: 6px; background: rgba(100, 116, 139, 0.08); opacity: 0.65; cursor: not-allowed;"
                  title="Completed meetings cannot be cancelled">
            <span>✓</span>
            <span>Completed</span>
          </button>
        </td>
      `;
    }

    const quote = calculateRefundQuote(booking, currentClock);

    // Allowed anytime before completion: show 100% full refund pill & cancellation trigger
    const refundTag = quote.isPlanCovered
      ? `${quote.durationHours}h credit restored`
      : `100% full refund (${formatPaiseToINR(quote.refundPaise)})`;

    return `
      <td style="white-space: nowrap; text-align: center;">
        <button class="btn btn-outline btn-sm btn-cancellation-trigger" 
                style="font-size: 11px; padding: 4px 10px; color: #dc2626; border-color: rgba(220, 38, 38, 0.4); font-weight: 700; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; border-radius: 6px; background: rgba(239, 68, 68, 0.05); transition: all 0.15s ease;"
                onclick="MeetingRoomsModule.openCancellationModal('${booking.roomId}', '${booking.id}')"
                title="Cancel reservation • ${refundTag}">
          <span>❌</span>
          <span>Cancel</span>
        </button>
      </td>
    `;
  }

  return {
    parseBookingStartIST,
    parseBookingEndIST,
    isBookingCompleted,
    computeMinsBeforeStart,
    getRefundTier,
    calculateRefundQuote,
    formatPaiseToINR,
    cancellationCell
  };
});
