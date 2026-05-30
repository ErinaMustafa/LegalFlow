# LegalFlow

**LegalFlow** is a full-stack legal case and contract management system developed for law firms and legal departments.
The platform centralizes legal operations by providing modules for case management, contracts, clients, documents, financial tracking, AI-assisted legal analysis, and audit logging.

The project follows a client-server architecture:


frontend  -> React Application
backend   -> FastAPI REST API
database  -> PostgreSQL (Supabase)
cache     -> Redis


# Features

### Authentication & Security

* JWT Authentication
* Password Hashing
* Protected Routes
* Role-Based Access Control

### Administration

* User Management
* Role Management
* Department Management
* Password Reset

### Legal Management

* Practice Areas
* Cases
* Case Notes
* Contracts
* Hearings
* Court Decisions
* Witnesses
* Documents
* Document Categories

### Operations

* Clients
* Tasks
* Calendar Events
* Appointments
* Reminders
* Notifications
* Comments

### Finance

* Invoices
* Payments
* Expenses
* Time Entries

### Artificial Intelligence

* AI Legal Assistant
* AI Analysis History
* Legal Text Analysis
* Contract Analysis

### Monitoring

* Audit Logs
* User Activity Tracking


# Technology Stack

## Frontend

* React
* React Router
* Axios
* Context API
* CSS

## Backend

* FastAPI
* SQLAlchemy
* Pydantic
* JWT Authentication
* Redis Cache
* Uvicorn

## Database & Services

* PostgreSQL
* Supabase
* Redis

# System Architecture

React Frontend
       │
       ▼
FastAPI REST API
       │
       ▼
PostgreSQL (Supabase)
       │
       ▼
Redis Cache


# Project Structure

## Backend

backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── utils/
│
├── migrations/
├── main.py
└── requirements.txt

## Frontend

frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── routes/
│   ├── utils/
│   └── App.jsx
│
├── package.json
└── vite.config.js


# Main Modules

### Administration

* Users
* Roles
* Departments

### Legal

* Practice Areas
* Cases
* Case Notes
* Contracts
* Hearings
* Witnesses
* Court Decisions
* Documents
* Document Categories

### Operations

* Clients
* Tasks
* Comments
* Notifications
* Appointments
* Reminders
* Calendar Events

### Finance

* Invoices
* Payments
* Expenses
* Time Entries

### AI

* AI Analyses

### Audit

* Audit Logs


## Backend Setup


cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload

Backend runs on:

http://127.0.0.1:8000


## Frontend Setup


cd frontend

npm install

npm run dev


Frontend runs on:


http://localhost:5173


# Audit Logging

The system automatically records important actions such as:

* Create
* Update
* Delete

Each audit record stores:

* User ID
* Action Type
* Entity Name
* Description
* Timestamp



# AI Legal Assistant

The AI module allows users to:

* Analyze legal text
* Analyze contracts
* Generate summaries
* Store analysis history

Each analysis contains:

* Prompt
* Result
* Analysis Type
* User Reference
* Case Reference
* Document Reference
* Timestamp



# Author

**Group 7**

**LegalFlow – Contract & Case Tracking System**
