# Tutor Metrics Enhancement Plan

## Problem Statement

The tutor dashboard has extensive raw session data but lacks the "intelligence layer" that surfaces actionable insights. We have metrics scattered across multiple tables, but no systematic way to:
1. Alert admins when tutors are at risk of leaving (churn)
2. Identify extreme performance issues requiring intervention
3. Recognize patterns of excellence (insights and achievements)
4. Pre-aggregate data for faster dashboard performance (optional)

## Current State

### What We Have (Working)

**Rich Per-Session Data:**
- `session_audio_metrics` - Talk ratios, engagement scores, question counts, frustration/confusion signals, understanding checks
- `session_video_metrics` - Visual engagement, attention, distraction events (optional)
- `session_screen_metrics` - Tab focus, whiteboard usage, off-task detection (optional)
- `session_feedback` - Student ratings (1-5), feedback text, tags
- `session_transcript_highlights` - Key moments with timestamps and types
- `sessions` table - Overall scores, session numbers, status, follow-up tracking

**Calculated Metrics (in services/tutor-service.ts):**
- `overall_score` - Weighted average with exponential decay favoring recent sessions
- `churn_risk_level` - Calculated from no-shows, reschedules, late arrivals in last 30 days
- `avg_student_rating`, `avg_student_engagement`, `rebook_rate`
- `first_session_convert_rate`, `rating_score_divergence`

**Dashboard Metrics (in services/dashboard.ts):**
- Platform-wide averages with trend comparisons
- Top performers and tutors needing attention
- Recent sessions with flagging

### What's Missing (Empty Tables)

- `alerts` table - Schema exists, no data
- `tutor_insights` table - Schema exists, no data
- `achievements` table - Schema exists, no data
- `tutor_performance_snapshots` table - Schema exists, no data (but code has fallback)
- `churn_algorithm_weights` table - Empty, needs seeding

## Design Decisions

### Priority 1: Tutor Churn Risk (Main Focus)

Dashboard should surface tutors at risk of leaving the platform. This is the PRIMARY concern.

### Priority 2: Extreme Performance Issues (Distant Second)

Only surface patterns severe enough to warrant immediate intervention. Avoid alert fatigue.

### Skip for Now

- Student churn risk alerts (not currently displayed in UI)
- Minor performance issues (convert to insights instead)
- Performance snapshots (existing code has working fallback to real-time calculation)

## Alert System Specification

### Critical Alerts - Tutor Churn Risk

**Purpose:** Identify tutors disengaging from platform

1. **no_show_pattern**
   - Threshold: ≥3 no-shows (`status='no_show_tutor'`) in last 30 days
   - Severity: `critical`
   - Recommended Action: "Urgent check-in call to identify issues"

2. **high_reschedule_rate**
   - Threshold: ≥5 tutor-initiated reschedules in last 30 days
   - Severity: `critical`
   - Recommended Action: "Review schedule availability and workload"

3. **chronic_lateness**
   - Threshold: ≥4 sessions with >5min late arrival in last 30 days
   - Severity: `critical`
   - Recommended Action: "Coaching on time management and commitment"

4. **declining_performance**
   - Threshold: Overall score dropped ≥2.5 points over 2 weeks
   - Severity: `critical`
   - Recommended Action: "Check-in to identify cause and offer support"

### Warning Alerts - Extreme Performance Issues

**Purpose:** Identify tutors with severe, pattern-based performance problems

1. **consistently_poor_scores**
   - Threshold: ≥3 consecutive completed sessions with score <5.0
   - Severity: `warning`
   - Recommended Action: "Performance improvement plan and training resources"

2. **repeated_student_frustration**
   - Threshold: `student_frustration_count` >0 in ≥3 sessions within 2 weeks
   - Severity: `warning`
   - Recommended Action: "Review session recordings and provide feedback techniques"
   - Note: Pattern detection, not single-session triggers

