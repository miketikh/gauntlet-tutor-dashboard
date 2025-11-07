# Tutor Quality Scoring System - Implementation Plan

## Overview
This document outlines the phased approach for building the Tutor Quality Scoring System MVP (Admin view only). The plan prioritizes data foundation, front-loads manual approval tasks, and identifies parallelization opportunities.

---

## Technical Stack Decisions

### Core Framework
- **Next.js 15** with App Router

### Database
- **PostgreSQL** with **Drizzle ORM**
- Drizzle chosen over Prisma for lighter weight, better performance with complex queries, and TypeScript-first approach

### Authentication
- **Firebase Authentication** with Firebase Admin SDK
- Manual HttpOnly cookie setup for server-side auth state
- Simple `getServerAuth()` helper for Server Components

### UI & Styling
- **shadcn/ui** for components (copy-paste approach, no runtime overhead)
- **Tailwind CSS** for styling
- Chosen over MUI for full customization control and smaller bundle size

### Data Visualization
- **Recharts** for charts and graphs
- Simple API, lightweight, excellent for dashboards

### State Management & Data Fetching
- **Server Components** for initial data fetching (fetches in services layer)
- **TanStack Query** for client-side caching and navigation between pages
- **Zustand** for UI state (filters, modals, sidebar state)
- **Server Actions** for mutations

### Forms & Validation
- **React Hook Form** for forms
- **Zod** for TypeScript-first schema validation

### Additional Libraries
- **date-fns** for date handling
- **lucide-react** for icons
- **sonner** for toast notifications
- **@tanstack/react-table** for complex data tables

### Architecture Pattern
- **Data Flow**: Server Components → Service Layer → Drizzle/Firebase → Database
- **Service Layer**: Business logic and data aggregation in `services/` directory
- **No API Routes**: Server Components fetch directly (API routes only if external access needed)
- **Folder Structure**: `app/` (pages), `services/` (business logic), `lib/` (db, firebase, utils)

---

## Phase 1: Foundation & Data Layer
**Goal**: Establish type system and seed database with realistic mock data

**Priority**: CRITICAL - All subsequent work depends on this phase

### 1.1 Type Definitions & Database Schema
- [ ] Define all TypeScript interfaces (User, Tutor, Student, Session, etc.)
- [ ] Create database schema files (SQL/migration scripts)
- [ ] Set up database connection configuration
- [ ] Define enums for reusable constants

**Manual Approval Required**: Database schema review

### 1.2 Package Dependencies & Configuration
- [ ] Install Firebase SDK for authentication
- [ ] Install database client (PostgreSQL/MySQL)
- [ ] Install UI component library (if using one)
- [ ] Install charting library for performance graphs
- [ ] Set up environment variables template

**Manual Approval Required**: Package selection and installation

### 1.3 Mock Data Generation
- [ ] Design tutor personas (star, solid, struggling, at-risk)
- [ ] Create mock data generator with correlation rules
- [ ] Generate 10 tutors, 40 students, 200 sessions
- [ ] Implement temporal patterns and realistic distributions
- [ ] Seed database with generated data

**Manual Approval Required**: Mock data validation and seeding strategy

**Deliverable**: Fully populated database with realistic, correlated mock data

---

## Phase 2: Authentication & Application Shell
**Goal**: Set up Firebase auth and basic application structure

**Dependencies**: Phase 1 complete

### 2.1 Firebase Authentication
- [ ] Configure Firebase project
- [ ] Implement login page
- [ ] Create auth context/provider
- [ ] Set up protected routes for admin
- [ ] Create 3-5 seed users (admin role)

**Manual Approval Required**: Firebase project setup

### 2.2 Basic Application Layout
- [ ] Create main navigation structure
- [ ] Implement route configuration
- [ ] Build basic page shells (Dashboard, Tutors, Students, Sessions, Settings)
- [ ] Set up global styles/theme
- [ ] Create loading and error states

**Deliverable**: Authenticated admin can navigate between empty page shells

---

## Phase 3: Reusable Components & UI Framework
**Goal**: Build foundational UI components for reuse across features

**Dependencies**: Phase 2 complete

**Parallelization Opportunity**: These components can be built concurrently

### 3.1 Data Display Components
- [ ] Metric card component (score display with trend)
- [ ] Data table component (sortable, filterable)
- [ ] Score badge component (color-coded)
- [ ] Trend indicator component (↑↓→)

