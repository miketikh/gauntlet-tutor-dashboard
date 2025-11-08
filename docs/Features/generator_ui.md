# Data Generator UI - Feature Plan

## Overview
Admin-only data generation page for creating test data including users (tutors/students), sessions, and related metrics. Located at `/dashboard/generate` with navigation placement after Settings.

## Phase 1: Simple User Creation [COMPLETED]

### 1.1 User Type Selection
- **UI:** Radio button group for Student vs Tutor
- **Location:** Top of form, always visible

### 1.2 Basic User Fields (Always Visible)
**All Users (from `users` table):**
- `email` - Text input with "Generate Random" button
- `name` - Text input with "Generate Random" button
- `preferred_name` - Optional, auto-fills from first name
- `avatar_url` - Optional, URL input

### 1.3 Role-Specific Fields (Appears after type selection)

**Tutor Fields (from `tutors` table):**
- `member_since` - Date picker (default: today)
- `hourly_rate` - Number input ($25-150 range)
- Quick presets: "New Tutor", "Experienced", "Premium"

**Student Fields (from `students` table):**
- `grade_level` - Dropdown (6th-12th, college, adult)
- `status` - Radio (active, churned, paused)
- Quick presets: "Elementary", "High School", "Adult Learner"

### 1.4 Advanced Fields (Collapsible Section)
**Tutor Advanced:**
- `bio` - Textarea with template suggestions
- `experience` - Textarea (years, subjects taught)
- `education` - Textarea (degrees, certifications)
- `teaching_style` - Textarea

**Student Advanced:**
- `parent_email` - Email input
- `bio` - Textarea
- `learning_goals` - Textarea
- `enrolled_since` - Date picker

### 1.5 Subject Assignment
- **Data Source:** `subjects` table
- **UI:** Grouped multi-checkbox by category
- **Categories:** math, science, language_arts, social_studies, foreign_language, test_prep, computer_science, arts, other
- **Tables Updated:** `tutor_subjects` or `student_subjects`

## Phase 2: Basic Session Creation [COMPLETED]

### 2.1 Participant Selection
**Tutor Selection:**
```typescript
// Priority order for dropdown:
1. Tutors with existing sessions with selected student
2. Tutors with matching subjects
3. All other tutors
// Display: "Name (X previous sessions)"
```

**Student Selection:**
```typescript
// Priority order:
1. Students with existing sessions with selected tutor
2. Active students with matching subjects
3. All other students
// Display: "Name (Grade) - X sessions"
```

### 2.2 Session Configuration
**Required Fields (from `sessions` table):**
- `scheduled_start` - DateTime picker
- `scheduled_duration` - Select (30, 45, 60, 90 minutes)
- `subject_id` - Filtered by tutor-student common subjects
- `status` - Select with smart default

**Smart Defaults:**
- Status: 'completed' for past dates, 'scheduled' for future
- Duration: 60 minutes
- Subject: Most recent if repeat pairing

### 2.3 Quick Scenario Templates
**"Good Session" Template:**
```javascript
{
  status: 'completed',
  tutor_showed_up: true,
  student_showed_up: true,
  technical_issues: false,
  has_audio_analysis: true,
  has_video_analysis: true,
  homework_assigned: true,
  follow_up_booked: true,
  // Metrics:
  student_engagement_score: 8.5,
  tutor_talk_ratio: 0.35,
  understanding_checks: 8
}
```

**"Poor Session" Template:**
```javascript
{
  status: 'completed',
  technical_issues: false,
  has_audio_analysis: true,
  homework_assigned: false,
  follow_up_booked: false,
  // Metrics:
  student_engagement_score: 3.5,
  tutor_talk_ratio: 0.65,
  student_frustration_count: 4
}
```

**"No Show" Template:**
```javascript
{
  status: 'no_show_student', // or 'no_show_tutor'
  actual_start: null,
  actual_duration: null,
  has_audio_analysis: false
}
```

**"Technical Issues" Template:**
```javascript
{
  status: 'completed',
  technical_issues: true,
  technical_issues_description: 'Connection dropped multiple times',
  actual_duration: scheduled_duration - 10,
  // Reduced metrics quality
  has_video_analysis: false,
  student_engagement_score: 5.0
}
```

**"First Session Success" Template:**
```javascript
{
  status: 'completed',
  session_number: 1,
  follow_up_booked: true,
  // Strong first impression metrics
  student_engagement_score: 8.0,
  tutor_checks_understanding_count: 10,
  student_initiated_questions: 5
}
```

## Phase 3: Advanced Session Metrics [COMPLETED]

