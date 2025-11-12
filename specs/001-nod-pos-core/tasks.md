# Implementation Tasks: NOD POS System

**Feature Branch**: `001-nod-pos-core`  
**Tasks Created**: 2025-11-13  
**Based On**: `plan.md` (Implementation Plan)  
**Format**: Checklist organized by user story and delivery phase

---

## Task Organization

Tasks are organized by:
1. **User Story** — Business-facing outcome
2. **Phase** — Delivery timeline (1–8)
3. **Dependencies** — Blocking tasks (if any)

✅ = Complete | ⏳ = In Progress | ❌ = Blocked | ⬜ = Not Started

---

## Phase 1: Foundation (Weeks 1–2)

### User Story 1.1: Set Up Project Infrastructure

**Goal**: Establish backend framework, database, and project structure

- ⬜ **1.1.1** — Initialize backend project
  - [ ] Choose framework (Node.js + Express or Python + FastAPI)
  - [ ] Set up project structure (src/, config/, tests/, migrations/)
  - [ ] Configure ESLint/Prettier or Black/Flake8
  - [ ] Set up .env configuration for local/staging/production
  - **Acceptance**: Project builds without errors, linting passes

- ⬜ **1.1.2** — Set up PostgreSQL database
  - [ ] Create database schema migration file
  - [ ] Define Order, Customer, Payment, Receipt, MenuItem, Promotion, OrderEvent tables
  - [ ] Add indexes for common queries (store_id, client_order_id, customer_id, created_at)
  - [ ] Add unique constraints (store_id + client_order_id on orders)
  - **Acceptance**: All tables created, constraints enforced, migrations runnable

- ⬜ **1.1.3** — Set up Redis cache
  - [ ] Configure Redis client connection (local and remote)
  - [ ] Design cache key patterns (menu:{store_id}, session:{token})
  - [ ] Implement cache invalidation strategy
  - **Acceptance**: Cache connects, keys expire correctly, no stale data

- ⬜ **1.1.4** — Set up ORM and database layer
  - [ ] Choose ORM (Prisma, SQLAlchemy, TypeORM)
  - [ ] Define models for all entities
  - [ ] Implement repositories for Order, Customer, Payment
  - [ ] Write unit tests for model validations
  - **Acceptance**: ORM generates tables correctly, CRUD operations pass tests

- ⬜ **1.1.5** — Set up error handling and logging
  - [ ] Implement global error handler middleware
  - [ ] Configure structured JSON logging (Winston, Pino, or similar)
  - [ ] Add request/response logging
  - [ ] Create custom error classes (BadRequest, NotFound, PaymentError, etc.)
  - **Acceptance**: Errors logged with context, stacktraces captured

- ⬜ **1.1.6** — Set up testing infrastructure
  - [ ] Configure test runner (Jest, Pytest, Mocha)
  - [ ] Set up test database (separate from dev)
  - [ ] Create test factories/fixtures for Order, Customer, Payment
  - [ ] Implement code coverage reporting
  - **Acceptance**: Tests run in isolation, coverage >70%

---

### User Story 1.2: Implement Order Ingestion via Webhook

**Goal**: Accept and persist Pick-Up orders from mobile app with idempotent deduplication

- ⬜ **1.2.1** — Design webhook endpoint and auth
  - [ ] Define webhook request/response schema (see plan.md API Contracts)
  - [ ] Implement webhook signature verification (HMAC-SHA256)
  - [ ] Create Bearer token validation middleware
  - [ ] Log all webhook attempts (success and failure)
  - **Acceptance**: Invalid signatures rejected, authorized requests accepted

- ⬜ **1.2.2** — Implement Order ingestion service
  - [ ] Create OrderIngestionService with validate() and persist() methods
  - [ ] Validate required fields (client_order_id, store_id, customer, items, total)
  - [ ] Validate item prices match menu (lookup in cache or DB)
  - [ ] Implement idempotency check (query by store_id + client_order_id)
  - [ ] Return existing order if duplicate detected
  - **Acceptance**: Valid orders persisted, duplicates detected, prices validated

- ⬜ **1.2.3** — Implement webhook endpoint POST /webhooks/orders/ingest
  - [ ] Create route handler
  - [ ] Call OrderIngestionService.validate()
  - [ ] Persist order to database
  - [ ] Return 200 OK with order_id + status
  - [ ] Return 409 Conflict if duplicate
  - [ ] Handle validation errors (400 Bad Request)
  - **Acceptance**: All HTTP status codes correct, response format matches spec

- ⬜ **1.2.4** — Write integration tests for webhook
  - [ ] Test valid order ingestion
  - [ ] Test duplicate order rejection
  - [ ] Test invalid signature rejection
  - [ ] Test missing required fields (400 errors)
  - [ ] Test invalid item prices
  - [ ] Test concurrent webhook requests (race condition safety)
  - **Acceptance**: 100% test coverage for webhook, all edge cases pass

- ⬜ **1.2.5** — Implement webhook retry mechanism (POS side)
  - [ ] Create webhook queue table (for storing failed webhooks)
  - [ ] Implement exponential backoff retry scheduler
  - [ ] Log all retry attempts
  - [ ] Alert if webhook fails >3 times
  - **Acceptance**: Failed webhooks retried, alerts triggered, logs clean

---

### User Story 1.3: Implement Order Lifecycle State Machine

**Goal**: Manage order status transitions (pending → processing → completed)

- ⬜ **1.3.1** — Design order state machine
  - [ ] Define valid state transitions (pending → processing → completed, pending → cancelled)
  - [ ] Identify which transitions require authorization (admin vs. staff)
  - [ ] Document business rules for each transition
  - **Acceptance**: State diagram clear, rules documented

- ⬜ **1.3.2** — Implement OrderStateMachine class
  - [ ] Create enum for OrderStatus (pending, processing, completed, cancelled)
  - [ ] Implement canTransitionTo(current, target) validation
  - [ ] Implement transition() method with state change + event logging
  - [ ] Ensure transitions are idempotent (same transition twice = no error)
  - **Acceptance**: All valid transitions work, invalid transitions rejected

- ⬜ **1.3.3** — Implement PATCH /api/orders/{order_id}/status endpoint
  - [ ] Create route handler
  - [ ] Validate actor_id (staff token)
  - [ ] Call OrderStateMachine.transition()
  - [ ] Persist new status to database
  - [ ] Return 200 OK with updated order
  - [ ] Return 400 Bad Request for invalid transitions
  - **Acceptance**: All HTTP responses correct, state transitions logged

- ⬜ **1.3.4** — Implement OrderEvent logging
  - [ ] Create OrderEvent table (id, order_id, event_type, actor_id, data, timestamp)
  - [ ] Log every state transition as an event
  - [ ] Include actor_id (staff ID or system)
  - [ ] Serialize event data (old status, new status, reason if provided)
  - **Acceptance**: Events immutable, all transitions logged, timestamps accurate

- ⬜ **1.3.5** — Write tests for state machine
  - [ ] Test all valid transitions
  - [ ] Test invalid transitions (400 errors)
  - [ ] Test duplicate transitions (idempotency)
  - [ ] Test concurrent state changes (pessimistic locking)
  - [ ] Test event logging for each transition
  - **Acceptance**: All transitions tested, 100% coverage, no race conditions

