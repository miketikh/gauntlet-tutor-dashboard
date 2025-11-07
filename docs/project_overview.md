# Tutor Quality Scoring System - Project Detail Document

## 1. General Context

### 1.1 Project Overview
The Tutor Quality Scoring System is an automated platform that evaluates tutor performance across every tutoring session, identifies coaching opportunities, predicts churn risk (both tutor and student), and recommends interventions. The system is designed to process thousands of daily sessions and provide actionable insights within 1 hour of session completion.

### 1.2 Key Objectives
- **Retention Enhancement**: Detect patterns leading to poor first session experiences (24% of churners fail here)
- **Operational Efficiency**: Flag tutors with high rescheduling rates (98.2% tutor-initiated) and no-show patterns (16% of replacements)
- **Continuous Improvement**: Self-learning algorithm that refines churn prediction weights based on actual outcomes
- **Quality Assurance**: Monitor teaching quality through AI-analyzed metrics from audio, video, and screen monitoring

### 1.3 User Roles
The system supports three distinct user roles:
- **Admin**: Full platform access, tutor management, algorithm refinement, churn analysis
- **Tutor**: Self-service performance dashboard, personal session history, coaching insights
- **Student**: Session history viewing, feedback submission

**Note**: For MVP, focus is on Admin view only. Tutor and Student views are designed but not implemented initially.

### 1.4 Core Value Proposition
Traditional tutoring platforms lack visibility into session quality and rely on lagging indicators (student churn) rather than leading indicators (session metrics). This system provides:
- Real-time quality monitoring
- Proactive intervention triggers
- Data-driven coaching recommendations
- Self-improving prediction algorithms

---

## 2. Page Layouts & User Flows

### 2.1 Admin Dashboard (Homepage)

**Purpose**: High-level platform health overview with quick access to problem areas

**Layout Sections**:

1. **Platform Health Metrics** (top bar)
   - Avg Session Score (with trend indicator)
   - First Session Convert Rate (with trend)
   - Tutor Churn Risk Count (number at risk)
   - No-Show Rate (with trend)
   - All metrics show comparison to previous period

2. **Tutor Scoreboard** (two-column layout)
   - **Left Column: Top Performers** (10 tutors)
     - Name, overall score, session count
     - Quick link to tutor profile
   - **Right Column: Needs Attention** (5 tutors)
     - Name, overall score, active alert count
     - Visual severity indicators
     - Quick link to tutor profile

3. **Recent Sessions Feed** (live updating)
   - Shows last 20 sessions in reverse chronological order
   - Each card displays:
     - Time ago, subject, tutor name
     - Overall score, engagement score, student mood indicator
     - Key highlights (✓ for positive, ⚠️ for concerns)
     - Links to session detail and tutor profile
   - Filter options: All / Flagged Only / High Scoring Only

**Navigation**:
- Click tutor name → Tutor Detail Page
- Click session card → Session Detail Page
- Top nav: Dashboard | Tutors | Students | Sessions | Settings (Algorithm)

### 2.2 Tutor Detail Page

**Purpose**: Comprehensive tutor performance analysis with coaching insights

**Layout Sections**:

1. **Tutor Header**
   - Name, profile picture, overall score (0-10)
   - Member since date, contact button
   - Quick stats grid:
     - Total Sessions
     - Avg Student Rating (1-5 stars)
     - Student Engagement Score
     - Rebook Rate
     - Churn Risk Level (color-coded badge)

2. **Performance Trends** (30-day chart)
   - Line graph showing three metrics over time:
     - Session Score
     - Engagement Score
     - Student Satisfaction
   - Visual trend indicators (↑↓→)

3. **Actionable Insights Panel**
   - **Strengths Section** (✅ green header)
     - Bullet list of what tutor does well
     - Based on consistent patterns across sessions
     - Example: "Consistently checks understanding (avg 11x/session)"
   
   - **Growth Opportunities Section** (💡 yellow header)
     - Bullet list of areas for improvement
     - Constructive, data-backed suggestions
     - Example: "Visual aids usage low (2/10 sessions) - Consider whiteboard"
   
   - **Active Alerts Section** (⚠️ red header if any)
     - Critical issues requiring immediate attention
     - Link to specific flagged sessions
     - Acknowledge/resolve buttons

