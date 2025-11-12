# Implementation Plan: NOD POS System

**Feature Branch**: `001-nod-pos-core`  
**Plan Created**: 2025-11-13  
**Status**: Draft  
**Based On**: `spec.md` (Specification version: Draft)

---

## Executive Summary

The NOD POS System is a cloud-native, real-time Point of Sales platform designed to:
- Receive and process Pick-Up orders from the NOD mobile app via secure webhooks
- Enable in-store order creation and management for walk-in customers
- Integrate multi-method payment processing (QRIS, e-wallets, cards)
- Print thermal receipts and deliver digital receipts via WhatsApp
- Maintain full audit trails and synchronize order status with the mobile app

This plan outlines the architecture, delivery phases, technical approach, and key integration points.

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      NOD Mobile App                              │
│          (Order placement, order status tracking)                │
└────────────────────┬────────────────────────────────────────────┘
                     │ Push Orders (webhook)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NOD POS Backend                                │
│  ┌──────────────────┬──────────────────┬──────────────────────┐ │
│  │  Order Service   │  Payment Service │  Receipt Service     │ │
│  │ (ingestion,      │ (payment         │ (thermal printer,    │ │
│  │  management)     │  processing)     │  WhatsApp delivery)  │ │
│  └──────────────────┴──────────────────┴──────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Data Layer                                 │ │
│  │  ┌─────────────┐  ┌────────────┐  ┌──────────────┐          │ │
│  │  │ PostgreSQL  │  │   Redis    │  │  S3/Storage  │          │ │
│  │  │ (persistent)│  │  (cache,   │  │  (receipts)  │          │ │
│  │  │             │  │   queues)  │  │              │          │ │
│  │  └─────────────┘  └────────────┘  └──────────────┘          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Event Sourcing & Audit                           │ │
│  │         (Order events, payment attempts, receipts)            │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
       ▲              ▲                    ▲
       │              │                    │
    Status       Menu Updates        Payment
    Updates      (sync window)        Webhook
       │              │                    │