---

### User Story 1.4: Implement Basic Order Query API

**Goal**: Enable staff to view orders and details

- ⬜ **1.4.1** — Implement GET /api/orders endpoint
  - [ ] List all orders for a store (paginated, sorted by created_at desc)
  - [ ] Add filters: status, customer_name, date_range
  - [ ] Add pagination (limit, offset)
  - [ ] Return: id, client_order_id, customer, status, total, created_at
  - **Acceptance**: Pagination works, filters apply correctly, response <1s

- ⬜ **1.4.2** — Implement GET /api/orders/{order_id} endpoint
  - [ ] Return full order details (items, customer, payment, status)
  - [ ] Return 404 if order not found
  - [ ] Include order events (status history)
  - **Acceptance**: Full details returned, 404 correct, events included

- ⬜ **1.4.3** — Write tests for query APIs
  - [ ] Test list endpoint with various filters
  - [ ] Test pagination edge cases (empty list, single page, multiple pages)
  - [ ] Test detail endpoint (found, not found)
  - [ ] Test performance (query time <100ms for 10k orders)
  - **Acceptance**: All queries correct, performance acceptable

---

## Phase 2: Payment Integration (Weeks 3–4)

### User Story 2.1: Implement Multi-Method Payment Abstraction

**Goal**: Create PaymentProvider interface to support QRIS, e-wallets, and cards

- ⬜ **2.1.1** — Design PaymentProvider interface
  - [ ] Define interface methods: pay(), refund(), getStatus(), verifyCallback()
  - [ ] Define provider enum: XENDIT, STRIPE, ADYEN, GOPAY_API, SHOPEEPAY_API
  - [ ] Define payment method enum: QRIS, GOPAY, SHOPEEPAY, CREDIT_CARD, DEBIT_CARD
  - [ ] Standardize response format across providers
  - **Acceptance**: Interface documented, no provider-specific code in core

- ⬜ **2.1.2** — Implement PaymentFactory
  - [ ] Create factory method getProvider(method, provider)
  - [ ] Load provider config from .env
  - [ ] Validate provider credentials on startup
  - [ ] Handle provider initialization errors gracefully
  - **Acceptance**: Factory returns correct provider, config validated

- ⬜ **2.1.3** — Implement base PaymentProvider class
  - [ ] Abstract error handling (provider errors → standardized PaymentError)
  - [ ] Implement retry logic for transient failures
  - [ ] Add request/response logging
  - [ ] Implement circuit breaker for provider outages
  - **Acceptance**: Errors standardized, retries work, circuit breaker triggers

- ⬜ **2.1.4** — Create Payment domain model
  - [ ] Define Payment entity (id, order_id, method, status, amount, provider_reference)
  - [ ] Implement Payment repository (create, update, find)
  - [ ] Add constraints (total payment ≤ order total, prevent double-payment)
  - **Acceptance**: Payments persisted correctly, constraints enforced

- ⬜ **2.1.5** — Write tests for PaymentProvider abstraction
  - [ ] Test factory returns correct provider
  - [ ] Test error mapping (provider errors → PaymentError)
  - [ ] Test retry logic
  - [ ] Mock provider API calls
  - **Acceptance**: All providers testable, errors mapped correctly

---

### User Story 2.2: Integrate QRIS Payment (Xendit)

**Goal**: Enable QRIS payments via Xendit provider

- ⬜ **2.2.1** — Implement XenditPaymentProvider class
  - [ ] Implement pay() method (create Charge object)
  - [ ] Set reference_id = order_id for reconciliation
  - [ ] Return provider_reference for tracking
  - [ ] Handle Xendit API errors (invalid amount, rate limit, timeout)
  - [ ] Add exponential backoff for retries
  - **Acceptance**: Charges created, references returned, errors handled

- ⬜ **2.2.2** — Implement Xendit webhook handler
  - [ ] Create POST /webhooks/payments/xendit endpoint
  - [ ] Verify Xendit signature (X-Xendit-Webhook-Token)
  - [ ] Parse webhook payload (charge_id, status, amount, reference_id)
  - [ ] Update Payment status in DB
  - [ ] Update Order status if payment successful
  - [ ] Handle idempotent delivery (same webhook twice)
  - **Acceptance**: Webhook validated, payment status updated, idempotent

- ⬜ **2.2.3** — Implement payment retry mechanism
  - [ ] Create POST /api/payments/{payment_id}/retry endpoint
  - [ ] Check if payment is in FAILED state
  - [ ] Call provider.pay() again
  - [ ] Update payment status
  - [ ] Log retry attempt
  - **Acceptance**: Retries work, status updated, failures logged

- ⬜ **2.2.4** — Write tests for QRIS payment flow
  - [ ] Test successful payment
  - [ ] Test failed payment (invalid amount, rate limit)
  - [ ] Test webhook callback (success and failure)
  - [ ] Test duplicate webhooks (idempotency)
  - [ ] Test payment retry
  - **Acceptance**: Full flow tested, all edge cases pass

- ⬜ **2.2.5** — Set up Xendit sandbox credentials
  - [ ] Create Xendit sandbox account
  - [ ] Store API key in .env (development)
  - [ ] Test with sandbox QRIS codes
  - **Acceptance**: Sandbox accessible, test payments work

---

### User Story 2.3: Integrate E-Wallet Payments (GoPay & ShopeePay)

**Goal**: Enable GoPay and ShopeePay wallet payments

- ⬜ **2.3.1** — Implement GoPayPaymentProvider class
  - [ ] Implement pay() method (call GoPay API)
  - [ ] Handle GoPay payment flow (deep link or QR code)
  - [ ] Return provider_reference for tracking
  - [ ] Handle GoPay-specific errors
  - **Acceptance**: GoPay payments initiated, references returned

- ⬜ **2.3.2** — Implement ShopeePay payment provider
  - [ ] Implement pay() method (call ShopeePay API)
  - [ ] Handle ShopeePay payment flow
  - [ ] Return provider_reference for tracking
  - **Acceptance**: ShopeePay payments initiated, references returned

- ⬜ **2.3.3** — Implement webhook handlers for both providers
  - [ ] Create POST /webhooks/payments/gopay endpoint
  - [ ] Create POST /webhooks/payments/shopeepay endpoint
  - [ ] Verify signatures, parse payloads, update status
  - [ ] Handle idempotent delivery
  - **Acceptance**: Webhooks validated, payments updated

- ⬜ **2.3.4** — Write tests for e-wallet payments
  - [ ] Test GoPay successful/failed payments
  - [ ] Test ShopeePay successful/failed payments
  - [ ] Test webhook callbacks (both providers)
  - [ ] Test idempotency
  - **Acceptance**: All flows tested, all edge cases pass

---

### User Story 2.4: Integrate Card Payments (Stripe/Adyen)

**Goal**: Enable credit and debit card payments

- ⬜ **2.4.1** — Choose card payment provider (Stripe vs. Adyen)
  - [ ] Evaluate both options (pricing, features, support)
  - [ ] Choose based on NOD's requirements
  - [ ] Get production credentials
  - **Acceptance**: Provider selected, credentials obtained

