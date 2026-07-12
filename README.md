# 🏥 MediCore HMS

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![AWS S3](https://img.shields.io/badge/AWS-S3_Static_Website_Hosting-FF9900?logo=amazonaws)

A modern web-based Hospital Management System that streamlines hospital operations through a centralized and user-friendly platform. MediCore HMS enables healthcare organizations to efficiently manage patients, doctors, appointments, medical records, pharmacy inventory, laboratory services, and billing from a single application.

---

# Table of Contents

- Overview
- Features
- Tech Stack
- Project Structure
- Supabase Backend
- Installation
- Environment Variables
- Run Locally
- Deployment
- Future Enhancements

---

# Overview

MediCore HMS is a comprehensive Hospital Management System developed to simplify day-to-day hospital operations through an intuitive and responsive web application.

The system provides dedicated modules for managing patients, doctors, departments, appointments, electronic medical records, laboratory services, pharmacy inventory, and billing. By centralizing these operations, it helps improve data organization, reduce manual work, and enhance overall workflow efficiency.

The frontend is developed using **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, while **Supabase** provides backend services including authentication, PostgreSQL database management, and REST APIs. The application is deployed using **Amazon S3 Static Website Hosting**.

---

# Features

## Dashboard

- Overview of hospital activities
- Quick access to all modules
- Summary cards for important information
- Responsive dashboard layout

## Patient Management

- Register new patients
- Edit patient information
- Search patient records
- View complete patient profiles

## Doctor Management

- Add and manage doctor profiles
- Assign doctors to departments
- Manage doctor availability
- Update professional information

## Department Management

- Create hospital departments
- Organize doctors by department
- View department information

## Appointment Management

- Schedule appointments
- Update appointment status
- View appointment history
- Search appointments

## Medical Records

- Maintain patient medical history
- Record diagnoses
- Store treatment information
- Update clinical notes

## Laboratory Management

- Create laboratory test requests
- Record laboratory reports
- Manage test results

## Pharmacy Management

- Maintain medicine inventory
- Track medicine availability
- Update stock information

## Billing

- Generate invoices
- Record payments
- Maintain billing history

---

# Tech Stack

| Category | Technology |
|-----------|------------|
| Frontend | React 18 |
| Programming Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Supabase |
| Database | PostgreSQL (Supabase) |
| Authentication | Supabase Authentication (Email & Password) |
| Version Control | Git & GitHub |
| Deployment | Amazon S3 Static Website Hosting |

---

# Project Structure

```text
medicore-hms/
│
├── public/
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   └── supabase.ts
│   ├── pages/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md

```

## Directory Overview

| Directory | Description |
|-----------|-------------|
| `components` | Reusable UI components used throughout the application |
| `pages` | Individual pages for each module |
| `hooks` | Custom React hooks |
| `lib` | Supabase client configuration |
| `types` | TypeScript interfaces and type definitions |
| `public` | Static assets |

---

# Supabase Backend

MediCore HMS uses **Supabase** as its Backend-as-a-Service (BaaS), providing a secure and scalable backend without the need to manage a traditional server.

Supabase powers the application's authentication, database, and API layer, allowing the frontend to communicate directly with the backend through the official Supabase JavaScript client.

## Services Used

- PostgreSQL Database
- Supabase Authentication
- REST API
- Supabase JavaScript Client
- Row Level Security (RLS)

---

## Authentication

The application uses **Supabase Authentication** to securely manage user access.

### Supported Features

- User Registration
- User Login
- Secure Session Management
- Email and Password Authentication
- Protected Application Access

Authenticated users can securely access the application after successful login.

---

## Database

Hospital data is stored in a PostgreSQL database hosted on Supabase.

### Database Tables

| Table | Description |
|--------|-------------|
| departments | Hospital department information |
| doctors | Doctor profiles and details |
| patients | Patient records |
| appointments | Appointment scheduling |
| medical_records | Patient medical history |
| medicines | Pharmacy inventory |
| prescriptions | Prescription information |
| lab_tests | Laboratory test requests |
| lab_reports | Laboratory test reports |
| invoices | Billing information |
| payments | Payment records |

---

## Frontend Integration

The application communicates with Supabase using the official **@supabase/supabase-js** client.

The client configuration is located in:

```text
src/lib/supabase.ts
```

The frontend performs operations such as:

- User Authentication
- Fetching Records
- Creating New Records
- Updating Existing Records
- Deleting Records

All communication between the frontend and database is handled securely through the Supabase API.

---

# Installation

## Prerequisites

Before running the project, install the following software:

- Node.js (v18 or later)
- npm
- Git

Verify the installation:

```bash
node -v
npm -v
git --version
```

---

## Clone the Repository

```bash
git clone https://github.com/Ziauddin9/smart-hospital-managment
```

Navigate to the project directory.

```bash
cd medicore-hms
```

---

## Install Dependencies

```bash
npm install
```

This installs all required project dependencies.

---

# Environment Variables

Create a `.env` file in the project root.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can obtain these values from your Supabase project.

**Navigation**

```
Project Settings
        ↓
API
        ↓
Project URL
Anon Public Key
```

> Never commit your `.env` file to GitHub.

---

# Run Locally

Start the development server.

```bash
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

---

## Build for Production

Generate the optimized production build.

```bash
npm run build
```

The production files will be generated inside the `dist` directory.

---

## Preview the Production Build

```bash
npm run preview
```

This command serves the production build locally for testing before deployment.

---

# Application Architecture

```text
React + TypeScript
        │
        ▼
Supabase JavaScript Client
        │
        ▼
Supabase REST API
        │
        ▼
PostgreSQL Database
```

This architecture provides a simple, scalable, and secure backend while allowing the frontend application to interact directly with Supabase services.

---

# Deployment

This project is deployed using **Amazon S3 Static Website Hosting**.

## Prerequisites

- AWS Account
- Amazon S3 Bucket
- AWS Management Console

---

## Step 1: Build the Project

Generate the production build.

```bash
npm run build
```

The production files will be created inside the `dist` directory.

---

## Step 2: Create an S3 Bucket

1. Sign in to the AWS Management Console.
2. Open the **Amazon S3** service.
3. Click **Create bucket**.
4. Enter a globally unique bucket name.
5. Select your preferred AWS Region.
6. Create the bucket.

---

## Step 3: Enable Static Website Hosting

Open the bucket and navigate to:

```
Properties
    ↓
Static Website Hosting
```

Configure:

```
Hosting Type: Host a static website

Index document:
index.html

Error document:
index.html
```

Save the configuration.

---

## Step 4: Configure Public Access

Navigate to:

```
Permissions
    ↓
Block Public Access
```

Disable Block Public Access for the bucket.

Then add a Bucket Policy allowing public read access to the objects.

---

## Step 5: Upload the Build

Open the bucket and upload **all files inside** the `dist` folder.

> Upload the contents of the folder, **not** the `dist` folder itself.

---

## Step 6: Access the Application

After the upload completes, open the **Static Website Endpoint** provided in the bucket properties.

Your application is now deployed.

---

# Future Enhancements

The following features are planned for future releases.

- Role-Based Access Control (RBAC)
- Doctor Availability Scheduling
- Patient Document Uploads
- PDF Report Generation
- Email Notifications
- SMS Appointment Reminders
- Online Payment Integration
- Dashboard Analytics
- Advanced Search and Filtering
- Mobile-Friendly User Experience Improvements

---

# Project Status

MediCore HMS is under active development. Additional features and improvements will continue to be added in future updates.