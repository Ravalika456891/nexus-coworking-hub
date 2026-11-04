const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'modules', 'meetingRooms.js');
let s = fs.readFileSync(filePath, 'utf8');

// 1. Update initial analyticsRange to 'month'
s = s.replace(/analyticsRange:\s*'all'/g, "analyticsRange: 'month'");

// 2. Locate renderAnalyticsTabView
const startMarker = 'renderAnalyticsTabView({ rooms }) {';
const startIdx = s.indexOf(startMarker);
if (startIdx === -1) {
  console.error('startMarker not found');
  process.exit(1);
}

// Find matching end of renderAnalyticsTabView
const endMarker = '  // Tab 6: Admin Management View';
const endIdx = s.indexOf(endMarker, startIdx);
if (endIdx === -1) {
  console.error('endMarker not found');
  process.exit(1);
}

const newAnalyticsMethod = `renderAnalyticsTabView({ rooms }) {
    const ist = this.getISTNow();
    const currentRole = (window.store && window.store.currentRole) || 'founder';
    const isOperator = (currentRole === 'operator' || currentRole === 'super_admin' || currentRole === 'admin');
    const myStartup = (window.store && window.store.getActiveStartup) 
      ? window.store.getActiveStartup() 
      : { id: 'STP-XYZ', name: 'XYZ Technologies' };
    const myStartupId = myStartup.id || 'STP-XYZ';

    const range = this.analyticsRange || 'month';
    let minDate = this.analyticsStartDate || null;
    let maxDate = this.analyticsEndDate || null;

    let daysCount = 30;
    if (range !== 'custom' && range !== 'all') {
      const baseParts = ist.todayStr.split('-').map(Number);
      const todayUtc = new Date(Date.UTC(baseParts[0], baseParts[1] - 1, baseParts[2]));
      if (range === 'day') {
        minDate = ist.todayStr;
        maxDate = ist.todayStr;
        daysCount = 1;
      } else if (range === 'week') {
        const sDate = new Date(todayUtc.getTime() - 6 * 86400000);
        minDate = sDate.toISOString().split('T')[0];
        maxDate = ist.todayStr;
        daysCount = 7;
      } else if (range === 'month') {
        minDate = \`\${ist.todayStr.slice(0, 7)}-01\`;
        const daysInMonth = new Date(baseParts[0], baseParts[1], 0).getDate();
        maxDate = \`\${ist.todayStr.slice(0, 7)}-\${daysInMonth}\`;
        daysCount = daysInMonth;
      }
    } else if (range === 'all') {
      daysCount = 90;
    } else if (minDate && maxDate) {
      const d1 = new Date(minDate).getTime();
      const d2 = new Date(maxDate).getTime();
      daysCount = Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
    }

    // Operating hours per room calculation
    const getRoomDailyHours = (r) => {
      if (r.operatingHours && typeof r.operatingHours === 'string' && r.operatingHours.includes('-')) {
        const parts = r.operatingHours.split('-').map(p => p.trim());
        const sMin = this.parseTimeToMinutes ? this.parseTimeToMinutes(parts[0]) : 480;
        const eMin = this.parseTimeToMinutes ? this.parseTimeToMinutes(parts[1]) : 1320;
        if (eMin > sMin) return (eMin - sMin) / 60;
      }
      return 14; // Default operating window 08:00 - 22:00 = 14 hours
    };

    let totalCapacityHours = 0;
    (rooms || []).forEach(r => {
      totalCapacityHours += (getRoomDailyHours(r) * daysCount);
    });
    totalCapacityHours = Math.max(1, totalCapacityHours);

    // Bookings collection: scoped for members, hub-wide for operator
    let allRelevantBookings = [];
    (rooms || []).forEach(r => {
      (r.bookings || []).forEach(b => {
        if (!b) return;
        if (minDate && b.date < minDate) return;
        if (maxDate && b.date > maxDate) return;
        if (!isOperator) {
          const isMine = (b.startupId === myStartupId || b.startupName === myStartup.name || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase()));
          if (!isMine) return;
        }
        allRelevantBookings.push(Object.assign({}, b, {
          roomName: r.name,
          roomHourlyRate: r.hourlyRate || 1500,
          roomCapacity: r.capacity || 4,
          roomIcon: r.icon || '🏢'
        }));
      });
    });

    let totalBookings = allRelevantBookings.length;
    let confirmedBookings = 0;
    let cancelledBookings = 0;
    let totalBookedHours = 0;
    let billedRevenue = 0;
    let creditValueUsed = 0;

    // Dynamic hour slot demand distribution
    const hourlyCounts = {};

    allRelevantBookings.forEach(b => {
      const dur = this.calculateBookingDuration(b.startTime, b.endTime);
      if (b.status === 'Cancelled') {
        cancelledBookings++;
        return;
      }
      confirmedBookings++;
      totalBookedHours += dur;
      const billedCost = Number(b.cost || 0);
      billedRevenue += billedCost;
      const ratePerHour = Number(b.roomHourlyRate || 1500);
      creditValueUsed += (dur * ratePerHour);

      // Track hour slots dynamically (including evening hours: 19:00, 20:00, 21:00, 22:00)
      const sMin = this.parseTimeToMinutes ? this.parseTimeToMinutes(b.startTime) : 0;
      const eMin = this.parseTimeToMinutes ? this.parseTimeToMinutes(b.endTime) : 0;
      const startH = Math.floor(sMin / 60);
      const endH = Math.ceil(eMin / 60);
      for (let h = startH; h < endH && h < 24; h++) {
        const slotKey = \`\${h < 10 ? '0' : ''}\${h}:00\`;
        hourlyCounts[slotKey] = (hourlyCounts[slotKey] || 0) + 1;
      }
    });

    // Sort hourly slots chronologically
    const sortedHourSlots = Object.keys(hourlyCounts).sort();
    const maxHourCount = Math.max(1, ...Object.values(hourlyCounts));
    const peakSlotKey = Object.entries(hourlyCounts).sort((a, b) => b[1] - a[1])[0] || ['09:00', 0];

    // Room utilization stats
    const roomStats = (rooms || []).map(r => {
      const rDaily = getRoomDailyHours(r);
      const rCapacityHours = rDaily * daysCount;
      let rConfirmed = 0;
      let rCancelled = 0;
      let rHours = 0;
      let rBilled = 0;
      let rCreditVal = 0;

      (r.bookings || []).forEach(b => {
        if (!b) return;
        if (minDate && b.date < minDate) return;
        if (maxDate && b.date > maxDate) return;
        if (!isOperator) {
          const isMine = (b.startupId === myStartupId || b.startupName === myStartup.name || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase()));
          if (!isMine) return;
        }
        if (b.status === 'Cancelled') {
          rCancelled++;
          return;
        }
        rConfirmed++;
        const dur = this.calculateBookingDuration(b.startTime, b.endTime);
        rHours += dur;
        const bCost = Number(b.cost || 0);
        rBilled += bCost;
        rCreditVal += (dur * (r.hourlyRate || 1500));
      });

      const utilPct = Math.min(100, Math.round((rHours / Math.max(1, rCapacityHours)) * 100));
      return {
        id: r.id,
        name: r.name,
        icon: r.icon || '🏢',
        capacity: r.capacity || 4,
        hourlyRate: r.hourlyRate || 1500,
        confirmed: rConfirmed,
        cancelled: rCancelled,
        bookedHours: Number(rHours.toFixed(1)),
        availableHours: rCapacityHours,
        utilPct,
        billedRevenue: rBilled,
        creditValue: rCreditVal
      };
    }).sort((a, b) => b.bookedHours - a.bookedHours);

    // Filter to only rooms used if member view
    const displayedRoomStats = isOperator ? roomStats : roomStats.filter(r => r.confirmed > 0);

    const overallUtilPct = Math.min(100, Math.round((totalBookedHours / Math.max(1, totalCapacityHours)) * 100));
    const cancelRatePct = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

    // Credit allowance for member
    const allowance = (window.CreditService && window.CreditService.getMonthlyAllowance) 
      ? window.CreditService.getMonthlyAllowance(myStartupId) 
      : { remainingHours: 15.0, usedHours: 0, planName: 'Startup Plan', remainingCredits: 150 };

    const rawStartups = (window.store && window.store.getStartups) ? window.store.getStartups() : [];
    const startupsList = isOperator ? rawStartups : rawStartups.filter(s => s.id === myStartupId);

    return \`
      <!-- Analytics Filter Bar -->
      <div class="card" style="padding: 14px 20px; margin-bottom: 20px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--bg-surface-elevated); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
            <span>📊</span> \${isOperator ? 'Hub Meeting Space Insights &amp; Utilization Analytics' : \`My Meeting Room Analytics — \${myStartup.name}\`}
          </h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">
            \${isOperator ? 'Hub-wide resource utilization, peak demand distribution, and revenue generation.' : 'Your company\\'s credit consumption, meeting session hours, and peak usage patterns.'}
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <button type="button" class="btn btn-sm \${range === 'month' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setAnalyticsFilterRange('month')" style="border-radius: 8px; font-size: 11.5px; font-weight: 700;">This Month</button>
          <button type="button" class="btn btn-sm \${range === 'week' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setAnalyticsFilterRange('week')" style="border-radius: 8px; font-size: 11.5px; font-weight: 700;">This Week</button>
          <button type="button" class="btn btn-sm \${range === 'day' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setAnalyticsFilterRange('day')" style="border-radius: 8px; font-size: 11.5px; font-weight: 700;">Today</button>
          <button type="button" class="btn btn-sm \${range === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setAnalyticsFilterRange('all')" style="border-radius: 8px; font-size: 11.5px; font-weight: 700;">All Time</button>
          <input type="date" value="\${this.analyticsStartDate || ''}" onchange="MeetingRoomsModule.setAnalyticsFilterRange('custom', this.value, MeetingRoomsModule.analyticsEndDate)" class="form-control" style="width: auto; font-size: 11.5px; padding: 4px 8px; border-radius: 6px;" title="Custom Start Date">
          <span style="font-size: 11px; color: var(--text-muted);">to</span>
          <input type="date" value="\${this.analyticsEndDate || ''}" onchange="MeetingRoomsModule.setAnalyticsFilterRange('custom', MeetingRoomsModule.analyticsStartDate, this.value)" class="form-control" style="width: auto; font-size: 11.5px; padding: 4px 8px; border-radius: 6px;" title="Custom End Date">
        </div>
      </div>

      <!-- Analytics KPI Cards -->
      <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: 14px; margin-bottom: 22px;">
        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(37, 99, 235, 0.25);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">\${isOperator ? 'Total Reservations' : 'My Reservations'}</div>
          <div style="font-size: 26px; font-weight: 800; color: #2563eb; margin-top: 4px;">\${confirmedBookings} Confirmed</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">\${totalBookedHours.toFixed(1)} hrs booked across \${displayedRoomStats.length} rooms</div>
        </div>

        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(16, 185, 129, 0.25);" title="Formula: Total Booked Hours (\${totalBookedHours.toFixed(1)}h) / [Sum of room operating hours (\${Math.round(totalCapacityHours / daysCount)}h/day) × \${daysCount} days = \${totalCapacityHours}h] × 100">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
            <span>\${isOperator ? 'Hub Utilization Rate' : 'Room Utilization'}</span>
            <span style="cursor: help; font-size: 12px; color: var(--text-muted);" title="Formula: Total Booked Hours / Sum of room daily operating hours over range">ℹ️</span>
          </div>
          <div style="font-size: 26px; font-weight: 800; color: #16a34a; margin-top: 4px;">\${overallUtilPct}%</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
            Formula: \${totalBookedHours.toFixed(1)}h / \${totalCapacityHours}h capacity
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(99, 102, 241, 0.25);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Peak Booking Window</div>
          <div style="font-size: 24px; font-weight: 800; color: #4f46e5; margin-top: 4px;">⏰ \${this.formatTimeTo12Hour(peakSlotKey[0])}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">\${peakSlotKey[1]} active session\${peakSlotKey[1] === 1 ? '' : 's'} in window</div>
        </div>

        <!-- 4. Revenue & Value: Two Separate Distinct Numbers -->
        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(245, 158, 11, 0.25);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Billed Revenue</div>
          <div style="font-size: 26px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">₹\${billedRevenue.toLocaleString('en-IN')}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Direct overage &amp; paid bookings</div>
        </div>

        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(16, 185, 129, 0.25);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Credit Value Used</div>
          <div style="font-size: 26px; font-weight: 800; color: #16a34a; margin-top: 4px;">₹\${creditValueUsed.toLocaleString('en-IN')}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Plan subsidized (hours × room rate)</div>
        </div>

        <div class="kpi-card" style="padding: 16px; border: 1.5px solid var(--border-subtle);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">\${isOperator ? 'Incubator Quota' : 'My Credit Balance'}</div>
          <div style="font-size: 24px; font-weight: 800; color: #0284c7; margin-top: 4px;">
            \${isOperator ? \`\${totalBookedHours.toFixed(1)} hrs\` : \`\${allowance.remainingHours.toFixed(1)} hrs left\`}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
            \${isOperator ? \`Across \${startupsList.length} startups\` : \`Plan: \${allowance.planName} (\${allowance.remainingCredits} cr)\`}
          </div>
        </div>
      </div>

      <!-- 2-Column Analytics Breakdown: Room Popularity & Peak Hours -->
      <div class="grid-2col" style="margin-bottom: 24px;">
        <!-- Room Popularity & Utilization -->
        <div class="card" style="padding: 18px 20px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--bg-surface);">
          <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0 0 14px 0;">
            🏢 \${isOperator ? 'Room Popularity, Capacity &amp; Financial Breakdown' : 'Meeting Spaces Used by Your Company'}
          </h4>
          <div style="overflow-x: auto;">
            <table class="nexus-table" style="width: 100%; font-size: 12px; margin: 0;">
              <thead>
                <tr>
                  <th>Space</th>
                  <th>Pax</th>
                  <th>Sessions</th>
                  <th>Hours</th>
                  <th>Utilization</th>
                  <th>Credit Value</th>
                  <th>Billed</th>
                </tr>
              </thead>
              <tbody>
                \${displayedRoomStats.length === 0 ? \`<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 18px;">No meeting room bookings recorded in this date range.</td></tr>\` :
                  displayedRoomStats.map(r => \`
                    <tr>
                      <td>
                        <strong>\${r.icon} \${r.name}</strong>
                      </td>
                      <td style="font-family: var(--font-mono);">\${r.capacity} Pax</td>
                      <td style="font-family: var(--font-mono);">\${r.confirmed}</td>
                      <td style="font-family: var(--font-mono);">\${r.bookedHours}h</td>
                      <td>
                        <span class="badge" style="background: \${r.utilPct >= 70 ? 'rgba(239, 68, 68, 0.1)' : r.utilPct >= 40 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: \${r.utilPct >= 70 ? '#dc2626' : r.utilPct >= 40 ? '#d97706' : '#16a34a'}; font-weight: 800;">
                          \${r.utilPct}%
                        </span>
                      </td>
                      <td style="font-family: var(--font-mono); color: #16a34a; font-weight: 700;">
                        ₹\${r.creditValue.toLocaleString('en-IN')}
                      </td>
                      <td style="font-family: var(--font-mono); color: \${r.billedRevenue > 0 ? '#dc2626' : 'var(--text-muted)'}; font-weight: 700;">
                        \${r.billedRevenue > 0 ? \`₹\${r.billedRevenue.toLocaleString('en-IN')}\` : '—'}
                      </td>
                    </tr>
                  \`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Peak Demand Chart (Dynamically Derived from Actual Data) -->
        <div class="card" style="padding: 18px 20px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--bg-surface);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0;">
              ⏰ Peak Demand Distribution (IST)
            </h4>
            <span style="font-size: 11px; color: var(--text-muted);">Derived dynamically from sessions</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 9px;">
            \${sortedHourSlots.length === 0 ? \`
              <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 12px;">No sessions booked in the selected window.</div>
            \` : sortedHourSlots.map(slot => {
              const cnt = hourlyCounts[slot] || 0;
              const barPct = Math.round((cnt / maxHourCount) * 100);
              return \`
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 3px;">
                    <span style="font-family: var(--font-mono);">\${this.formatTimeTo12Hour(slot)}</span>
                    <span style="color: #4f46e5; font-size: 11.5px;">\${cnt} reservation\${cnt === 1 ? '' : 's'}</span>
                  </div>
                  <div style="height: 8px; width: 100%; background: var(--border-subtle); border-radius: 999px; overflow: hidden;">
                    <div style="height: 100%; width: \${barPct}%; background: #4f46e5; border-radius: 999px;"></div>
                  </div>
                </div>
              \`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Startup-Wise Table (Operator Only) -->
      \${isOperator ? \`
        <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 14px; margin-bottom: 22px;">
          <div style="padding: 14px 20px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0;">🏢 Startup-Wise Meeting Room Usage &amp; Allowance Ledger</h4>
              <p style="font-size: 11.5px; color: var(--text-muted); margin: 2px 0 0 0;">All credit figures in hours. Used equals actual confirmed past bookings in the selected date range.</p>
            </div>
            <span class="badge badge-info" style="font-size: 11px; font-weight: 700;">Operator Console Only</span>
          </div>
          <div style="overflow-x: auto;">
            <table class="nexus-table" style="width: 100%; margin: 0; font-size: 12.5px;">
              <thead>
                <tr>
                  <th style="min-width: 160px;">Startup</th>
                  <th>Plan</th>
                  <th>Included Hrs</th>
                  <th>Used</th>
                  <th>Reserved</th>
                  <th>Remaining</th>
                  <th>Bookings</th>
                  <th>Booked Hrs</th>
                  <th>Overage Billed</th>
                </tr>
              </thead>
              <tbody>
                \${startupsList.length === 0 ? \`<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 20px;">No startup records found.</td></tr>\` :
                  startupsList.map(st => {
                    const planCatalog = window.PlanCatalog;
                    const planInfo = planCatalog ? planCatalog.resolvePlanForStartup(st) : { name: st.subscriptionPlan || 'Startup Plan', monthlyHours: st.includedMeetingHours || 15 };
                    const included = Number(planInfo.monthlyHours || st.includedMeetingHours || 15);

                    // Collect all confirmed bookings for this startup
                    const startupBookings = [];
                    (rooms || []).forEach(r => {
                      (r.bookings || []).forEach(b => {
                        if (!b || b.status === 'Cancelled') return;
                        if (minDate && b.date < minDate) return;
                        if (maxDate && b.date > maxDate) return;
                        const isMatch = (b.startupId === st.id || b.startupName === st.name || (b.startupName && b.startupName.toLowerCase() === st.name.toLowerCase()));
                        if (isMatch) {
                          startupBookings.push(Object.assign({}, b, { roomRate: r.hourlyRate || 1500 }));
                        }
                      });
                    });

                    // Past bookings = used, Future bookings = reserved
                    let usedHrs = 0;
                    let reservedHrs = 0;
                    let overageBilled = 0;

                    startupBookings.forEach(b => {
                      const dur = this.calculateBookingDuration(b.startTime, b.endTime);
                      const isPast = (b.date < ist.todayStr || (b.date === ist.todayStr && b.endTime <= ist.liveTimeStr));
                      if (isPast) {
                        usedHrs += dur;
                      } else {
                        reservedHrs += dur;
                      }
                      overageBilled += Number(b.cost || 0);
                    });

                    const totalBooked = usedHrs + reservedHrs;
                    const remaining = Math.max(0, included - totalBooked);
                    const isOver = (totalBooked > included);

                    return \`
                      <tr>
                        <td><strong>\${st.logoEmoji || '🚀'} \${st.name}</strong></td>
                        <td><span class="badge badge-primary" style="font-size: 10.5px;">\${planInfo.name}</span></td>
                        <td style="font-family: var(--font-mono); font-weight: 700;">\${included.toFixed(1)}h</td>
                        <td style="font-family: var(--font-mono); font-weight: 700; color: \${usedHrs > 0 ? '#111827' : 'var(--text-muted)'};">\${usedHrs.toFixed(1)}h</td>
                        <td style="font-family: var(--font-mono); color: #2563eb; font-weight: 700;">\${reservedHrs.toFixed(1)}h</td>
                        <td style="font-family: var(--font-mono); font-weight: 800; color: \${isOver ? '#dc2626' : '#16a34a'};">
                          \${remaining.toFixed(1)}h
                        </td>
                        <td style="font-family: var(--font-mono);">\${startupBookings.length}</td>
                        <td style="font-family: var(--font-mono); font-weight: 700;">\${totalBooked.toFixed(1)}h</td>
                        <td style="font-family: var(--font-mono); font-weight: 800; color: \${overageBilled > 0 ? '#dc2626' : 'var(--text-muted)'};">
                          \${overageBilled > 0 ? \`₹\${overageBilled.toLocaleString('en-IN')}\` : '—'}
                        </td>
                      </tr>
                    \`;
                  }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      \` : ''}
    \`;
  },`;

s = s.slice(0, startIdx) + newAnalyticsMethod + '\n\n' + s.slice(endIdx);
fs.writeFileSync(filePath, s, 'utf8');
console.log('✅ Updated renderAnalyticsTabView in js/modules/meetingRooms.js successfully!');