4. **Session History Table**
   - Sortable/filterable list of all sessions
   - Columns: Date/Time | Subject | Score | Student Rating | Key Metrics
   - Each row expandable or clickable to session detail
   - Sort options: Recent, Highest Score, Lowest Score, Most Engaging

5. **Coaching Notes Section**
   - Timestamped log of admin interventions
   - System-generated insights
   - Manual notes from coaching conversations

**Key Metrics Display Logic**:
- **Rating vs Score Divergence**: If abs(student_rating*2 - overall_score) > 2.0, display warning badge
- **Churn Risk**: Color-coded based on no-show patterns and reschedule frequency
- **Alert Badges**: Count of unacknowledged alerts with severity indicators

### 2.3 Session Detail Page

**Purpose**: Forensic analysis of individual session for coaching conversations

**Layout Sections**:

1. **Session Overview Header**
   - Date, time, duration (scheduled vs actual)
   - Tutor name (linked), Student ID (anonymized)
   - Subject, session number with student
   - Overall Session Score (large, prominent)

2. **Key Metrics Breakdown** (tabbed or accordion sections)
   
   **Engagement Metrics**:
   - Student Engagement Score (0-10 with visual bar)
   - Student Talk Ratio (percentage with bar)
   - Tutor Talk Ratio (percentage with bar)
   - Understanding Checks Count (with "Excellent/Good/Needs Improvement" label)
   
   **Communication Quality**:
   - Tutor Enthusiasm Score
   - Positive Reinforcement Count
   - Question Quality Breakdown (open vs closed)
   
   **Student Response Patterns**:
   - Avg Response Delay (with context: "Great" if <3s)
   - Frustration Signals Count (with severity)
   - Student Initiated Questions
   - Pause Analysis (productive vs awkward)
   
   **Visual Engagement** (if camera was on):
   - On-Screen Attention Percentage
   - Visual Engagement Score
   - Note-Taking Duration
   - Distraction Events
   
   **Technical Environment** (if screen monitoring enabled):
   - Active Tab Focus Percentage
   - Whiteboard Usage Duration
   - Tab Switch Count
   - Off-task Application Usage

3. **AI Analysis Summary**
   - Natural language summary of session
   - "What Went Well" bullet list
   - "Growth Opportunities" bullet list
   - Specific moment callouts with timestamps

4. **Transcript Highlights**
   - 3-5 key moments from session
   - Each with timestamp, speaker, text snippet, highlight type
   - Types: Strong Question, Breakthrough, Confusion, Positive Reinforcement
   - Link to "View Full Transcript" (not implemented in MVP)

5. **Student Feedback Section**
   - Star rating (if provided)
   - Selected feedback tags
   - Freeform text response
   - Note if feedback not yet submitted

6. **Session Outcomes**
   - Homework assigned: Yes/No
   - Follow-up booked: Yes/No (with date if yes)
   - Link to follow-up session if exists

**Data Availability Indicators**:
- Clear badges showing which analysis types are available:
  - "Audio Analysis ✓"
  - "Video Analysis ✓" or "Video Analysis ✗ (camera off)"
  - "Screen Monitoring ✓" or "Screen Monitoring ✗"

### 2.4 Student Detail Page

**Purpose**: Track individual student journey and churn risk

**Layout Sections**:

1. **Student Header**
   - Student ID (anonymized), enrolled since date
   - Status badge (Active/At Risk/Churned)
   - Contact parent button

2. **Churn Risk Assessment Panel** (prominent placement)
   - Current Risk Level (Low/Medium/High with color coding)
   - Risk Score percentage
   - **Risk Factors** (red/orange):
     - Listed with weight and contribution to risk
     - Example: "First session satisfaction was 3.5/5 (Weight: 0.25)"
   - **Protective Factors** (green):
     - Positive indicators reducing churn risk
     - Example: "Good tutor match (avg session score: 7.8)"
   - Link to detailed risk breakdown

