# E_COMMERCE_IMPLEMENTATION_PLAN.md

## 1. Executive Summary

This document is a comprehensive architectural audit and implementation roadmap for the `Ecomerce-BE-NestJs-1` repository. It provides structural verification based on the provided repository file layout.

**CRITICAL VERIFICATION LIMITATION:** This audit verifies the existence of modules, controllers, services, and models based *only* on the physical file tree and naming conventions. **Business logic, exact HTTP methods, decorators, and route paths have NOT been verified via AST parsing.** 
*Google Antigravity Instructions:* You MUST read and parse the actual AST of the specified controller and service files to confirm exact route names, existing logic, and DTOs before implementing modifications. Do not assume any functionality is fully implemented just because the file exists.

**System Architecture Requirement (Transactions):** The implementation of Checkout, Inventory Reservation, and Webhooks strictly requires ACID transactions. **MongoDB must be deployed as a Replica Set** to support the `ClientSession` and transaction capabilities required in this plan.

## 2. Actual Technology Stack and Versions

* **Framework:** NestJS (Node.js)
* **Language:** TypeScript
* **API Architecture:** REST APIs (Inferred via `.controller.ts` files).
* **Database:** MongoDB via Mongoose (Inferred via `src/db/model/*.model.ts`).
* **Caching:** Redis (Inferred via `src/common/service/redis/redis.service.ts`).
* **File Storage:** Cloudinary (Inferred via `src/common/service/cloudinary/cloud.service.ts`).
* **Testing:** Vitest (Verified via `vitest.config.ts` and `vitest.config.e2e.ts`).
* **Linting/Formatting:** Oxlint (`oxlint.json`) and Prettier (`.prettierrc`).
* **Dependencies to Add:** `stripe` (Note: The official `stripe` package includes TypeScript definitions natively; `@types/stripe` is redundant and should not be installed), `@nestjs/schedule` (for cron jobs).

## 3. Structural Status Audit (Unverified Logic)

| Feature Module | Status | Verified Files (Existence Only) | Implementation Notes & Missing Logic | 
| ----- | ----- | ----- | ----- | 
| **Auth / Users** | PARTIAL | `auth.controller.ts`, `auth.service.ts`, `user.model.ts`, `auth.guard.ts`, `check-role.guard.ts` | JWT auth structure exists. **Unverified:** Actual token generation. **Missing:** Secure hashed refresh token rotation, Address management, Password reset. | 
| **Category** | PARTIAL | `category.controller.ts`, `category.service.ts`, `catedory.model.ts` | Basic CRUD structure exists. **Issues:** Typo in schema filename (`catedory.model.ts`). | 
| **Brand** | PARTIAL | `brand.controller.ts`, `brand.service.ts`, `brand.model.ts` | Basic CRUD structure exists. | 
| **Product** | NEEDS_FIX | `product.controller.ts`, `product.service.ts` | Structure exists. **Missing:** `product.model.ts` is missing from `src/db/model/`. No DB integration exists. | 
| **Cart** | MISSING | None | Requires full implementation and dynamic server-side price calculation. | 
| **Wishlist** | MISSING | None | Requires full implementation. | 
| **Orders / Checkout** | MISSING | None | Requires full implementation, atomic inventory reservation, and price snapshotting. | 
| **Payments (Stripe)** | MISSING | None | Requires Stripe SDK wrapper, Intent creation, Webhook processing, and retry handling. | 
| **Reviews & Ratings** | MISSING | None | Requires full implementation. | 
| **Discounts / Coupons** | MISSING | None | Requires full implementation with concurrent redemption protection. | 

## 4. Unverified API Audit

*Note: The following routes are assumptions based on standard NestJS REST conventions. Antigravity MUST parse the exact `@Get()`, `@Post()`, etc., decorators in the source code to confirm exact paths and DTOs before integrating.*

* **Auth Module** (`src/module/auth/auth.controller.ts`)
  * `POST /auth/register`, `POST /auth/login` [UNVERIFIED]
