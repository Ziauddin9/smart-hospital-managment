# MediCore HMS — Smart Hospital Management System

A full-featured, production-ready Hospital Management System built with React, TypeScript, Tailwind CSS, and Supabase. Designed as a capstone project for an AWS & DevOps course, covering CI/CD, containerization, infrastructure as code, and cloud deployment.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [AWS Deployment Guide](#aws-deployment-guide)
- [Docker & Containerization](#docker--containerization)
- [CI/CD Pipeline with Jenkins](#cicd-pipeline-with-jenkins)
- [Infrastructure as Code (Terraform)](#infrastructure-as-code-terraform)
- [Monitoring & Observability](#monitoring--observability)
- [DevOps Modules Covered](#devops-modules-covered)

---

## Overview

MediCore HMS is a comprehensive hospital management system that digitizes core hospital workflows including patient registration, doctor management, appointment scheduling, electronic medical records (EMR), pharmacy inventory, laboratory tests, and billing — all in a single unified dashboard.

This project is designed to be deployed on AWS using modern DevOps practices including:

- Version control with **Git & GitHub**
- Infrastructure provisioning with **Terraform & AWS CloudFormation**
- Containerization with **Docker & Kubernetes**
- CI/CD automation with **Jenkins**
- Configuration management with **Ansible**
- Monitoring with **Prometheus & Grafana**

---

## Features

### Modules

| Module | Description |
|---|---|
| **Dashboard** | Real-time stats, alerts (low stock, unpaid bills, pending labs), appointment overview, patient growth metrics |
| **Patient Management** | Register patients with auto-generated IDs (HOSP-#####), blood group, insurance, emergency contacts, allergy tracking |
| **Doctor Management** | Doctor profiles with specialization, qualification, availability days, department assignment |
| **Departments** | Department cards with head doctor assignment and doctor count per department |
| **Appointments** | Book, reschedule, and track appointments with inline status updates (Scheduled / Confirmed / Completed / Cancelled / No-Show) |
| **Medical Records (EMR)** | Record vital signs (BP, temperature, pulse, weight, height, O2 saturation), diagnosis, treatment plan, prescription notes |
| **Pharmacy** | Medicine inventory with low-stock alerts, expiry warnings, reorder levels, and category filtering |
| **Laboratory** | Order lab tests with STAT/Urgent/Routine priority, record results with reference ranges and critical flagging |
| **Billing** | Multi-line invoices with tax/discount, payment recording, partial payment tracking, revenue summary |

### General Features

- Responsive design — works on mobile, tablet, and desktop
- Real-time data via Supabase
- Row Level Security (RLS) on all database tables
- Auto-generated patient numbers (HOSP-00001) and invoice numbers (INV-2026-00001)
- INR (₹) currency support with `en-IN` locale formatting
- Search and filter across all modules
- Modal-based forms with validation

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Inter font |
| **Icons** | Lucide React |
| **Backend / Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase (ready to enable) |
| **Containerization** | Docker, Docker Compose |
| **Orchestration** | Kubernetes (AWS EKS) |
| **CI/CD** | Jenkins |
| **IaC** | Terraform, AWS CloudFormation |
| **Config Management** | Ansible |
| **Monitoring** | Prometheus, Grafana, AWS CloudWatch |
| **Cloud** | AWS (S3, CloudFront, EC2, ECS, EKS) |

---

## Project Structure

```
medicore-hms/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Sidebar navigation + topbar
│   │   ├── Modal.tsx           # Reusable modal component
│   │   └── StatCard.tsx        # Dashboard stat cards
│   ├── lib/
│   │   └── supabase.ts         # Supabase client singleton
│   ├── pages/
│   │   ├── Dashboard.tsx       # Overview & analytics
│   │   ├── Patients.tsx        # Patient registration & management
│   │   ├── Doctors.tsx         # Doctor profiles
│   │   ├── Departments.tsx     # Hospital departments
│   │   ├── Appointments.tsx    # Appointment scheduling
│   │   ├── MedicalRecords.tsx  # EMR (Electronic Medical Records)
│   │   ├── Pharmacy.tsx        # Medicine inventory
│   │   ├── Labs.tsx            # Lab tests & results
│   │   └── Billing.tsx         # Invoicing & payments
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── App.tsx                 # Root component with routing
│   ├── main.tsx                # React entry point
│   └── index.css               # Global styles + Tailwind
├── supabase/
│   └── migrations/             # Database migration SQL files
├── .env                        # Environment variables (not committed)
├── Dockerfile                  # Container image definition
├── docker-compose.yml          # Local multi-service setup
├── Jenkinsfile                 # CI/CD pipeline definition
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Database Schema

The system uses **14 PostgreSQL tables** managed via Supabase:

```
departments          — Hospital departments (Emergency, Cardiology, etc.)
doctors              — Doctor profiles and availability
staff                — Non-doctor hospital staff
patients             — Patient records with auto-generated IDs
appointments         — Patient-doctor appointment scheduling
medical_records      — EMR with vital signs (JSONB)
medicines            — Pharmacy inventory
prescriptions        — Prescription headers
prescription_items   — Individual prescription line items
lab_tests            — Lab test orders with priority
lab_results          — Test results with reference ranges
invoices             — Billing invoices with auto-generated numbers
invoice_items        — Invoice line items
payments             — Payment records per invoice
```

All tables have Row Level Security (RLS) enabled with `anon + authenticated` policies.

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Git
- A Supabase account (free tier works)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/medicore-hms.git
cd medicore-hms

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project dashboard under **Settings → API**.

---

## AWS Deployment Guide

### Option 1: Static Hosting (S3 + CloudFront)

This is the simplest deployment for the React frontend.

```bash
# Build the project
npm run build

# Create an S3 bucket
aws s3 mb s3://medicore-hms-prod

# Enable static website hosting
aws s3 website s3://medicore-hms-prod \
  --index-document index.html \
  --error-document index.html

# Deploy build output
aws s3 sync dist/ s3://medicore-hms-prod --delete

# Create CloudFront distribution (via console or CLI)
# Point it to the S3 bucket for global CDN delivery
```

### Option 2: Docker on AWS ECS

```bash
# Build Docker image
docker build -t medicore-hms .

# Tag and push to AWS ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.ap-south-1.amazonaws.com

docker tag medicore-hms:latest \
  <account-id>.dkr.ecr.ap-south-1.amazonaws.com/medicore-hms:latest

docker push \
  <account-id>.dkr.ecr.ap-south-1.amazonaws.com/medicore-hms:latest

# Deploy to ECS Fargate via AWS Console or CLI
```

### Option 3: Kubernetes on AWS EKS

```bash
# Create EKS cluster
eksctl create cluster \
  --name medicore-hms \
  --region ap-south-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2

# Apply Kubernetes manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment
kubectl get pods
kubectl get svc
```

---

## Docker & Containerization

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    restart: unless-stopped
```

```bash
# Build and run with Docker Compose
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## CI/CD Pipeline with Jenkins

### Jenkinsfile

```groovy
pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'medicore-hms'
        ECR_REPO = '<account-id>.dkr.ecr.ap-south-1.amazonaws.com/medicore-hms'
        AWS_REGION = 'ap-south-1'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/your-username/medicore-hms.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Type Check') {
            steps {
                sh 'npm run typecheck'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                sh "docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${ECR_REPO}:${BUILD_NUMBER}"
                sh "docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${ECR_REPO}:latest"
            }
        }

        stage('Push to ECR') {
            steps {
                sh """
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin ${ECR_REPO}
                    docker push ${ECR_REPO}:${BUILD_NUMBER}
                    docker push ${ECR_REPO}:latest
                """
            }
        }

        stage('Deploy to ECS') {
            steps {
                sh """
                    aws ecs update-service \
                      --cluster medicore-cluster \
                      --service medicore-hms-service \
                      --force-new-deployment \
                      --region ${AWS_REGION}
                """
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Pipeline failed. Check logs.'
        }
    }
}
```

---

## Infrastructure as Code (Terraform)

### main.tf — S3 + CloudFront Deployment

```hcl
provider "aws" {
  region = "ap-south-1"
}

resource "aws_s3_bucket" "frontend" {
  bucket = "medicore-hms-prod"
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}

resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-medicore-hms"
  }

  enabled             = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-medicore-hms"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

output "cloudfront_url" {
  value = aws_cloudfront_distribution.frontend.domain_name
}
```

```bash
# Initialize and apply
terraform init
terraform plan
terraform apply
```

---

## Monitoring & Observability

### Prometheus + Grafana (Self-hosted on EC2)

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvf prometheus-*.tar.gz
cd prometheus-*
./prometheus --config.file=prometheus.yml

# Install Node Exporter (for system metrics)
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvf node_exporter-*.tar.gz
./node_exporter

# Install Grafana
sudo apt-get install -y grafana
sudo systemctl start grafana-server
# Access at http://localhost:3000 (admin/admin)
```

### AWS CloudWatch Alarms

```bash
# Create CPU utilization alarm for ECS service
aws cloudwatch put-metric-alarm \
  --alarm-name "medicore-hms-high-cpu" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-south-1:<account-id>:medicore-alerts
```

---

## DevOps Modules Covered

This project directly maps to the following modules from the AWS & DevOps course:

| Course Module | How It Applies |
|---|---|
| **Module 1 — AWS, DevOps & Shell Scripting** | AWS S3/CloudFront deployment, shell scripts for build automation |
| **Module 2 — Version Control with Git & GitHub** | Git workflow, branching strategy, GitHub Actions |
| **Module 3 — IaC (Terraform, CloudFormation)** | `main.tf` for S3 + CloudFront, ECS task definitions as CloudFormation stacks |
| **Module 4 — Containers & Orchestration** | Dockerfile, docker-compose, Kubernetes manifests for EKS deployment |
| **Module 5 — Configuration Management (Ansible)** | Ansible playbooks to provision EC2 instances with Node.js, Nginx |
| **Module 6 — CI/CD (Jenkins)** | Full Jenkinsfile pipeline: install → typecheck → build → docker push → ECS deploy |
| **Module 7 — Build & Monitor** | npm build via Maven-style pipeline, Prometheus metrics, Grafana dashboards, CloudWatch alarms |

---

## Ansible Playbook (EC2 Setup)

```yaml
# playbook.yml
- hosts: webservers
  become: yes
  tasks:
    - name: Install Node.js
      apt:
        name: nodejs
        state: present
        update_cache: yes

    - name: Install Nginx
      apt:
        name: nginx
        state: present

    - name: Copy build files
      copy:
        src: ./dist/
        dest: /var/www/html/
        owner: www-data
        group: www-data

    - name: Start Nginx
      service:
        name: nginx
        state: started
        enabled: yes
```

---

## GitHub Actions (Alternative to Jenkins)

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install & Build
        run: |
          npm ci
          npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to S3
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1

      - run: aws s3 sync dist/ s3://medicore-hms-prod --delete

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} \
            --paths "/*"
