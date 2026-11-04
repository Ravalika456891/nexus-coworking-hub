/**
 * Shared Format Helper for Nexus Hub
 * 
 * Rules:
 * - Time: 12-hour IST with AM/PM (e.g. "7:00 PM")
 * - Dates: "4 Nov 2026" (never ISO or dd/mm)
 * - Money: Indian grouping (₹1,500, ₹7,500, ₹25,00,000)
 * - Hours: "15.0 hrs"
 * - Capacity term: "Pax" (or "seats" where specified)
 */

(function (root, factory) {
  const exports = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = exports;
  }
  if (typeof window !== 'undefined') {
    window.FormatHelper = exports;
  }
  if (typeof root !== 'undefined') {
    root.FormatHelper = exports;
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /**
   * Format any date input (YYYY-MM-DD, ISO string, Date object) to "4 Nov 2026"
   */
  function formatDate(val) {
    if (!val) return '';
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return '';
      const day = val.getDate();
      const month = MONTH_NAMES_SHORT[val.getMonth()];
      const year = val.getFullYear();
      return `${day} ${month} ${year}`;
    }

    const str = String(val).trim();
    // Match YYYY-MM-DD
    const matchYMD = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (matchYMD) {
      const year = parseInt(matchYMD[1], 10);
      const mIdx = parseInt(matchYMD[2], 10) - 1;
      const day = parseInt(matchYMD[3], 10);
      return `${day} ${MONTH_NAMES_SHORT[mIdx] || matchYMD[2]} ${year}`;
    }

    // Try parsing as standard date
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getDate()} ${MONTH_NAMES_SHORT[parsed.getMonth()]} ${parsed.getFullYear()}`;
    }

    return str;
  }

  /**
   * Format 24h or arbitrary time to 12-hour IST (e.g. "07:00 PM" or "7:00 PM")
   */
  function formatTime(val, padZero = false) {
    if (!val) return '';
    const str = String(val).trim();
    // Match "HH:MM" or "HH:MM:SS"
    const match = str.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return str;

    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;

    const hourStr = padZero ? String(h).padStart(2, '0') : String(h);
    return `${hourStr}:${m} ${ampm}`;
  }

  /**
   * Format duration into hours with 1 decimal place: e.g. "15.0 hrs"
   */
  function formatHours(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return '0.0 hrs';
    return `${num.toFixed(1)} hrs`;
  }

  /**
   * Format currency in Indian Numbering System (e.g. ₹1,500, ₹25,00,000)
   */
  function formatCurrency(val, includeSymbol = true) {
    const num = Math.round(Number(val) || 0);
    const formatted = num.toLocaleString('en-IN');
    return includeSymbol ? `₹${formatted}` : formatted;
  }

  /**
   * Format capacity as Pax: e.g. "12 Pax"
   */
  function formatCapacity(val, term = 'Pax') {
    const num = parseInt(val, 10);
    if (isNaN(num)) return `0 ${term}`;
    return `${num} ${term}`;
  }

  /**
   * Format next renewal date based on billing period / cycle
   * E.g. for November 2026, next renewal date is 1 Dec 2026.
   */
  function computeNextRenewalDate(referenceDate = new Date()) {
    const ref = (referenceDate instanceof Date) ? referenceDate : new Date(referenceDate);
    const nextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    return formatDate(nextMonth);
  }

  return {
    formatDate,
    formatTime,
    formatHours,
    formatCurrency,
    formatCapacity,
    computeNextRenewalDate,
    MONTH_NAMES_SHORT,
    MONTH_NAMES_FULL
  };
});

