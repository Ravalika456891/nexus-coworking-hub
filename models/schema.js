/**
 * NEXUS HUB — Unified MongoDB Schema, Validators & Index Definitions
 * 
 * Part 5: One Owner Per Fact
 * - Times stored in UTC, displayed in IST
 * - Money in integer paise (1 INR = 100 paise)
 * - Credits as integers (10 credits = 1 hour)
 * - roomSlots unique index on { roomId: 1, slotStart: 1 } as atomic overlap guard
 * - creditLedger append-only with unique index on { companyId: 1, entryType: 1, sourceId: 1 }
 */

const SCHEMAS = {
  companies: {
    $jsonSchema: {
      bsonType: "object",
      required: ["legalName", "startupCode", "status", "founderContact", "planId"],
      properties: {
        legalName: { bsonType: "string", description: "Official company / legal entity name" },
        startupCode: { bsonType: "string", pattern: "^STP-[A-Z0-9_-]+$", description: "Unique immutable company identifier" },
        status: { enum: ["applied", "under_review", "approved", "incubated", "graduated"] },
        sector: { bsonType: "string" },
        stage: { bsonType: "string" },
        teamSize: { bsonType: "int", minimum: 1 },
        gstin: { bsonType: "string" },
        pan: { bsonType: "string" },
        billingAddress: {
          bsonType: "object",
          properties: {
            line1: { bsonType: "string" },
            city: { bsonType: "string" },
            state: { bsonType: "string" },
            pincode: { bsonType: "string" }
          }
        },
        planId: { bsonType: "string" },
        hoursOverride: { bsonType: ["int", "double", "null"] },
        hoursOverrideReason: { bsonType: ["string", "null"] },
        founderContact: {
          bsonType: "object",
          required: ["name", "email", "phone"],
          properties: {
            name: { bsonType: "string" },
            email: { bsonType: "string" },
            phone: { bsonType: "string" }
          }
        }
      }
    }
  },

  plans: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name", "monthlyHours", "monthlyCredits", "pricePaise"],
      properties: {
        id: { bsonType: "string" },
        name: { bsonType: "string" },
        monthlyHours: { bsonType: ["int", "double"], minimum: 0 },
        monthlyCredits: { bsonType: "int", minimum: 0 },
        pricePaise: { bsonType: "int", minimum: 0 },
        gstHandling: {
          bsonType: "object",
          required: ["ratePercent", "isInclusive"],
          properties: {
            ratePercent: { bsonType: "int" },
            isInclusive: { bsonType: "bool" }
          }
        }
      }
    }
  },

  rooms: {
    $jsonSchema: {
      bsonType: "object",
      required: ["code", "name", "floor", "type", "capacity", "creditRatePerHour", "hourlyPricePaise"],
      properties: {
        code: { bsonType: "string" },
        name: { bsonType: "string" },
        floor: { bsonType: "int" },
        type: { bsonType: "string" },
        capacity: { bsonType: "int", minimum: 1 },
        creditRatePerHour: { bsonType: "int", minimum: 1 },
        hourlyPricePaise: { bsonType: "int", minimum: 0 },
        operatingHours: {
          bsonType: "object",
          properties: {
            start: { bsonType: "string" },
            end: { bsonType: "string" },
            tz: { bsonType: "string" }
          }
        },
        amenities: { bsonType: "array", items: { bsonType: "string" } },
        photos: { bsonType: "array", items: { bsonType: "string" } }
      }
    }
  },

  bookings: {
    $jsonSchema: {
      bsonType: "object",
      required: ["ref", "companyId", "roomId", "startUtc", "endUtc", "attendees", "title", "status", "creditsCharged"],
      properties: {
        ref: { bsonType: "string", pattern: "^BKG-\\d{8}-\\d{4}$" },
        companyId: { bsonType: "string" },
        roomId: { bsonType: "string" },
        startUtc: { bsonType: "date" },
        endUtc: { bsonType: "date" },
        durationHours: { bsonType: ["int", "double"] },
        attendees: { bsonType: "int", minimum: 1 },
        title: { bsonType: "string", minLength: 1 },
        purpose: { bsonType: "string" },
        status: { enum: ["Confirmed", "Cancelled", "Completed", "NoShow"] },
        seriesId: { bsonType: ["string", "null"] },
        creditsCharged: { bsonType: "int", minimum: 0 },
        createdBy: { bsonType: "string" },
        createdAt: { bsonType: "date" }
      }
    }
  },

  roomSlots: {
    $jsonSchema: {
      bsonType: "object",
      required: ["roomId", "slotStartUtc", "bookingRef", "companyId"],
      properties: {
        roomId: { bsonType: "string" },
        slotStartUtc: { bsonType: "date" },
        bookingRef: { bsonType: "string" },
        companyId: { bsonType: "string" },
        createdAt: { bsonType: "date" }
      }
    }
  },

  creditLedger: {
    $jsonSchema: {
      bsonType: "object",
      required: ["companyId", "month", "entryType", "bucket", "credits", "sourceId"],
      properties: {
        companyId: { bsonType: "string" },
        month: { bsonType: "string", pattern: "^\\d{4}-\\d{2}$" },
        entryType: { enum: ["plan_credit", "topup", "debit", "refund", "forfeit", "expiry"] },
        bucket: { enum: ["plan", "topup"] },
        credits: { bsonType: "int" },
        sourceId: { bsonType: "string" },
        description: { bsonType: "string" },
        expiresAtUtc: { bsonType: ["date", "null"] },
        createdAtUtc: { bsonType: "date" }
      }
    }
  },

  topupOrders: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "companyId", "packId", "credits", "amountPaise", "status", "invoiceNumber"],
      properties: {
        id: { bsonType: "string" },
        companyId: { bsonType: "string" },
        packId: { bsonType: "string" },
        credits: { bsonType: "int" },
        amountPaise: { bsonType: "int" },
        status: { enum: ["pending", "paid", "failed", "cancelled"] },
        invoiceNumber: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        paidAt: { bsonType: ["date", "null"] }
      }
    }
  },

  invoices: {
    $jsonSchema: {
      bsonType: "object",
      required: ["invoiceNumber", "companyId", "amountPaise", "taxPaise", "totalPaise", "status", "issueDateUtc", "dueDateUtc"],
      properties: {
        invoiceNumber: { bsonType: "string", pattern: "^INV/\\d{4}-\\d{2}/\\d{4}$" },
        companyId: { bsonType: "string" },
        description: { bsonType: "string" },
        amountPaise: { bsonType: "int" },
        taxPaise: { bsonType: "int" },
        totalPaise: { bsonType: "int" },
        status: { enum: ["Draft", "Pending", "Paid", "Overdue", "Voided"] },
        issueDateUtc: { bsonType: "date" },
        dueDateUtc: { bsonType: "date" },
        paidAtUtc: { bsonType: ["date", "null"] },
        items: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["description", "amountPaise"],
            properties: {
              description: { bsonType: "string" },
              quantity: { bsonType: "int" },
              unitPricePaise: { bsonType: "int" },
              amountPaise: { bsonType: "int" }
            }
          }
        }
      }
    }
  },

  creditNotes: {
    $jsonSchema: {
      bsonType: "object",
      required: ["creditNoteNumber", "invoiceNumber", "companyId", "amountPaise", "reason", "settledVia"],
      properties: {
        creditNoteNumber: { bsonType: "string", pattern: "^CN/\\d{4}-\\d{2}/\\d{4}$" },
        invoiceNumber: { bsonType: "string" },
        companyId: { bsonType: "string" },
        amountPaise: { bsonType: "int" },
        reason: { bsonType: "string" },
        settledVia: { enum: ["refund", "credit_balance", "adjustment"] },
        createdAt: { bsonType: "date" }
      }
    }
  },

  payments: {
    $jsonSchema: {
      bsonType: "object",
      required: ["gatewayRef", "invoiceNumber", "companyId", "amountPaise", "status"],
      properties: {
        gatewayRef: { bsonType: "string" },
        invoiceNumber: { bsonType: "string" },
        companyId: { bsonType: "string" },
        amountPaise: { bsonType: "int" },
        method: { bsonType: "string" },
        status: { enum: ["success", "failed", "pending", "refunded"] },
        paidAtUtc: { bsonType: "date" }
      }
    }
  },

  workspaceUnits: {
    $jsonSchema: {
      bsonType: "object",
      required: ["code", "wing", "type", "seats", "listPricePaise", "status"],
      properties: {
        code: { bsonType: "string" },
        wing: { bsonType: "string" },
        type: { enum: ["Hot Desk", "Dedicated Desk", "Private Cabin", "Team Pod"] },
        seats: { bsonType: "int", minimum: 1 },
        listPricePaise: { bsonType: "int", minimum: 0 },
        status: { enum: ["free", "held", "taken", "maintenance"] }
      }
    }
  },

  allocations: {
    $jsonSchema: {
      bsonType: "object",
      required: ["companyId", "unitId", "fromUtc", "status", "agreedPricePaise"],
      properties: {
        companyId: { bsonType: "string" },
        unitId: { bsonType: "string" },
        fromUtc: { bsonType: "date" },
        toUtc: { bsonType: ["date", "null"] },
        status: { enum: ["active", "pending", "terminated"] },
        agreedPricePaise: { bsonType: "int" },
        approvedBy: { bsonType: "string" }
      }
    }
  },

  visitors: {
    $jsonSchema: {
      bsonType: "object",
      required: ["passCode", "companyId", "visitorName", "visitorPhone", "purpose", "status"],
      properties: {
        passCode: { bsonType: "string", pattern: "^PASS-\\d{4}-\\d{4}$" },
        companyId: { bsonType: "string" },
        visitorName: { bsonType: "string" },
        visitorPhone: { bsonType: "string" },
        visitorEmail: { bsonType: ["string", "null"] },
        guestCompany: { bsonType: "string" },
        hostEmployee: { bsonType: "string" },
        purpose: { bsonType: "string" },
        idType: { bsonType: "string" },
        visitDate: { bsonType: "string" },
        visitTime: { bsonType: "string" },
        status: { enum: ["Expected", "Checked In", "Completed", "Cancelled"] },
        checkInTimeUtc: { bsonType: ["date", "null"] },
        checkOutTimeUtc: { bsonType: ["date", "null"] },
        createdAt: { bsonType: "date" }
      }
    }
  },

  inquiries: {
    $jsonSchema: {
      bsonType: "object",
      required: ["ticketNumber", "companyId", "fullName", "email", "phone", "category", "subject", "message", "status"],
      properties: {
        ticketNumber: { bsonType: "string" },
        companyId: { bsonType: "string" },
        fullName: { bsonType: "string" },
        email: { bsonType: "string" },
        phone: { bsonType: "string" },
        category: { bsonType: "string" },
        subject: { bsonType: "string" },
        message: { bsonType: "string" },
        status: { enum: ["New", "In progress", "Replied", "Closed"] },
        slaExpiresAtUtc: { bsonType: "date" },
        createdAt: { bsonType: "date" }
      }
    }
  },

  tickets: {
    $jsonSchema: {
      bsonType: "object",
      required: ["ticketId", "companyId", "category", "priority", "description", "status"],
      properties: {
        ticketId: { bsonType: "string" },
        companyId: { bsonType: "string" },
        category: { bsonType: "string" },
        priority: { bsonType: "string" },
        location: { bsonType: "string" },
        description: { bsonType: "string" },
        status: { enum: ["Open", "In Progress", "Resolved", "Closed"] },
        slaHours: { bsonType: "int" },
        createdAt: { bsonType: "date" }
      }
    }
  },

  milestones: {
    $jsonSchema: {
      bsonType: "object",
      required: ["milestoneId", "companyId", "title", "dueDate", "status"],
      properties: {
        milestoneId: { bsonType: "string" },
        companyId: { bsonType: "string" },
        title: { bsonType: "string" },
        dueDate: { bsonType: "string" },
        status: { enum: ["Pending", "Completed", "Overdue"] },
        mentorVerified: { bsonType: "bool" }
      }
    }
  },

  mentors: {
    $jsonSchema: {
      bsonType: "object",
      required: ["mentorId", "name", "domain"],
      properties: {
        mentorId: { bsonType: "string" },
        name: { bsonType: "string" },
        domain: { bsonType: "string" },
        allocatedHours: { bsonType: ["int", "double"] }
      }
    }
  },

  auditLogs: {
    $jsonSchema: {
      bsonType: "object",
      required: ["timestampUtc", "actor", "action", "entityType", "entityId"],
      properties: {
        timestampUtc: { bsonType: "date" },
        actor: { bsonType: "string" },
        action: { bsonType: "string" },
        entityType: { bsonType: "string" },
        entityId: { bsonType: "string" },
        details: { bsonType: "object" }
      }
    }
  }
};