3. **Student Stats Grid**
   - Sessions Completed
   - Avg Session Score
   - Avg Student Engagement
   - Tutors Worked With
   - Rebook Rate

4. **Session History**
   - Similar to tutor's session list but from student perspective
   - Shows which tutor, score, student's rating
   - Note if tutor was switched

5. **Tutor History**
   - List of all tutors student has worked with
   - Performance with each tutor
   - Easy identification of tutor switches

6. **Churn Management** (if status = churned)
   - Churn date
   - Recorded reasons
   - Survey response
   - Link to algorithm learning event

### 2.5 Algorithm Refinement Dashboard

**Purpose**: Demonstrate system's ability to learn and improve from churn cases

**Layout Sections**:

1. **Model Performance Summary**
   - Current accuracy percentage
   - False positive count
   - False negative count (most critical)
   - Total predictions made
   - Trend indicators

2. **Churn Prediction Factors & Weights**
   - Interactive sliders for each factor:
     - First Session Satisfaction
     - Sessions Completed
     - Follow-up Booking Rate
     - Avg Session Score
     - Tutor Consistency
     - Student Engagement
     - (Additional factors discovered through learning)
   - Each slider shows:
     - Current weight (0-1)
     - Suggested weight (from AI analysis)
     - Impact level (Low/Medium/High/Very High)
   - Total weight validation (must sum to 1.0)
   - Buttons: Apply Suggested Weights, Reset to Defaults, Save Changes

3. **Recent Learning Events**
   - Chronological list of churn cases that informed weight adjustments
   - Each entry shows:
     - Date, student ID
     - Predicted risk vs actual outcome
     - Survey response (if available)
     - What the system learned
     - Link to detailed case study

4. **Before/After Comparison** (when weights are changed)
   - Modal or panel showing:
     - Retroactive analysis on past N students
     - Old model accuracy vs new model accuracy
     - Specific students whose predictions would improve
     - False negative reduction

5. **Case Study Modal** (when marking student as churned)
   - Shows system's prediction vs reality
   - Survey response collection
   - AI-recommended weight adjustments
   - Apply/Dismiss/Modify options
   - Impact projection

---

## 3. Data Models & Database Schema

### 3.1 User & Authentication

#### User (Base Table)
```
Table: users
- id: VARCHAR(128) PK [Firebase UID]
- email: VARCHAR(255) UNIQUE NOT NULL
- name: VARCHAR(255) NOT NULL
- preferred_name: VARCHAR(255) NULL
- avatar_url: TEXT NULL
- role: ENUM('admin', 'tutor', 'student') NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
```

**TypeScript Interface**:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  preferred_name?: string;
  avatar_url?: string;
  role: 'admin' | 'tutor' | 'student';
  created_at: Date;
}
```

### 3.2 Subjects System

#### Subjects (Reference Table)
```
Table: subjects
- id: UUID PK
- name: VARCHAR(100) UNIQUE NOT NULL
- category: VARCHAR(50) [e.g., 'Math', 'Science', 'Language']
- created_at: TIMESTAMP DEFAULT NOW()

Pre-seeded with: Algebra, Geometry, Calculus, Pre-Calculus, Statistics, etc.
```

### 3.3 Tutor Model

#### Core Tutor Data (Stored)
```
Table: tutors
- user_id: VARCHAR(128) PK FK(users.id)
- member_since: DATE NOT NULL DEFAULT CURRENT_DATE
- bio: TEXT NULL
- experience: TEXT NULL
- education: TEXT NULL
- teaching_style: TEXT NULL
- hourly_rate: DECIMAL(6,2) NULL