- ⬜ **2.4.2** — Implement StripePaymentProvider or AdyenPaymentProvider
  - [ ] Implement pay() method (create Payment Intent or paymentRequest)
  - [ ] Handle 3D Secure flows if needed
  - [ ] Return provider_reference + client_secret for frontend
  - [ ] Handle provider-specific errors
  - **Acceptance**: Payment intents created, references returned

- ⬜ **2.4.3** — Implement card payment webhook
  - [ ] Create webhook endpoint for payment status
  - [ ] Verify webhook signature
  - [ ] Update Payment status
  - [ ] Update Order status
  - **Acceptance**: Webhook validated, payments updated

- ⬜ **2.4.4** — Write tests for card payment flow
  - [ ] Test successful payment (test card)
  - [ ] Test failed payment (declined card)
  - [ ] Test 3D Secure flow (if applicable)
  - [ ] Test webhook callback
  - **Acceptance**: All flows tested, test cards work

- ⬜ **2.4.5** — Ensure PCI compliance
  - [ ] Never log raw card numbers
  - [ ] Use tokenization (provider handles card data)
  - [ ] Document PCI compliance approach
  - [ ] Run security audit
  - **Acceptance**: No card data in logs, PCI audit passed

---

### User Story 2.5: Implement Unified Payment Reconciliation

**Goal**: Ensure payment status accuracy across all providers

- ⬜ **2.5.1** — Implement payment status poller
  - [ ] Create scheduled job (every 60 seconds)
  - [ ] Find payments in PROCESSING state
  - [ ] Call provider.getStatus() for each
  - [ ] Update DB if status changed
  - [ ] Log status changes
  - **Acceptance**: Status poller runs, updates captured

- ⬜ **2.5.2** — Implement payment reconciliation report
  - [ ] Create GET /api/admin/payments/reconciliation endpoint
  - [ ] Find payments with mismatched status (DB vs. provider)
  - [ ] Generate report with discrepancies
  - [ ] Provide admin action to sync
  - **Acceptance**: Report shows mismatches, sync works

- ⬜ **2.5.3** — Write tests for reconciliation
  - [ ] Test status poller updates PROCESSING → SUCCESS
  - [ ] Test status poller updates PROCESSING → FAILED
  - [ ] Test reconciliation report accuracy
  - [ ] Test reconciliation sync
  - **Acceptance**: All scenarios tested, status accurate

---

## Phase 3: Receipts & Communications (Weeks 5–6)

### User Story 3.1: Implement Thermal Printer Integration

**Goal**: Print receipts on connected thermal printer

- ⬜ **3.1.1** — Design Receipt entity and schema
  - [ ] Create Receipt table (id, order_id, channel, status, content, delivery_attempts, created_at)
  - [ ] Create ReceiptContent schema (order summary, items, total, promotions)
  - [ ] Add index on order_id and status
  - **Acceptance**: Schema created, indexes added

- ⬜ **3.1.2** — Implement ReceiptChannel interface
  - [ ] Define interface: deliver(order, receipt_content) → Promise<ReceiptDeliveryResult>
  - [ ] Define channel enum: THERMAL, WHATSAPP
  - [ ] Define delivery status: PENDING, SENT, FAILED, RETRYING
  - **Acceptance**: Interface documented, no channel-specific code in core

- ⬜ **3.1.3** — Implement ThermalPrinterChannel
  - [ ] Detect USB printers using platform-specific driver
  - [ ] Format receipt content to ESC/POS commands
  - [ ] Send to printer queue
  - [ ] Handle offline printer (retry with exponential backoff)
  - [ ] Log print attempts and failures
  - **Acceptance**: Printers detected, receipts formatted, failures handled

- ⬜ **3.1.4** — Implement receipt queue and retry logic
  - [ ] Create in-memory queue for pending receipts
  - [ ] Implement retry scheduler (every 10 seconds for failed receipts)
  - [ ] Max retries: 5 times with exponential backoff
  - [ ] Update Receipt status (PENDING → SENT or FAILED)
  - [ ] Alert staff if receipt stuck after 3 retries
  - **Acceptance**: Queue processes, retries work, alerts trigger

- ⬜ **3.1.5** — Implement POST /api/orders/{order_id}/receipt/print endpoint
  - [ ] Create receipt content from order details
  - [ ] Add to thermal printer queue
  - [ ] Return 200 OK with receipt_id + status
  - [ ] Return 202 Accepted (receipt queued, not yet printed)
  - **Acceptance**: Endpoint returns correct status, receipt queued

- ⬜ **3.1.6** — Write tests for thermal printer
  - [ ] Test receipt formatting (ESC/POS)
  - [ ] Test printer detection
  - [ ] Test offline printer handling (mock USB unavailable)
  - [ ] Test receipt queue and retry
  - [ ] Test concurrent print requests
  - **Acceptance**: All flows tested, offline scenarios covered

---

### User Story 3.2: Implement WhatsApp Receipt Delivery

**Goal**: Send digital receipts via WhatsApp Business API

- ⬜ **3.2.1** — Set up WhatsApp Business API integration
  - [ ] Choose provider (Meta WhatsApp Business API or Twilio)
  - [ ] Create business account and verify phone number
  - [ ] Get API credentials
  - [ ] Create receipt message template (pre-approved by Meta)
  - **Acceptance**: Account active, template approved

- ⬜ **3.2.2** — Implement WhatsAppReceiptChannel
  - [ ] Implement deliver(order, receipt_content) method
  - [ ] Format receipt as WhatsApp message (text + structured format)
  - [ ] Call WhatsApp API to send message
  - [ ] Handle delivery status (QUEUED, SENT, FAILED, DELIVERED, READ)
  - [ ] Map provider errors to standard ReceiptDeliveryError
  - **Acceptance**: Messages sent, status tracked, errors mapped

- ⬜ **3.2.3** — Implement WhatsApp webhook handler
  - [ ] Create POST /webhooks/whatsapp/status endpoint
  - [ ] Verify webhook signature
  - [ ] Parse delivery status (sent, delivered, read, failed)
  - [ ] Update Receipt status in DB
  - [ ] Handle idempotent delivery
  - **Acceptance**: Webhook validated, status updated, idempotent

- ⬜ **3.2.4** — Implement receipt retry for WhatsApp
  - [ ] Create retry scheduler for failed WhatsApp deliveries
  - [ ] Max retries: 3 times
  - [ ] Exponential backoff: 1min, 5min, 30min
  - [ ] Alert staff if delivery fails after retries
  - **Acceptance**: Retries work, alerts trigger

- ⬜ **3.2.5** — Implement POST /api/orders/{order_id}/receipt/whatsapp endpoint
  - [ ] Validate customer phone number
  - [ ] Create receipt from order details
  - [ ] Add to WhatsApp queue
  - [ ] Return 202 Accepted with receipt_id + status
  - **Acceptance**: Endpoint works, receipt queued

- ⬜ **3.2.6** — Write tests for WhatsApp delivery
  - [ ] Test message formatting
  - [ ] Test successful delivery
  - [ ] Test delivery failures (invalid phone, rate limit)
  - [ ] Test webhook callbacks
  - [ ] Test retry logic
  - **Acceptance**: All flows tested, failures handled

---

### User Story 3.3: Implement Dual-Channel Receipt Fallback

