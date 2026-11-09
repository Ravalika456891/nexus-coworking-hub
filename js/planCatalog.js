/**
 * Single Plan Catalog for Nexus Hub
 * 
 * Centralized, authoritative plan configuration.
 * Rule: 10 credits = 1 hour.
 */

(function (root, factory) {
  const exports = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = exports;
  }
  if (typeof window !== 'undefined') {
    window.PlanCatalog = exports;
  }
  if (typeof root !== 'undefined') {
    root.PlanCatalog = exports;
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const CREDITS_PER_HOUR = 10;

  const PLANS = [
    {
      id: 'starter',
      key: 'starter',
      name: 'Starter Plan',
      displayName: 'Starter Tier',
      monthlyHours: 10.0,
      monthlyCredits: 100,
      price: 5000,
      gstRate: 18,
      description: 'Ideal for early-stage ventures and small incubation teams',
      creditRollover: false,
      topUpValidityDays: 90
    },
    {
      id: 'startup',
      key: 'startup',
      name: 'Startup Plan',
      displayName: 'Startup Plan',
      aliases: ['Scale-Up Growth Plan', 'Growth Plan', 'Growth / Scale-up Venture', 'Startup Plan'],
      monthlyHours: 15.0,
      monthlyCredits: 150,
      price: 12000,
      gstRate: 18,
      description: 'Standard incubator venture plan with 15 monthly meeting room hours',
      creditRollover: false,
      topUpValidityDays: 90
    },
    {
      id: 'growth',
      key: 'growth',
      name: 'Growth Plan',
      displayName: 'Scale-Up Growth Plan',
      aliases: ['Scale-Up Growth Plan', 'Growth Plan'],
      monthlyHours: 30.0,
      monthlyCredits: 300,
      price: 22000,
      gstRate: 18,
      description: 'High-velocity scaling startups requiring 30 monthly hours',
      creditRollover: false,
      topUpValidityDays: 90
    },
    {
      id: 'enterprise',
      key: 'enterprise',
      name: 'Enterprise Scale Plan',
      displayName: 'Enterprise Scale',
      aliases: ['Enterprise Accelerator', 'Enterprise Scale Plan'],
      monthlyHours: 60.0,
      monthlyCredits: 600,
      price: 45000,
      gstRate: 18,
      description: 'Full ecosystem access with 60 monthly meeting room hours',
      creditRollover: true,
      maxRolloverHours: 20.0,
      topUpValidityDays: 180
    }
  ];

  function getPlanByKey(key) {
    if (!key) return PLANS.find(p => p.id === 'startup');
    const lower = String(key).trim().toLowerCase();
    
    // Direct match by id/name
    let match = PLANS.find(p => p.id === lower || p.name.toLowerCase() === lower);
    if (match) return match;

    // Match by aliases
    match = PLANS.find(p => Array.isArray(p.aliases) && p.aliases.some(a => a.toLowerCase() === lower));
    if (match) return match;

    // Partial search
    if (lower.includes('enterprise')) return PLANS.find(p => p.id === 'enterprise');
    if (lower.includes('growth') || lower.includes('scale')) return PLANS.find(p => p.id === 'growth');
    if (lower.includes('starter') || lower.includes('micro')) return PLANS.find(p => p.id === 'starter');

    return PLANS.find(p => p.id === 'startup');
  }

  function getPlanForStartup(startup) {
    const planKey = startup?.subscriptionPlan || startup?.plan || 'startup';
    const plan = getPlanByKey(planKey);
    // Allow custom override if specified on startup record
    const hours = (startup && typeof startup.includedMeetingHours === 'number') 
      ? startup.includedMeetingHours 
      : plan.monthlyHours;
    return {
      ...plan,
      monthlyHours: hours,
      monthlyCredits: Math.round(hours * CREDITS_PER_HOUR)
    };
  }

  function getRenewalDate(date = new Date()) {
    const d = (date instanceof Date) ? date : new Date(date);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${nextMonth.getDate()} ${months[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;
  }

  return {
    CREDITS_PER_HOUR,
    PLANS,
    getPlanByKey,
    getPlanForStartup,
    resolvePlanForStartup: getPlanForStartup,
    getRenewalDate
  };
});

