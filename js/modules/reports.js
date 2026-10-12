// Module: Reports, Visual Analytics & CSV Data Export

const ReportsModule = {
  render() {
    const container = document.getElementById('view-reports');
    if (!container) return;

    const stats = window.store.getDashboardStats();
    const startups = window.store.getStartups();
    const spaces = window.store.getSpaces();
    const invoices = window.store.getInvoices();
    const rooms = window.store.getMeetingRooms();

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary);">
            Reports & Incubation Intelligence
          </h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
            Executive metrics, occupancy utilization, financial run-rate, and cohort growth analytics.
          </p>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="ReportsModule.exportCSV('invoices')">
            📥 Export Invoices CSV
          </button>
          <button class="btn btn-primary" onclick="ReportsModule.exportCSV('startups')">
            📥 Export Startups CSV
          </button>
        </div>
      </div>

      <!-- Financial & Occupancy Charts Row -->
      <div class="grid-2col" style="margin-bottom: 24px;">
        <!-- Chart 1: Revenue Breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📊 Monthly Revenue Trend (Last 5 Months)</span>
            </div>
            <span class="badge badge-success">₹${(stats.mrr/100000).toFixed(2)}L Current MRR</span>
          </div>
          <div>
            ${this.renderRevenueSvgChart()}
          </div>
          <div style="display: flex; justify-content: space-around; margin-top: 14px; font-size: 11.5px; color: var(--text-secondary);">
            <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; background: #6366f1; border-radius: 2px;"></span> Workspace Rent</span>
            <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; background: #10b981; border-radius: 2px;"></span> Add-on Services</span>
            <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; background: #f59e0b; border-radius: 2px;"></span> Meeting Overages</span>
          </div>
        </div>

        <!-- Chart 2: Space Occupancy Breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🏢 Space Utilization by Zone</span>
            </div>
            <span class="badge badge-info">${stats.occupancyRate}% Overall Occupancy</span>
          </div>
          <div>
            ${this.renderOccupancySvgDonut(spaces)}
          </div>
          <div style="display: flex; justify-content: space-around; margin-top: 14px; font-size: 11.5px; color: var(--text-secondary);">
            <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; background: #6366f1; border-radius: 2px;"></span> Hot Desks</span>
            <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; background: #8b5cf6; border-radius: 2px;"></span> Dedicated Desks</span>
            <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; background: #ec4899; border-radius: 2px;"></span> Private Cabins</span>
          </div>
        </div>
      </div>

      <!-- Incubation Stages & Meeting Room Utilization Row -->
      <div class="grid-2col">
        <!-- Chart 3: Incubation Cohort Stage Distribution -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🚀 Incubation Portfolio Distribution</span>
            </div>
            <span class="badge badge-subtle">${startups.length} Founders</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; padding: 10px 0;">
            ${this.renderCohortDistributionBars(startups)}
          </div>
        </div>

        <!-- Chart 4: Meeting Room Usage Hours -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📅 Meeting Room Demand & Bookings</span>
            </div>
            <span class="badge badge-info">${stats.totalRoomBookingsCount} Total Bookings</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px; padding: 10px 0;">
            ${rooms.map(r => {
              const bCount = (r.bookings || []).filter(b => b.status !== 'Cancelled').length;
              const fillPct = Math.min(100, bCount * 25);
              return `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 5px;">
                    <strong>${r.icon} ${r.name} (${r.capacity} Pax)</strong>
                    <span style="color: var(--accent-primary); font-weight: 700;">${bCount} Bookings</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${fillPct}%; background: ${r.badgeColor};"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderRevenueSvgChart() {
    // 5 months: Jun, Jul, Aug, Sep, Oct
    const months = [
      { name: 'Jun', total: 180, h1: 120, h2: 40, h3: 20 },
      { name: 'Jul', total: 220, h1: 150, h2: 50, h3: 20 },
      { name: 'Aug', total: 275, h1: 190, h2: 60, h3: 25 },
      { name: 'Sep', total: 310, h1: 220, h2: 65, h3: 25 },
      { name: 'Oct', total: 360, h1: 260, h2: 70, h3: 30 }
    ];

    const maxVal = 400;
    const chartHeight = 160;

    return `
      <div style="width: 100%; height: 180px; position: relative; padding-top: 20px;">
        <svg viewBox="0 0 500 170" width="100%" height="100%" style="overflow: visible;">
          <!-- Grid lines -->
          <line x1="30" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4" />
          <line x1="30" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4" />
          <line x1="30" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4" />
          <line x1="30" y1="150" x2="480" y2="150" stroke="rgba(255,255,255,0.15)" />

          ${months.map((m, idx) => {
            const x = 70 + idx * 90;
            const hRent = (m.h1 / maxVal) * chartHeight;
            const hAddon = (m.h2 / maxVal) * chartHeight;
            const hMeet = (m.h3 / maxVal) * chartHeight;

            const yRent = 150 - hRent;
            const yAddon = yRent - hAddon;
            const yMeet = yAddon - hMeet;

            return `
              <g>
                <!-- Stacked bar -->
                <rect x="${x - 18}" y="${yRent}" width="36" height="${hRent}" fill="#6366f1" rx="2" />
                <rect x="${x - 18}" y="${yAddon}" width="36" height="${hAddon}" fill="#10b981" rx="2" />
                <rect x="${x - 18}" y="${yMeet}" width="36" height="${hMeet}" fill="#f59e0b" rx="2" />
                <!-- Total label -->
                <text x="${x}" y="${yMeet - 6}" font-size="11" fill="var(--text-primary)" font-weight="700" text-anchor="middle">₹${(m.total/100).toFixed(1)}L</text>
                <!-- Month label -->
                <text x="${x}" y="165" font-size="12" fill="var(--text-secondary)" text-anchor="middle">${m.name}</text>
              </g>
            `;
          }).join('')}
        </svg>
      </div>
    `;
  },

  renderOccupancySvgDonut(spaces) {
    const hotDesks = spaces.filter(s => s.type === 'Hot Desk');
    const dedDesks = spaces.filter(s => s.type === 'Dedicated Desk');
    const cabins = spaces.filter(s => s.type === 'Private Cabin');

    const hotOcc = hotDesks.filter(s => s.status === 'occupied').length;
    const dedOcc = dedDesks.filter(s => s.status === 'occupied').length;
    const cabOcc = cabins.filter(s => s.status === 'occupied').length;

    return `
      <div style="display: flex; align-items: center; justify-content: center; height: 180px; gap: 28px;">
        <svg viewBox="0 0 160 160" width="150" height="150">
          <circle cx="80" cy="80" r="58" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18" />
          
          <!-- Dedicated Desks: 6 occupied of 10 -->
          <circle cx="80" cy="80" r="58" fill="none" stroke="#8b5cf6" stroke-width="18"
            stroke-dasharray="140 365" stroke-dashoffset="0" stroke-linecap="round" />
          
          <!-- Cabins: 3 occupied of 5 -->
          <circle cx="80" cy="80" r="58" fill="none" stroke="#ec4899" stroke-width="18"
            stroke-dasharray="110 365" stroke-dashoffset="-150" stroke-linecap="round" />
          
          <!-- Hot Desks -->
          <circle cx="80" cy="80" r="58" fill="none" stroke="#6366f1" stroke-width="18"
            stroke-dasharray="60 365" stroke-dashoffset="-270" stroke-linecap="round" />

          <text x="80" y="76" font-size="22" font-weight="900" fill="var(--text-primary)" text-anchor="middle" font-family="var(--font-mono)">
            ${Math.round((spaces.filter(s=>s.status==='occupied').length / spaces.length)*100)}%
          </text>
          <text x="80" y="94" font-size="11" fill="var(--text-muted)" text-anchor="middle">OCCUPIED</text>
        </svg>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
          <div>Hot Desks: <strong>${hotOcc}/${hotDesks.length}</strong></div>
          <div>Dedicated: <strong>${dedOcc}/${dedDesks.length}</strong></div>
          <div>Cabins: <strong>${cabOcc}/${cabins.length}</strong></div>
          <div style="color: var(--text-muted); font-size: 11px;">Total Capacity: 54 workstations</div>
        </div>
      </div>
    `;
  },

  renderCohortDistributionBars(startups) {
    const stageCounts = {
      'Ideation': startups.filter(s => s.stage === 'Ideation').length,
      'MVP': startups.filter(s => s.stage === 'MVP').length,
      'Product-Market Fit': startups.filter(s => s.stage === 'Product-Market Fit').length,
      'Early Traction': startups.filter(s => s.stage === 'Early Traction').length,
      'Growth / Fundraising': startups.filter(s => s.stage === 'Growth / Fundraising').length,
      'Graduated': startups.filter(s => s.stage === 'Graduated').length
    };

    const total = Math.max(1, startups.length);

    return Object.entries(stageCounts).map(([stage, count]) => {
      const pct = Math.round((count / total) * 100);
      return `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
            <span>${stage}</span>
            <span style="font-weight: 700;">${count} (${pct}%)</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  exportCSV(type) {
    if (type === 'startups') {
      const startups = window.store.getStartups();
      let csv = 'ID,Name,Sector,Cohort,Stage,Status,Founder,Email,TeamSize,AllocatedSeats,SubsidyPct,ReadinessScore\n';
      startups.forEach(s => {
        csv += `"${s.id}","${s.name}","${s.sector}","${s.cohort}","${s.stage}","${s.status}","${s.founders.name}","${s.founders.email}",${s.teamSize},"${(s.allocatedSeats||[]).join(';')}",${s.monthlyGrantSubsidyPercent},${s.metrics.readinessScore}\n`;
      });
      this.downloadBlob(csv, 'nexus_incubated_startups_directory.csv');
      App.showToast('📥 Exported Startups Directory to CSV!', 'success');
    } else if (type === 'invoices') {
      const invoices = window.store.getInvoices();
      let csv = 'InvoiceID,StartupID,StartupName,BillingPeriod,IssueDate,DueDate,Subtotal,Subsidy,Taxable,GST,Total,Status\n';
      invoices.forEach(inv => {
        csv += `"${inv.id}","${inv.startupId}","${inv.startupName}","${inv.billingPeriod}","${inv.issueDate}","${inv.dueDate}",${inv.subtotal},${inv.subsidyDeduction},${inv.taxableAmount},${inv.taxGst},${inv.total},"${inv.status}"\n`;
      });
      this.downloadBlob(csv, 'nexus_invoices_and_revenue.csv');
      App.showToast('📥 Exported Invoices & Collections to CSV!', 'success');
    }
  },

  downloadBlob(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