**Goal**: Ensure receipts are delivered via thermal or WhatsApp with fallback

- ⬜ **3.3.1** — Design receipt delivery strategy
  - [ ] Primary: Thermal printer (for in-store orders)
  - [ ] Fallback: WhatsApp (if printer offline or failed)
  - [ ] Document fallback logic and UX
  - **Acceptance**: Strategy documented, clear UX flow

- ⬜ **3.3.2** — Implement receipt delivery orchestrator
  - [ ] Create ReceiptDeliveryOrchestrator class
  - [ ] Try thermal first, log failure if any
  - [ ] If thermal fails, queue WhatsApp as fallback
  - [ ] Track which channels attempted
  - [ ] Update Receipt with channel list
  - **Acceptance**: Orchestrator tries both channels, logs attempts

- ⬜ **3.3.3** — Implement staff dashboard for receipt status
  - [ ] Create GET /api/orders/{order_id}/receipt/status endpoint
  - [ ] Return receipt status (PENDING, SENT, FAILED) + channel
  - [ ] Show delivery history (channels tried, timestamps, errors)
  - [ ] Provide retry button for failed receipts
  - **Acceptance**: Staff can see receipt status and history

- ⬜ **3.3.4** — Write tests for fallback logic
  - [ ] Test thermal success (no WhatsApp fallback)
  - [ ] Test thermal failure + WhatsApp success
  - [ ] Test both fail (alert staff)
  - [ ] Test concurrent delivery attempts
  - **Acceptance**: All fallback scenarios tested

---

## Phase 4: Real-Time Sync (Weeks 7–8)

### User Story 4.1: Implement WebSocket Server for Order Updates

**Goal**: Push order status updates to mobile app in real-time

- ⬜ **4.1.1** — Set up WebSocket server
  - [ ] Choose WebSocket library (Socket.io or ws)
  - [ ] Create WebSocket server on separate port or upgrade HTTP
  - [ ] Configure connection pooling and memory management
  - [ ] Add connection/disconnection logging
  - **Acceptance**: WebSocket server starts, connections tracked

- ⬜ **4.1.2** — Implement WebSocket auth and channel subscription
  - [ ] Implement auth middleware (verify JWT token)
  - [ ] Extract store_id + mobile_app_id from token
  - [ ] Create subscription model (channel: order.{store_id})
  - [ ] Implement subscribe/unsubscribe messages
  - [ ] Reject unauthorized subscriptions
  - **Acceptance**: Auth works, subscriptions secure

- ⬜ **4.1.3** — Implement order status push
  - [ ] Listen for Order status changes (from state machine)
  - [ ] Publish event to WebSocket channel (order.{store_id})
  - [ ] Message format: {type: "order.status_changed", order_id, status, timestamp}
  - [ ] Track delivery (client ACK)
  - **Acceptance**: Status updates pushed, client ACKs received

- ⬜ **4.1.4** — Implement WebSocket error handling and reconnection
  - [ ] Handle connection drops (graceful reconnection)
  - [ ] Implement heartbeat (ping/pong every 30 seconds)
  - [ ] Queue messages during temporary disconnection (buffer up to 100 messages)
  - [ ] Flush queue on reconnection
  - [ ] Log all connection errors
  - **Acceptance**: Reconnection works, no message loss, heartbeat active

- ⬜ **4.1.5** — Write tests for WebSocket
  - [ ] Test connection and auth
  - [ ] Test subscription to channel
  - [ ] Test status push delivery
  - [ ] Test connection drop and reconnection
  - [ ] Test message queue during disconnection
  - [ ] Load test (1000 concurrent connections)
  - **Acceptance**: All flows tested, 1000 concurrent connections stable

---

### User Story 4.2: Implement Order Status Polling Scheduler

**Goal**: Periodically sync order status from POS to mobile app (fallback if WebSocket fails)

- ⬜ **4.2.1** — Implement polling scheduler
  - [ ] Create scheduler job (every 5 seconds)
  - [ ] Find orders with status changed in last 5 seconds
  - [ ] For each changed order, publish sync event
  - [ ] Log polling attempts and synced orders
  - **Acceptance**: Scheduler runs every 5 seconds, publishes events

- ⬜ **4.2.2** — Implement order status webhook (mobile app → POS)
  - [ ] Create POST /webhooks/orders/status-update endpoint
  - [ ] Mobile app sends updates when order status changes
  - [ ] Validate mobile app signature
  - [ ] Update order in POS if applicable
  - [ ] Log webhook attempts
  - **Acceptance**: Webhook receives status updates, POS updated

- ⬜ **4.2.3** — Implement DELAYED badge logic
  - [ ] Track last sync timestamp for each order
  - [ ] If no sync update >10 seconds, mark as DELAYED
  - [ ] Return DELAYED flag in order status API
  - [ ] Mobile app displays badge to staff
  - **Acceptance**: DELAYED flag accurate, badge displays correctly

- ⬜ **4.2.4** — Write tests for polling and sync
  - [ ] Test polling scheduler interval
  - [ ] Test orders included in polling (status changed filter)
  - [ ] Test webhook endpoint (valid/invalid signatures)
  - [ ] Test DELAYED flag (>10 seconds of no sync)
  - **Acceptance**: All flows tested, timing accurate

---

### User Story 4.3: Implement Staff Dashboard (Basic)

**Goal**: Display order list and real-time status updates for store staff

- ⬜ **4.3.1** — Design staff dashboard UI/UX
  - [ ] Sketch order list view (columns: order_id, customer, status, items, total)
  - [ ] Sketch order detail view (full order, payment, receipt status)
  - [ ] Define real-time update UX (highlight changed orders, toast notifications)
  - [ ] Define error states (connection lost, sync delayed)
  - **Acceptance**: Design approved by product

- ⬜ **4.3.2** — Implement staff dashboard frontend (React/Vue)
  - [ ] Create order list component (fetch from GET /api/orders)
  - [ ] Create order detail component (fetch from GET /api/orders/{order_id})
  - [ ] Implement WebSocket connection (subscribe to order.{store_id})
  - [ ] Implement real-time update rendering
  - [ ] Implement DELAYED badge (no update >10 seconds)
  - [ ] Implement error boundary and connection status display
  - **Acceptance**: Dashboard displays orders, real-time updates work

- ⬜ **4.3.3** — Implement staff dashboard actions
  - [ ] Add button to update order status (pending → processing → completed)
  - [ ] Add button to print/send receipt
  - [ ] Add button to retry failed receipts
  - [ ] Add button to retry failed payments
  - [ ] Add confirmation dialogs for critical actions
  - **Acceptance**: All buttons work, actions persist

- ⬜ **4.3.4** — Write tests for dashboard
  - [ ] Test order list render
  - [ ] Test order detail render
  - [ ] Test real-time update rendering
  - [ ] Test action buttons (state changes)
  - [ ] Test WebSocket disconnection (connection status shows)
  - **Acceptance**: All UI components tested, interactions work

---

### User Story 4.4: Implement Load Testing for Real-Time Sync

**Goal**: Ensure system handles high order volume with acceptable latency