### 3.1 Audio Metrics Configuration
**Table:** `session_audio_metrics`
**Always Created for Completed Sessions**

**Primary Controls:**
- Talk Ratio Sliders (must sum to 1.0):
  - `tutor_talk_ratio` (0-1)
  - `student_talk_ratio` (0-1)
  - `productive_silence_ratio` (0-1)
  - `awkward_pause_ratio` (0-1)

**Engagement Metrics:**
- `student_engagement_score` (0-10 slider)
- `tutor_enthusiasm_score` (0-10 slider)

**Interaction Counts:**
- `student_initiated_questions` (0-20)
- `tutor_checks_understanding_count` (0-15)
- `tutor_positive_reinforcement_count` (0-20)

**Advanced Toggle Section:**
- `avg_student_response_delay` (0.5-10 seconds)
- `long_pauses_count` (0-10)
- `student_frustration_count` (0-10)
- `student_confusion_count` (0-10)
- `positive_moments_count` (0-15)
- `concept_re_explanation_count` (0-5)
- Question type distribution:
  - `open_ended_questions` (0-30)
  - `closed_ended_questions` (0-30)
  - `rhetorical_questions` (0-10)

### 3.2 Video Metrics Configuration
**Table:** `session_video_metrics`
**Optional - Toggle Enable/Disable**

- `student_on_screen_attention_pct` (0-1 slider)
- `student_visual_engagement_score` (0-10)
- `distraction_events_count` (0-20)
- `confusion_moments_count` (0-15)
- `tutor_uses_visual_aids` (checkbox)
- `student_taking_notes_duration` (0-session_duration minutes)

### 3.3 Screen Metrics Configuration
**Table:** `session_screen_metrics`
**Optional - Toggle Enable/Disable**

- `active_tab_focus_pct` (0-1 slider)
- `tab_switches_count` (0-50)
- `whiteboard_usage_minutes` (0-session_duration)
- `messaging_app_detected` (checkbox)
- `gaming_detected` (checkbox)

### 3.4 Feedback Configuration
**Table:** `session_feedback`
**Optional - 60% default probability**

- `student_satisfaction_rating` (1-5 stars)
- `feedback_text` (textarea with templates)
- Tags (multi-select from `feedback_tag` enum):
  - Positive: clear_explanations, patient, encouraging, helpful_examples, good_pace, made_learning_fun
  - Negative: too_fast, too_slow, didnt_check_understanding, too_much_talking, confusing_examples
  - Neutral: technical_issues

### 3.5 Transcript Highlights
**Table:** `session_transcript_highlights`
**Optional - Add Key Moments**

- `timestamp_seconds` - When it occurred
- `speaker` - tutor or student
- `text` - What was said
- `highlight_type`:
  - strong_question
  - breakthrough
  - confusion
  - positive_reinforcement
  - concern
  - concept_explanation

### 3.6 Overall Score Calculation
```typescript
// From scripts/seed/generators/metrics.ts
calculateOverallScore(audio, video, screen) {
  let score = 5.0; // Base

  // Audio factors (primary weight)
  score += (audio.studentEngagementScore - 5) * 0.3;
  score += (8 - audio.tutorTalkRatio * 10) * 0.2;
  score += audio.tutorChecksUnderstandingCount * 0.05;
  score -= audio.studentFrustrationCount * 0.1;

  // Video factors (if available)
  if (video) {
    score += (video.studentOnScreenAttentionPct - 0.5) * 2;
    score += video.tutorUsesVisualAids ? 0.3 : 0;
  }

  // Screen factors (if available)
  if (screen) {
    score += (screen.activeTabFocusPct - 0.5) * 1.5;
    score -= screen.messagingAppDetected ? 0.5 : 0;
    score -= screen.gamingDetected ? 1.0 : 0;
  }

  return Math.max(0, Math.min(10, score));
}
```

## Phase 4: Bulk Generation & Series

### 4.1 Bulk User Generation
**Reference:** `scripts/seed/generators/users.ts`

**Tutor Personas (with distribution):**
- **Star performers (15%)**
  - Overall score: 8.5-9.5
  - Talk ratio: 0.25-0.35
  - Understanding checks: 10-15 per session
  - No-show rate: < 1%

- **Solid performers (40%)**
  - Overall score: 7.0-8.5
  - Talk ratio: 0.35-0.45
  - Understanding checks: 6-10 per session
  - No-show rate: 2-3%

- **Struggling (30%)**
  - Overall score: 5.5-7.0
  - Talk ratio: 0.50-0.65
  - Understanding checks: 2-6 per session
  - No-show rate: 5-8%