Junction Table: tutor_subjects
- tutor_id: VARCHAR(128) FK(users.id)
- subject_id: UUID FK(subjects.id)
- PRIMARY KEY (tutor_id, subject_id)
```

#### Tutor Performance Snapshots (Pre-aggregated)
```
Table: tutor_performance_snapshots
- id: UUID PK
- tutor_id: VARCHAR(128) FK(users.id)
- snapshot_date: DATE NOT NULL
- period_type: ENUM('daily', 'weekly')
- sessions_count: INT
- avg_session_score: DECIMAL(3,2)
- avg_engagement_score: DECIMAL(3,2)
- avg_student_satisfaction: DECIMAL(3,2)
- created_at: TIMESTAMP DEFAULT NOW()
- UNIQUE(tutor_id, snapshot_date, period_type)

Note: Generated by nightly aggregation job
```

#### Tutor Insights (Cached Analysis)
```
Table: tutor_insights
- id: UUID PK
- tutor_id: VARCHAR(128) FK(users.id)
- insight_type: ENUM('strength', 'growth_area', 'achievement')
- category: ENUM (see insight categories below)
- display_text: TEXT NOT NULL
- detected_at: TIMESTAMP DEFAULT NOW()
- last_confirmed_at: TIMESTAMP
- is_active: BOOLEAN DEFAULT true
- resolved_at: TIMESTAMP NULL
- sample_sessions: UUID[] [Array of session IDs]
- metric_value: DECIMAL(5,2)

Insight Categories:
- high_engagement
- low_engagement
- high_talk_ratio
- balanced_talk_ratio
- frequent_understanding_checks
- infrequent_understanding_checks
- strong_questioning
- low_visual_aids
- high_visual_aids
- positive_reinforcement
- first_session_expert
```

**TypeScript Interface**:
```typescript
interface Tutor {
  user_id: string;
  
  // Stored
  member_since: Date;
  bio?: string;
  experience?: string;
  education?: string;
  teaching_style?: string;
  hourly_rate?: number;
  subjects: Subject[];
  
  // Calculated on read
  overall_score: number;
  total_sessions: number;
  avg_student_rating?: number;
  avg_student_engagement: number;
  rebook_rate: number;
  first_session_convert_rate: number;
  
  // Calculated - tutor reliability
  tutor_churn_risk: 'low' | 'medium' | 'high';
  no_show_count_30d: number;
  reschedule_count_30d: number;
  late_count_30d: number;
  
  // Calculated - impact on students
  student_churn_impact: number;
  rating_score_divergence: number;
  
  // Loaded from snapshots table
  performance_history: TutorPerformanceSnapshot[];
  
  // Loaded from insights table
  active_alerts: Alert[];
  strengths: TutorInsight[];
  growth_areas: TutorInsight[];
  achievements: TutorInsight[];
}
```

**Key Calculation Rules**:
- **overall_score**: Weighted average of recent session scores
- **rebook_rate**: (sessions with follow-up booked) / (total completed sessions)
- **first_session_convert_rate**: (first sessions leading to session 2) / (total first sessions)
- **rating_score_divergence**: abs(avg_student_rating * 2 - overall_score)
- **tutor_churn_risk**: Based on no_show_count, reschedule_count, late_count thresholds

### 3.4 Student Model

#### Core Student Data (Stored)
```
Table: students
- user_id: VARCHAR(128) PK FK(users.id)
- enrolled_since: DATE NOT NULL DEFAULT CURRENT_DATE
- grade_level: ENUM('6th', '7th', '8th', '9th', '10th', '11th', '12th', 'college', 'adult') NULL
- parent_email: VARCHAR(255) NULL
- bio: TEXT NULL
- learning_goals: TEXT NULL
- status: ENUM('active', 'churned', 'paused') DEFAULT 'active'
- churned_date: DATE NULL
- churn_survey_response: TEXT NULL

Junction Table: student_subjects
- student_id: VARCHAR(128) FK(users.id)
- subject_id: UUID FK(subjects.id)
- PRIMARY KEY (student_id, subject_id)
```

#### Student Churn Tracking
```
Table: student_churn_reasons
- student_id: VARCHAR(128) FK(users.id)
- reason: ENUM (see churn reasons below)
- added_at: TIMESTAMP DEFAULT NOW()
- PRIMARY KEY (student_id, reason)

