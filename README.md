<div align="center">

<img src="https://img.shields.io/badge/VentoryTrack-📦_Inventory_Management-4F46E5?style=for-the-badge" alt="VentoryTrack" />

<br/>

![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

<br/>

**VentoryTrack** is a professional, full-featured inventory management system built for small to medium enterprises.  
Manage products, stock movements, invoices, sales, and staff — all in one place.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Roadmap](#-roadmap) · [Contributing](#-contributing)

</div>

---

## 📋 Overview

VentoryTrack provides **role-based access control**, **real-time stock tracking**, and **business analytics** through an intuitive mobile interface. Designed to help business owners and their teams stay on top of inventory without the complexity of enterprise-grade software.

---

## ✨ Features

### 🔐 Authentication & Access Control
- **Splash Screen** — Checks session state and redirects to Dashboard or Login automatically
- **Login / Signup** — Secure authentication powered by Supabase Auth
- **Role Selection** — Admin or Staff roles with granular permission-based access

### 📊 Dashboard
- Summary cards: Total Products, Low Stock Items, Today's Sales, Monthly Profit
- Charts: Weekly sales trends, Top-selling products
- Quick actions: Add Product, Stock In/Out, Create Invoice

### 📦 Product & Category Management
- Add, edit, and organize products with categories
- Product list with real-time **search & filter**
- Product detail view with full **stock history** and **sales history**

### 🔄 Stock Management
- **Stock In** — Log new purchases and restocks
- **Stock Out** — Track sales, damages, and returns
- Complete stock movement logs with timestamps

### 🧾 Sales & Invoicing
- Create invoices with **multiple line items**
- Sales list with detailed invoice view
- Backend tables: `invoices`, `invoice_items`, `sales`

### 📈 Reports & Analytics
- Filter by: Daily, Weekly, Monthly
- Reports: Sales performance, Stock levels, Profit/Loss summary

### 👥 Staff & Role Management
- Admin-only staff management panel
- Role-based permissions: view-only, stock management, sales access

### 🔔 Notifications
- Low stock alerts
- Product expiry reminders
- Powered by Supabase Edge Functions (cron jobs) + Firebase Push Notifications

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React Native, Expo |
| **Backend** | Supabase (Auth, Database, Storage, Edge Functions) |
| **Database** | PostgreSQL via Supabase |
| **Push Notifications** | Firebase Cloud Messaging |
| **Charts & Analytics** | React Native chart libraries |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase](https://supabase.com/) project (free tier works)
- [Firebase](https://firebase.google.com/) project for push notifications

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ahmedtaha56/VentoryTrack.git

# 2. Navigate to the project directory
cd VentoryTrack

# 3. Install dependencies
npm install

# 4. Configure environment variables
cp .env.example .env
# Fill in your Supabase URL, Anon Key, and Firebase config

# 5. Start the development server
expo start
```

### Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FIREBASE_API_KEY=your_firebase_api_key
```

---

## 🗺 Roadmap

| # | Module | Status |
|---|---|---|
| 1 | **Database Foundation** — users, roles, products, categories, suppliers | ✅ |
| 2 | **Product & Category** — Add, Edit, List, Detail | ✅ |
| 3 | **Stock Management** — Stock In/Out, stock_logs | ✅ |
| 4 | **Dashboard** — Cards, Charts, Summary | ✅ |
| 5 | **Sales & Invoice** — Create invoices, Sales list, Invoice detail | 🔄 In Progress |
| 6 | **Reports & Analytics** — Filters, Profit calculation | 🔄 In Progress |
| 7 | **Staff & Roles** — Role-based permissions | 📅 Planned |
| 8 | **Notifications** — Alerts, reminders | 📅 Planned |
| 9 | **Settings & Polish** — Dark mode, Profile, Logout | 📅 Planned |

---

## 🗄 Database Schema

Core tables managed via Supabase PostgreSQL:

```
users          — Authentication & role data
products       — Product catalog
categories     — Product categories
suppliers      — Supplier information
stock_logs     — Stock movement history
invoices       — Invoice headers
invoice_items  — Invoice line items
sales          — Sales records
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [Ahmed Taha](https://github.com/ahmedtaha56)

⭐ If you find this project useful, please consider giving it a star!

</div>
