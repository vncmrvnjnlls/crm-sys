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
  employeeId: String,        // Auto-generated (EMP-XXXXX)
  team: ObjectId,            // Reference to Team
  firstName: String, 
  lastName: String,          // Personal info
  email: String,             // Unique, lowercase
  password: String,          // Never selected by default
  role: String,              // Admin | Sales Manager | Sales Agent | Support Staff
  status: String,            // active | inactive
  profilePicture: String,    // URL to uploaded image
  notificationPreferences: Object,  // Email & in-app notification settings
  signInAt: Date, 
  signOutAt: Date            // Last login tracking
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
### Lead Model
```javascript
{
  leadOwner: ObjectId,       // User who created the lead (immutable)
  leadAssignee: ObjectId,    // User responsible for the lead (can be reassigned)

  // Personal Info
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfBirth: Date,
  sex: String,

  // Business Info
  company: String,
  industry: String,
  leadSource: String,        // Website | Referral | Social Media | Email Campaign | Walk-in | Other

  // Lead Status (Kanban column)
  status: String,            // New | Contacted | Qualified | Converted | Lost
  position: Number,          // Order within status column

  // Conversion Workflow
  conversionRequested: Boolean,      // Agent signals lead is ready
  conversionApproved: Boolean,       // Manager approves
  convertedToCustomer: Boolean,      // Final conversion
  convertedBy: ObjectId,             // User who converted
  convertedAt: Date,

  timestamps: true           // createdAt, updatedAt
}
```

## Authentication & Authorization

### JWT Flow

```
1. User logs in with email/password
   ↓
2. Server validates credentials
   ↓
3. Server creates:
   - Access Token (JWT, 1 day expiry) - sent in response
   - Refresh Token (secure cookie, 7 days expiry) - stored in HTTP-only cookie
   ↓
4. Frontend stores Access Token in memory
   ↓
5. All API requests include: Authorization: Bearer <accessToken>
```

### Token Refresh (Silent Refresh)

```
1. API returns 401 (Access Token expired)
   ↓
2. Frontend calls /api/auth/refresh using HTTP-only cookie
   ↓
3. Server validates refresh token and issues new Access Token
   ↓
4. Server revokes old refresh token (token rotation for security)
   ↓
5. Frontend automatically retries failed request with new token
```

### Access Control Levels

| Role | Can See | Can Modify |
| :--- | :--- | :--- |
| **Super Admin** | All organizational data | Everything (Full administrative control) |
| **Admin** | All organizational data | Everything, except editing or managing co-admin accounts |
| **Sales Manager** | Direct team & pipeline data | Team records & personally owned records |
| **Sales Agent** | Assigned records only | Assigned leads, clients, quotations & tasks |
| **Support Staff** | Client chats & support tickets | Assigned support tickets & communication threads |

---

## Real-Time Features

### WebSocket Events (`Socket.IO`)

All real-time communications, typing indicators, and pipeline updates run through WebSocket event streams:

**Lead & Pipeline Events:**

- `lead:created` - New lead created
- `lead:updated` - Lead details modified
- `lead:deleted` - Lead removed
- `lead:assigned` - Lead assigned/reassigned to an agent
- `lead:status_changed` - Lead moved across Kanban stages

**Client Events (formerly Customer):**

- `client:created` - Lead approved and converted to Client
- `client:updated` - Client profile updated

**Quotation Events (formerly Deal):**

- `quotation:created` - New proposal/quotation generated
- `quotation:moved` - Quotation stage transitioned in pipeline
- `quotation:updated` - Line items, discounts, or terms updated

**Messaging & Communication Events:**

- `message:send` - New chat message or attachment dispatched
- `message:received` - Inbound message received in real-time channel
- `message:edited` - Message content modified inline
- `message:deleted` - Soft-deletion flag applied to message
- `typing:start` - Typing state notification triggered

**Support Ticket Events:**

- `ticket:created` - New ticket created from inquiry or message escalation
- `ticket:updated` - Ticket status, priority, or assignee changed
- `ticket:resolved` - Support ticket marked as resolved

**Notification Events:**

- `notification:new` - In-app system alert delivered

### Frontend Socket Integration

```javascript
// Using useSocket hook
import { useSocket } from "./hooks/useSocket";

function MyComponent() {
  useSocket("lead:created", (leadData) => {
    console.log("New lead:", leadData);
    refetchLeads(); // Refresh data
  });

  return <div>...</div>;
}
```