- **At risk (15%)**
  - Overall score: 4.0-5.5
  - Talk ratio: 0.65-0.80
  - Understanding checks: 0-2 per session
  - No-show rate: 10-15%

**Student Personas:**
- **Engaged (25%)**
  - Engagement: 7.5-9.5
  - Questions: 5-10 per session
  - Attendance: 95%+
  - Churn probability: 5%

- **Moderate (50%)**
  - Engagement: 5.5-7.5
  - Questions: 2-5 per session
  - Attendance: 85-95%
  - Churn probability: 15%

- **Struggling (15%)**
  - Engagement: 3.5-5.5
  - Questions: 0-2 per session
  - Attendance: 70-85%
  - Churn probability: 40%

- **Churn risk (10%)**
  - Engagement: 2.0-3.5
  - Questions: 0-1 per session
  - Attendance: < 70%
  - Churn probability: 75%

### 4.2 Session Series Patterns
**Progressive Relationships:**
```typescript
// Session progression patterns
sessionProgression = {
  'improving': [6.0, 6.5, 7.0, 7.5, 8.0, 8.2],
  'stable_good': [7.5, 7.3, 7.6, 7.4, 7.5, 7.6],
  'stable_poor': [5.0, 5.2, 4.9, 5.1, 5.0, 4.8],
  'declining': [7.0, 6.8, 6.3, 5.9, 5.5, 5.0],
  'rocky': [7.0, 5.0, 7.5, 6.0, 8.0, 6.5],
  'honeymoon_crash': [8.5, 8.0, 7.0, 5.5, 4.5, 4.0]
}
```

**Scheduling Patterns:**
- **Weekly regular** - Same day/time each week
- **Bi-weekly regular** - Every other week, consistent
- **Irregular** - Varying gaps (3-14 days)
- **Intensive** - 2-3x per week
- **Declining frequency** - Starts weekly, becomes sporadic

### 4.3 Complex Scenario Templates

**"Path to Churn" Template:**
```typescript
{
  sessions: [
    { score: 7.5, follow_up: true },  // Good start
    { score: 5.0, technical_issues: true }, // Problems begin
    { status: 'rescheduled', by: 'student' }, // Warning sign
    { score: 4.0, student_frustration: 5 }, // Bad session
    { status: 'no_show_student' }, // Critical sign
    // Student churns after this
  ],
  student_final_status: 'churned',
  churn_reasons: ['poor_sessions', 'tutor_mismatch']
}
```

**"Tutor Excellence Journey" Template:**
```typescript
{
  sessions: [
    { score: 8.5, understanding_checks: 12 }, // Strong start
    { score: 8.7, student_questions: 8 }, // Building rapport
    { score: 9.0, follow_up: true }, // Excellence
    { score: 8.8, positive_feedback: true }, // Consistent
    { score: 9.2, referral_generated: true } // Peak performance
  ],
  achievements_earned: [
    'first_session_expert',
    'engagement_master',
    'student_favorite'
  ]
}
```

**"Recovery Arc" Template:**
```typescript
{
  sessions: [
    { score: 5.5, high_talk_ratio: 0.70 }, // Poor start
    { score: 5.0, alert_generated: true }, // Hit bottom
    { score: 6.0, coaching_received: true }, // Intervention
    { score: 6.8, improvement_shown: true }, // Recovery
    { score: 7.5, back_on_track: true } // Success
  ],
  alerts_resolved: true,
  coaching_notes_added: true
}
```

## Implementation Details

### File Structure
```
app/dashboard/generate/
├── page.tsx                    # Main orchestrator component
├── layout.tsx                  # Admin-only layout wrapper
├── actions.ts                  # Server actions for data creation
├── _components/
│   ├── user-form.tsx          # Phase 1 user creation
│   ├── session-form.tsx       # Phase 2-3 session creation
│   ├── bulk-form.tsx          # Phase 4 bulk generation
│   ├── template-selector.tsx  # Quick template selection
│   ├── preview-modal.tsx      # Preview before save
│   ├── result-summary.tsx     # Post-creation summary
│   └── field-generators/
│       ├── name-generator.tsx # Random name generation
│       ├── email-generator.tsx # Random email generation
│       └── metric-sliders.tsx # Linked metric sliders
```

### Data Flow
1. **Form State Management**
   - Use React Hook Form with zod validation
   - Store complex nested state for metrics
   - Real-time validation feedback

2. **Preview Generation**
   - Show exact database records to be created
   - Display calculated fields
   - Highlight any warnings (unrealistic data)