3. **poor_first_session_pattern**
   - Threshold: ≥3 first sessions (`session_number=1`) with score <6.0 in last 60 days
   - Severity: `warning`
   - Recommended Action: "First session coaching and mentorship pairing"

4. **extreme_talk_ratio**
   - Threshold: avg `tutor_talk_ratio` ≥0.75 over last 5 sessions
   - Severity: `warning`
   - Recommended Action: "Socratic method training and active listening workshop"

### Alert Table Fields

When generating alerts, populate:
- `tutor_id` - The tutor being alerted about
- `alert_type` - One of the enum values above
- `severity` - 'critical' or 'warning'
- `title` - Short headline (e.g., "No-Show Pattern Detected")
- `description` - Detailed explanation with metrics
- `session_id` - Link to specific session if applicable (optional)
- `triggered_date` - When alert was generated
- `acknowledged`, `resolved` - Default to false

## Insight System Specification

### Purpose

Identify patterns in tutor behavior that are notable but don't require alerts. Used for coaching conversations and tutor development.

### Insight Types

**Strengths** (`insight_type='strength'`):
- `high_engagement` - avg `student_engagement_score` >8.5
- `balanced_talk_ratio` - `tutor_talk_ratio` between 0.35-0.45
- `frequent_understanding_checks` - avg `tutor_checks_understanding_count` >12/session
- `strong_questioning` - avg `open_ended_questions` >15/session
- `high_visual_aids` - uses visual aids in >80% of sessions
- `positive_reinforcement` - avg `tutor_positive_reinforcement_count` >12
- `first_session_expert` - first session avg score >8.5

**Growth Areas** (`insight_type='growth_area'`):
- `low_engagement` - avg `student_engagement_score` <6.0
- `high_talk_ratio` - avg `tutor_talk_ratio` >0.65 (not extreme enough for alert)
- `infrequent_understanding_checks` - avg checks <6/session
- `low_visual_aids` - uses visual aids in <30% of sessions

### Insight Table Fields

- `tutor_id` - The tutor
- `insight_type` - 'strength' or 'growth_area'
- `category` - Specific category from enum
- `display_text` - Human-readable text with actual metric value (e.g., "Consistently achieves high student engagement (avg 9.2)")
- `metric_value` - The actual metric as string
- `sample_sessions` - Array of 3-5 session IDs as evidence
- `is_active` - Default to true
- `detected_at` - Timestamp

## Achievement System Specification

Award badges to tutors who meet excellence criteria.

### Achievement Types

1. **engagement_master**
   - Criteria: avg `student_engagement_score` >8.5 for ≥10 sessions
   - Icon: "🎯"

2. **question_guru**
   - Criteria: avg `open_ended_questions` >15 AND avg `tutor_checks_understanding_count` >10
   - Icon: "💡"

3. **first_session_expert**
   - Criteria: avg score for `session_number=1` >8.5 with ≥5 first sessions
   - Icon: "⭐"

4. **consistency_champion**
   - Criteria: completed ≥20 sessions in last 30 days with avg score >8.0
   - Icon: "🏆"

5. **student_favorite**
   - Criteria: avg `student_satisfaction_rating` >4.5 AND `rebook_rate` >80%
   - Icon: "❤️"

6. **rising_star**
   - Criteria: performance improved by >1.5 points over last 30 days
   - Icon: "🚀"

### Achievement Table Fields

- `tutor_id`
- `achievement_type` - Enum value
- `title`, `description`, `icon`
- `earned_date` - Date achieved
- `is_active` - Default true

## Implementation Action Items

### Scripts to Create

All scripts should use `npx tsx` and be placed in `/scripts` directory.

#### 1. `scripts/generate-alerts.ts`
- Query all tutors from database
- For each tutor, calculate metrics from their sessions in last 30-60 days
- Check thresholds for each alert type
- Create alert records for violations
- Link to `session_id` when specific session triggered it
- Avoid duplicate alerts (check if already exists)