┌──────┴──────┬───────┴─────┬─────────────┴──────┐
│             │             │                    │
▼             ▼             ▼                    ▼
Mobile   Back Office     Payment         Thermal Printer
App      Dashboard       Provider        / WhatsApp API
```

### Key Design Decisions

#### 1. Webhook-Based Order Ingestion (FR-013)
- **Decision**: Implement idempotent webhook endpoint with client-side order ID deduplication
- **Rationale**: Ensures mobile app can retry safely; POS decoupled from real-time mobile connectivity
- **Implementation**: 
  - Unique constraint on `(store_id, client_order_id)`
  - Webhook response includes acknowledgment
  - Failed deliveries retry with exponential backoff (mobile app side)

#### 2. Event Sourcing for Audit Trail (FR-010)
- **Decision**: All order state changes logged as immutable events
- **Rationale**: 
  - Native audit trail without separate logging layer
  - Easy replay/reconciliation on POS restart
  - Strong compliance posture for payment disputes
- **Implementation**:
  - Event table: `(id, aggregate_id, event_type, timestamp, data, actor_id)`
  - Order snapshots for performance (snapshot every 100 events)

#### 3. Real-Time Sync via WebSocket + Polling Fallback (FR-003)
- **Decision**: WebSocket for push updates; polling every 5s as fallback for unreliable networks
- **Rationale**: 
  - 10-second sync requirement with latency tolerance
  - Mobile app can detect stale orders (show DELAYED badge if no update >10s)
  - Resilient to network hiccups in retail environment
- **Implementation**:
  - Sync service polls order status every 5 seconds
  - Publishes updates via WebSocket to subscribed mobile clients
  - Fallback HTTP endpoint for status polling if WebSocket unavailable

#### 4. Multi-Method Payment with Unified Interface (FR-007)
- **Decision**: Abstract payment provider behind common interface
- **Rationale**: Easy to add new payment methods without core changes (OCP principle)
- **Supported Providers**:
  - QRIS (via Xendit or similar)
  - GoPay (wallet API)
  - ShopeePay (wallet API)
  - Credit/Debit (via Stripe or Adyen)
- **Implementation**:
  - `PaymentProvider` interface: `pay(), refund(), getStatus()`
  - Factory pattern for provider selection
  - Webhook endpoints for payment status callbacks

#### 5. Receipt Delivery Abstraction (FR-008, FR-009)
- **Decision**: Two-channel receipt system with fallback logic
- **Rationale**: Covers offline (thermal) and digital (WhatsApp) channels
- **Implementation**:
  - `ReceiptChannel` interface: `deliver(order, receipt_content)`
  - ThermalPrinter channel: polls USB printer, retries if offline
  - WhatsApp channel: uses WhatsApp Business API via provider
  - Fallback: if WhatsApp fails, prompt staff to print thermal

#### 6. Menu Sync Cache (FR-004)
- **Decision**: Redis-backed menu cache with sync window
- **Rationale**: Fast lookups for price validation; controlled update frequency
- **Implementation**:
  - Cache invalidation on menu update webhook
  - Sync window: configurable (e.g., 5 minutes)
  - If cache miss: direct DB lookup (eventual consistency)

---

## Delivery Phases

### Phase 1: Foundation (Weeks 1–2)
**Goal**: Core infrastructure, order ingestion, basic order management

#### Tasks
- [ ] Set up project structure (backend framework, database migrations)
- [ ] Implement Order entity, database schema, and repository
- [ ] Build webhook endpoint for order ingestion (idempotent receiver)
- [ ] Implement order lifecycle state machine (Pending → Processing → Complete)
- [ ] Basic unit tests for order service

**Success Criteria**:
- ✅ Webhook can receive and persist orders
- ✅ Duplicate client_order_ids rejected gracefully
- ✅ Order status can be retrieved and updated

---

### Phase 2: Payment Integration (Weeks 3–4)
**Goal**: Multi-method payment processing with provider abstraction

#### Tasks
- [ ] Design and implement PaymentProvider interface
- [ ] Integrate QRIS payment provider (Xendit)
- [ ] Integrate GoPay and ShopeePay via wallet APIs
- [ ] Implement card payment (Stripe/Adyen)
- [ ] Build payment webhook endpoints for provider callbacks
- [ ] Add payment retry logic and error handling
- [ ] Unit and integration tests for payment flows

**Success Criteria**:
- ✅ All payment methods can process payments
- ✅ Payment status updates sync back to order
- ✅ Failed payments trigger staff alerts
- ✅ Payment events fully audited

---

### Phase 3: Receipts & Communications (Weeks 5–6)
**Goal**: Thermal printer and WhatsApp receipt delivery

#### Tasks
- [ ] Design Receipt entity and storage
- [ ] Implement ThermalPrinter channel (USB detection, print queue)
- [ ] Integrate WhatsApp Business API client
- [ ] Implement WhatsApp receipt template and delivery
- [ ] Add receipt retry logic and fallback mechanisms
- [ ] Build receipt status dashboard
- [ ] Integration tests for both channels

**Success Criteria**:
- ✅ Thermal receipts print successfully
- ✅ WhatsApp receipts deliver within 30 seconds
- ✅ Failed deliveries retry and alert staff

---

### Phase 4: Real-Time Sync (Weeks 7–8)
**Goal**: Bidirectional order status sync with mobile app

#### Tasks
- [ ] Implement WebSocket server for push updates
- [ ] Build sync scheduler (5-second polling)
- [ ] Implement mobile app webhook endpoint for status updates
- [ ] Add DELAYED badge logic for >10s latency
- [ ] Build dashboard for store staff (order list, status updates)
- [ ] Load testing for concurrent orders

**Success Criteria**:
- ✅ Status updates reach mobile app within 10 seconds (95% of cases)
- ✅ Mobile app shows DELAYED badge when appropriate
- ✅ WebSocket connection resilient to disconnects

---

### Phase 5: Observability & Audit (Weeks 9–10)
**Goal**: Full audit trail, logging, and operational visibility

#### Tasks
- [ ] Implement event sourcing for all order state changes
- [ ] Build audit log table and query interface
- [ ] Add structured logging (JSON logs to ELK or CloudWatch)
- [ ] Create admin dashboard for order search and dispute resolution
- [ ] Implement data retention policies (FR-012 clarification needed)
- [ ] Load testing and performance optimization

**Success Criteria**:
- ✅ All order events queryable and timestamped
- ✅ Payment disputes traceable to specific transaction
- ✅ Performance: <100ms for order queries

---

### Phase 6: Menu Integration & Vouchers (Weeks 11–12)
**Goal**: Menu sync, promotion validation, pricing accuracy

#### Tasks
- [ ] Build menu sync receiver (webhook from back office)
- [ ] Implement Redis cache for menu items and variants
- [ ] Build promotion/voucher validator
- [ ] Implement discount calculation and order total adjustment
- [ ] Add promotions to receipt output
- [ ] Integration tests for invalid/expired vouchers

**Success Criteria**:
- ✅ Menu updates sync within configured window
- ✅ Promotion validation prevents invalid orders
- ✅ Discounts calculated correctly and audited

---

### Phase 7: Testing & Hardening (Weeks 13–14)
**Goal**: Comprehensive testing, edge case handling, security

#### Tasks
- [ ] End-to-end integration tests (mobile app → POS → payments → receipts)
- [ ] Network outage simulation (POS resilience testing)
- [ ] Duplicate order detection testing
- [ ] Payment provider failure scenarios
- [ ] Thermal printer offline and network outage handling
- [ ] Security audit (webhook auth, payment PCI compliance)
- [ ] Load testing (100+ concurrent orders)

**Success Criteria**:
- ✅ 95%+ test coverage
- ✅ All edge cases handled gracefully
- ✅ Performance meets SLAs under load

---

### Phase 8: Deployment & Operations (Week 15)
**Goal**: Production readiness and deployment

#### Tasks
- [ ] Set up CI/CD pipeline (GitHub Actions/GitLab CI)
- [ ] Deploy to staging environment
- [ ] Create runbook and operational documentation
- [ ] Set up alerting and monitoring
- [ ] Train store staff on POS UI
- [ ] Production deployment and go-live support

**Success Criteria**:
- ✅ Zero-downtime deployment capability
- ✅ Alerting configured for critical paths
- ✅ Staff trained and confident with system

---

## Data Model

### Core Entities

#### Order
```
table: orders
├── id: UUID (primary key)
├── store_id: UUID (foreign key → Store)
├── client_order_id: STRING (from mobile app, unique per store)
├── source: ENUM (mobile_pickup | in_store)
├── status: ENUM (pending | processing | completed | cancelled)
├── customer_id: UUID (foreign key → Customer)
├── items: JSONB (menu_item_id, variant_id, quantity, unit_price)
├── subtotal: DECIMAL
├── discount_amount: DECIMAL
├── tax_amount: DECIMAL
├── total: DECIMAL
├── payment_id: UUID (foreign key → Payment)
├── promotion_ids: ARRAY[UUID]
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
├── completed_at: TIMESTAMP (nullable)
```

#### Customer
```
table: customers
├── id: UUID (primary key)
├── phone: STRING (unique per store)
├── name: STRING
├── email: STRING (nullable)
├── contact_preference: ENUM (none | sms | whatsapp | email)
├── created_at: TIMESTAMP
```

#### Payment
```
table: payments
├── id: UUID (primary key)
├── order_id: UUID (foreign key → Order)
├── method: ENUM (qris | gopay | shopeepay | credit_card | debit_card)
├── provider: ENUM (xendit | stripe | adyen | gopay_api | shopeepay_api)
├── status: ENUM (pending | processing | success | failed | refunded)
├── amount: DECIMAL
├── provider_reference: STRING
├── receipt_number: STRING (for card payments)
├── created_at: TIMESTAMP
├── completed_at: TIMESTAMP (nullable)
```

#### Receipt
```
table: receipts
├── id: UUID (primary key)
├── order_id: UUID (foreign key → Order)
├── channel: ENUM (thermal | whatsapp)
├── status: ENUM (pending | sent | failed | retrying)
├── content: JSONB (order summary, totals, receipt text)
├── delivery_attempts: INTEGER
├── last_attempt_at: TIMESTAMP (nullable)
├── delivered_at: TIMESTAMP (nullable)
├── created_at: TIMESTAMP
```

#### OrderEvent (Event Sourcing)
```
table: order_events
├── id: UUID (primary key)
├── order_id: UUID (foreign key → Order)
├── event_type: ENUM (created | status_changed | payment_received | receipt_sent | cancelled)
├── actor_id: STRING (user_id or system)
├── data: JSONB (event-specific details)
├── timestamp: TIMESTAMP
```

#### MenuItem
```
table: menu_items
├── id: UUID (primary key)
├── store_id: UUID (foreign key → Store)
├── name: STRING
├── base_price: DECIMAL
├── available: BOOLEAN
├── variants: JSONB (variant_id, name, price_delta)
├── synced_at: TIMESTAMP
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
```

#### Promotion/Voucher
```
table: promotions
├── id: UUID (primary key)
├── store_id: UUID (foreign key → Store)
├── code: STRING (unique per store)
├── type: ENUM (percentage | fixed_amount)
├── value: DECIMAL
├── min_order_amount: DECIMAL (nullable)
├── max_discount: DECIMAL (nullable)
├── valid_from: TIMESTAMP
├── valid_until: TIMESTAMP
├── usage_limit: INTEGER (nullable)
├── usage_count: INTEGER
├── active: BOOLEAN
├── created_at: TIMESTAMP
```

---

## API Contracts

### Webhook: Order Ingestion
```http
POST /webhooks/orders/ingest
Content-Type: application/json
Authorization: Bearer <webhook_token>

