# NEXUS Hub: Co-Working & Startup Incubation Management System

> **🌐 Live Production Deployment**: **[https://nexus-coworking-hub.vercel.app](https://nexus-coworking-hub.vercel.app)**

A state-of-the-art, end-to-end management platform engineered for co-working operators, technology incubators, and startup accelerators.

## 🚀 The Complete 8-Stage Lifecycle Covered

```
Startup Onboarding ➔ Workspace Allocation ➔ Meeting-Room Booking ➔ Rent Calculation ➔ Invoices ➔ Payments ➔ Incubation Tracking ➔ Reports & Analytics
```

---

### **1. 👥 Startup Onboarding Lifecycle**

When a startup joins the incubator, the system manages the complete progression:
```
Startup Registration ➔ Company Details ➔ Founder Details ➔ Documents Upload ➔ Verification ➔ Incubation Approval ➔ Workspace Allocation
```

#### **Stored Entity Fields:**
* **Startup Name**: Official trade & registered company name
* **Founder Details**: Primary founder, co-founders, role, bio
* **Email & Mobile**: Authorized corporate and founder contact credentials
* **Startup Category**: Sector classification (*AI & DeepTech, FinTech & Web3, BioTech / HealthTech, ClimateTech / EV, Supply Chain, AgriTech, Quantum Computing*)
* **Registration Number**: Corporate CIN / LLPIN / MCA registration reference
* **GST Details**: GSTIN or Provisional / Exemption status
* **Number of Employees**: Team size and workstation headcount requirement
* **Joining Date**: Official incubator admission date
* **Incubation Period**: Track tenure (*6 Months, 12 Months, 18 Months, 24 Months*)
* **Documents**: Upload checklist & audit log (*Certificate of Incorporation, GST Certificate, Pitch Deck, Founder KYC Proofs*)
* **Status**: Automated lifecycle state machine

#### **Lifecycle Status Progression:**
```
Applied ➔ Under Review ➔ Approved ➔ Incubated ➔ Completed
```
1. **Applied**: Application submitted through the multi-step registration wizard; awaiting screening.
2. **Under Review**: Document compliance and background verification in progress by legal and administrative ops.
3. **Approved**: Formally cleared by the incubation selection committee; ready for seat and cabin assignment.
4. **Incubated**: Workspace allocated on the interactive floor plan; active resident startup with billing & credits active.
5. **Completed**: Successfully completed incubation program and graduated to independent commercial facilities.

### **2. 🏢 Workspace Management**

Admin can manage all 7 categories of workspace resources across the hub:
* **Private Cabins** (e.g. `Cabin A-101`, Capacity: 10, Rent: ₹25,000/month, Status: Occupied)
* **Dedicated Desks** (e.g. `Desk D-101`, Capacity: 1, Rent: ₹12,000/month, Status: Occupied)
* **Hot Desks** (e.g. `Hot Desk H-01`, Capacity: 1, Rent: ₹7,500/month, Status: Available)
* **Meeting Rooms** (e.g. `Meeting Room M-01`, Capacity: 8, Rate: ₹500/hour, Status: Available)
* **Conference Rooms** (e.g. `Conference Room C-01 (Boardroom Alpha)`, Capacity: 20, Rate: ₹1,500/hour, Status: Occupied)
* **Training Rooms** (e.g. `Training Room T-01 (Innovation Lab)`, Capacity: 30, Rate: ₹2,000/hour, Status: Available)
* **Event Spaces** (e.g. `Event Arena E-01 (Nexus Townhall)`, Capacity: 100, Rate: ₹5,000/hour, Status: Available)

#### **Example Workspace Card Layout:**
```
Workspace
────────────────────
Cabin A-101
Type: Private Cabin
Capacity: 10
Rent: ₹25,000/month
Status: Occupied (Tenant: NeuroPulse AI)

Meeting Room M-01
Type: Meeting Room
Capacity: 8
Rate: ₹500/hour
Status: Available
```

#### **Admin Management Capabilities:**
1. **+ Add New Workspace**: Modal to create any workspace resource with code, category, seating capacity, pricing mode (monthly rent or hourly rate), location wing, and equipment/amenities.
2. **Edit Workspace Details**: Modify capacity, rate/rent, status, location, and amenities on the fly.
3. **Allocate Space**: Assign vacant cabins or desks directly to approved or incubated startups, automatically syncing tenancy and billing.
4. **Release Space**: Deallocate spaces and return them to Available status.
5. **View Modes**: Switch dynamically between the structured **Cards Inventory View** and the interactive **2D Visual Floor Plan Map**.

### **3. 📅 Meeting-Room Booking & Conflict Prevention**
- **Room Catalog**: Boardroom Alpha (16-pax, 4K dual display & Cisco Webex), Pitch Arena (35-pax laser projector & stage), Brainstorm Pod Beta, and Focus Room Quantum.
- **Smart Time-Slot Grid**: Interactive 9:00 AM – 8:00 PM slot scheduler.
- **Conflict Prevention Engine**: Prevents double-booking across overlapping time windows.
- **Credit Allowance & Overages**: Automatically deducts from monthly included credit hours (12 hrs/mo); overage hours are flagged for monthly invoicing.

### **4. ⚙️ Automated Rent Computation Engine**
- **Dynamic Fee Aggregation**: Computes monthly base fees for hot desks, dedicated workstations, and private cabins.
- **Add-On Subscriptions**: High-speed dedicated static IP & firewall (₹3,500/mo), secure locker bays (₹1,500/mo), unlimited artisan coffee pass (₹2,000/mo), and GPU server rack cluster (₹6,500/mo).
- **Incubation Grant Deduction**: Applies 25% or 50% grant credit automatically before tax.
- **GST Compliance**: Itemizes 18% GST (CGST 9% + SGST 9%) on taxable amount.

### **5. 🧾 Official Tax Invoices & Print Layout**
- **Batch Generation**: 1-click batch generation of monthly tax invoices for all active startups.
- **Itemized Tax Invoice View**: Hub GSTIN, PAN, bank account details, line-item description, unit rate, grant deduction, and UPI QR code.
- **Print / PDF Ready**: Dedicated `@media print` styling for clean, paperless or PDF invoice export.

### **6. 💳 Payment Management (Invoice → Payment → Receipt)**
- **3-Stage Lifecycle Pipeline**:
  - 🧾 **Invoice**: Itemized tax invoice with MCA & GST compliance, subsidy grant credits, and due dates.
  - 💳 **Payment**: Multi-gateway settlement hub supporting Razorpay, Stripe, and UPI with live status tracking.
  - 📄 **Receipt**: Official reconciled payment receipt voucher with UTR reference, QR verification, and printable A5 layout.
- **5 Canonical Payment Statuses**:
  - ⏳ **Pending**: Invoice issued and awaiting settlement within due date.
  - ✅ **Paid**: 100% Settled and reconciled with receipt voucher issued.
  - 🔸 **Partially Paid**: Installment payments tracked with real-time balance calculations and progress bars.
  - 🔴 **Overdue**: Past due date highlighted with urgent alerts and days overdue counter.
  - ❌ **Cancelled**: Voided/amended invoices with audit trail and cancellation reason.
- **Multi-Gateway Integration Hub (Portfolio Project Ready)**:
  - 💙 **Razorpay (India Gateway)**: Branded checkout simulator, Order ID generation, UPI QR, cards, NetBanking, and production SDK hook (`Razorpay.open()`).
  - 🟣 **Stripe (Global & Cards)**: Branded Stripe Elements UI, quick-fill test card (`4242`), 3D Secure simulation, and `Stripe.confirmCardPayment` hook.
  - 📱 **UPI / QR (Instant Settlement)**: Interactive dynamic QR pattern, VPA validator (`nexusincubation@icici`), intent launch simulators (GPay, PhonePe, Paytm, Cred), and validity timer.
  - 🏦 **NEFT / RTGS Wire Transfer**: Virtual CMS beneficiary details and bank UTR reference logger.
- **Interactive Lifecycle Inspector**: 1-click modal to trace any invoice across all 3 lifecycle stages from generation to receipt.
- **Fast Actions**: Quick Collect, 1-Click Partial Installment, Bulk Settlement, and Gateway Key Configuration.

### **7. 🎯 Incubation Milestones & Mentorship**
- **Incubation Maturity Funnel**: Tracks progress across Ideation ➔ MVP ➔ Product-Market Fit ➔ Early Traction ➔ Growth / Fundraising ➔ Graduated.
- **Milestone Progress Tracker**: Target completion dates, progress sliders, KPI impact, and mentor guidance notes.
- **Mentors Network**: Dedicated mentor profiles across AI Architecture, FinTech Compliance, MedTech Clinical Trials, and EV Battery Systems.

### **8. 📊 Intelligence, Analytics & CSV Export**
- **Live SVG Visualizations**:
  - 5-Month Revenue & Collections Breakdown (Workspace Rent vs Add-ons vs Meeting Fees)
  - Donut Occupancy Breakdown across hot desks, dedicated bays, and private suites
  - Cohort Stage Distribution Funnel
  - Meeting Room Utilization Meters
- **CSV Data Exporter**: Instant download of Startups Directory and Invoices Ledger.

---

## 💻 How to Run Locally

### **Option 1: Using the Local Node Server (Recommended)**
```bash
# Start server (runs on http://localhost:5173/)
node server.js
```

### **Option 2: Direct Browser Launch**
You can also open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).

---

## 🎨 Design Features
- **Curated Cyber Midnight & Clean Light Themes**: Toggle anytime with the header button.
- **Role Perspective Switcher**: Switch between **Hub Admin** and **Founder Portal (NeuroPulse AI)** to preview the system from both viewpoints.
- **Persistent LocalStorage**: Edits, bookings, new startups, and payments persist in browser storage. Click **"Reset Demo Data"** anytime to restore default seed data.
