# CoachingOS Technical Architecture

```mermaid
graph TD
    Client[Web & Mobile Responsive Clients] --> NextRouter[Next.js 15 App Router]
    
    subgraph UI & Experience Layer
        Navbar[Navbar with Role & Institute Switcher]
        CmdPalette[Command Palette & Global Search (Cmd+K)]
        Sidebar[Role-Scoped Sidebar Navigation]
        TodayQueue[Today's Action Triage Engine]
        Workspaces[CRM, Attendance, Finance, Interventions, Tests, Copilot]
    end

    subgraph API & Service Layer
        APIGateway[/api/v1 REST Endpoints]
        AuthPolicy[Server-Side RBAC & Tenant Scoper]
        LeadService[Lead & Admission Pipeline Service]
        AttendanceService[Attendance & Notification Service]
        LedgerService[Double-Entry Fee & UPI POS Service]
        InterventionService[Early Warning Remediation Engine]
        AICopilotService[Grounded Query & RAG Studio Engine]
    end

    subgraph Data & Storage Layer
        Store[(Thread-Safe Relational Data Store)]
        PostgresDDL[(PostgreSQL 16+ Production DDL)]
        AuditLog[(Immutable Audit Log Trail)]
    end

    Client --> Navbar
    Client --> CmdPalette
    Client --> Workspaces
    Workspaces --> APIGateway
    APIGateway --> AuthPolicy
    AuthPolicy --> LeadService
    AuthPolicy --> AttendanceService
    AuthPolicy --> LedgerService
    AuthPolicy --> InterventionService
    AuthPolicy --> AICopilotService
    LeadService --> Store
    AttendanceService --> Store
    LedgerService --> Store
    InterventionService --> Store
    AICopilotService --> Store
    Store --> AuditLog
```

## Architectural Highlights
1. **Zero-Latency In-Memory Persistence:** Development and pilot environments execute seamlessly against a memory-safe, thread-safe data store pre-populated with 5 real-world Indian institutes.
2. **Tenant Boundary Enforcement:** Every operation, search query, report, and AI retrieval is strictly parameterized with `organization_id` and optional `branch_id`.
3. **Atomic State Transitions:** Lead conversions, fee payments, and attendance submissions execute as atomic transactions to ensure data consistency across accounting and academic rosters.
