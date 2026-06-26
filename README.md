# Catering Management System

---

## 📖 Overview

This is a **full‑stack catering management web application** built with:
- **Flask** (Python) for the backend API.
- **Oracle Database** for persistent data storage.
- **Vanilla HTML / JavaScript / CSS** for a modern, premium UI.
- A **dynamic staff dashboard** that shows a live "Active Session" badge (name & ID) for Manager, Chef, and Delivery staff.

The system supports:
- Menu item management (CRUD with serving size/unit).
- Deal creation and allocation of menu items to deals.
- Order placement, payment handling, and status updates.
- Role‑based dashboards (manager, chef, delivery) with real‑time staff badge.
- Staff administration (add, edit, delete, password handling).
- Comprehensive Oracle schema with views for reporting.

---

## 📂 Project Structure

```
Catering system/
├─ app.py                     # Flask entry point & API routes
├─ database_manager.py        # DB helper functions (connections, queries)
├─ Catering_Management_System_Database.sql   # Full Oracle schema & seed data
├─ requirements.txt           # Python dependencies
├─ static/
│   ├─ js/
│   │   ├─ admin_new.js      # Front‑end logic for manager/chef/delivery dashboards and active session badge
│   │   ├─ admin.js           # Legacy dashboard script (still referenced in some templates)
│   │   ├─ cart_new.js       # Cart handling utilities (add/remove items, quantity updates)
│   │   ├─ checkout_new.js   # Checkout flow logic, order submission, payment processing
│   │   └─ menu_new.js       # Menu item management UI interactions (editable serving size, preview)

│   │   └─ admin_new.js      # Front‑end logic for dashboards
│   └─ css/
│       └─ style_new.css    # Premium styling (glassmorphism, gradients)
├─ templates/
│   └─ index_new.html        # Main UI with manager/chef/delivery views
└─ README.md                  # Documentation (this file)
```

---

## 🛠️ Prerequisites

1. **Python 3.10+**
2. **Oracle Database** (any edition that supports the `oracledb` driver). The schema can be created with the provided `.sql` file.
3. **Node/NPM** is **not** required – we are using plain HTML/JS/CSS.
4. **Git** (optional, for cloning the repo).

---

## 📦 Installation

1. **Clone the repository** (or copy the folder to your machine):
   ```bash
   git clone <repo‑url>
   cd "Catering system"
   ```

2. **Create a virtual environment** and install Python dependencies:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate   # Windows PowerShell
   pip install -r requirements.txt
   ```

3. **Configure environment variables** – create a `.env` file in the project root:
   ```dotenv
   DB_USER=YOUR_ORACLE_USER        # default: SYSTEM
   DB_PASSWORD=YOUR_PASSWORD       # default: maham123
   DB_DSN=HOST:PORT/SERVICE_NAME   # default: localhost:1521/XEPDB1
   ```
   *If you keep the defaults, the app will try to connect to a local Oracle XE instance.*

4. **Set up the Oracle database**:
   - Open your Oracle client (SQL*Plus, SQL Developer, etc.).
   - Run the full script:
     ```sql
     @Catering_Management_System_Database.sql
     ```
   - This creates all tables, sequences, indexes, views, and seed data.

---

## 🚀 Run the Application with Only the SQL File (No Pre‑Existing Database)

If you do **not** already have a database, you can spin one up locally and initialise it solely from the provided SQL script:
1. **Install Oracle XE** (or any Oracle Express/Instant Client) on your machine.
2. **Create a new Oracle user** (or use the default `SYSTEM`).
3. **Execute the `.sql` file** as shown in the Installation step above – it will build the entire schema and populate sample data.
4. **Adjust the `.env` file** if you used a custom user/password/DSN.
5. **Start the Flask server**:
   ```bash
   python app.py
   ```
The application will now connect to the freshly created database and be fully functional.

---

## 📊 Database Overview

- **Primary tables:** `STAFF`, `STAFFCONTACT`, `CUSTOMER`, `MENUITEM`, `MENUDEAL`, `MENUDEALCONTAINSMENUITEMS`, `ORDERS`, `PAYMENT`, `CHEF`, `DELIVERYSTAFF`, `MANAGER`.
- **Junction tables:** `CHEFMANAGESORDER`, `DELIVERYSTAFFMANAGESORDER`, `MANAGERMANAGESORDER`.
- **Views** (prefixed `VW_`) provide ready‑to‑use reporting for customers, chefs, managers, and delivery staff.
- **Indexes** are added on foreign‑key columns for fast look‑ups.

---

## 📂 Files Overview

- **`app.py`** – Flask entry point, defines all API endpoints and launches the dev server.
- **`database_manager.py`** – Helper module for establishing Oracle connections and performing CRUD operations.
- **`Catering_Management_System_Database.sql`** – Complete DDL/DML script that creates tables, sequences, indexes, views and inserts seed data for staff, customers, menu items, deals, etc.
- **`requirements.txt`** – Lists Python package dependencies (`Flask`, `oracledb`, `python-dotenv`, etc.).
- **`static/js/admin_new.js`** – Front‑end JavaScript handling dashboard navigation, data loading, and the dynamic "Active Session" badge.
- **`static/css/style_new.css`** – Modern stylesheet featuring glassmorphism, gradients, and subtle micro‑animations.
- **`templates/index_new.html`** – Main HTML template containing the home page and role‑based dashboard sections.
- **`README.md`** – Documentation you are reading right now.

---

## 🔐 Security & Authentication

- Staff login validates the password stored in the `STAFF.PASSWORD` column.
- Role verification ensures a staff member can only access dashboards matching their role (manager, chef, delivery).
- All API routes validate input and use parameterised queries (no string interpolation) to prevent SQL injection.

---

## 📚 Development & Contribution

1. **Run tests** (if you add any):
   ```bash
   python -m unittest discover tests
   ```
2. **Styling** – All CSS lives in `static/css/style_new.css`. Feel free to tweak colors, animations, or add dark‑mode toggles.
3. **Front‑end** – JavaScript for UI interactions is in `static/js/admin_new.js`. The badge logic lives in the `openDashboardDirect` function.
4. **Pull Requests** – Fork the repo, create a feature branch, and submit a PR. Ensure the code follows the existing style and runs without errors.

---

*Happy catering!*