Churn Reasons:
- poor_first_session
- tutor_mismatch
- no_progress
- scheduling_difficulty
- price_concerns
- technical_issues
- found_competitor
- completed_goals
- personal_circumstances
- other
```

**TypeScript Interface**:
```typescript
interface Student {
  user_id: string;
  
  // Stored
  enrolled_since: Date;
  grade_level?: string;
  parent_email?: string;
  bio?: string;
  learning_goals?: string;
  status: 'active' | 'churned' | 'paused';
  subjects_interested: Subject[];
  
  // Calculated
  total_sessions: number;
  avg_session_score?: number;
  avg_engagement?: number;
  avg_satisfaction_rating?: number;
  rebook_rate?: number;
  
  // Churn prediction (calculated)
  churn_risk_score: number;
  churn_risk_level: 'low' | 'medium' | 'high';
  churn_factors: ChurnFactor[];
  protective_factors: ProtectiveFactor[];
  
  // History (calculated)
  sessions_completed: number;
  tutors_worked_with: string[];
  first_session_date?: Date;
  last_session_date?: Date;
  
  // Churn data (stored if churned)
  churned_date?: Date;
  churn_reasons?: ChurnReason[];
  churn_survey_response?: string;
}

interface ChurnFactor {
  category: ChurnFactorCategory;
  weight: number;
  value: number;
  normalized_score: number;
  impact: 'positive' | 'negative';
  contribution_to_risk: number;
}

type ChurnFactorCategory = 
  | 'first_session_satisfaction'
  | 'sessions_completed'
  | 'follow_up_booking_rate'
  | 'avg_session_score'
  | 'tutor_consistency'
  | 'student_engagement'
  | 'tutor_switch_frequency'
  | 'scheduling_friction'
  | 'response_rate';
```

### 3.5 Session Model

#### Core Session Data
```
Table: sessions
- id: UUID PK
- tutor_id: VARCHAR(128) FK(users.id)
- student_id: VARCHAR(128) FK(users.id)
- scheduled_start: TIMESTAMP NOT NULL
- actual_start: TIMESTAMP NULL
- scheduled_duration: INT NOT NULL [minutes]
- actual_duration: INT NULL
- subject_id: UUID FK(subjects.id)
- session_number: INT NOT NULL [nth session for this tutor-student pair]
- status: ENUM (see session statuses below)
- tutor_showed_up: BOOLEAN DEFAULT true
- student_showed_up: BOOLEAN DEFAULT true
- rescheduled_by: ENUM('tutor', 'student') NULL
- technical_issues: BOOLEAN DEFAULT false
- technical_issues_description: TEXT NULL
- has_audio_analysis: BOOLEAN DEFAULT false
- has_video_analysis: BOOLEAN DEFAULT false
- has_screen_monitoring: BOOLEAN DEFAULT false
- homework_assigned: BOOLEAN DEFAULT false
- follow_up_booked: BOOLEAN DEFAULT false
- overall_session_score: DECIMAL(3,1) CHECK(0 <= score <= 10)
- ai_summary: TEXT
- completed_at: TIMESTAMP NULL
- created_at: TIMESTAMP DEFAULT NOW()