* **Category Module** (`src/module/category/category.controller.ts`)
  * `GET /category`, `POST /category`, `PATCH /category/:id`, `DELETE /category/:id` [UNVERIFIED]
* **Brand Module** (`src/module/brand/brand.controller.ts`)
  * `GET /brand`, `POST /brand`, `PATCH /brand/:id`, `DELETE /brand/:id` [UNVERIFIED]
* **Product Module** (`src/module/product/product.controller.ts`)
  * `GET /product`, `POST /product`, `PATCH /product/:id`, `DELETE /product/:id` [UNVERIFIED]

## 5. Complete Stripe Architecture & Concurrency Plan

To prevent double stock deductions, race conditions, duplicate orders, and lost carts, the Stripe integration utilizes **Payment Intents**, **Idempotent Webhooks**, and **Atomic MongoDB Operations**.

* **Payment Intent and Order Relationship:** 1:1 relationship. The `Order` model will contain a `stripePaymentIntentId` field.
* **Cart Preservation:** The User's Cart is **NOT** cleared upon Order creation. It is only cleared upon successful payment (`payment_intent.succeeded`). If a payment fails or expires, the user's cart remains intact for a seamless retry.
* **Payment Status Lifecycle & Webhook Handling:**
  * `PENDING`: Order created, Payment Intent initialized. Stock is temporarily reserved.
  * `payment_intent.payment_failed`: A payment attempt failed (e.g., declined card). **DO NOT** cancel the order or release stock. The PaymentIntent remains active for the user to retry with a different payment method.
  * `payment_intent.canceled`: The PaymentIntent was explicitly canceled or expired. Update Order to `CANCELLED` and release `reservedStock`.
  * `payment_intent.succeeded`: Payment confirmed. Update Order to `PAID`, permanently deduct stock, and clear the User's Cart.
* **Atomic Inventory Reservation (Concurrency Protection):**
  * Use MongoDB query conditions to prevent overselling during concurrent checkouts. Example: `updateOne({ _id: productId, stock: { $gte: qty } }, { $inc: { reservedStock: qty, stock: -qty } })`.
* **Inventory Expiration (Cron Job):**
  * Implement `@nestjs/schedule` to run a job every minute. Find `PENDING` orders older than 15 minutes. Cancel the Stripe PaymentIntent via API, mark Order `CANCELLED`, and atomically release `reservedStock` back to `stock`.
* **Webhook Idempotency & Duplicate Protection:**
  * Create a `WebhookEvent` MongoDB collection.
  * Store `stripeEventId` inside a MongoDB transaction. If the ID exists (Unique Index violation), the webhook is a duplicate and must be safely ignored (return 200 OK).

## 6. Implementation Phases

**Antigravity Instructions:** Execute the following phases sequentially. Ensure `dependencies` are met before starting a phase. Perform localized AST reads to verify existing logic.

### Phase 1: Codebase Stabilization & Secure Auth Extensions
* **Objective:** Fix structural typos, implement secure Refresh Token rotation, and expand User profiles.
* **Exact files to create:** `src/db/model/address.model.ts`
* **Exact files to modify:** 
  * `src/db/model/catedory.model.ts` (Rename to `category.model.ts`)
  * `src/module/category/category.service.ts` (Update imports)
  * `src/db/model/user.model.ts`
  * `src/module/auth/auth.service.ts`
* **Dependencies:** None.
* **Implementation steps:**
  1. Rename `catedory.model.ts` and update internal references.
  2. Update `user.model.ts` to add `addresses` (ObjectIds), `hashedRefreshToken`, and `role`.
  3. Implement Refresh Token Rotation in `auth.service.ts`: Hash the refresh token using bcrypt/argon2 before storing it in the DB. Invalidate old tokens upon reuse to prevent replay attacks.
* **API requirements:** `PATCH /auth/profile`, `POST /auth/refresh`.
* **Validation and authorization:** `PATCH /auth/profile` requires `@UseGuards(AuthGuard)`.
* **Database changes:** User schema update; Address schema creation.
* **Testing requirements:** 
  * *Positive:* Successful profile update, successful token refresh.
  * *Negative:* Attempting to refresh with an old/reused token must fail and invalidate the token family.
