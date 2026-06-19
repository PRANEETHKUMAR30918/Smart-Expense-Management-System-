# 💰 ExpenseIQ — Smart Expense Management System

A full-stack expense tracking application with Spring Boot backend, React frontend, MySQL database, and JWT authentication.

---

## 🗂️ Project Structure

```
smart-expense-manager/
├── backend/          ← Spring Boot REST API (port 8096)
├── frontend/         ← React + Vite UI (port 5196)
└── database/
    └── setup.sql     ← MySQL setup script
```

---

## ⚙️ Prerequisites

| Tool | Version |
|------|---------|
| Java | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |
| MySQL | 8.0+ |

---

## 🗄️ Database Setup

1. Open MySQL and run:
```sql
CREATE DATABASE IF NOT EXISTS expense_db;
```

2. Update credentials in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.username=root
spring.datasource.password=root   ← change to your MySQL password
```

> Tables are auto-created by JPA on first run (`ddl-auto=update`)

---

## 🚀 Running the Backend

```bash
cd smart-expense-manager/backend
mvn spring-boot:run
```

Backend starts at: **http://localhost:8096**

---

## 🎨 Running the Frontend

```bash
cd smart-expense-manager/frontend
npm install
npm run dev
```

Frontend starts at: **http://localhost:5196**

---

## 🔑 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login → returns JWT |
| GET | `/api/expenses` | Yes | Get expenses (paginated) |
| POST | `/api/expenses` | Yes | Create expense |
| PUT | `/api/expenses/{id}` | Yes | Update expense |
| DELETE | `/api/expenses/{id}` | Yes | Delete expense |
| GET | `/api/expenses/category/{cat}` | Yes | Filter by category |
| GET | `/api/budgets` | Yes | Get budgets (by month/year) |
| POST | `/api/budgets` | Yes | Create budget |
| PUT | `/api/budgets/{id}` | Yes | Update budget |
| DELETE | `/api/budgets/{id}` | Yes | Delete budget |
| GET | `/api/categories` | Yes | Get all categories |
| POST | `/api/categories` | Yes | Create category |
| PUT | `/api/categories/{id}` | Yes | Update category |
| DELETE | `/api/categories/{id}` | Yes | Delete category |
| GET | `/api/dashboard/stats` | Yes | Dashboard analytics |

---

## 🔐 Authentication

- JWT token stored in `localStorage`
- Add to requests: `Authorization: Bearer <token>`
- Token expires in 24 hours
- Auto-redirect to `/login` on 401

---

## 🏗️ Architecture

```
Frontend (React)
    ↕ axios + JWT
Backend (Spring Boot)
    ↕ JPA/Hibernate
MySQL Database
```

**Backend Layers:**
- `Controller` → validates & routes HTTP
- `Service` → business logic + ownership checks
- `Repository` → JPA queries
- `Security` → JWT filter chain

---

## 🎨 UI Features

- Dark glassmorphism design
- Donut chart — category breakdown
- Bar chart — 6-month spending trend
- Budget progress bars with color alerts (green/yellow/red)
- Paginated expense table with search & filter
- Responsive sidebar navigation
- Toast notifications

---

## 🌱 Seeding Default Categories

After starting the backend, run in MySQL:
```sql
USE expense_db;
INSERT IGNORE INTO categories (name, icon, color) VALUES
('Food', '🍔', '#10b981'),
('Transport', '🚗', '#3b82f6'),
('Shopping', '🛍️', '#ec4899'),
('Entertainment', '🎬', '#8b5cf6'),
('Health', '💊', '#ef4444'),
('Education', '📚', '#f59e0b'),
('Bills', '📄', '#06b6d4'),
('Other', '📦', '#64748b');
```