- ⬜ **4.4.1** — Set up load testing framework
  - [ ] Choose tool (Apache JMeter, k6, Locust)
  - [ ] Design load test scenarios (100, 500, 1000 concurrent orders)
  - [ ] Define success criteria (p95 latency <2 seconds, error rate <1%)
  - **Acceptance**: Load testing framework ready

- ⬜ **4.4.2** — Execute load tests
  - [ ] Run 100 concurrent orders, measure latency and errors
  - [ ] Run 500 concurrent orders
  - [ ] Run 1000 concurrent orders
  - [ ] Identify bottlenecks and performance issues
  - **Acceptance**: Load test results documented

- ⬜ **4.4.3** — Optimize based on load test results
  - [ ] Fix identified bottlenecks (database indexes, caching, connection pooling)
  - [ ] Re-run load tests to verify improvements
  - [ ] Document performance optimizations
  - **Acceptance**: Performance meets success criteria

---

## Phase 5: Observability & Audit (Weeks 9–10)

### User Story 5.1: Implement Event Sourcing

**Goal**: Create immutable audit trail of all order state changes

- ⬜ **5.1.1** — Design event sourcing schema
  - [ ] Create OrderEvent table (id, order_id, event_type, actor_id, data, timestamp)
  - [ ] Define event types: CREATED, STATUS_CHANGED, PAYMENT_RECEIVED, RECEIPT_SENT, CANCELLED
  - [ ] Define event data schema for each type
  - [ ] Add index on (order_id, timestamp)
  - **Acceptance**: Schema designed, events well-defined

- ⬜ **5.1.2** — Implement event publishing
  - [ ] Create EventPublisher class
  - [ ] Publish event on every order state change
  - [ ] Publish event on every payment status change
  - [ ] Publish event on every receipt delivery
  - [ ] Serialize event data (include old state, new state, reason)
  - **Acceptance**: Events published for all changes

- ⬜ **5.1.3** — Implement event replay for snapshots
  - [ ] Create snapshot strategy (every 100 events)
  - [ ] Implement EventReplayer to rebuild order state from events
  - [ ] Test replay accuracy (replayed state = current state)
  - [ ] Optimize replay performance (use snapshots)
  - **Acceptance**: Snapshots created, replay works, performance acceptable

- ⬜ **5.1.4** — Write tests for event sourcing
  - [ ] Test events published for all changes
  - [ ] Test event data serialization
  - [ ] Test event replay accuracy
  - [ ] Test snapshot creation and usage
  - **Acceptance**: All event flows tested, replay verified

---

### User Story 5.2: Implement Audit Log Query Interface

**Goal**: Enable admins to query order history and investigate disputes

- ⬜ **5.2.1** — Implement GET /api/admin/orders/{order_id}/audit-log endpoint
  - [ ] Return list of OrderEvents for given order (newest first)
  - [ ] Include event_type, actor_id, data, timestamp
  - [ ] Format data for readability (human-readable event descriptions)
  - [ ] Add filtering by event_type
  - **Acceptance**: Endpoint returns audit log, format readable

- ⬜ **5.2.2** — Implement admin audit log dashboard
  - [ ] Create audit log view in admin dashboard
  - [ ] Display event timeline (vertical timeline UI)
  - [ ] Show event details (who, what, when, data)
  - [ ] Search by order_id or customer
  - [ ] Export audit log as CSV
  - **Acceptance**: Dashboard displays audit log, search works, export works

- ⬜ **5.2.3** — Implement audit log data retention policy
  - [ ] Define retention period (e.g., 7 years for compliance)
  - [ ] Create archival job (move old events to cold storage)
  - [ ] Implement soft delete or hard delete based on policy
  - [ ] Log all deletions for audit
  - **Acceptance**: Retention policy implemented, archival works

- ⬜ **5.2.4** — Write tests for audit log
  - [ ] Test audit log query
  - [ ] Test event timeline rendering
  - [ ] Test search functionality
  - [ ] Test export to CSV
  - [ ] Test archival job
  - **Acceptance**: All audit log features tested

---

### User Story 5.3: Implement Structured Logging

**Goal**: Capture all system events in searchable, structured format

- ⬜ **5.3.1** — Set up structured logging (JSON format)
  - [ ] Choose logging library (Winston, Pino, Bunyan)
  - [ ] Configure to output JSON logs
  - [ ] Add contextual fields (request_id, actor_id, store_id, order_id)
  - [ ] Add log level (DEBUG, INFO, WARN, ERROR)
  - **Acceptance**: Logs output JSON, context fields included

- ⬜ **5.3.2** — Integrate logging with ELK or CloudWatch
  - [ ] Choose log aggregation platform (ELK or AWS CloudWatch)
  - [ ] Configure log shipping
  - [ ] Create index/log group for POS logs
  - [ ] Set up log retention policy
  - **Acceptance**: Logs shipped and searchable

- ⬜ **5.3.3** — Create logging dashboard and alerts
  - [ ] Create Kibana/CloudWatch dashboard for key metrics
  - [ ] Display: error rate, webhook success rate, payment success rate, receipt delivery rate
  - [ ] Set up alerts for critical errors (payment provider down, printer offline, webhook failures)
  - [ ] Alert channels: email, Slack, SMS
  - **Acceptance**: Dashboard displays metrics, alerts trigger

- ⬜ **5.3.4** — Write tests for logging
  - [ ] Test structured log format
  - [ ] Test context fields are included
  - [ ] Test log levels
  - [ ] Test ELK/CloudWatch integration
  - **Acceptance**: Logging tests pass

---

### User Story 5.4: Implement Payment Dispute Resolution

**Goal**: Enable admins to investigate payment disputes with full audit trail

- ⬜ **5.4.1** — Implement GET /api/admin/disputes endpoint
  - [ ] List disputed orders (filtered by status or manually flagged)
  - [ ] Show order details, payment details, audit log
  - [ ] Link to payment provider for verification
  - **Acceptance**: Disputes listed with full context

- ⬜ **5.4.2** — Implement dispute investigation workflow
  - [ ] Create dispute flag/status (flagged, investigating, resolved)
  - [ ] Log dispute notes and findings
  - [ ] Create refund button (call payment provider)
  - [ ] Track refund status
  - **Acceptance**: Disputes can be investigated and resolved

- ⬜ **5.4.3** — Create compliance report
  - [ ] Generate monthly report of disputes, refunds, chargebacks
  - [ ] Export as PDF
  - [ ] Include audit trail for each dispute
  - **Acceptance**: Report generated, format acceptable

---

## Phase 6: Menu Integration & Vouchers (Weeks 11–12)

### User Story 6.1: Implement Menu Sync Cache

**Goal**: Cache menu items and variants for fast POS access

- ⬜ **6.1.1** — Implement menu cache schema
  - [ ] Design cache key: menu:{store_id}
  - [ ] Cache structure: {menu_items: [{id, name, base_price, variants: [...]}]}
  - [ ] Set TTL: configurable (default 5 minutes)
  - **Acceptance**: Cache key/structure designed

- ⬜ **6.1.2** — Implement menu sync receiver
  - [ ] Create POST /webhooks/menu/sync endpoint
  - [ ] Receive menu updates from back office
  - [ ] Validate webhook signature
  - [ ] Update menu cache (invalidate + re-fetch)
  - [ ] Update menu database table
  - [ ] Log sync attempts
  - **Acceptance**: Webhook receives updates, cache updated

