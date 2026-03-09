
---

# 2️⃣ VentoryTrack – README.md

```markdown
# VentoryTrack 📦

**VentoryTrack** is a professional **inventory management system** designed to help businesses manage products, stock, sales, invoices, and staff efficiently.  
It provides role-based access, real-time stock updates, and business analytics for small to medium enterprises.

---

## Features

### 🔹 Authentication
- **Splash Screen** – Checks if user is logged in and redirects to Dashboard or Login.  
- **Login / Signup** – Secure authentication via Supabase.  
- **Role Selection** – Admin or Staff for permission-based access.

### 🔹 Dashboard
- Quick summary cards: Total Products, Low Stock, Today Sales, Monthly Profit  
- Charts: Weekly sales, Top-selling products  
- Quick actions: Add Product, Stock In/Out, Create Invoice

### 🔹 Product & Category Management
- Add/Edit Products and Categories  
- Product List with search & filter  
- Product Detail with stock history and sales history  

### 🔹 Stock Management
- Stock In (New purchase)  
- Stock Out (Sale, Damage, Return)  
- Stock logs tracking  

### 🔹 Sales & Invoice
- Create invoices with multiple products  
- Sales list & invoice detail  
- Backend: invoices, invoice_items, sales tables  

### 🔹 Reports & Analytics
- Filters: Daily, Weekly, Monthly  
- Reports: Sales, Stock, Profit/Loss  

### 🔹 Staff & Roles
- Admin-only staff management  
- Role-based permissions (view-only, stock, sales access)  

### 🔹 Notifications
- Low stock alerts  
- Expiry alerts  
- Backend: Supabase cron / edge functions + Firebase push notifications  

---

## Tech Stack

- **Frontend:** React Native, Expo  
- **Backend:** Supabase (Auth, Database, Storage)  
- **Database:** PostgreSQL (Supabase tables for products, stock, sales, invoices, users)  
- **Notifications:** Firebase  
- **Charts & Analytics:** React Native chart libraries  

---

## Modules Roadmap

1. **Database Foundation** – users, roles, products, categories, suppliers  
2. **Product & Category** – Add, Edit, List, Detail  
3. **Stock Management** – Stock In/Out, stock_logs  
4. **Dashboard** – Cards, Charts, Summary  
5. **Sales & Invoice** – Create invoices, Sales list, Invoice detail  
6. **Reports & Analytics** – Filters, Profit calculation  
7. **Staff & Roles** – Role-based permissions  
8. **Notifications** – Alerts, reminders  
9. **Settings & Polish** – Dark mode, Profile, Logout  

---

## Installation

```bash
# Clone repository
git clone https://github.com/ahmedtaha56/VentoryTrack.git

# Change directory
cd VentoryTrack

# Install dependencies
npm install

# Run project
expo start