* **Acceptance criteria:** Project compiles. Secure refresh token rotation is active.

### Phase 2: Product & Inventory Management
* **Objective:** Implement the Product data model and finalize CRUD with concurrency support.
* **Exact files to create:** `src/db/model/product.model.ts`
* **Exact files to modify:** `src/module/product/product.service.ts`, `product.controller.ts`, `dto/create-product.dto.ts`, `dto/update-product.dto.ts`
* **Dependencies:** Category, Brand, Cloudinary Service.
* **Implementation steps:**
  1. Define `product.model.ts`: `name`, `slug`, `price`, `stock`, `reservedStock` (default 0), `categoryId`, `brandId`, `images`.
  2. Implement Service logic with pagination, filtering, and sorting.
* **API requirements:** Verify and implement `GET`, `POST`, `PATCH`, `DELETE` for `/product`.
* **Validation and authorization:** `POST`, `PATCH`, `DELETE` require Admin role.
* **Database changes:** New Product collection with indexes.
* **Testing requirements:**
  * *Negative:* Admin creation with invalid categoryId/brandId must fail. Users attempting POST must get 403 Forbidden.
* **Acceptance criteria:** Products can be created, updated, and fetched accurately.

### Phase 3: Cart & Wishlist Modules
* **Objective:** Allow users to manage carts/wishlists with secure server-side pricing.
* **Exact files to create:** `src/db/model/cart.model.ts`, `src/db/model/wishlist.model.ts`, `src/module/cart/*`, `src/module/wishlist/*`
* **Exact files to modify:** `src/app.module.ts`
* **Dependencies:** Product Module, Auth Guard.
* **Implementation steps:**
  1. `cart.model.ts`: `userId`, `items` (`productId`, `quantity`).
  2. `CartService.getCart()` must query `ProductModel` to dynamically calculate the `totalPrice` on the fly. Do NOT store derived prices permanently in the cart to avoid staleness.
* **API requirements:** `POST /cart`, `GET /cart`, `DELETE /cart/:itemId`, `POST /wishlist`, `GET /wishlist`.
* **Validation and authorization:** All routes require Auth.
* **Database changes:** Cart and Wishlist collections.
* **Testing requirements:**
  * *Negative:* Adding a product ID that doesn't exist returns 404. Attempting to add more quantity than available `stock` returns 400.
* **Acceptance criteria:** Cart strictly calculates totals server-side based on real-time DB prices.

### Phase 4: Coupons & Discounts
* **Objective:** Implement promotional codes with atomic usage limits.
* **Exact files to create:** `src/db/model/coupon.model.ts`, `src/module/coupon/*`
* **Exact files to modify:** `src/app.module.ts`
* **Dependencies:** Cart Module.
* **Implementation steps:**
  1. Schema: `code`, `discountPercentage`, `expirationDate`, `usageLimit`, `usedCount`.
  2. Service validation: Use a MongoDB transaction to atomically check `usedCount < usageLimit` and increment `usedCount` during order finalization to prevent concurrent redemption bypass.