---

## Access Control

### Permission & Role Scoping Model

The `roleScope.js` utility enforces row-level data access control:

**For Sales Agents:**
- Scoped strictly to their assigned leads, clients, quotations, and tasks
- Restricted from viewing other agents' data

**For Sales Managers:**
- Access extended across all agents within their domain
- Can review, approve, or reject lead conversion requests
- Can reassign leads and clients within their team scope

**For Admins & Super Admins:**
- Broad access across all organizational records
- Admins cannot edit co-admin security profiles (reserved for Super Admins)

### Implementation

```javascript
// Example: Building access filter for leads
const filter = await buildLeadAccessFilter(req);
// Returns MongoDB query that restricts data based on user role
// Admin gets {} (all docs)
// Manager gets {leadOwner: teamMemberIds}
// Agent gets {leadAssignee: userId}
```

---

## Key Workflows

### Lead Conversion Workflow

```
1. Lead Created (status: "New")
   ↓
2. Agent updates status → "Contacted"
   ↓
3. Agent updates status → "Qualified"
   ↓
4. Agent clicks "Request Conversion"
   - conversionRequested = true
   - Manager receives notification
   ↓
5. Manager Reviews Request
   - Option A: Approve → converts to Customer
   - Option B: Reject → returns to Qualified state
   ↓
6. If Approved:
   - New Customer record created
   - Lead marked as convertedToCustomer
   - All team notified via Socket.IO
```

### Task Assignment Workflow

```
1. User creates task
   ↓
2. Assigns to team member
   ↓
3. Assigned user receives real-time notification
   ↓
4. Task appears in their task list
   ↓
5. User marks complete
   ↓
6. Activity logged
   ↓
7. Creator receives notification
```

### Quotations Pipeline Workflow

```
1. Quotation generated with line items (stage: "Draft")
   ↓
2. Agent sends proposal & advances stage ("Proposal Sent" / "Negotiation")
   ↓
3. Stage update triggers `quotation:moved` event
   ↓
4. Server recalculates pipeline total and updates record position
   ↓
5. Real-time updates push to manager & agent dashboards
```

### Real-Time Chat to Support Ticket Escalation Workflow

```
1. Client sends message/inquiry via Chat Channel
   ↓
2. Support Staff receives message in real-time
   ↓
3. Support Staff selects "Convert to Ticket" on target message
   ↓
4. System generates Support Ticket (TCK-XXXXX) linked to source message
   ↓
5. Ticket broadcasted to Kanban resolution board via `ticket:created`
   ↓
6. Support Staff manages ticket status: "New" → "In Progress" → "Resolved"
```

---

## Development Tips

### Adding a New Feature

1. **Backend**:
   - Create model in `models/`
   - Create controller in `controllers/`
   - Create route in `routes/`
   - Add service methods if needed
   - Add access control in `utils/teamScope.js`

2. **Frontend**:
   - Create feature folder in `src/features/`
   - Create custom hook in `src/hooks/`
   - Create components and pages
   - Add API service calls
   - Add Socket.IO listeners if real-time needed

3. **Testing**:
   - Test with different user roles
   - Verify access control (don't expose other users' data)
   - Test real-time updates

### Debugging

**Backend**:

- Check `console.error()` statements
- Verify MongoDB connection
- Check JWT token expiry
- Monitor Socket.IO connections

**Frontend**:

- Check browser console for errors
- Verify API token is present in headers
- Check Socket.IO connection status
- Use React DevTools to inspect component state

---

## Security Considerations

 **Implemented:**

- Passwords never returned from API
- HTTP-only cookies for refresh tokens
- JWT access tokens with 1-day expiry
- Token rotation on refresh
- Role-based access control
- Row-level security (users can't access others' data)
- Input validation on all endpoints

 **Best Practices:**

- Never log sensitive data (passwords, tokens)
- Always validate user permissions on backend (not just frontend)
- Use HTTPS in production
- Keep dependencies updated
- Implement rate limiting on auth endpoints

---

## Performance Optimization

- **Pagination**: Use limit/offset for large datasets
- **Indexes**: MongoDB indexes on frequently queried fields
- **Caching**: Client-side caching for immutable data
- **Lazy Loading**: Load features on demand
- **Real-Time Efficiency**: Send only changed data in Socket.IO events
