# IntelliCRM Architecture Guide

A comprehensive guide to understanding the IntelliCRM system structure, data flow, and core concepts.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Data Models](#data-models)
4. [Authentication & Authorization](#authentication--authorization)
5. [Real-Time Features](#real-time-features)
6. [Access Control](#access-control)
7. [Key Workflows](#key-workflows)
8. [Development Tips](#development-tips)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)

---

## System Overview

IntelliCRM is a **full-stack Sales CRM application** with:

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + Vite
- **Real-Time**: Socket.IO for live updates
- **Authentication**: JWT (Access Token) + Refresh Token (Cookie)

### Core Entities

- **Users**: System users with roles (Admin, Sales Manager, Sales Agent, Support Staff)
- **Leads**: Potential customers in various pipeline stages
- **Clients**: Converted leads with ongoing relationships
- **Quotations**: Sales opportunities with value and pipeline stages
- **Tasks**: Action items assigned to team members
- **Activities**: Audit trail of all system changes
- **Notifications**: Real-time alerts for important events

---

## Architecture Layers

### Backend Architecture
```
┌─────────────────────────────────────────────────────────┐
│              API Routes & Controllers                   │
│   (Express endpoints handling HTTP REST requests)       │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│             Real-Time & Upload Engine                   │
│   (socket.js & Multer File Handler Middlewares)         │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              Business Logic Services                    │
│   (leadService, communicationService, ticketService)    │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│            Data Models & Validation (MongoDB)           │
│   (User, Lead, Client, Quotation, Message, Ticket)      │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              Utilities & Middleware                     │
│  (authMiddleware, roleScope, fileFilter, errorHandler)  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  MongoDB Database                       │
└─────────────────────────────────────────────────────────┘

```
### Frontend Architecture
```
┌─────────────────────────────────────────────┐
│         Pages & Feature Modules             │
│  (Leads, Clients, Quotations, Tasks, etc.)     │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│      React Components & Layouts             │
│  (Form components, Tables, Kanban, etc.)    │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│       Custom Hooks (Logic Layer)            │
│ (useActivities, useNotifications, etc.)     │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│    Context API (Global State)               │
│   (AuthContext, SocketContext)              │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│      Services (API & WebSocket)             │
│  (api.js, authService, socketService)       │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│          Backend API Server                 │
└─────────────────────────────────────────────┘
```
---

## Data Models


### User Model
```javascript
{
  employeeId: String,          // Auto-generated (EMP-XXXXX)
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false },
  role: { 
    type: String, 
    enum: ['Super Admin', 'Admin', 'Sales Manager', 'Sales Agent', 'Support Staff']
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  profilePicture: String,
  notificationPreferences: Object,
  signInAt: Date,
  signOutAt: Date,
  timestamps: true
}
```

### Lead Model
```javascript
{
  leadOwner: { type: Schema.Types.ObjectId, ref: 'User' },
  leadAssignee: { type: Schema.Types.ObjectId, ref: 'User' },

  // Contact Info
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  company: String,
  industry: String,
  leadSource: String,          // Website | Referral | Social Media | Walk-in | Other

  // Lead Pipeline Status
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'],
    default: 'New' 
  },
  position: Number,

  // Conversion Workflow Guardrails
  conversionRequested: { type: Boolean, default: false },
  conversionApproved: { type: Boolean, default: false },
  convertedToClient: { type: Boolean, default: false },
  convertedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  convertedAt: Date,

  timestamps: true
}
```

### Client Model (Formerly Customer)
```javascript
{
  clientCode: String,          // Unique ID (e.g., CLI-10023)
  leadSourceRef: { type: Schema.Types.ObjectId, ref: 'Lead' },
  name: String,                // Person or Company name
  email: { type: String, required: true },
  phone: String,
  company: String,
  assignedAgent: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Inactive', 'Archived'], default: 'Active' },
  notes: [String],
  timestamps: true
}
```