{
  "client_order_id": "APP-12345-67890",
  "store_id": "store-001",
  "customer": {
    "name": "John Doe",
    "phone": "+6282123456789"
  },
  "items": [
    {
      "menu_item_id": "item-001",
      "variant_id": "var-001",
      "quantity": 2,
      "unit_price": 15000
    }
  ],
  "subtotal": 30000,
  "discount": 5000,
  "tax": 3000,
  "total": 28000,
  "promotions": ["PROMO-2025"],
  "timestamp": "2025-11-13T10:30:00Z"
}

Response (200 OK):
{
  "order_id": "order-uuid-123",
  "status": "pending",
  "acknowledged_at": "2025-11-13T10:30:00.123Z"
}

Response (409 Conflict) - Duplicate:
{
  "error": "duplicate_order",
  "order_id": "order-uuid-123",
  "message": "Order with client_order_id already exists"
}
```

### REST: Order Status Update
```http
PATCH /api/orders/{order_id}/status
Content-Type: application/json
Authorization: Bearer <staff_token>

{
  "status": "completed",
  "actor_id": "staff-001"
}

Response (200 OK):
{
  "order_id": "order-uuid-123",
  "status": "completed",
  "updated_at": "2025-11-13T10:35:00Z"
}
```

### Webhook: Payment Status Callback
```http
POST /webhooks/payments/callback
Content-Type: application/json
X-Signature: <provider_signature>

