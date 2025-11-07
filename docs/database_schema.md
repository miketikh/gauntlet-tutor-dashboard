# Database Schema Reference

## Quick Navigation

**For detailed context:** See `docs/project_overview.md` (business logic, calculated fields, use cases)

**For implementation:**
- **Drizzle schemas:** `lib/db/schema/*.ts` (TypeScript definitions, most readable)
- **TypeScript types:** `lib/db/types.ts` (enums, interfaces, type definitions)
- **Raw SQL:** `supabase/migrations/0000_*.sql` (exact database structure)

**For architecture decisions:** See `docs/general_project_plan.md`

---

## Core Tables

### Users & Authentication

**`users`** - Base user accounts for all roles (admin, tutor, student)
- Uses Firebase/Supabase Auth UIDs (VARCHAR) as primary key
- Single table for all user types, differentiated by `role` enum
- Foundation for tutors, students, and admin accounts

**`subjects`** - Catalog of tutorable subjects
- Math, Science, Language Arts, etc. with category classification
- Referenced by sessions and junction tables for tutor/student specialties

---

## Tutor Tables

**`tutors`** - Tutor profile information
- One-to-one with users table (tutor role only)
- Bio, experience, education, hourly rate, member since date

**`tutor_subjects`** - Many-to-many: which subjects each tutor teaches
- Junction table linking tutors to their subject expertise

**`tutor_performance_snapshots`** - Pre-aggregated performance data
- Daily/weekly rollups to avoid expensive real-time calculations
- Stores avg session scores, engagement, satisfaction over time periods

**`tutor_insights`** - Cached analysis results
- Strengths, growth areas, achievements detected by system
- Active/resolved status for tracking coaching interventions
- Includes sample session IDs for evidence backing

---

## Student Tables

**`students`** - Student profile information
- One-to-one with users table (student role only)
- Grade level, parent contact, learning goals, churn status

**`student_subjects`** - Many-to-many: which subjects each student studies
- Junction table for student learning interests

**`student_churn_reasons`** - Many-to-many: why students churned
- Multiple reasons can be assigned per student
- Used for churn algorithm learning

---

## Session Tables

**`sessions`** - Core session records
- Links tutor + student + subject
- Stores timing, status, attendance, technical issues
- Has flags for which analysis types are available (audio/video/screen)
- `overall_session_score` is stored (0-10) after AI analysis
- `session_number` tracks sequence for this tutor-student pair

**`session_audio_metrics`** - Audio analysis results (always present)
- Talk ratios, engagement scores, question counts
- Understanding checks, student frustration signals, pause analysis

**`session_video_metrics`** - Video analysis results (optional, camera required)
- On-screen attention, visual engagement, distraction events
- Note-taking duration, visual aid usage

**`session_screen_metrics`** - Screen monitoring results (optional)
- Tab focus percentage, whiteboard usage
- Detects messaging apps, gaming during session

**`session_feedback`** - Student satisfaction ratings (optional)
- 1-5 star rating, freeform text feedback
- Not all students provide feedback (~60% response rate)

**`session_feedback_tags`** - Many-to-many: predefined feedback categories
- Junction table for tags like "patient", "too_fast", "clear_explanations"

**`session_transcript_highlights`** - Key moments from session transcript
- Timestamps with speaker, text snippet, highlight type
- Used for coaching conversations and session review

---

## Alert & Achievement Tables

**`alerts`** - System-generated warnings for tutors
- High talk ratio, low understanding checks, poor first session, no-show patterns
- Tracks acknowledgment and resolution by admins
- Links to specific session if applicable

**`achievements`** - Positive milestones earned by tutors
- Engagement master, question guru, first session expert, etc.
- Earned date tracking for gamification

---

## Churn Algorithm Tables

**`churn_algorithm_weights`** - Current version of prediction weights
- Factor categories (first_session_satisfaction, sessions_completed, etc.)
- Weights must sum to 1.0 across all factors
- Version tracking for algorithm evolution

**`churn_weight_history`** - Audit log of weight changes
- Records who changed weights, why, and when
- Before/after accuracy metrics
- Links to case study sessions/students that prompted change
- Stores old/new weights as JSONB for comparison