const INDEX_DEFINITIONS = {
  companies: [
    { key: { startupCode: 1 }, options: { unique: true, name: "uniq_startupCode" } },
    { key: { "founderContact.email": 1 }, options: { unique: true, name: "uniq_founder_email" } },
    { key: { status: 1 }, options: { name: "idx_status" } }
  ],
  plans: [
    { key: { id: 1 }, options: { unique: true, name: "uniq_plan_id" } }
  ],
  rooms: [
    { key: { code: 1 }, options: { unique: true, name: "uniq_room_code" } },
    { key: { name: 1 }, options: { name: "idx_room_name" } }
  ],
  bookings: [
    { key: { ref: 1 }, options: { unique: true, name: "uniq_booking_ref" } },
    { key: { companyId: 1, startUtc: 1 }, options: { name: "idx_company_bookings" } },
    { key: { roomId: 1, startUtc: 1 }, options: { name: "idx_room_schedule" } },
    { key: { status: 1 }, options: { name: "idx_booking_status" } }
  ],
  roomSlots: [
    // CRITICAL ATOMIC OVERLAP GUARD: 1 document per room per 30-min slot
    { key: { roomId: 1, slotStartUtc: 1 }, options: { unique: true, name: "uniq_room_30min_slot" } },
    { key: { bookingRef: 1 }, options: { name: "idx_slot_bookingRef" } }
  ],
  creditLedger: [
    // CRITICAL IDEMPOTENCY GUARD: append-only ledger
    { key: { companyId: 1, entryType: 1, sourceId: 1 }, options: { unique: true, name: "uniq_ledger_idempotency" } },
    { key: { companyId: 1, month: 1, createdAtUtc: -1 }, options: { name: "idx_company_month_ledger" } }
  ],
  topupOrders: [
    { key: { id: 1 }, options: { unique: true, name: "uniq_topup_order_id" } },
    { key: { companyId: 1 }, options: { name: "idx_company_topups" } },
    { key: { invoiceNumber: 1 }, options: { name: "idx_topup_invoice" } }
  ],
  invoices: [
    { key: { invoiceNumber: 1 }, options: { unique: true, name: "uniq_invoice_number" } },
    { key: { companyId: 1, status: 1 }, options: { name: "idx_company_invoices" } }
  ],
  creditNotes: [
    { key: { creditNoteNumber: 1 }, options: { unique: true, name: "uniq_credit_note_num" } },
    { key: { invoiceNumber: 1 }, options: { name: "idx_cn_invoice" } }
  ],
  payments: [
    { key: { gatewayRef: 1 }, options: { unique: true, name: "uniq_payment_gatewayRef" } },
    { key: { invoiceNumber: 1 }, options: { name: "idx_payment_invoice" } }
  ],
  workspaceUnits: [
    { key: { code: 1 }, options: { unique: true, name: "uniq_unit_code" } },
    { key: { status: 1 }, options: { name: "idx_unit_status" } }
  ],
  allocations: [
    { key: { companyId: 1, status: 1 }, options: { name: "idx_allocation_company" } },
    { key: { unitId: 1 }, options: { name: "idx_allocation_unit" } }
  ],
  visitors: [
    { key: { passCode: 1 }, options: { unique: true, name: "uniq_visitor_pass" } },
    { key: { companyId: 1, visitDate: 1 }, options: { name: "idx_company_visitors" } }
  ],
  inquiries: [
    { key: { ticketNumber: 1 }, options: { unique: true, name: "uniq_inquiry_ticket" } },
    { key: { companyId: 1 }, options: { name: "idx_company_inquiries" } }
  ],
  tickets: [
    { key: { ticketId: 1 }, options: { unique: true, name: "uniq_ticket_id" } },
    { key: { companyId: 1 }, options: { name: "idx_company_tickets" } }
  ],
  milestones: [
    { key: { milestoneId: 1 }, options: { unique: true, name: "uniq_milestone_id" } },
    { key: { companyId: 1 }, options: { name: "idx_company_milestones" } }
  ],
  mentors: [
    { key: { mentorId: 1 }, options: { unique: true, name: "uniq_mentor_id" } }
  ],
  auditLogs: [
    { key: { timestampUtc: -1 }, options: { name: "idx_audit_timestamp" } },
    { key: { entityType: 1, entityId: 1 }, options: { name: "idx_audit_entity" } }
  ]
};

async function applyIndexes(db) {
  console.log('⚡ Applying MongoDB indexes for unified collections...');
  const results = {};
  for (const [colName, indexes] of Object.entries(INDEX_DEFINITIONS)) {
    const col = db.collection(colName);
    results[colName] = [];
    for (const idx of indexes) {
      try {
        const res = await col.createIndex(idx.key, idx.options);
        results[colName].push({ status: 'created', name: res });
      } catch (err) {
        results[colName].push({ status: 'error', message: err.message, index: idx.options.name });
      }
    }
  }
  return results;
}

module.exports = {
  SCHEMAS,
  INDEX_DEFINITIONS,
  applyIndexes
};