Session Statuses:
- scheduled
- in_progress
- completed
- no_show_tutor
- no_show_student
- cancelled
- rescheduled
```

#### Session Audio Metrics
```
Table: session_audio_metrics
- session_id: UUID PK FK(sessions.id)
- tutor_talk_ratio: DECIMAL(4,3) [0.000 to 1.000]
- student_talk_ratio: DECIMAL(4,3)
- productive_silence_ratio: DECIMAL(4,3)
- awkward_pause_ratio: DECIMAL(4,3)
- student_engagement_score: DECIMAL(3,1)
- tutor_enthusiasm_score: DECIMAL(3,1)
- avg_student_response_delay: DECIMAL(5,2) [seconds]
- long_pauses_count: INT
- student_initiated_questions: INT
- student_frustration_count: INT
- student_confusion_count: INT
- positive_moments_count: INT
- tutor_checks_understanding_count: INT
- tutor_positive_reinforcement_count: INT
- concept_re_explanation_count: INT
- open_ended_questions: INT
- closed_ended_questions: INT
- rhetorical_questions: INT
- created_at: TIMESTAMP DEFAULT NOW()
```

#### Session Video Metrics (Optional)
```
Table: session_video_metrics
- session_id: UUID PK FK(sessions.id)
- student_on_screen_attention_pct: DECIMAL(4,3)
- student_visual_engagement_score: DECIMAL(3,1)
- distraction_events_count: INT
- confusion_moments_count: INT
- tutor_uses_visual_aids: BOOLEAN
- student_taking_notes_duration: INT [minutes]
- created_at: TIMESTAMP DEFAULT NOW()
```

#### Session Screen Metrics (Optional)
```
Table: session_screen_metrics
- session_id: UUID PK FK(sessions.id)
- active_tab_focus_pct: DECIMAL(4,3)
- tab_switches_count: INT
- whiteboard_usage_minutes: INT
- messaging_app_detected: BOOLEAN
- gaming_detected: BOOLEAN
- created_at: TIMESTAMP DEFAULT NOW()
```

#### Session Feedback (Optional - Student Generated)
```
Table: session_feedback
- session_id: UUID PK FK(sessions.id)
- student_satisfaction_rating: INT CHECK(1 <= rating <= 5)
- feedback_text: TEXT NULL
- submitted_at: TIMESTAMP DEFAULT NOW()

Table: session_feedback_tags
- session_id: UUID FK(sessions.id)
- tag: VARCHAR(50)
- PRIMARY KEY (session_id, tag)

Feedback Tags:
- clear_explanations
- patient
- encouraging
- helpful_examples
- good_pace
- too_fast
- too_slow
- didnt_check_understanding
- too_much_talking
- confusing_examples
- technical_issues
- made_learning_fun
```

#### Transcript Highlights
```
Table: session_transcript_highlights
- id: UUID PK
- session_id: UUID FK(sessions.id)
- timestamp_seconds: INT
- speaker: ENUM('tutor', 'student')
- text: TEXT NOT NULL
- highlight_type: ENUM (see highlight types below)
- UNIQUE(session_id, timestamp_seconds)

Highlight Types:
- strong_question
- breakthrough
- confusion
- positive_reinforcement
- concern
- concept_explanation
```

**TypeScript Interface**:
```typescript
interface Session {
  id: string;
  tutor_id: string;
  student_id: string;
  
  // Metadata
  scheduled_start: Date;
  actual_start?: Date;
  scheduled_duration: number;
  actual_duration?: number;
  subject_id: string;
  session_number: number;
  
  // Status
  status: SessionStatus;
  tutor_showed_up: boolean;
  student_showed_up: boolean;
  rescheduled_by?: 'tutor' | 'student';
  technical_issues: boolean;
  technical_issues_description?: string;
  
  // Analysis flags
  has_audio_analysis: boolean;
  has_video_analysis: boolean;
  has_screen_monitoring: boolean;
  
  // Metrics (loaded from separate tables)
  audio_metrics?: AudioMetrics;
  video_metrics?: VideoMetrics;
  screen_metrics?: ScreenMetrics;
  
  // Feedback (loaded if exists)
  feedback?: SessionFeedback;
  
  // AI Analysis
  overall_session_score: number;
  ai_summary: string;
  transcript_highlights?: TranscriptHighlight[];
  
  // Outcomes
  homework_assigned: boolean;
  follow_up_booked: boolean;
  
  completed_at?: Date;
  created_at: Date;
}
```

### 3.6 Alert System

```
Table: alerts
- id: UUID PK
- tutor_id: VARCHAR(128) FK(users.id)
- alert_type: ENUM (see alert types below)
- severity: ENUM('info', 'warning', 'critical')
- title: VARCHAR(255) NOT NULL
- description: TEXT NOT NULL
- triggered_date: TIMESTAMP DEFAULT NOW()
- session_id: UUID FK(sessions.id) NULL
- acknowledged: BOOLEAN DEFAULT false
- acknowledged_by: VARCHAR(128) FK(users.id) NULL
- acknowledged_at: TIMESTAMP NULL
- action_taken: TEXT NULL
- resolved: BOOLEAN DEFAULT false
- resolved_at: TIMESTAMP NULL
- created_at: TIMESTAMP DEFAULT NOW()

