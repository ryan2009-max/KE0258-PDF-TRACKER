# Student PDF Payment Management

[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ec988?logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive web application for managing student PDF fees and payments. It features an admin dashboard for fee tracking, student profile management, and automated receipt generation via Supabase Edge Functions.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Supabase Configuration](#supabase-configuration)
- [Usage Guide](#usage-guide)
  - [Admin Features](#admin-features)
  - [Student Features](#student-features)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contribution](#contribution)
- [License](#license)
- [Contact](#contact)

---

## Overview

The **Student PDF Payment Management** system provides a streamlined interface for educational institutions to track and record student fee payments. It integrates seamlessly with Supabase for robust authentication, data persistence, and secure access control.

---

## Key Features

### 👨‍💼 Admin Dashboard
- **Real-time Stats**: View total students, expected collections, today's collections, and outstanding balances.
- **Student Management**: Search for students by name or ID, add new student records, and update student profiles.
- **Payment Recording**: Securely record payments with automated receipt number generation.
- **Reporting**: Access daily collection reports and track students with outstanding balances.
- **Audit Log (History)**: Full history tracking with versioning for student and payment record modifications.

### 🎓 Student Portal
- **Dashboard**: Quick view of personal payment status and remaining balance.
- **Payment History**: Access to all past payments with receipt details.
- **Profile**: View personal information and fee requirements.

### 🔒 Security & Backend
- **Role-Based Access Control (RBAC)**: Secure access using Supabase Row Level Security (RLS) for Admins, Super Admins, and Students.
- **Automated Receipt Numbers**: Edge Functions for unique, sequential receipt number generation.

---

## Project Structure

```text
├── supabase/                 # Supabase Backend Configuration
│   ├── functions/            # Edge Functions (e.g., receipt-number)
│   └── sql/                  # SQL scripts for database schema and policies
├── app.js                    # Main Frontend Logic (Vanilla JS SPA)
├── index.html                # Main Entry Point
├── styles.css                # Application Styles
└── README.md                 # Project Documentation
```

---

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Backend**: [Supabase](https://supabase.com) (PostgreSQL, Auth, Edge Functions).
- **Architecture**: Single Page Application (SPA) with Hash-based Routing.

---

## Installation & Setup

### Prerequisites

- A [Supabase](https://supabase.com) account.
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed (optional, for local development).

### Frontend Setup

1. Clone the repository.
2. Open `index.html` in a modern web browser.
3. (Optional) For production use, configure the Supabase URL and Anon Key in `app.js` (currently using mock data for demo).

### Supabase Configuration

1. **Create a new project** in the Supabase Dashboard.
2. **Execute SQL scripts**: Run the scripts located in `supabase/sql/` in the following order using the SQL Editor:
   - `01_schema.sql`
   - `02_rls_policies.sql`
   - `03_views_and_functions.sql`
   - `04_rpc_record_payment.sql`
3. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy receipt-number
   ```

---

## Usage Guide

### Admin Features
1. **Login**: Use administrative credentials to access the admin dashboard.
2. **Dashboard**: Get an overview of current financial statuses.
3. **Search**: Quickly find students by name or student number.
4. **Record Payment**: Select a student profile and click "Record Payment".
5. **History**: View the audit log for any changes made to the system records.

### Student Features
1. **Login**: Use student number and password to access the student portal.
2. **Dashboard**: View balance and recent payments.
3. **History**: Download or view past receipts.

---

## API Documentation

The project utilizes Supabase RPC and Edge Functions for core logic.

### Edge Function: `receipt-number`
- **Description**: Generates a unique receipt number for each payment.
- **Format**: `RCPT-YYYY-XXXXX` (e.g., `RCPT-2024-00001`).

---

## Testing

Testing scripts are provided in `supabase/sql/05_tests.sql` to verify RLS policies and database functions within the Supabase SQL editor.

---

## Deployment

1. **Frontend**: Can be hosted on Vercel, Netlify, or GitHub Pages.
2. **Backend**: Managed via the Supabase Dashboard. Ensure all RLS policies are active before production deployment.

---

## Contribution

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Contact

- **Author**: Your Name / Organization
- **Project Link**: [https://github.com/yourusername/pdf-file](https://github.com/yourusername/pdf-file)

---

## Changelog

### v1.0.0 (2024-03-19)
- Initial release with Admin and Student portals.
- Integration with Supabase for data and authentication.
- Audit log with versioning implementation.
- Automated receipt generation via Edge Functions.