---

## Enums (Shared Type System)

### User & Session Management
- **`user_role`**: admin | tutor | student
- **`session_status`**: scheduled, in_progress, completed, no_show_tutor, no_show_student, cancelled, rescheduled
- **`reschedule_by`**: tutor | student

### Student Lifecycle
- **`student_status`**: active | churned | paused
- **`grade_level`**: 6th, 7th, 8th, 9th, 10th, 11th, 12th, college, adult
- **`churn_reason`**: poor_first_session, tutor_mismatch, no_progress, scheduling_difficulty, price_concerns, technical_issues, found_competitor, completed_goals, personal_circumstances, other

### Feedback & Analysis
- **`feedback_tag`**: clear_explanations, patient, encouraging, helpful_examples, good_pace, too_fast, too_slow, didnt_check_understanding, too_much_talking, confusing_examples, technical_issues, made_learning_fun
- **`highlight_type`**: strong_question, breakthrough, confusion, positive_reinforcement, concern, concept_explanation
- **`transcript_speaker`**: tutor | student

### Alerts & Insights
- **`alert_type`**: high_talk_ratio, low_understanding_checks, student_frustration_detected, poor_first_session, high_reschedule_rate, no_show_pattern, declining_performance, student_churn_risk
- **`alert_severity`**: info | warning | critical
- **`achievement_type`**: engagement_master, question_guru, first_session_expert, consistency_champion, student_favorite, rising_star

### Tutor Analysis
- **`insight_type`**: strength | growth_area | achievement
- **`insight_category`**: high_engagement, low_engagement, high_talk_ratio, balanced_talk_ratio, frequent_understanding_checks, infrequent_understanding_checks, strong_questioning, low_visual_aids, high_visual_aids, positive_reinforcement, first_session_expert
- **`snapshot_period`**: daily | weekly

### Subject System
- **`subject_category`**: math, science, language_arts, social_studies, foreign_language, test_prep, computer_science, arts, other

---

## Key Relationships

### One-to-One
- `users` → `tutors` (user_id)
- `users` → `students` (user_id)
- `sessions` → `session_audio_metrics` (always present for completed sessions)
- `sessions` → `session_video_metrics` (optional)
- `sessions` → `session_screen_metrics` (optional)
- `sessions` → `session_feedback` (optional)

### One-to-Many
- `users` (tutor) → `sessions` (tutor_id)
- `users` (student) → `sessions` (student_id)
- `users` (tutor) → `alerts` (tutor_id)
- `users` (tutor) → `achievements` (tutor_id)
- `users` (tutor) → `tutor_insights` (tutor_id)
- `users` (tutor) → `tutor_performance_snapshots` (tutor_id)
- `sessions` → `session_transcript_highlights` (session_id)
- `sessions` → `alerts` (session_id, optional link)

### Many-to-Many (via Junction Tables)
- `users` (tutors) ↔ `subjects` via `tutor_subjects`
- `users` (students) ↔ `subjects` via `student_subjects`
- `users` (students) ↔ `churn_reason` via `student_churn_reasons`
- `sessions` ↔ `feedback_tag` via `session_feedback_tags`

---

## Important Notes

### Stored vs Calculated Fields
Many fields mentioned in `project_overview.md` are **calculated on-read**, not stored in the database:
- `tutor.overall_score` (weighted avg of session scores)
- `tutor.rebook_rate` (calculated from session follow_up_booked)
- `tutor.churn_risk_level` (calculated from no-shows, reschedules, late counts)
- `student.churn_risk_score` (calculated using algorithm weights)

These calculations happen in service layer code, not in the database.

### Pre-Aggregation Strategy
`tutor_performance_snapshots` exists to avoid expensive joins/aggregations on every page load. Populated by nightly batch job.

### Optional Data Handling
Video and screen metrics may not exist for every session. System handles missing data gracefully by excluding from calculations or showing "N/A" in UI.

### Cascade Deletion Rules
Most foreign keys use `ON DELETE CASCADE` - deleting a user cascades to their tutors/students/sessions/alerts. Sessions use `ON DELETE SET NULL` for optional references (acknowledged_by, case_study links).