Alert Types:
- high_talk_ratio
- low_understanding_checks
- student_frustration_detected
- poor_first_session
- high_reschedule_rate
- no_show_pattern
- declining_performance
- student_churn_risk
```

**Alert Generation Thresholds**:
```typescript
interface AlertThreshold {
  alert_type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  condition: string;
  threshold_value: number;
  lookback_period_days: number;
}

// Example thresholds:
// - high_talk_ratio (warning): > 0.65 in 70% of last 14 days sessions
// - high_talk_ratio (critical): > 0.75 in 70% of last 14 days sessions
// - low_understanding_checks (warning): avg < 4 in last 14 days
// - poor_first_session (critical): score < 6.5 within 7 days
// - no_show_pattern (critical): >= 2 no-shows in last 30 days
```

### 3.7 Achievement System

```
Table: achievements
- id: UUID PK
- tutor_id: VARCHAR(128) FK(users.id)
- achievement_type: ENUM (see achievement types below)
- title: VARCHAR(255) NOT NULL
- description: TEXT NOT NULL
- icon: VARCHAR(50) NOT NULL
- earned_date: DATE NOT NULL
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP DEFAULT NOW()
- UNIQUE(tutor_id, achievement_type, earned_date)

Achievement Types:
- engagement_master (8.5+ engagement, 10+ sessions)
- question_guru (65%+ open-ended questions)
- first_session_expert (85%+ first session convert)
- consistency_champion (low cancellation/no-show rate)
- student_favorite (4.8+ avg rating, 20+ sessions)
- rising_star (significant score improvement trend)
```

### 3.8 Churn Algorithm Versioning

```
Table: churn_algorithm_weights
- id: UUID PK
- version: INT NOT NULL
- factor_category: VARCHAR(50) NOT NULL
- weight: DECIMAL(4,3) CHECK(0 <= weight <= 1)
- effective_from: TIMESTAMP DEFAULT NOW()
- notes: TEXT NULL
- created_at: TIMESTAMP DEFAULT NOW()