* **API requirements:** `POST /coupon/apply` (Validates against user's cart).
* **Validation and authorization:** Admin CRUD for coupons.
* **Database changes:** Coupon collection.
* **Testing requirements:**
  * *Edge Case:* Simulate concurrent requests applying a coupon with 1 remaining usage to ensure only one succeeds.
* **Acceptance criteria:** Coupons are atomically protected against overuse.

### Phase 5: Orders & Checkout Pipeline
* **Objective:** Freeze cart prices, handle atomic inventory reservation, and initiate Stripe.
* **Exact files to create:** `src/db/model/order.model.ts`, `src/module/order/*`
* **Exact files to modify:** `src/app.module.ts`
* **Dependencies:** Cart, Product, MongoDB Replica Set.
* **Implementation steps:**
  1. `order.model.ts`: `userId`, `items` (frozen snapshot), `totalAmount`, `status` (PENDING, PAID, CANCELLED), `stripePaymentIntentId`.
  2. `OrderService.checkout()` (Inside a MongoDB Transaction):
     a. Fetch User's Cart and validate current prices.
     b. Atomically reserve inventory for all items: `updateMany` where `stock >= qty`, decrement `stock`, increment `reservedStock`. If any item fails, abort transaction.
     c. Create Order in `PENDING` state.
     d. *Leave Cart intact.*
* **API requirements:** `POST /order/checkout`.
* **Validation and authorization:** Auth required.
* **Database changes:** Order collection.
* **Testing requirements:**
  * *Edge Case:* Concurrent checkouts for a product with 1 stock left. Only one transaction should succeed; the other must throw an OutOfStock error.
* **Acceptance criteria:** Atomic reservations work perfectly under concurrent load.

### Phase 6: Stripe Payments, Idempotent Webhooks & Expiration
* **Objective:** Process payments, handle lifecycle webhooks, and expire old orders.
* **Exact files to create:** `src/db/model/webhook-event.model.ts`, `src/module/payment/*`, `src/module/cron/*`
* **Exact files to modify:** `src/app.module.ts`, `src/main.ts` (Raw body parsing).
* **Dependencies:** `stripe`, `@nestjs/schedule`, Order Module.
* **Implementation steps:**
  1. `PaymentController`: `/payment/create-intent` takes `orderId`, verifies ownership, generates Stripe Payment Intent, saves ID to Order.
  2. `WebhookController`: Verify Stripe signature.
  3. Webhook Transaction: Begin session. Insert `stripeEventId` to `WebhookEvent`. If unique constraint fails, abort (duplicate).
  4. Handle `payment_intent.canceled`: Mark Order `CANCELLED`, decrement `reservedStock`, increment `stock`.
  5. Handle `payment_intent.succeeded`: Mark Order `PAID`, decrement `reservedStock`, CLEAR the user's Cart.
  6. `CronService`: Run every minute. Find `PENDING` orders > 15 mins old. Cancel Stripe PI, mark `CANCELLED`, restore stock.
* **API requirements:** `POST /payment/create-intent`, `POST /webhook/stripe`.
* **Testing requirements:**
  * *Negative:* Send `payment_intent.payment_failed` - verify order remains `PENDING` and stock remains reserved.
  * *Negative:* Send duplicate `payment_intent.succeeded` - verify idempotency ignores the second request.
* **Acceptance criteria:** Payments process securely. Expired orders restore stock automatically.

### Phase 7: Reviews and Ratings
* **Objective:** Allow users to review products they have successfully purchased.
* **Exact files to create:** `src/db/model/review.model.ts`, `src/module/review/*`
* **Exact files to modify:** `src/app.module.ts`
* **Dependencies:** Order, Product.
* **Implementation steps:**
  1. Schema: `userId`, `productId`, `rating` (1-5), `comment`.
  2. Verify User has an Order for `productId` with status `PAID`.
* **Testing requirements:**
  * *Negative:* Attempting to review an unpurchased product, or an order in `PENDING` status, returns 403 Forbidden.
* **Acceptance criteria:** Reviews are tied strictly to verified purchases.

### Phase 8: End-to-End System Integration
* **Objective:** Validate the entire e-commerce lifecycle from registration to review.
* **Exact files to create:** `test/e-commerce-lifecycle.e2e-spec.ts`
* **Dependencies:** All previous modules.
* **Implementation steps:**
  1. Write a comprehensive E2E test suite simulating a user flow:
     * Register -> Login -> Browse Products -> Add to Cart.
     * Apply Coupon -> Checkout (Reserve Stock) -> Create Payment Intent.
     * Simulate Stripe Webhook (`payment_intent.succeeded`).
     * Verify Cart is cleared, Order is `PAID`, and permanent stock is deducted.
     * Post a Review.
* **Acceptance criteria:** The E2E test passes sequentially without manual intervention, proving the modules integrate seamlessly and transactions hold under automated execution.