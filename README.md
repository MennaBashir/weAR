# weAR – Virtual Fitting Room SaaS Platform

> Graduation Project – Role-Based SaaS Architecture with AI Integration

---

## 📖 Overview

**weAR** is a B2B SaaS platform that enhances online retail experiences using Virtual Fitting Room (VFR) technology.

The platform supports three user roles:

- 🛍 Retailers (B2B Dashboard)
- 🛒 Customers (B2C Storefront)
- 🔑 Super Admins (Platform Management)

This project demonstrates scalable frontend architecture, modular design, role-based routing, and AI feature integration.

---

## 🏗 Architecture Strategy

We implemented a **Single SPA + Domain-Driven Modular Architecture**.

### Why this approach?

- Clean separation of concerns
- Role-based isolation
- Scalable structure
- Graduation timeline friendly
- Avoids over-engineering

Each user role is treated as a mini-system inside a unified application.

---

## 👥 User Roles

### 🛍 Retailer
- Dashboard Analytics
- Inventory Management
- Subscription & Billing

### 🛒 Customer
- Product Browsing
- Virtual Fitting Room
- AI-based Style Recommendations

### 🔑 Super Admin
- Tenant Management
- Platform Analytics

---

## 🛠 Tech Stack (Locked)

| Category | Technology |
|----------|------------|
| Core | React 19 + Vite |
| Language | TypeScript (strict) |
| Routing | React Router v7 |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| Styling | Tailwind CSS v4 |
| UI Primitives | Shadcn/UI |
| Forms | React Hook Form |
| Validation | Zod |
| Testing | Vitest + React Testing Library |
| Code Quality | ESLint + Prettier |

---

## 🚦 Routing Strategy

- `/login`
- `/signup`
- `/retailer/*`
- `/customer/*`
- `/admin/*`

Protected by:

- `RequireAuth`
- `RequireRole`

---

## 🗺 Development Phases

### Phase 1 – Project Skeleton (done)
- Routing
- Layout system
- Guards
- Folder structure

### Phase 2 – Authentication System (done)
- Login / Signup
- Role persistence
- Protected routes

### Phase 3 – Retailer Core (done)
- Inventory CRUD
- Dashboard
- Billing

### Phase 4 – Customer Experience (current)
- Store UI
- Virtual Fitting Demo
- AI Recommendation

### Phase 5 – Admin Portal
- Tenant Management
- Platform Analytics

### Phase 6 – Polish & Testing
- Loading states
- Error handling
- UX refinement
- Unit tests

---
