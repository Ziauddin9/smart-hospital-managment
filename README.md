# 🏥 MediCore HMS

<div align="center">

### Smart Hospital Management System

A modern web-based Hospital Management System with a complete DevOps implementation using AWS Cloud Services.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker)
![Jenkins](https://img.shields.io/badge/Jenkins-CI/CD-D24939?logo=jenkins)
![Terraform](https://img.shields.io/badge/Terraform-844FBA?logo=terraform)
![AWS](https://img.shields.io/badge/AWS-Cloud-FF9900?logo=amazonaws)
![CloudWatch](https://img.shields.io/badge/Amazon-CloudWatch-FF4F8B)
![License](https://img.shields.io/badge/License-Educational-blue)

</div>

---

# 📖 Table of Contents

- Overview
- Features
- Technology Stack
- Project Structure
- Supabase Backend
- Database Design
- Installation
- Environment Variables
- Running the Application
- Docker Deployment
- Jenkins CI/CD Pipeline
- Terraform Infrastructure
- AWS Infrastructure
- CloudWatch Monitoring
- Deployment Workflow
- Application Architecture
- DevOps Architecture
- Future Enhancements
- Author
- License

---

# 📌 Overview

MediCore HMS is a web-based Hospital Management System developed to simplify the day-to-day activities of hospitals through a centralized platform. The application provides separate modules for managing patients, doctors, departments, appointments, medical records, laboratory services, pharmacy inventory, prescriptions, and billing.

The frontend is built using **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, while **Supabase** provides backend services including authentication, PostgreSQL database management, and REST APIs.

In addition to the application itself, this project demonstrates the implementation of modern DevOps practices. Source code is managed using Git and GitHub, continuous integration and deployment are automated with Jenkins, the application is containerized using Docker, infrastructure is provisioned using Terraform, and AWS CloudWatch is used for monitoring system resources. Amazon SNS is configured to notify administrators when configured CloudWatch alarms are triggered.

The objective of this project is not only to build a Hospital Management System but also to demonstrate how a modern web application can be developed, deployed, automated, and monitored using industry-standard DevOps tools and cloud services.

---

# 🎯 Project Objectives

- Develop a centralized Hospital Management System.
- Simplify hospital administration processes.
- Maintain patient and doctor records securely.
- Automate application deployment using Jenkins.
- Containerize the application using Docker.
- Provision AWS infrastructure using Terraform.
- Monitor infrastructure using Amazon CloudWatch.
- Configure email notifications using Amazon SNS.
- Demonstrate an end-to-end DevOps workflow using AWS services.

---

# ⭐ Key Features

- Responsive web interface
- Secure authentication
- Patient Management
- Doctor Management
- Department Management
- Appointment Scheduling
- Medical Records
- Laboratory Management
- Pharmacy Management
- Billing System
- Automated CI/CD Pipeline
- Docker Container Deployment
- Terraform Infrastructure as Code
- CloudWatch Monitoring
- Amazon SNS Notifications

---

# ✨ Features

## 📊 Dashboard

The dashboard provides a centralized overview of hospital operations, allowing users to quickly access different modules and view important information through a clean and responsive interface.

**Features**

- Dashboard overview
- Quick navigation to all modules
- Summary cards
- Responsive layout

---

## 👨‍⚕️ Doctor Management

The Doctor Management module allows administrators to maintain doctor information and organize doctors based on departments.

**Features**

- Add new doctors
- Update doctor profiles
- Delete doctor records
- Search doctors
- View doctor details
- Assign doctors to departments

---

## 🏥 Department Management

Departments can be created and managed from a dedicated module.

**Features**

- Create departments
- Edit department details
- View department information
- Organize doctors department-wise

---

## 🧑 Patient Management

Patient records are maintained in a centralized database, making it easier to access medical information whenever required.

**Features**

- Register patients
- Update patient information
- Search patients
- View patient profiles
- Manage patient history

---

## 📅 Appointment Management

Appointments can be scheduled and managed efficiently.

**Features**

- Book appointments
- Update appointment status
- Search appointments
- View appointment history
- Manage doctor schedules

---

## 🩺 Medical Records

Medical records are stored digitally to improve accessibility and reduce paperwork.

**Features**

- Store diagnoses
- Treatment records
- Clinical notes
- Medical history
- Patient-wise records

---

## 🧪 Laboratory Management

The laboratory module manages test requests and reports.

**Features**

- Create lab test requests
- Upload reports
- View laboratory history
- Manage test records

---

## 💊 Pharmacy Management

Medicine inventory and prescriptions are managed within the application.

**Features**

- Medicine inventory
- Prescription records
- Stock management
- Medicine availability

---

## 💳 Billing Management

Billing information is maintained digitally.

**Features**

- Generate invoices
- Record payments
- Billing history
- Payment tracking

---

## 🔐 Authentication

Authentication is handled using Supabase Authentication.

Supported features include:

- User Registration
- Secure Login
- Session Management
- Protected Routes
- Email & Password Authentication

---

# 🛠️ Technology Stack

## Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

---

## Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- REST APIs

---

## DevOps

- Git
- GitHub
- Jenkins
- Docker
- Terraform

---

## AWS Services

- Amazon EC2
- Amazon ECR
- Amazon S3 (Terraform Backend)
- AWS IAM
- Amazon CloudWatch
- Amazon SNS

---

# 📂 Project Structure

```text
smart-hospital-managment/
│
├── src/
├── public/
├── supabase/
├── dist/
├── node_modules/
│
├── backend.tf
├── provider.tf
├── variables.tf
├── outputs.tf
├── main.tf
│
├── Dockerfile
├── Jenkinsfile
├── Jenkinsfile.terraform
├── buildspec.yml
│
├── .env
├── .env.production
├── .dockerignore
├── .gitignore
│
├── package.json
├── package-lock.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
│
├── index.html
└── README.md
```

---

# 📁 Directory Overview

| Directory / File | Description |
|------------------|-------------|
| `src/` | React application source code |
| `public/` | Static assets |
| `supabase/` | Supabase configuration and SQL files |
| `dist/` | Production build generated by Vite |
| `backend.tf` | Terraform backend configuration |
| `provider.tf` | AWS provider configuration |
| `variables.tf` | Terraform input variables |
| `outputs.tf` | Terraform output values |
| `main.tf` | AWS infrastructure resources |
| `Dockerfile` | Docker image configuration |
| `Jenkinsfile` | Jenkins CI/CD pipeline |
| `Jenkinsfile.terraform` | Terraform automation pipeline |
| `buildspec.yml` | AWS CodeBuild specification |
| `.env.production` | Production environment variables |
| `package.json` | Project dependencies |
| `README.md` | Project documentation |

---

# ⚙️ Backend

MediCore HMS uses **Supabase** as its Backend-as-a-Service (BaaS). Instead of maintaining a custom backend server, Supabase provides authentication, PostgreSQL database services, REST APIs, and secure communication between the frontend and the database.

The frontend communicates directly with Supabase using the official **@supabase/supabase-js** client, allowing the application to perform CRUD operations securely without managing a dedicated backend server.

The backend is responsible for:

- User Authentication
- Database Management
- CRUD Operations
- REST APIs
- Secure Data Access
- Row Level Security (RLS)

---

# 🔐 Authentication

Authentication is implemented using **Supabase Authentication**.

Supported authentication features include:

- User Registration
- User Login
- Email & Password Authentication
- Session Management
- Protected Routes
- Persistent Login Sessions

The authentication service ensures that only authorized users can access the Hospital Management System.

---

# 🗄 Database Design

The project uses a **PostgreSQL** database hosted on Supabase.

Hospital information is organized into multiple relational tables to improve data consistency and simplify management.

## Database Tables

| Table | Description |
|---------|-------------|
| departments | Stores hospital department information |
| doctors | Stores doctor profiles |
| patients | Stores patient records |
| appointments | Appointment scheduling |
| medical_records | Patient medical history |
| prescriptions | Prescription details |
| medicines | Medicine inventory |
| lab_tests | Laboratory test requests |
| lab_reports | Laboratory reports |
| invoices | Billing information |
| payments | Payment history |

---

# 🔄 Frontend–Backend Communication

The frontend communicates with Supabase through the official JavaScript client.

Configuration file:

```text
src/lib/supabase.ts
```

The application performs the following operations through Supabase APIs:

- User Authentication
- Fetch Records
- Create Records
- Update Records
- Delete Records

All requests are securely processed using HTTPS.

---

# 🔒 Security

The application follows several security practices:

- Environment variables for sensitive credentials
- Secure authentication using Supabase
- Row Level Security (RLS)
- IAM Role for AWS resources
- Private Docker image repository (Amazon ECR)
- CloudWatch monitoring
- SNS notifications for infrastructure alerts

---

# 💻 Installation

## Prerequisites

Before running the project, install the following software:

- Node.js (v18 or later)
- npm
- Git
- Docker Desktop (optional for containerized deployment)
- Terraform (for infrastructure provisioning)

Verify the installation:

```bash
node -v
npm -v
git --version
docker --version
terraform --version
```

---

## Clone the Repository

```bash
git clone https://github.com/Ziauddin9/smart-hospital-managment.git
```

Move into the project directory.

```bash
cd smart-hospital-managment
```

---

## Install Dependencies

```bash
npm install
```

This command installs all required project dependencies.

---

# 🌍 Environment Variables

Create a `.env` file in the project root.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For production deployments, configure the required variables in `.env.production`.

> Do not commit `.env` or `.env.production` files containing sensitive credentials to GitHub.

---

# ▶️ Running the Application Locally

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

---

## Build for Production

Generate an optimized production build.

```bash
npm run build
```

The generated files will be available inside the `dist` directory.

---

## Preview the Production Build

```bash
npm run preview
```

This command serves the production build locally before deployment.

---

# 🐳 Docker

Docker is used to containerize the application, ensuring a consistent runtime environment across development, testing, and production.

## Build Docker Image

```bash
docker build -t medicore-hms .
```

## Run Docker Container

```bash
docker run -d \
-p 8081:80 \
--name medicore-hms \
medicore-hms
```

## Useful Docker Commands

View running containers

```bash
docker ps
```

View all containers

```bash
docker ps -a
```

View Docker images

```bash
docker images
```

View container logs

```bash
docker logs medicore-hms
```

Stop the container

```bash
docker stop medicore-hms
```

Remove the container

```bash
docker rm medicore-hms
```

---

# 🤖 Jenkins CI/CD Pipeline

The project uses Jenkins to automate both application deployment and infrastructure provisioning.

## Application Pipeline

The application deployment pipeline performs the following tasks automatically:

1. Checkout the latest source code from GitHub.
2. Install project dependencies using npm.
3. Build the production-ready React application.
4. Upload the generated build files (`dist/`) to an Amazon S3 bucket.
5. Build a Docker image for the application.
6. Authenticate with Amazon Elastic Container Registry (ECR).
7. Tag and push the Docker image to Amazon ECR.
8. Stop and remove any existing Docker container.
9. Deploy a new Docker container with the latest image.

---

## Infrastructure Pipeline

Infrastructure provisioning is managed through a separate Jenkins pipeline using Terraform.

The pipeline executes:

- Terraform Init
- Terraform Plan
- Terraform Apply

This automates the provisioning and updating of AWS infrastructure.

## Pipeline Stages

1. Checkout Source Code
2. Install Project Dependencies
3. Build Production Application
4. Build Docker Image
5. Push Docker Image to Amazon ECR
6. Deploy Docker Container on EC2
7. Verify Deployment

---

## CI/CD Workflow

Developer
      │
      ▼
Git Push
      │
      ▼
GitHub Repository
      │
      ▼
Jenkins
      │
      ▼
Checkout Source Code
      │
      ▼
Install Dependencies
      │
      ▼
Build React Application
      │
      ▼
Upload Production Build to Amazon S3
      │
      ▼
Build Docker Image
      │
      ▼
Login to Amazon ECR
      │
      ▼
Push Docker Image to Amazon ECR
      │
      ▼
Stop Existing Container
      │
      ▼
Start New Docker Container
      │
      ▼
CloudWatch Monitoring
      │
      ▼
Amazon SNS Alerts

---

# ☁️ AWS Infrastructure

The application is deployed on Amazon Web Services using multiple AWS services.

## Services Used

| Service | Purpose |
|----------|---------|
| Amazon EC2 | Hosts the application |
| Amazon ECR | Stores Docker images |
| Amazon CloudWatch | Monitoring and alarms |
| Amazon SNS | Email notifications |
| AWS IAM | Access management |
| Amazon S3 | Terraform backend state storage |

---

# 🏗️ Terraform

Terraform is used to provision and manage AWS infrastructure as code.

Infrastructure managed by Terraform includes:

- EC2 Instance
- Security Group
- IAM Role
- Amazon ECR Repository
- Amazon S3 Backend (State Storage)

## Terraform Files

| File | Purpose |
|------|---------|
| `main.tf` | Infrastructure resources |
| `provider.tf` | AWS provider configuration |
| `variables.tf` | Input variables |
| `outputs.tf` | Output values |
| `backend.tf` | Remote backend configuration |

---

## Terraform Commands

Initialize Terraform

```bash
terraform init
```

Validate configuration

```bash
terraform validate
```

Preview execution plan

```bash
terraform plan
```

Provision infrastructure

```bash
terraform apply
```

Destroy infrastructure

```bash
terraform destroy
```

---

# 🚀 Deployment Workflow

The deployment process is automated using Jenkins and Docker.

```text
Developer
     │
     ▼
GitHub Repository
     │
     ▼
Jenkins
     │
     ▼
Build React Application
     │
     ▼
Docker Build
     │
     ▼
Push Image to Amazon ECR
     │
     ▼
Pull Image on EC2
     │
     ▼
Run Docker Container
     │
     ▼
Application Available
```

This workflow minimizes manual deployment steps and helps maintain consistency across deployments.

---

# 📈 CloudWatch Monitoring

Amazon CloudWatch is used to monitor the application's infrastructure after deployment. It provides real-time metrics and alerts, allowing administrators to track the health and performance of the EC2 instance.

## Metrics Collected

The CloudWatch Agent is configured to collect system-level metrics, including:

- CPU Utilization
- Memory Utilization (`mem_used_percent`)
- EC2 Instance Status

These metrics help monitor the overall health of the application and identify potential performance issues.

---

## CloudWatch Dashboard

A CloudWatch dashboard provides a centralized view of the monitored resources.

The dashboard includes:

- CPU Utilization
- Memory Usage
- Alarm Status
- EC2 Performance Metrics

This allows administrators to quickly monitor the application's resource usage from a single interface.

---

## CloudWatch Alarms

CloudWatch Alarms are configured to notify administrators whenever resource usage exceeds predefined thresholds.

Configured alarms include:

| Alarm | Threshold |
|--------|-----------|
| High CPU Usage | CPU Utilization > 80% |
| High Memory Usage | Memory Usage > 80% |

The alarms help detect abnormal resource utilization before it impacts application performance.

---

## Amazon SNS Notifications

Amazon Simple Notification Service (SNS) is integrated with CloudWatch Alarms.

Whenever an alarm changes to the **ALARM** state, an email notification is automatically sent to the subscribed administrator.

This enables timely monitoring without continuously checking the AWS Console.

---

# 🚀 Deployment Workflow

The application deployment process is automated using Jenkins.

```text
Developer
     │
     ▼
GitHub Repository
     │
     ▼
Jenkins
     │
     ▼
Checkout Source Code
     │
     ▼
Install Dependencies
     │
     ▼
Build React Application
     │
     ▼
Upload Production Build to Amazon S3
     │
     ▼
Build Docker Image
     │
     ▼
Push Image to Amazon ECR
     │
     ▼
Deploy Docker Container
     │
     ▼
Amazon EC2
     │
     ▼
CloudWatch Monitoring
     │
     ▼
Amazon SNS Notification
```

This workflow reduces manual deployment effort while ensuring that every deployment follows the same sequence of steps.

---

# 🏗️ Application Architecture

```text
React + TypeScript + Vite
            │
            ▼
     Supabase Client
            │
            ▼
     Supabase REST API
            │
            ▼
 PostgreSQL Database
```

The frontend communicates directly with Supabase using the official JavaScript client for authentication and database operations.

---

# ⚙️ DevOps Architecture

```text
Developer
     │
     ▼
GitHub Repository
     │
     ▼
Jenkins CI/CD
     │
     ├──────────────┐
     │              │
     ▼              ▼
Build App      Terraform Apply
     │
     ▼
Docker Build
     │
     ▼
Amazon ECR
     │
     ▼
Amazon EC2
     │
     ▼
CloudWatch
     │
     ▼
Amazon SNS
```

The DevOps pipeline automates application deployment, infrastructure provisioning, and system monitoring using AWS services and Jenkins.

---

# 🚀 Future Scope

MediCore HMS provides a solid foundation for managing hospital operations while demonstrating a complete DevOps workflow. The project can be extended further by incorporating additional features and cloud-native technologies.

Some possible enhancements include:

- Implement Role-Based Access Control (RBAC) for different user roles.
- Add online payment gateway integration for billing.
- Generate downloadable PDF reports for prescriptions, invoices, and laboratory reports.
- Implement email and SMS notifications for appointment reminders.
- Add doctor availability scheduling and leave management.
- Develop a mobile application for Android and iOS.
- Deploy the application using Kubernetes for improved scalability.
- Configure NGINX as a reverse proxy with HTTPS support.
- Integrate Prometheus and Grafana for advanced monitoring.
- Implement Auto Scaling and Load Balancing on AWS.
- Add automated backup and disaster recovery strategies.
- Integrate GitHub Actions for additional CI/CD workflows.

---

# 👨‍💻 Author

**Ziauddin Gandluri**

B.Tech – Computer Science & Engineering (Artificial Intelligence)

S V University College of Engineering

### Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- PostgreSQL
- Docker
- Jenkins
- Terraform
- Amazon EC2
- Amazon ECR
- Amazon S3
- Amazon CloudWatch
- Amazon SNS
- Git & GitHub

---

## Acknowledgements

This project was developed as part of continuous learning in full-stack web development and DevOps practices. It combines modern frontend development with cloud deployment, infrastructure automation, and monitoring to demonstrate practical software engineering concepts using AWS and open-source technologies.

---