- ⬜ **6.1.3** — Implement menu cache warming on startup
  - [ ] On POS startup, load menu from DB into cache
  - [ ] Log cache warm-up time
  - [ ] If DB unavailable, keep old cache (graceful degradation)
  - **Acceptance**: Cache warmed on startup, fallback works

- ⬜ **6.1.4** — Implement menu price validation
  - [ ] On order ingestion, lookup menu item price from cache
  - [ ] Compare ingested price with cached price
  - [ ] If mismatch, log warning (price changed during order placement)
  - [ ] Use cached price for order total recalculation
  - **Acceptance**: Prices validated, mismatches logged

- ⬜ **6.1.5** — Write tests for menu sync
  - [ ] Test webhook endpoint (valid/invalid signatures)
  - [ ] Test cache update
  - [ ] Test cache TTL expiration
  - [ ] Test cache miss fallback (DB lookup)
  - [ ] Test menu price validation
  - **Acceptance**: All menu sync flows tested

---

### User Story 6.2: Implement Promotion/Voucher Validation

**Goal**: Validate and apply promotions to orders

- ⬜ **6.2.1** — Design promotion schema
  - [ ] Create Promotion table (id, store_id, code, type, value, min_order, max_discount, valid_from, valid_until, usage_limit, usage_count, active)
  - [ ] Support types: percentage (e.g., 10%), fixed_amount (e.g., Rp 5000)
  - [ ] Support constraints: min_order_amount, max_discount
  - **Acceptance**: Schema supports all promotion types

- ⬜ **6.2.2** — Implement PromotionValidator
  - [ ] Create validate(promotion_code, order_total) method
  - [ ] Check promotion exists and is active
  - [ ] Check expiration (valid_from ≤ now ≤ valid_until)
  - [ ] Check usage limit (usage_count < usage_limit)
  - [ ] Check min_order_amount
  - [ ] Calculate discount amount (respecting max_discount)
  - [ ] Return validation result + discount amount
  - **Acceptance**: All validation rules implemented

- ⬜ **6.2.3** — Implement promotion application in order ingestion
  - [ ] On order ingestion, validate promotion code if provided
  - [ ] Calculate discount amount
  - [ ] Adjust order total and tax if applicable
  - [ ] Return adjusted totals
  - [ ] Log promotion application
  - [ ] Reject order if promotion invalid
  - **Acceptance**: Promotions applied correctly, invalids rejected

- ⬜ **6.2.4** — Implement promotion usage tracking
  - [ ] Increment usage_count when promotion applied
  - [ ] Store promotion_id in order for audit
  - [ ] Handle concurrent promotion applications (prevent over-usage)
  - [ ] Log usage tracking
  - **Acceptance**: Usage counted accurately, no over-usage

- ⬜ **6.2.5** — Write tests for promotion validation
  - [ ] Test valid promotion (all checks pass)
  - [ ] Test expired promotion (rejected)
  - [ ] Test usage limit exceeded (rejected)
  - [ ] Test min_order_amount not met (rejected)
  - [ ] Test percentage and fixed_amount discounts
  - [ ] Test max_discount cap
  - [ ] Test concurrent promotion applications
  - **Acceptance**: All promotion scenarios tested

---

### User Story 6.3: Implement Promotion Management Dashboard

**Goal**: Enable admins to create and manage promotions

- ⬜ **6.3.1** — Implement promotion CRUD endpoints
  - [ ] POST /api/admin/promotions — Create promotion
  - [ ] GET /api/admin/promotions — List promotions (paginated, filterable)
  - [ ] GET /api/admin/promotions/{promo_id} — Get promotion details
  - [ ] PATCH /api/admin/promotions/{promo_id} — Update promotion
  - [ ] DELETE /api/admin/promotions/{promo_id} — Soft delete promotion
  - **Acceptance**: All CRUD operations work

- ⬜ **6.3.2** — Implement promotion dashboard UI
  - [ ] Create promotion list view (code, type, discount, status, usage)
  - [ ] Create promotion detail view (full details + usage history)
  - [ ] Create promotion form (add/edit)
  - [ ] Add date/time pickers for valid_from/valid_until
  - [ ] Real-time validation (e.g., code uniqueness)
  - **Acceptance**: Dashboard UI complete, form validation works

- ⬜ **6.3.3** — Implement promotion usage analytics
  - [ ] Create usage report (promotions sorted by usage count)
  - [ ] Show promotion effectiveness (discount given vs. order count)
  - [ ] Export as CSV
  - **Acceptance**: Analytics calculated, export works

- ⬜ **6.3.4** — Write tests for promotion management
  - [ ] Test CRUD operations
  - [ ] Test form validation
  - [ ] Test usage analytics
  - **Acceptance**: All CRUD and management flows tested

---

## Phase 7: Testing & Hardening (Weeks 13–14)

### User Story 7.1: End-to-End Integration Tests

**Goal**: Test full order-to-receipt cycle with real external integrations

- ⬜ **7.1.1** — Design E2E test scenarios
  - [ ] Scenario 1: Pick-Up order → payment (QRIS) → receipt (thermal)
  - [ ] Scenario 2: Pick-Up order → payment (GoPay) → receipt (WhatsApp fallback)
  - [ ] Scenario 3: In-store order → payment (card) → receipt (both channels)
  - [ ] Scenario 4: Order with promotion + payment → receipt
  - [ ] Document all scenarios
  - **Acceptance**: Scenarios documented

- ⬜ **7.1.2** — Implement E2E test suite
  - [ ] Set up E2E testing framework (Cypress, Selenium, Playwright)
  - [ ] Implement test for Scenario 1 (full flow, assertions)
  - [ ] Implement test for Scenario 2
  - [ ] Implement test for Scenario 3
  - [ ] Implement test for Scenario 4
  - [ ] Add test data setup/teardown
  - **Acceptance**: All scenarios have E2E tests

- ⬜ **7.1.3** — Mock external integrations for E2E tests
  - [ ] Mock payment provider API (success/failure responses)
  - [ ] Mock WhatsApp API (delivery status)
  - [ ] Mock thermal printer (success/failure)
  - [ ] Mock menu sync webhook
  - **Acceptance**: Mocks realistic, E2E tests pass with mocks

- ⬜ **7.1.4** — Run E2E tests in CI/CD
  - [ ] Add E2E tests to GitHub Actions pipeline
  - [ ] Run on every commit to main
  - [ ] Report failures to team (email, Slack)
  - **Acceptance**: E2E tests run automatically, failures reported

---

### User Story 7.2: Network Resilience Testing

**Goal**: Test POS behavior during network outages and latency

- ⬜ **7.2.1** — Implement network failure simulation tests
  - [ ] Test webhook ingestion during mobile app disconnection
  - [ ] Test order status sync when WebSocket times out
  - [ ] Test payment processing with provider timeout
  - [ ] Test receipt delivery when printer unreachable
  - [ ] Test graceful degradation (queueing, retries, alerts)
  - **Acceptance**: All failure scenarios tested

- ⬜ **7.2.2** — Implement high-latency simulation tests
  - [ ] Introduce 1s, 5s, 10s latency in API responses
  - [ ] Verify DELAYED badge appears correctly
  - [ ] Verify UI remains responsive
  - [ ] Verify no dropped requests
  - **Acceptance**: High-latency scenarios handled gracefully

