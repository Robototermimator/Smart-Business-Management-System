# Smart Business Management System (SBMS)

A portfolio-ready, enterprise-style **Business Information Technology** web application built with **HTML, CSS, and JavaScript** (no backend).

The system demonstrates:
- Systems Analysis & Design
- Business Process Management
- CRUD data handling with persistent storage
- Cloud computing concepts (simulated)
- Cybersecurity fundamentals

---

## Table of Contents
1. [Overview](#overview)
2. [Core Modules](#core-modules)
3. [Analytics](#analytics)
4. [Cybersecurity Controls](#cybersecurity-controls)
5. [Cloud Simulation](#cloud-simulation)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [How to Run](#how-to-run)
9. [Data Model](#data-model)
10. [Validation Rules](#validation-rules)
11. [Known Limitations](#known-limitations)
12. [Future Enhancements](#future-enhancements)
13. [Footer Statement](#footer-statement)

---

## Overview

SBMS is a single-page dashboard application that simulates business operations management in a professional SaaS-style interface. It includes full workflows for managing customers, products, and orders, with automatic analytics and local persistence.

The app is designed to run immediately by opening `index.html` in a browser.

---

## Core Modules

### 1) Authentication & Access Control
- Password-based admin login gate
- Application is hidden until authenticated
- Login state persisted in `localStorage`
- Logout support

> Demo password: `Admin@123`

### 2) Customer Management
- Add / Edit / Delete customers
- Auto-generated unique customer IDs
- Duplicate customer-name prevention
- Search by name/email
- High-value customer highlighting based on spend

### 3) Product Management
- Add / Edit / Delete products
- Fields: Name, Price (ZAR), Category
- Validation for required and numeric input
- Search and sorting (name/price)

### 4) Order Management
- Create orders using selected customer and product
- Quantity support with auto-calculated totals
- Timestamped order history
- Filter orders by customer
- Sort by date and amount

---

## Analytics

Dashboard KPIs include:
- Total customers
- Total orders
- Total revenue (ZAR)
- Most popular product

Visualization:
- Revenue trend line chart (Chart.js)

---

## Cybersecurity Controls

The project includes baseline frontend security practices:
- Input sanitization and trimming
- Required field validation
- Numeric validation for price and quantity
- Access gating through authentication state

Why this matters:
- Protects data quality
- Reduces invalid/malicious input risk
- Prevents unauthorized access to operational data

---

## Cloud Simulation

The app simulates cloud operations using browser files:
- **Backup to Cloud:** Export all data as JSON
- **Restore from Backup:** Import JSON and restore system state
- **Reset System:** Clear all business data with confirmation
- **Bonus:** Export orders to CSV

---

## Tech Stack

- **HTML5**: Application structure and forms
- **CSS3**: Responsive enterprise dashboard styling
- **Vanilla JavaScript (ES6+)**: Business logic and CRUD operations
- **Chart.js**: Revenue trend visualization
- **localStorage**: Client-side persistence layer

---

## Project Structure

```text
Smart-Business-Management-System/
├── index.html      # App shell, sections, forms, navigation
├── style.css       # Visual design, layout, responsive behavior, themes
├── script.js       # Application logic, storage, CRUD, analytics, cloud tools
├── README.md       # Project documentation
└── LICENSE
```

---

## How to Run

1. Clone or download this repository.
2. Open `index.html` in any modern browser.
3. Login with the demo password (`Admin@123`).

No backend, build step, or package installation is required.

---

## Data Model

All data is stored in `localStorage` under a structured payload.

- `customers[]`
  - `id`, `name`, `email`, `tier`
- `products[]`
  - `id`, `name`, `category`, `price`
- `orders[]`
  - `id`, `customerId`, `productId`, `quantity`, `total`, `timestamp`

---

## Validation Rules

- Empty inputs are not accepted
- Product price must be numeric and non-negative
- Order quantity must be numeric and >= 1
- Customer names must be unique
- Strings are sanitized before processing

---

## Known Limitations

- Authentication is demo-only (client-side password)
- No server/database integration
- No multi-user role engine (single admin mode)

---

## Future Enhancements

- Server-side authentication and API integration
- Multi-role authorization (Admin/Manager/Viewer)
- Database-backed persistence
- Audit logs and advanced reporting exports
- Automated test coverage (unit/e2e)

---

## Footer Statement

> Developed as a Business Information Technology systems project demonstrating enterprise system design, analytics, cloud concepts, and cybersecurity fundamentals.