### 3.2 Specialized Components
- [ ] Performance chart component (line graph)
- [ ] Alert/insight list component
- [ ] Session card component
- [ ] Risk level badge component

### 3.3 Layout Components
- [ ] Page header component
- [ ] Section container component
- [ ] Two-column layout component
- [ ] Modal/dialog component

**Deliverable**: Component library ready for feature implementation

---

## Phase 4: Feature Implementation
**Goal**: Build each major page with full functionality

**Dependencies**: Phase 3 complete

**Parallelization Opportunity**: After 4.1, sections 4.2-4.5 can be built in parallel

### 4.1 Platform Metrics & Data Layer
- [ ] Create API/data access layer for all queries
- [ ] Implement calculation functions (averages, trends, aggregations)
- [ ] Build caching strategy for expensive queries
- [ ] Test all data retrieval functions

**Critical**: This must complete before 4.2-4.5 can begin

### 4.2 Admin Dashboard (Homepage) [PARALLELIZABLE]
- [ ] Platform health metrics bar
- [ ] Top performers / needs attention scoreboard
- [ ] Recent sessions feed with filters
- [ ] Wire up all navigation links

### 4.3 Tutor Detail Page [PARALLELIZABLE]
- [ ] Tutor header with stats
- [ ] Performance trends chart
- [ ] Actionable insights panel (strengths, growth, alerts)
- [ ] Session history table
- [ ] Coaching notes section

### 4.4 Session Detail Page [PARALLELIZABLE]
- [ ] Session overview header
- [ ] Key metrics breakdown (engagement, communication, student response, etc.)
- [ ] AI analysis summary
- [ ] Transcript highlights
- [ ] Student feedback display
- [ ] Data availability indicators

### 4.5 Student Detail Page [PARALLELIZABLE]
- [ ] Student header and status
- [ ] Churn risk assessment panel
- [ ] Risk and protective factors display
- [ ] Session history from student perspective
- [ ] Tutor history and switches

### 4.6 Algorithm Refinement Dashboard [PARALLELIZABLE]
- [ ] Model performance summary
- [ ] Weight adjustment interface with sliders
- [ ] Recent learning events feed
- [ ] Before/after comparison modal
- [ ] Case study workflow

**Deliverable**: Fully functional admin dashboard with all pages

---

## Phase 5: Integration, Polish & Testing
**Goal**: Connect all pieces and ensure quality

**Dependencies**: Phase 4 complete

### 5.1 Cross-Feature Integration
- [ ] Verify all navigation links work correctly
- [ ] Ensure consistent data across all views
- [ ] Test user flows (dashboard → tutor → session → back)
- [ ] Validate calculations appear consistently

### 5.2 Performance Optimization
- [ ] Implement query optimization
- [ ] Add loading states for slow queries
- [ ] Set up error boundaries
- [ ] Add analytics/monitoring

### 5.3 Final Polish
- [ ] Responsive design adjustments
- [ ] Accessibility review
- [ ] Cross-browser testing
- [ ] Documentation updates

**Deliverable**: Production-ready MVP

---

## Key Parallelization Opportunities

### After Phase 3:
Once the data layer (4.1) is complete, these can run in parallel:
- Admin Dashboard (4.2)
- Tutor Detail Page (4.3)
- Session Detail Page (4.4)
- Student Detail Page (4.5)
- Algorithm Dashboard (4.6)

### Within Phase 3:
All component groups (3.1, 3.2, 3.3) can be built simultaneously

---

## Manual Approval Checkpoints

1. **Before Phase 1 execution**: Database schema, package dependencies
2. **End of Phase 1**: Mock data validation and seeding
3. **Before Phase 2**: Firebase project configuration
4. **End of Phase 4**: Feature completeness review
5. **End of Phase 5**: Production readiness

---

## Estimated Effort Distribution

- **Phase 1**: 25% (Foundation is critical)
- **Phase 2**: 10% (Straightforward setup)
- **Phase 3**: 15% (Component library)
- **Phase 4**: 40% (Core features - parallelizable)
- **Phase 5**: 10% (Integration & polish)

---

## Success Criteria

- [ ] Admin can log in with Firebase auth
- [ ] All mock data appears correctly across all views
- [ ] Navigation works seamlessly between all pages
- [ ] Calculations are accurate and consistent
- [ ] All charts and metrics display properly
- [ ] System handles missing/optional data gracefully
- [ ] Performance is acceptable with 200 sessions

---

**Next Steps**: Use this plan + project_overview.md to create detailed PRDs for each phase