- ⬜ **7.2.3** — Test reconnection and data recovery
  - [ ] Simulate network drop followed by reconnection
  - [ ] Verify queued orders delivered after reconnection
  - [ ] Verify status updates resync
  - [ ] Verify no duplicate orders
  - **Acceptance**: Reconnection recovery works

---

### User Story 7.3: Payment Provider Failure Testing

**Goal**: Test POS resilience to payment provider outages

- ⬜ **7.3.1** — Implement payment provider timeout tests
  - [ ] Simulate QRIS provider timeout
  - [ ] Simulate GoPay API rate limit (429)
  - [ ] Simulate card payment 3D Secure timeout
  - [ ] Verify retry logic triggers
  - [ ] Verify staff alert displays
  - **Acceptance**: All provider failure modes handled

- ⬜ **7.3.2** — Implement payment status mismatch tests
  - [ ] Webhook arrives late (order already marked complete)
  - [ ] Payment provider reports success but webhook never arrives
  - [ ] Status poller detects and corrects mismatch
  - [ ] Reconciliation report shows discrepancy
  - **Acceptance**: All mismatch scenarios detected and resolved

- ⬜ **7.3.3** — Test refund workflow
  - [ ] Request refund for completed payment
  - [ ] Verify provider refund initiates
  - [ ] Verify status updates to REFUNDED
  - [ ] Verify audit log captures refund
  - **Acceptance**: Refund workflow works end-to-end

---

### User Story 7.4: Duplicate Order Prevention Testing

**Goal**: Verify duplicate orders cannot be processed

- ⬜ **7.4.1** — Implement duplicate detection tests
  - [ ] Send same order twice (same client_order_id)
  - [ ] Verify second order rejected with 409
  - [ ] Verify first order returned in response
  - [ ] Verify no charges applied twice
  - **Acceptance**: Duplicates reliably detected

- ⬜ **7.4.2** — Test edge cases for duplicates
  - [ ] Concurrent duplicate requests (race condition)
  - [ ] Duplicate after several minutes delay
  - [ ] Duplicate with modified amount (should be rejected)
  - **Acceptance**: All edge cases handled safely

---

### User Story 7.5: Thermal Printer Offline Testing

**Goal**: Verify receipt delivery fallback when printer offline

- ⬜ **7.5.1** — Implement printer offline simulation
  - [ ] Simulate USB printer disconnected
  - [ ] Simulate network printer timeout
  - [ ] Simulate printer out of paper
  - **Acceptance**: All offline scenarios simulatable

- ⬜ **7.5.2** — Test receipt fallback to WhatsApp
  - [ ] When thermal fails, WhatsApp queued as fallback
  - [ ] Verify receipt delivers via WhatsApp
  - [ ] Verify staff alerted of printer failure
  - [ ] Verify retry button available in dashboard
  - **Acceptance**: Fallback to WhatsApp works

- ⬜ **7.5.3** — Test print queue retry logic
  - [ ] Printer comes back online
  - [ ] Queued receipts print successfully
  - [ ] No duplicate receipts
  - **Acceptance**: Queue processes correctly

---

### User Story 7.6: Security Testing

**Goal**: Verify no security vulnerabilities in critical paths

- ⬜ **7.6.1** — Test webhook signature verification
  - [ ] Webhook with invalid signature rejected
  - [ ] Webhook without signature rejected
  - [ ] Webhook with valid signature accepted
  - **Acceptance**: Signature verification working

- ⬜ **7.6.2** — Test payment data handling
  - [ ] No raw card data in logs
  - [ ] No raw card data in database
  - [ ] Card data tokenized by provider
  - [ ] PCI compliance verified
  - **Acceptance**: Card data secured

- ⬜ **7.6.3** — Test staff authentication
  - [ ] Invalid token rejected
  - [ ] Expired token rejected
  - [ ] Valid token accepted
  - [ ] Staff cannot access other store's orders
  - **Acceptance**: Authentication and authorization working

- ⬜ **7.6.4** — Test API rate limiting
  - [ ] Rate limit enforced on webhook endpoint (per signature)
  - [ ] Rate limit enforced on API endpoints (per token)
  - [ ] Rate limit headers returned (X-RateLimit-*)
  - **Acceptance**: Rate limiting working

---

### User Story 7.7: Code Coverage & Quality

**Goal**: Achieve high code coverage and code quality standards

- ⬜ **7.7.1** — Achieve 90%+ code coverage
  - [ ] Run coverage report
  - [ ] Identify uncovered code paths
  - [ ] Add tests for critical paths
  - [ ] Reach 90%+ coverage threshold
  - **Acceptance**: Coverage report shows 90%+

- ⬜ **7.7.2** — Run static code analysis
  - [ ] Configure linting (ESLint, Pylint)
  - [ ] Configure code complexity analysis (SonarQube, CodeFactor)
  - [ ] Fix all critical issues
  - [ ] Fix all high-priority issues
  - **Acceptance**: No critical/high issues remaining

- ⬜ **7.7.3** — Code review checklist
  - [ ] All changes reviewed by 2+ team members
  - [ ] All comments addressed
  - [ ] No blocking concerns
  - **Acceptance**: Code review complete

---

## Phase 8: Deployment & Operations (Week 15)

### User Story 8.1: Set Up CI/CD Pipeline

**Goal**: Automate build, test, and deployment

- ⬜ **8.1.1** — Design CI/CD pipeline
  - [ ] Define stages: build, lint, test, security scan, deploy-staging, deploy-production
  - [ ] Define triggers (on push, PR, manual)
  - [ ] Define notifications (email, Slack)
  - **Acceptance**: Pipeline architecture documented

- ⬜ **8.1.2** — Implement GitHub Actions workflow
  - [ ] Create .github/workflows/main.yml
  - [ ] Build stage: compile/install dependencies
  - [ ] Lint stage: ESLint/Pylint
  - [ ] Test stage: unit tests + E2E tests
  - [ ] Coverage stage: upload to Codecov
  - **Acceptance**: GitHub Actions workflow runs successfully

- ⬜ **8.1.3** — Implement security scanning
  - [ ] Add SAST scanning (SonarQube, Snyk)
  - [ ] Add dependency vulnerability scanning
  - [ ] Add container image scanning (if using Docker)
  - [ ] Fail pipeline if high-severity issues found
  - **Acceptance**: Security scanning integrated, issues reported

- ⬜ **8.1.4** — Implement staging deployment
  - [ ] Deploy to staging on every successful build
  - [ ] Run smoke tests on staging
  - [ ] Alert on deployment failure
  - **Acceptance**: Staging deploys automatically

- ⬜ **8.1.5** — Implement production deployment
  - [ ] Manual approval required before production deploy
  - [ ] Blue-green deployment or canary rollout
  - [ ] Health checks post-deployment
  - [ ] Automatic rollback on health check failure
  - **Acceptance**: Production deployment workflow tested

---

### User Story 8.2: Deploy to Staging Environment

**Goal**: Run full system in staging for final validation