{
  "payment_id": "pay-001",
  "order_id": "order-uuid-123",
  "status": "success",
  "provider_reference": "XENDIT-REF-12345",
  "timestamp": "2025-11-13T10:32:00Z"
}

Response (200 OK):
{
  "status": "acknowledged"
}
```

### WebSocket: Real-Time Sync
```javascript
// Client connects and subscribes to order updates
ws.send(JSON.stringify({
  type: "subscribe",
  channel: "order.store-001",
  token: "<auth_token>"
}));

// Server pushes order status updates
ws.onmessage = (event) => {
  const {
    type: "order.status_changed",
    order_id: "order-uuid-123",
    status: "completed",
    timestamp: "2025-11-13T10:35:00Z"
  } = JSON.parse(event.data);
};
```

---

## Integration Points

### 1. NOD Mobile App
- **Webhook endpoint**: `/webhooks/orders/ingest` (HTTP POST)
- **Order status polling**: `/api/orders/{order_id}` (HTTP GET)
- **Real-time updates**: WebSocket `/ws/orders/sync`
- **Auth**: Bearer token in webhook Authorization header

### 2. Back Office Dashboard
- **Menu sync webhook**: `/webhooks/menu/sync`
- **Promotion management**: Manual or webhook-driven updates
- **Order reporting**: `/api/orders/search` (query, filter, export)

### 3. Payment Providers
- **QRIS (Xendit)**: API endpoint for charge creation
- **GoPay/ShopeePay**: Wallet API endpoints
- **Card payments (Stripe)**: Payment Intent API
- **Callbacks**: Webhook endpoints for payment status

### 4. WhatsApp Business API
- **Provider**: Meta WhatsApp Business API or Twilio
- **Template-based messages**: Receipt template pre-approved
- **Callback**: Delivery and read status webhooks

### 5. Thermal Printer
- **Protocol**: ESC/POS over USB or network
- **Driver**: Platform-specific printer driver
- **Queue**: In-memory or Redis-backed queue for retry logic

---

## Technical Stack Recommendations

### Backend
- **Framework**: Node.js + Express.js or Python + FastAPI
- **Database**: PostgreSQL (ACID transactions, JSONB)
- **Cache**: Redis (menu cache, session store, job queue)
- **Event Bus**: Bull (job queue) for async tasks
- **ORM**: Prisma or SQLAlchemy

### Real-Time
- **WebSocket**: Socket.io or ws (Node.js) or FastAPI WebSockets (Python)
- **Message Queue**: Bull or Celery for polling jobs

### Infrastructure
- **Deployment**: Docker + Kubernetes or AWS ECS
- **CI/CD**: GitHub Actions or GitLab CI
- **Monitoring**: Prometheus + Grafana, CloudWatch, or Datadog
- **Logging**: ELK Stack or CloudWatch Logs

### Security
- **API Auth**: JWT tokens for staff, webhook signature verification (HMAC-SHA256)
- **TLS**: HTTPS for all external endpoints
- **PCI Compliance**: Tokenized payment handling (no raw card data in logs)

---

## Risk Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Network outage between mobile and POS | Orders not received | Medium | Webhook retry (mobile side), queue reconciliation |
| Payment provider downtime | Orders cannot be paid | Low | Fallback to manual payment entry, queue for retry |
| Thermal printer offline | No receipt printed | Medium | WhatsApp fallback, print queue retry, staff alert |
| Duplicate order from mobile | Double-charge risk | Low | Client-side order ID deduplication in POS |
| High concurrent load | Slow order processing | Medium | Load testing, database indexing, caching |
| Staff authentication/authorization not defined | Security gap | Medium | See FR-011 clarification (OAuth/SSO/local) |
| Data retention policy unclear | Compliance risk | Low | See FR-012 clarification (audit log retention) |

---

## Dependencies & Assumptions

### External Dependencies
- ✅ WhatsApp Business API access (Meta/Twilio account)
- ✅ Payment provider SDKs and API credentials (Xendit, Stripe, etc.)
- ✅ Thermal printer driver/USB support
- ✅ Back office menu sync webhook (from NOD dashboard)
- ✅ Mobile app webhook integration (from NOD mobile team)

### Internal Dependencies
- ✅ NOD Back Office Dashboard (menu and promotion management)
- ✅ NOD Mobile App (order placement, status tracking)
- ✅ Store infrastructure (network connectivity, USB printer)

### Assumptions
- Staff have reliable internet connection to POS (for order sync, payments)
- Thermal printer available in store (USB or network-connected)
- WhatsApp Business API quotas sufficient for receipt volume
- Mobile app client implements retry logic for webhook calls
- Back office provides menu/promotion updates within sync window

---

## Success Metrics

### Functional Success
- ✅ 100% of pick-up orders from mobile reach POS within 10 seconds
- ✅ 100% of payment methods process successfully
- ✅ 99% of receipts deliver (thermal or WhatsApp) within 30 seconds
- ✅ Order status syncs to mobile within 10 seconds (95% of cases)

### Operational Success
- ✅ Staff can complete order-to-receipt cycle in <2 minutes
- ✅ System uptime: 99.5% during store hours
- ✅ Zero unhandled exceptions in audit logs
- ✅ Payment success rate: >98%

### Business Success
- ✅ Reduces order processing time vs. manual system
- ✅ Improves customer satisfaction (quick status updates)
- ✅ Enables seamless mobile pick-up experience
- ✅ Provides compliance-ready audit trail for disputes

---

## Next Steps

1. **Clarifications Needed** (Block on FR-011, FR-012):
   - Staff authentication model (SAML/SSO/OAuth/local)?
   - Data retention period for order/payment logs?

2. **Kickoff Actions**:
   - [ ] Database schema review and approval
   - [ ] Payment provider API credential setup
   - [ ] WhatsApp Business account provisioning
   - [ ] Thermal printer driver evaluation
   - [ ] Team capability assessment

3. **Plan Review & Sign-Off**:
   - [ ] Product Manager approval
   - [ ] Tech Lead / Architect sign-off
   - [ ] Security review (payment handling, auth)

---

## Appendix: Open Questions

| # | Question | From Spec | Answer |
|----|----------|-----------|--------|
| 1 | Staff authentication & authorization model? | FR-011 | *Pending clarification* |
| 2 | Order/payment log retention period? | FR-012 | *Pending clarification* |
| 3 | Supported languages on receipts? | FR-008, FR-009 | Assume Indonesian (ID) as default |
| 4 | Refund workflow? | Payment | Assume refund initiated by staff, handled by payment provider |
| 5 | Multi-store support? | Scope | Yes, architecture supports multiple stores via store_id |
| 6 | Historical menu/pricing for audits? | FR-004 | Store price snapshots in order events |
| 7 | Barcode/QR for order tracking? | Receipt | Optional enhancement (not in Phase 1) |

---

**Plan Status**: Ready for Phase 1 kickoff pending clarifications on FR-011 and FR-012.