3. **Server Action Processing**
   ```typescript
   // Transaction-based creation
   async function createSessionWithMetrics(data) {
     const tx = await db.transaction();
     try {
       const session = await tx.insert(sessions).values(sessionData);
       const audio = await tx.insert(audioMetrics).values(audioData);
       if (hasVideo) await tx.insert(videoMetrics).values(videoData);
       if (hasScreen) await tx.insert(screenMetrics).values(screenData);
       await tx.commit();
       return { sessionId: session.id, metricsCreated: [...] };
     } catch (error) {
       await tx.rollback();
       throw error;
     }
   }
   ```

4. **Result Display**
   - Summary cards for each created entity
   - Direct links to view pages
   - Option to "Create Another" with same settings
   - Export as JSON for later reuse

### Validation Rules

**User Validation:**
- Email must be unique in database
- Name required, 2-100 characters
- Firebase UID format for ID generation
- Valid role selection

**Session Validation:**
- Tutor and student must share at least one subject
- Session date reasonable (not > 1 year past/future)
- Duration 15-180 minutes
- If completed, must have actual_start and actual_duration

**Metrics Validation:**
- All ratios 0-1 range
- Talk ratios + silence ratios ≤ 1.0
- Scores 0-10 range
- Counts non-negative integers
- Video/screen only if session completed

### Server Actions Required
```typescript
// app/dashboard/generate/actions.ts

export async function createUser(userData: UserFormData) {
  // Validate admin permission
  // Generate Firebase-like UID
  // Insert user + role-specific data
  // Assign subjects
  // Return created user ID
}

export async function createSession(sessionData: SessionFormData) {
  // Validate tutor-student-subject relationship
  // Create session record
  // Create metrics based on flags
  // Calculate overall score
  // Return session ID + calculated fields
}

export async function createBulkUsers(
  count: number,
  type: 'tutor' | 'student',
  persona: string
) {
  // Generate users based on persona distribution
  // Randomize but follow persona patterns
  // Return array of created user IDs
}

export async function createSessionSeries(
  tutorId: string,
  studentId: string,
  pattern: string,
  count: number
) {
  // Generate sessions following pattern
  // Progressive metrics changes
  // Realistic scheduling
  // Return array of session IDs
}

export async function validateUniqueEmail(email: string) {
  // Check database for existing email
  // Return boolean
}

export async function getCommonSubjects(
  tutorId: string,
  studentId: string
) {
  // Query junction tables
  // Return intersection of subjects
}
```

### UI Components & Libraries

**From existing `/components/ui/`:**
- Button, Card, Dialog, Form
- Select, Input, Textarea
- Slider, Checkbox, RadioGroup
- Tabs, Collapsible, Alert

**Custom components needed:**
- MultiStep form wizard
- Linked sliders (sum to 1.0)
- Persona card selector
- Timeline visualization for series
- Metrics correlation indicator

### Navigation Integration

**Update `app/dashboard/_components/dashboard-nav.tsx`:**
```typescript
const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/tutors', label: 'Tutors', icon: GraduationCap },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/dashboard/sessions', label: 'Sessions', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/generate', label: 'Generate', icon: Database }, // NEW
];
```

### Permission Control
```typescript
// Middleware or layout check
const user = await getUser();
if (user.role !== 'admin') {
  redirect('/dashboard');
}
```

## Testing Considerations

### Unit Tests
- Validate all enum values match database schemas
- Test metric calculation functions
- Verify validation rules
- Test persona distribution logic

### Integration Tests
- Full user creation flow
- Session with all metrics
- Bulk generation performance
- Transaction rollback on error

### E2E Tests
- Complete form submission
- Preview accuracy
- Result navigation
- Permission denial for non-admins

## Performance Considerations

### Optimization Strategies
- Lazy load advanced sections
- Debounce preview generation
- Batch database inserts for bulk operations
- Cache subject and user lists
- Virtualize long dropdown lists

### Database Indexes Needed
- users.email (unique)
- sessions.tutor_id + student_id (compound)
- sessions.scheduled_start (range queries)

## Future Enhancements

### Phase 5 Features
- **Import/Export:** Save and load generation templates as JSON
- **Copy Existing:** Use existing session as template
- **Undo:** Soft delete with restore option
- **Scheduling:** Cron-based recurring generation
- **API Endpoint:** REST API for automated testing
- **Presets Library:** Shared template repository
- **Data Relationships:** Generate related alerts/achievements
- **Realistic Names:** Integration with name generation API
- **Audit Log:** Track all generated test data

### Phase 6 Features
- **ML-Based Generation:** Learn from production data patterns
- **Scenario Builder:** Visual flow chart for complex scenarios
- **Data Validation:** Compare against production statistics
- **Performance Testing:** Generate load testing datasets
- **Compliance Mode:** GDPR-compliant test data generation