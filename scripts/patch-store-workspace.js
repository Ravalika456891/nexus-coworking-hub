const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'js', 'store.js');
let s = fs.readFileSync(storePath, 'utf8');

const targetMethod = `getWorkspaces() {
    if (!this.state.workspaces) {
      this.state.workspaces = JSON.parse(JSON.stringify(window.INITIAL_DATA.workspaces || []));
    }
    return this.state.workspaces;
  }

  getWorkspaceById(id) {
    const list = this.getWorkspaces();
    return list.find(w => w.id === id || w.code === id || w.name === id);
  }

  getWorkspaceStats() {
    const list = this.getWorkspaces();
    const occupied = list.filter(w => w.status === 'Occupied');
    const available = list.filter(w => w.status === 'Available');
    const reserved = list.filter(w => w.status === 'Reserved');
    const maintenance = list.filter(w => w.status === 'Maintenance');
    const totalCapacity = list.reduce((sum, w) => sum + (Number(w.capacity) || 0), 0);
    const occupiedCapacity = occupied.reduce((sum, w) => sum + (Number(w.capacity) || 0), 0);

    return {
      totalCount: list.length,
      occupiedCount: occupied.length,
      availableCount: available.length,
      reservedCount: reserved.length,
      maintenanceCount: maintenance.length,
      totalCapacity,
      occupiedCapacity,
      utilizationRate: totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0
    };
  }`;

const replacementMethod = `getWorkspaces() {
    return this.getSpaces();
  }

  getWorkspaceById(id) {
    const list = this.getSpaces();
    return list.find(w => w.id === id || w.code === id || w.name === id || w.label === id);
  }

  getWorkspaceStats(startupId = null) {
    const list = this.getSpaces();
    const myId = startupId || (this.getActiveStartup ? this.getActiveStartup()?.id : null) || 'STP-XYZ';
    const myName = (this.getActiveStartup ? this.getActiveStartup()?.name : null) || 'XYZ Technologies';

    let free = 0;
    let booked_by_you = 0;
    let taken = 0;
    let held = 0;
    let maintenance = 0;
    let totalCapacity = 0;
    let occupiedCapacity = 0;

    list.forEach(w => {
      const cap = Number(w.capacity) || 1;
      totalCapacity += cap;
      const st = String(w.status || 'available').toLowerCase();
      const isMine = (w.allocatedStartupId === myId || (w.allocatedStartupName && w.allocatedStartupName === myName));

      if (st === 'maintenance') {
        maintenance++;
      } else if (st === 'reserved' || st === 'held' || w.isHeld) {
        held++;
      } else if (isMine) {
        booked_by_you++;
        occupiedCapacity += cap;
      } else if (st === 'occupied' || w.allocatedStartupId) {
        taken++;
        occupiedCapacity += cap;
      } else {
        free++;
      }
    });

    const totalUnits = list.length;
    // Mathematical Identity: free + booked_by_you + taken + held + maintenance === totalUnits
    return {
      totalCount: totalUnits,
      totalUnits,
      free,
      booked_by_you,
      taken,
      held,
      maintenance,
      // Backwards-compatible fields
      availableCount: free,
      occupiedCount: taken + booked_by_you,
      reservedCount: held,
      maintenanceCount: maintenance,
      totalCapacity,
      occupiedCapacity,
      availableCapacity: totalCapacity - occupiedCapacity,
      utilizationRate: totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0
    };
  }`;

// Replace with normalized line endings
const sNorm = s.replace(/\\r\\n/g, '\\n');
const targetNorm = targetMethod.replace(/\\r\\n/g, '\\n');

if (sNorm.includes(targetNorm)) {
  s = sNorm.replace(targetNorm, replacementMethod);
  fs.writeFileSync(storePath, s, 'utf8');
  console.log('✅ Updated getWorkspaces and getWorkspaceStats in js/store.js');
} else {
  console.error('Target getWorkspaces method not matched directly!');
  process.exit(1);
}