- ⬜ **8.2.1** — Set up staging infrastructure
  - [ ] Provision staging database (PostgreSQL)
  - [ ] Provision staging Redis cache
  - [ ] Provision staging application servers
  - [ ] Set up staging monitoring/logging
  - **Acceptance**: Staging environment ready

- ⬜ **8.2.2** — Deploy POS backend to staging
  - [ ] Deploy latest build
  - [ ] Run database migrations
  - [ ] Seed staging data (menu, promotions, test orders)
  - [ ] Verify all services running
  - **Acceptance**: Staging deployment successful

- ⬜ **8.2.3** — Run full E2E tests on staging
  - [ ] Run all E2E test scenarios
  - [ ] Test with real payment provider sandbox
  - [ ] Test with real WhatsApp sandbox
  - [ ] Verify all scenarios pass
  - **Acceptance**: All E2E tests pass on staging

- ⬜ **8.2.4** — Perform manual validation
  - [ ] Staff testing (create, update, complete orders)
  - [ ] Payment testing (process payments)
  - [ ] Receipt testing (print and WhatsApp)
  - [ ] Sync testing (mobile app integration)
  - [ ] Performance testing (response times, load)
  - **Acceptance**: All manual tests pass

---

### User Story 8.3: Create Operational Documentation

**Goal**: Document system for operational support teams

- ⬜ **8.3.1** — Create system architecture documentation
  - [ ] Architecture diagram (components, data flow)
  - [ ] Technology stack documentation
  - [ ] Data model documentation
  - [ ] API documentation (Swagger/OpenAPI)
  - **Acceptance**: Architecture documented

- ⬜ **8.3.2** — Create operational runbook
  - [ ] Startup procedures
  - [ ] Common troubleshooting scenarios
  - [ ] Backup and recovery procedures
  - [ ] Scaling procedures
  - [ ] Emergency contact list
  - **Acceptance**: Runbook complete

- ⬜ **8.3.3** — Create deployment runbook
  - [ ] Pre-deployment checklist
  - [ ] Deployment steps (step-by-step)
  - [ ] Rollback procedure
  - [ ] Post-deployment validation
  - **Acceptance**: Deployment runbook complete

- ⬜ **8.3.4** — Create staff documentation
  - [ ] POS user guide (how to use dashboard)
  - [ ] Troubleshooting guide (common issues)
  - [ ] FAQ
  - [ ] Video tutorials (if applicable)
  - **Acceptance**: Staff documentation complete

---

### User Story 8.4: Set Up Monitoring & Alerting

**Goal**: Enable 24/7 operational visibility

- ⬜ **8.4.1** — Set up application metrics
  - [ ] Configure metrics collection (Prometheus or DataDog)
  - [ ] Define key metrics: request latency, error rate, payment success rate, receipt delivery rate
  - [ ] Export metrics to dashboard
  - **Acceptance**: Metrics collected and visible

- ⬜ **8.4.2** — Set up health checks
  - [ ] Implement health check endpoint: GET /health
  - [ ] Check database connectivity
  - [ ] Check Redis connectivity
  - [ ] Check payment provider connectivity
  - [ ] Return 200 OK if all healthy, 503 if unhealthy
  - **Acceptance**: Health check endpoint working

- ⬜ **8.4.3** — Create alerting rules
  - [ ] Alert if error rate >5% (page ops team)
  - [ ] Alert if payment success rate <95% (page ops + product)
  - [ ] Alert if receipt delivery failure rate >10% (page ops)
  - [ ] Alert if webhook failures >100 in 5 minutes (page ops)
  - [ ] Alert if database response time >1s (page ops)
  - **Acceptance**: Alerting rules configured

- ⬜ **8.4.4** — Set up alert escalation
  - [ ] Define alert severity levels (critical, high, medium, low)
  - [ ] Critical: immediate page (Opsgenie/PagerDuty)
  - [ ] High: email + Slack
  - [ ] Medium: Slack only
  - [ ] Low: logged but not alerted
  - **Acceptance**: Alert escalation working

---

### User Story 8.5: Train Store Staff

**Goal**: Prepare staff to operate POS system

- ⬜ **8.5.1** — Design training program
  - [ ] Training sessions: basic operations, troubleshooting, edge cases
  - [ ] Practice scenarios: create order, process payment, print receipt, handle failures
  - [ ] Q&A session
  - [ ] Certification/sign-off
  - **Acceptance**: Training program designed

- ⬜ **8.5.2** — Conduct training sessions
  - [ ] Schedule training for each store
  - [ ] Deliver training to staff
  - [ ] Hands-on practice with POS
  - [ ] Address questions
  - **Acceptance**: Staff trained and confident

- ⬜ **8.5.3** — Set up support hotline
  - [ ] Designate on-call support person
  - [ ] Create support ticket system
  - [ ] Provide contact information to staff
  - [ ] Set response time SLA (e.g., 15 minutes)
  - **Acceptance**: Support hotline active

---

### User Story 8.6: Production Deployment

**Goal**: Deploy to production with zero downtime

- ⬜ **8.6.1** — Pre-deployment validation
  - [ ] Run pre-deployment checklist
  - [ ] Verify staging tests pass
  - [ ] Verify monitoring/alerting configured
  - [ ] Verify runbooks reviewed
  - [ ] Get sign-off from tech lead and product
  - **Acceptance**: All checks pass, sign-off received

- ⬜ **8.6.2** — Execute production deployment
  - [ ] Backup production database
  - [ ] Deploy new version (blue-green or canary)
  - [ ] Run smoke tests
  - [ ] Monitor error rates and latency
  - [ ] Verify health check passing
  - **Acceptance**: Deployment successful, system healthy

- ⬜ **8.6.3** — Perform post-deployment validation
  - [ ] Monitor system for 2 hours
  - [ ] Check logs for errors
  - [ ] Test critical flows (order ingestion, payment, receipt)
  - [ ] Confirm staff can operate system
  - **Acceptance**: System stable, staff comfortable

- ⬜ **8.6.4** — Document deployment
  - [ ] Log deployment metadata (version, timestamp, deployed by)
  - [ ] Summarize changes (new features, bug fixes)
  - [ ] Note any issues encountered and resolutions
  - **Acceptance**: Deployment documented for future reference

---

## Task Summary by Status

**Total Tasks**: ~250

**Estimation**:
- Phase 1 (Weeks 1–2): ~30 tasks
- Phase 2 (Weeks 3–4): ~25 tasks
- Phase 3 (Weeks 5–6): ~20 tasks
- Phase 4 (Weeks 7–8): ~20 tasks
- Phase 5 (Weeks 9–10): ~25 tasks
- Phase 6 (Weeks 11–12): ~30 tasks
- Phase 7 (Weeks 13–14): ~60 tasks
- Phase 8 (Week 15): ~40 tasks

**Execution Notes**:
- Tasks marked ⬜ are "Not Started"
- As work progresses, update status: ⏳ (In Progress) → ✅ (Complete)
- Blocked tasks marked ❌ with reason in comment
- Dependencies documented in each task description

**Next Steps**:
1. Form development team (backend, frontend, QA, DevOps)
2. Assign tasks to team members
3. Hold kickoff meeting to review plan and tasks
4. Begin Phase 1 (Foundation)

---

**Tasks Document Status**: Ready for team assignment and execution