Table: churn_weight_history
- id: UUID PK
- version: INT NOT NULL
- changed_by: VARCHAR(128) FK(users.id)
- change_reason: TEXT
- case_study_session_id: UUID FK(sessions.id) NULL
- case_study_student_id: VARCHAR(128) FK(users.id) NULL
- old_weights: JSONB
- new_weights: JSONB
- accuracy_before: DECIMAL(4,3)
- accuracy_after: DECIMAL(4,3)
- created_at: TIMESTAMP DEFAULT NOW()
```

**Current Algorithm Factors** (can evolve):
- first_session_satisfaction (initial weight: 0.25)
- sessions_completed (initial weight: 0.15)
- follow_up_booking_rate (initial weight: 0.20)
- avg_session_score (initial weight: 0.15)
- tutor_consistency (initial weight: 0.10)
- student_engagement (initial weight: 0.15)

Weights must sum to 1.0.

---

## 4. Key Technical Decisions

### 4.1 Data Storage Strategy
- **Stored in DB**: User profiles, session metadata, raw metrics, timestamps
- **Calculated on Read**: Aggregate scores, trends, risk levels, platform metrics
- **Pre-aggregated**: Performance snapshots (nightly job), insights (periodic analysis)
- **Caching**: Platform dashboard metrics (5-min TTL), tutor aggregates (on-demand with Redis)

### 4.2 Metric Calculation Approach
- **Audio metrics are always available** for completed sessions
- **Video metrics are optional** (only when camera on)
- **Screen metrics are optional** (only when monitoring enabled)
- Overall session score is calculated from available metrics with normalized weights
- Missing metrics don't penalize score; weights redistribute across available data

### 4.3 Real-time vs Batch Processing
- **Real-time**: Session status updates, alert generation for critical issues
- **Batch (nightly)**: Performance snapshots, insight detection, achievement checks
- **On-demand**: Individual tutor/student calculations with caching

### 4.4 Handling Optional Data
- Most student-related fields are optional (ratings, feedback)
- Calculations only use available data
- Track "response rate" separately as its own metric
- Display "N/A" or "Not enough data" rather than zero for missing metrics

### 4.5 Enum Usage vs Freeform Text
- **Enums for**: Alert types, achievement types, feedback tags, churn reasons, session statuses
- **Freeform for**: AI summaries, student feedback text, coaching notes, bio fields
- **Hybrid for**: Insights (enum category + generated display text)

### 4.6 Authentication
- Firebase Auth for user authentication
- User IDs are Firebase UIDs (not auto-generated UUIDs)
- Role-based access control at application level

---

## 5. Mock Data Requirements

### 5.1 Volume for MVP
- 10 tutors (2 star, 5 solid, 2 struggling, 1 at-risk)
- 40 students (~4 per tutor)
- 200 sessions (~20 per tutor)
- 30 days of history

### 5.2 Tutor Personas
Each persona has characteristic ranges for metrics that generate realistic patterns:
- **Star tutors**: High scores, low talk ratio, frequent checks, high satisfaction
- **Solid tutors**: Good scores, balanced metrics, occasional issues
- **Struggling tutors**: Lower scores, high talk ratio, few checks, student frustration
- **At-risk tutors**: Poor scores, reliability issues, high churn risk

### 5.3 Correlation Rules
Mock data must enforce realistic correlations:
- High tutor talk ratio → Lower engagement, fewer student questions
- Frequent understanding checks → Higher engagement, higher satisfaction
- Poor first session → Higher churn probability
- Student frustration → Lower ratings, less likely to rebook

### 5.4 Temporal Patterns
- Sessions distributed across business hours (3pm-8pm peak)
- Weekly patterns (weekday focus)
- Tutor improvement curves (new tutors start lower, improve)
- Student engagement trajectories (honeymoon period, then slight decline)

### 5.5 Realism Requirements
- Not all sessions have student feedback (~60% response rate)
- Video analysis available for ~70% of sessions
- Screen monitoring for ~60% of sessions
- Some sessions have technical issues, cancellations, no-shows
- First sessions are weighted more heavily in churn calculation

---

## 6. Future Considerations (Post-MVP)

### 6.1 Features Not in Initial Scope
- Tutor self-service view
- Student feedback portal
- Automated scheduling integration
- SMS/email alert notifications
- Multi-language support
- Mobile applications
- Payment processing integration

### 6.2 Scalability Considerations
- Current design targets 3,000 daily sessions
- Database indices on tutor_id, student_id, session dates, status fields
- Consider read replicas if query load increases
- Materialized views for complex aggregations
- CDN for static assets

### 6.3 Machine Learning Evolution
- Currently using rule-based scoring and thresholds
- Future: Train ML models on historical data
- Consider incorporating NLP for transcript analysis
- Computer vision for more sophisticated video analysis
- Anomaly detection for unusual patterns

---

## 7. Success Metrics

### 7.1 System Performance
- Metrics available within 1 hour of session completion
- Dashboard load time < 2 seconds
- Support 3,000+ daily sessions without degradation

### 7.2 Business Impact
- Reduce first-session churn from 24% to < 18%
- Identify at-risk tutors before no-show incidents
- Improve algorithm accuracy from baseline 68% to 80%+
- Decrease time-to-intervention for struggling tutors

### 7.3 User Adoption (Admin)
- Daily active usage by admin team
- Average time-to-acknowledge alerts < 24 hours
- Coaching conversations informed by system insights
- Algorithm refinement occurs monthly based on learnings

---

**Document Version**: 1.0  
**Last Updated**: November 7, 2025  
**Status**: Ready for PRD Development