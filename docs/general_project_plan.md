# Tutor Quality Scoring System - Implementation Plan

## Current Status
**Phase 1: Complete ✅** - Database schema, dependencies installed, seed data created
**Phase 2: Complete ✅** - Supabase authentication, sign-in/sign-up pages, protected routes, basic dashboard
**Phase 3: Complete ✅** - Reusable Components & UI Framework (20+ components with full documentation)
**Phase 4: Ready to Start** - Feature Implementation (Dashboard, Tutor Detail, Session Detail, etc.)
**Tech Stack Update**: Migrated from Firebase to Supabase for better relational database integration

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
- **Supabase Authentication** with Supabase SSR package
- Built-in session management with HttpOnly cookies
- Simple `getServerAuth()` helper for Server Components
- Row Level Security (RLS) integration with PostgreSQL

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
- **Data Flow**: Server Components → Service Layer → Drizzle/Supabase → Database
- **Service Layer**: Business logic and data aggregation in `services/` directory
- **No API Routes**: Server Components fetch directly (API routes only if external access needed)
- **Folder Structure**: `app/` (pages), `services/` (business logic), `lib/` (db, supabase, utils)

---

## Phase 1: Foundation & Data Layer ✅ COMPLETE
**Goal**: Establish type system and seed database with realistic mock data

**Priority**: CRITICAL - All subsequent work depends on this phase

**Status**: ✅ All tasks completed with Supabase integration

### 1.1 Type Definitions & Database Schema
- [x] Define all TypeScript interfaces (User, Tutor, Student, Session, etc.)
- [x] Create database schema files (SQL/migration scripts)
- [x] Set up database connection configuration
- [x] Define enums for reusable constants

**Manual Approval Required**: Database schema review

### 1.2 Package Dependencies & Configuration
- [x] Install Supabase SDK for authentication (@supabase/supabase-js, @supabase/ssr)
- [x] Install database client (PostgreSQL with Drizzle ORM)
- [x] Install UI component libraries (shadcn/ui dependencies, Tailwind CSS)
- [x] Install charting library for performance graphs (Recharts)
- [x] Set up environment variables template

**Manual Approval Required**: Package selection and installation

### 1.3 Mock Data Generation
- [x] Design tutor personas (star, solid, struggling, at-risk)
- [x] Create mock data generator with correlation rules
- [x] Generate 6 tutors, 20 students, 150 sessions (adjusted for MVP)
- [x] Implement temporal patterns and realistic distributions
- [x] Seed database with generated data

**Manual Approval Required**: Mock data validation and seeding strategy ✅ Complete

**Deliverable**: ✅ Fully populated database with realistic, correlated mock data
- Created comprehensive seed data system in `scripts/seed/`
- Generated 6 tutors, 20 students, ~150 sessions with realistic patterns
- Full documentation available in `docs/seeding_data_overview.md`

---

## Phase 2: Authentication & Application Shell ✅ COMPLETE
**Goal**: Set up Supabase auth and basic application structure

**Dependencies**: Phase 1 complete ✅

**Status**: ✅ All authentication and basic layout tasks completed

### 2.1 Supabase Authentication
- [x] Configure Supabase project (local development configured)
- [x] Implement login page (`/auth/sign-in`)
- [x] Implement signup page (`/auth/sign-up`)
- [x] Create auth context/provider with Supabase SSR
- [x] Set up protected routes for admin with middleware
- [x] Fix misleading email confirmation flow
- [ ] Create 3-5 seed users (admin role) - *Manual step when needed*

**Manual Approval Required**: ✅ Supabase project setup complete

### 2.2 Basic Application Layout
- [x] Create main navigation structure (landing page with header)
- [x] Implement route configuration
- [x] Build basic page shells (Dashboard ✅, Tutors ⏳, Students ⏳, Sessions ⏳, Settings ⏳)
- [x] Set up global styles/theme (deep blue edu-tech theme)
- [x] Create loading and error states

**Additional Completed Items (not in original plan):**
- [x] Professional landing page with features, benefits, and CTA sections
- [x] Responsive design for all auth pages
- [x] Smart detection of local vs production for auth flows
- [x] Email confirmation auto-detection (shows appropriate UI based on Supabase config)

**Deliverable**: ✅ Authenticated admin can sign up, sign in, and access dashboard

---

## Phase 3: Reusable Components & UI Framework ✅ COMPLETE
**Goal**: Build foundational UI components for reuse across features

**Dependencies**: Phase 2 complete ✅

**Status**: ✅ All component tasks completed - 20+ components built and documented

### 3.1 Data Display Components ✅
- [x] Metric card component (score display with trend)
- [x] Data table component (sortable, filterable) - @tanstack/react-table integration
- [x] Score badge component (color-coded) - Automatic 0-10 scale coloring
- [x] Trend indicator component (↑↓→)

### 3.2 Specialized Components ✅
- [x] Performance chart component (line graph) - Recharts integration
- [x] Alert/insight card component - Severity-based styling
- [x] Session card component - Compact session summary
- [x] Risk level badge component - Churn risk indicators

### 3.3 Layout Components ✅
- [x] Page header component - With breadcrumbs and actions
- [x] Section container component - Multiple variants
- [x] Two-column layout component - Responsive with flexible ratios
- [x] Stat grid component - Responsive metric grids
- [x] Empty state component - No-data displays
- [x] Modal/dialog component - shadcn/ui Dialog

### 3.4 Form Components & Utilities ✅
- [x] Filter bar component - Flexible table/list filtering
- [x] Date range picker component - With preset options
- [x] Loading card component - Skeleton loading states
- [x] Toast notification setup - Using sonner
- [x] All shadcn/ui form components - select, textarea, checkbox, radio-group, switch, slider
- [x] Formatting utilities - Consistent data formatting helpers

### 3.5 Documentation & Testing ✅
- [x] Component test page (`/components-test`) - Comprehensive showcase
- [x] Component library overview documentation (`docs/components/README.md`)
- [x] Data display components documentation (`docs/components/data-display.md`)
- [x] Specialized components documentation (`docs/components/specialized.md`)
- [x] Layout components documentation (`docs/components/layout.md`)

**Deliverable**: ✅ Complete component library with 20+ reusable components
- All components use shadcn/ui patterns with TypeScript
- Full documentation with usage examples
- Test page demonstrating all components with realistic data
- Components ready for Phase 4 feature implementation

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

1. ~~**Before Phase 1 execution**: Database schema, package dependencies~~ ✅ Complete
2. ~~**End of Phase 1**: Mock data validation and seeding~~ ✅ Complete
3. ~~**Before Phase 2**: Supabase project configuration~~ ✅ Complete (local setup)
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

- [x] Admin can log in with Supabase auth
- [x] Reusable component library complete (20+ components)
- [x] All components properly documented and tested
- [ ] All mock data appears correctly across all views
- [ ] Navigation works seamlessly between all pages
- [ ] Calculations are accurate and consistent
- [ ] All charts and metrics display properly
- [ ] System handles missing/optional data gracefully
- [ ] Performance is acceptable with 200 sessions

---

**Next Steps**: Phase 4.1 - Platform Metrics & Data Layer (critical path) → Then Phase 4.2-4.6 in parallel
