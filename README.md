# Smart Expense Management System

A personal financial management and budgeting platform featuring a **Spring Boot 3** REST API and a **React 18 + Vite** client.

---

## 🏗️ Architecture

```
[ Browser Client ]
        │  (HTTP / REST + Bearer JWT)
        ▼
[ React 18 SPA (Vite + Chart.js) ]
        │
        ▼
[ Spring Boot 3 REST Backend (Port 8096) ]
  ├── Security Filter Chain (JwtAuthFilter, Stateless Sessions)
  ├── Controllers (AuthController, ExpenseController, BudgetController, CategoryController, DashboardController)
  ├── Service Layer (User scoping, budget limit calculations, ownership verification)
  └── Spring Data JPA Repositories
        │
        ▼
[ MySQL 8.0 Database (expense_db) ]
```

---

## 🗄️ Domain Model & Entity Relationships

- **User**: Authentication identity (`name`, `email`, `password_hash`, `role`).
- **Expense**: Many-to-1 with `User`. Tracks `title`, `amount`, `category`, `date`, `paymentMethod`, and `description`.
  - Optimized with a compound B-tree index on `(user_id, date)`.
- **Budget**: Many-to-1 with `User`. Stores monthly expenditure thresholds per category (`limitAmount`, `month`, `year`).
- **Category**: Master metadata for categorization (`name`, `icon`, `color`).

---

## 🔒 Security & Data Invariants

1. **User Scoping & IDOR Prevention**: Every expense and budget mutation strictly validates entity ownership against the authenticated JWT principal. Any attempt to read or modify another user's record triggers `UnauthorizedAccessException`, returning `403 Forbidden`.
2. **Category Administration & Integrity**: Shared category mutation (`POST`, `PUT`, `DELETE`) is restricted to users with `ROLE_ADMIN` via Spring Security `@PreAuthorize`, preventing users from tampering with shared metadata. Category models validate non-blank names with length constraints.
3. **Server-Side Search & Multi-Page Filtering**: Expense querying supports server-side pagination with dynamic search terms and category criteria (`searchExpenses` query), allowing complete dataset searching rather than client-only page slicing.
4. **Database Indexing & Sargable Date Predicates**: The `expenses` table utilizes a composite index on `(user_id, date)` with date-range predicates (`date >= :start AND date < :end`) to accelerate monthly and trend aggregations without breaking index usability.

---

## ⚙️ Getting Started

### Prerequisites
- **Java**: JDK 17 or 21
- **Node.js**: v18 or later
- **MySQL**: 8.0+ running locally

### 1. Database Setup
```sql
CREATE DATABASE IF NOT EXISTS expense_db;
```

### 2. Backend Setup
1. Configure database credentials or copy the example properties:
   ```bash
   cp backend/src/main/resources/application-example.properties backend/src/main/resources/application.properties
   ```
2. Run backend via Maven Wrapper:
   ```bash
   cd backend
   .\mvnw clean spring-boot:run
   ```
   Backend starts at **`http://localhost:8096`**.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend starts at **`http://localhost:5196`**.

---

## 🧪 Running Automated Tests

The backend test suite contains **23 automated JUnit 5 & Mockito tests**:

```bash
cd backend
.\mvnw test
```

### Test Coverage
- `ExpenseDTOValidationTest`: Validates bean validation rules (rejection of blank titles, zero/negative amounts, missing categories).
- `ExpenseServiceTest`: Verifies user-scoping, pagination, category filtering, and ownership rejection on unauthorized updates/deletions.
- `BudgetServiceTest`: Verifies budget spending calculations, percentage alerts, zero-spend boundaries, and ownership checks.
- `DashboardServiceTest`: Verifies budget threshold warnings (highlighting budgets $\ge 80\%$) and trend aggregation.

---

## ⚖️ Known Limitations & Trade-offs

- **Stateless Revocation**: JWT tokens remain valid for 24 hours without distributed revocation (e.g., Redis blocklist on explicit logout).
- **Scheduled Budget Reset**: Monthly budgets are queried per calendar month; automatic recurring budget templates across calendar rollovers can be added via Spring `@Scheduled`.