#### 2. `scripts/generate-insights.ts`
- Query all tutors
- Calculate aggregate metrics from their completed sessions
- Compare against thresholds for each insight category
- Generate `display_text` with actual metric values
- Include 3-5 `sample_sessions` as evidence
- Create insight records (both strengths and growth areas)

#### 3. `scripts/award-achievements.ts`
- Query all tutors
- Calculate metrics for each achievement criteria
- Check if criteria met
- Insert achievement records
- Avoid duplicates (check if already awarded)

#### 4. `scripts/seed-churn-weights.ts`
- Insert initial algorithm weights into `churn_algorithm_weights` table
- Version 1 with factors: first_session_satisfaction (0.25), sessions_completed (0.15), avg_session_score (0.20), tutor_consistency (0.10), engagement_trend (0.15), scheduling_issues (0.10), price_sensitivity (0.05)
- Must sum to 1.0
- Only run if table is empty

#### 5. `scripts/enrich-all-data.ts`
- Master runner that executes all scripts in sequence
- Order: seed-churn-weights → generate-insights → generate-alerts → award-achievements
- Progress reporting after each step
- Error handling

#### 6. `scripts/clear-generated-data.ts`
- Delete all records from: alerts, tutor_insights, achievements
- Useful for re-running generation with new logic
- Keep sessions and other core data intact

#### 7. `scripts/validate-data.ts`
- Count alerts by severity and type
- Count insights by type (strengths vs growth)
- List achievement distribution
- Show any data quality issues

### Package.json Scripts

Add to scripts section:
```
"seed:churn": "npx tsx scripts/seed-churn-weights.ts"
"generate:insights": "npx tsx scripts/generate-insights.ts"
"generate:alerts": "npx tsx scripts/generate-alerts.ts"
"generate:achievements": "npx tsx scripts/award-achievements.ts"
"enrich": "npx tsx scripts/enrich-all-data.ts"
"clear:generated": "npx tsx scripts/clear-generated-data.ts"
"validate": "npx tsx scripts/validate-data.ts"
```

### Workflow

```bash
# First time
npm run enrich

# To regenerate
npm run clear:generated
npm run enrich

# To validate
npm run validate
```

## Key Files Reference

### Database Schema
- `docs/database_schema.md` - Complete schema documentation
- `lib/db/schema/alerts.ts` - Alert, achievement, churn weight table definitions
- `lib/db/schema/sessions.ts` - Session tables
- `lib/db/schema/metrics.ts` - Audio/video/screen metrics tables

### Service Layer
- `services/tutor-service.ts` - All tutor calculations (overall_score, churn_risk, rebook_rate, etc.)
- `services/dashboard.ts` - Dashboard aggregations (platform metrics, top performers, tutors needing attention)

### Type Definitions
- `lib/db/types.ts` - All enums and TypeScript interfaces

## Dashboard Impact

With conservative thresholds, the "Tutors Needing Attention" section should show:
- 3-8 tutors maximum (not 20-50)
- Only those with genuine churn risk or extreme performance issues
- Clear, actionable recommendations for each
- Evidence via linked sessions and metric values

## Future Enhancements (Optional)

1. **Performance Snapshots** - Only if dashboard becomes slow
   - Generate daily/weekly rollups in `tutor_performance_snapshots`
   - Speeds up chart rendering for historical trends
   - Current code already has fallback, so not urgent

2. **Student Churn Risk** - When student-facing features are built
   - Calculate per-student churn scores using algorithm weights
   - Show which tutors are causing student churn
   - Separate alert type: `student_churn_risk`

3. **Alert Notifications** - For production use
   - Email admins when critical alerts trigger
   - Slack/Discord webhook integration
   - Weekly digest reports

4. **Continuous Alert Generation** - For production
   - Convert scripts to scheduled jobs (cron/background workers)
   - Real-time alert generation after session completion
   - Auto-resolution when thresholds no longer violated
