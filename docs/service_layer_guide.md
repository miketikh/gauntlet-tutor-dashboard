# Service Layer Guide

## Overview

The service layer provides a comprehensive data access and calculation API for the tutor dashboard application. All services are designed to work with Next.js 15 App Router Server Components, providing type-safe, cached, and performant data operations.

### Architecture Principles

1. **Server-Side Only**: All service functions are async and run on the server
2. **Type Safety**: Full TypeScript support with exported interfaces
3. **Caching Strategy**: In-memory cache with configurable TTL for expensive operations
4. **Error Handling**: Try/catch with meaningful error messages
5. **Optional Data**: Graceful handling of missing metrics (video/screen analytics may not exist)
6. **Drizzle ORM**: All database access uses Drizzle query builder (never raw SQL)

## File Organization

All service files are located in `/services/`:

```
services/
├── session-service.ts      # Session data retrieval
├── tutor-service.ts         # Tutor profiles and calculations
├── student-service.ts       # Student profiles and churn risk
├── platform-service.ts      # Platform-wide metrics
├── alert-service.ts         # Alert generation and management
└── insight-service.ts       # Tutor insight detection
```

### Naming Conventions

- **Files**: `{domain}-service.ts` (e.g., `tutor-service.ts`)
- **Functions**: Verb-based names describing the action
  - `get*` - Fetch data from database
  - `calculate*` - Perform calculations on data
  - `check*` - Validate conditions
  - `invalidate*` - Clear cache entries
- **Interfaces**: Descriptive names ending in type descriptor
  - `TutorProfile` - Complete profile object
  - `TutorSummary` - Lightweight summary
  - `SessionFilters` - Filter options

## Using Services in Server Components

Services are designed for use in Next.js Server Components:

```typescript
// app/tutors/[id]/page.tsx
import { getTutorById, getTutorOverallScore } from '@/services/tutor-service';
import { getSessionsByTutorId } from '@/services/session-service';

export default async function TutorDetailPage({ params }: { params: { id: string } }) {
  // Fetch data in parallel for optimal performance
  const [tutor, overallScore, sessions] = await Promise.all([
    getTutorById(params.id),
    getTutorOverallScore(params.id),
    getSessionsByTutorId(params.id, { status: 'completed', limit: 10 })
  ]);

  if (!tutor) {
    return <div>Tutor not found</div>;
  }

  return (
    <div>
      <h1>{tutor.name}</h1>
      <p>Overall Score: {overallScore?.toFixed(1) || 'N/A'}</p>
      <SessionList sessions={sessions} />
    </div>
  );
}
```

### Key Patterns

1. **Parallel Fetching**: Use `Promise.all()` for independent queries
2. **Null Handling**: Always check for null returns
3. **Type Safety**: Import and use exported interfaces
4. **Caching**: Services handle caching automatically - no manual cache management needed

## Caching Strategy

The service layer uses an in-memory cache with TTL (Time To Live) for expensive operations.

### Cache TTL Values

| Operation Type | TTL | Rationale |
|---------------|-----|-----------|
| Platform metrics | 5 minutes | Critical data, needs freshness |
| Top performers | 10 minutes | Leaderboards change slowly |
| Tutor calculations | 15 minutes | Individual metrics update gradually |
| Student ratings | 20 minutes | Feedback arrives infrequently |
| Churn risk scores | 20 minutes | Complex calculation, changes slowly |
| First session converts | 30 minutes | Historical metric, very stable |

### Cache Keys

Cache keys are generated deterministically from function parameters:

```typescript
import { generateCacheKey, CACHE_PREFIXES } from '@/lib/cache';

const cacheKey = generateCacheKey(CACHE_PREFIXES.TUTOR, {
  metric: 'overall_score',
  tutorId: 'tutor-123',
  start: dateRange?.start.toISOString(),
  end: dateRange?.end.toISOString(),
});
```

### Cache Invalidation

Each service exports invalidation functions:

```typescript
import { invalidateTutorCache } from '@/services/tutor-service';
import { invalidateStudentCache } from '@/services/student-service';
import { invalidatePlatformCache } from '@/services/platform-service';

// After a tutor completes a session
invalidateTutorCache(tutorId);
invalidateStudentCache(studentId);
invalidatePlatformCache();
```

## Error Handling

All service functions follow a consistent error handling pattern:

```typescript
export async function getExample(id: string): Promise<Example | null> {
  try {
    const result = await db.query.examples.findFirst({
      where: eq(examples.id, id)
    });
    return result || null;
  } catch (error) {
    console.error('Error in getExample:', error);
    throw new Error('Failed to fetch example: ' + (error as Error).message);
  }
}
```

### Error Handling Best Practices

1. **Always use try/catch** in service functions
2. **Log errors** with `console.error` including function name
3. **Throw new errors** with context (never swallow errors)
4. **Return null** for "not found" scenarios (don't throw)
5. **Provide context** in error messages for debugging

## Service Function Reference

### Session Service (`session-service.ts`)

#### `getSessionById(sessionId: string)`

Fetches a complete session with all metrics, feedback, and transcript highlights.

**Returns**: `SessionWithMetrics | null`

**Features**:
- Optional metrics return null if unavailable (video/screen)
- Includes audio metrics, feedback, transcript highlights
- Single query with joins for optimal performance

**Example**:
```typescript
const session = await getSessionById('session-123');
if (session?.audioMetrics) {
  console.log(`Talk ratio: ${session.audioMetrics.tutor_talk_ratio}`);
}
```

#### `getSessionsByTutorId(tutorId: string, options?: SessionFilters)`

Retrieves session summaries for a tutor with filtering and pagination.

**Parameters**:
- `options.status` - Filter by status (single or array)
- `options.dateRange` - Filter by date range
- `options.limit` - Max results
- `options.offset` - Pagination offset

**Returns**: `SessionSummary[]`

**Example**:
```typescript
const sessions = await getSessionsByTutorId('tutor-123', {
  status: 'completed',
  limit: 20,
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  }
});
```

#### `getSessionsByStudentId(studentId: string, options?: SessionFilters)`

Similar to `getSessionsByTutorId` but includes tutor information in results.

**Returns**: `Array<SessionSummary & { tutor_name: string }>`

#### `getRecentSessions(limit: number, filters?: RecentSessionFilters)`

Platform-wide recent sessions with flagging support.

**Features**:
- `flagged_only: true` returns only sessions with score < 6.5
- `status: 'completed'` filters to completed sessions
- Includes tutor name and subject information

**Example**:
```typescript
// Get sessions that need attention
const flaggedSessions = await getRecentSessions(10, {
  status: 'completed',
  flagged_only: true
});
```

### Tutor Service (`tutor-service.ts`)

#### `getTutorById(tutorId: string)`

Fetches complete tutor profile with subjects.

**Returns**: `TutorProfile | null`

**Includes**:
- User information (name, email, avatar)
- Bio, experience, education
- Hourly rate
- All subjects taught (via junction table)

#### `getAllTutors(options?: TutorFilters)`

Returns all tutors with optional subject filtering.

**Parameters**:
- `options.subject_id` - Filter to tutors teaching specific subject

**Returns**: `TutorSummary[]`

#### `getTutorOverallScore(tutorId: string, dateRange?: DateRange)` [CACHED: 15min]

Calculates weighted average of session scores. Recent sessions weighted higher using exponential decay (0.95 factor).

**Returns**: `number | null` (0-10 scale)

**Example**:
```typescript
const score = await getTutorOverallScore('tutor-123');
console.log(`Overall: ${score?.toFixed(1)}/10`);
```

#### `getTutorRebookRate(tutorId: string, dateRange?: DateRange)` [CACHED: 15min]

Percentage of completed sessions where student booked follow-up.

**Returns**: `number | null` (0-100 percentage)

#### `getTutorFirstSessionConvertRate(tutorId: string)` [CACHED: 30min]

Percentage of first sessions (session_number=1) that led to session_number=2.

**Returns**: `number | null` (0-100 percentage)

**Note**: Critical metric for retention - first sessions are make-or-break.

#### `getTutorChurnRisk(tutorId: string)` [CACHED: 15min]

Calculates churn risk based on no-shows, reschedules, and late arrivals.

**Thresholds**:
- **High**: ≥2 no-shows OR ≥5 reschedules in last 30 days
- **Medium**: 1 no-show OR 3-4 reschedules in last 30 days
- **Low**: Below medium thresholds

**Returns**: `'low' | 'medium' | 'high'`

#### `getTutorStudentEngagement(tutorId: string, dateRange?: DateRange)` [CACHED: 15min]

Average student engagement score from audio analysis.

**Returns**: `number | null` (0-10 scale)

#### `getTutorAvgStudentRating(tutorId: string, dateRange?: DateRange)` [CACHED: 20min]

Average student satisfaction rating from feedback.

**Returns**: `number | null` (1-5 scale)

#### `getTutorRatingScoreDivergence(tutorId: string)`

Difference between student rating (scaled to 10) and AI session score.

**Returns**: `number | null`

**Use Case**: Identifies tutors where student perception differs from AI analysis.

#### `invalidateTutorCache(tutorId: string)`

Clears all cached tutor metrics. Call after session completion.

### Student Service (`student-service.ts`)

#### `getStudentById(studentId: string)`

Fetches complete student profile with subjects and churn reasons.

**Returns**: `StudentProfile | null`

**Includes**:
- Churn reasons if status is 'churned'
- All enrolled subjects
- Learning goals and bio

#### `getAllStudents(options?: StudentFilters)`

Returns all students with filtering.

**Parameters**:
- `options.status` - Filter by 'active', 'churned', or 'paused'
- `options.grade_level` - Filter by grade level

**Returns**: `StudentSummary[]`

#### `getStudentTutorHistory(studentId: string)`

Returns all tutors this student has worked with, including session counts.

**Returns**: `TutorHistory[]`

**Use Case**: Detect tutor switches, which increase churn risk.

#### `getStudentChurnRiskScore(studentId: string)` [CACHED: 20min]

Calculates comprehensive churn risk score using weighted algorithm.

**Factors Considered**:
- First session satisfaction (25%)
- Sessions completed (15%)
- Follow-up booking rate (15%)
- Avg session score (15%)
- Tutor consistency (10%)
- Student engagement (10%)
- Other factors (10%)

**Returns**: `number` (0-100 scale)

**Example**:
```typescript
const riskScore = await getStudentChurnRiskScore('student-123');
if (riskScore > 70) {
  console.log('High churn risk - intervention needed');
}
```

#### `getStudentChurnRiskLevel(studentId: string)`

Converts risk score to level.

**Thresholds**:
- **High**: >70
- **Medium**: 40-70
- **Low**: <40

**Returns**: `'low' | 'medium' | 'high'`

#### `getStudentChurnFactors(studentId: string)` [CACHED: 20min]

Detailed breakdown of all churn factors.

**Returns**: `{ risk_factors: ChurnFactor[], protective_factors: ChurnFactor[] }`

**Use Case**: Understand WHY a student is at risk and what's protecting them.

**Example**:
```typescript
const factors = await getStudentChurnFactors('student-123');
console.log('Risk factors:', factors.risk_factors.map(f => f.category));
console.log('Protective factors:', factors.protective_factors.map(f => f.category));
```

#### `invalidateStudentCache(studentId: string)`

Clears student-specific cache. Call after session completion or feedback submission.

#### `invalidateChurnAlgorithmCache()`

Clears ALL student caches globally. Call when algorithm weights are updated.

### Platform Service (`platform-service.ts`)

#### `getPlatformHealthMetrics(dateRange?: DateRange)` [CACHED: 5min]

Calculates platform-wide health metrics with trend indicators.

**Returns**: `PlatformHealthMetrics`

**Metrics Included**:
- Average session score
- First session convert rate
- Tutor churn risk count (tutors at high risk)
- No-show rate
- Trend percentages (vs previous period)

**Example**:
```typescript
const health = await getPlatformHealthMetrics();
console.log(`Avg Score: ${health.avgSessionScore?.toFixed(1)}`);
console.log(`Trend: ${health.avgSessionScoreTrend > 0 ? '+' : ''}${health.avgSessionScoreTrend}%`);
```

#### `getTopPerformers(limit: number, dateRange?: DateRange)` [CACHED: 10min]

Returns top tutors by average session score.

**Requirements**:
- Minimum 5 sessions in period to qualify
- Only completed sessions counted

**Returns**: `TutorPerformance[]`

**Example**:
```typescript
const topTutors = await getTopPerformers(10);
topTutors.forEach((tutor, index) => {
  console.log(`${index + 1}. ${tutor.tutor_name}: ${tutor.overall_score.toFixed(1)}`);
});
```

#### `getNeedsAttention(limit: number, dateRange?: DateRange)` [CACHED: 5min]

Returns tutors with active alerts or low scores (<6.5).

**Sorting Priority**:
1. Critical alerts first
2. Then by overall score (lowest first)
3. Then by alert count

**Returns**: `TutorAlert[]`

**Use Case**: Admin dashboard "Needs Attention" section.

#### `calculateTrendPercentage(current: number | null, previous: number | null)`

Helper function to calculate percentage change.

**Returns**: `number | null`

**Example**:
```typescript
const trend = calculateTrendPercentage(8.5, 8.0); // Returns 6.25
```

#### `invalidatePlatformCache()`

Clears all platform-wide metrics. Call after batch session processing.

### Alert Service (`alert-service.ts`)

#### `getActiveAlerts(tutorId: string)`

Returns all unresolved alerts for a tutor, ordered by severity.

**Returns**: `Alert[]`

**Sorting**: Critical first, then warning, then info, then by triggered date.

#### `getTutorAlertCount(tutorId: string, severity?: AlertSeverityType)`

Counts unresolved alerts, optionally filtered by severity.

**Parameters**:
- `severity` - 'info', 'warning', or 'critical'

**Returns**: `number`

#### `acknowledgeAlert(alertId: string, acknowledgedBy: string)`

Marks alert as seen by admin.

**Returns**: `Alert`

**Use Case**: Track that admin has viewed the alert.

#### `resolveAlert(alertId: string, actionTaken: string)`

Resolves alert with description of action taken.

**Returns**: `Alert`

**Example**:
```typescript
await resolveAlert('alert-123', 'Coached tutor on reducing talk time');
```

#### `checkAndGenerateAlerts(tutorId: string)`

Analyzes tutor data and generates new alerts if conditions are met.

**Alert Types Checked**:
- **high_talk_ratio** (warning): >65% in 70%+ of last 10 sessions
- **low_understanding_checks** (warning): avg <4 per session
- **poor_first_session** (critical): First session score <6.5 in last 7 days
- **no_show_pattern** (critical): ≥2 no-shows in last 30 days
- **high_reschedule_rate** (warning): ≥5 reschedules in last 30 days
- **declining_performance** (warning): Score dropped >15% over 30 days

**Returns**: `Alert[]` (newly created alerts)

**Note**: Prevents duplicates - won't create alert if one already exists.

**Example**:
```typescript
// Run this periodically or after each session
const newAlerts = await checkAndGenerateAlerts('tutor-123');
if (newAlerts.length > 0) {
  console.log(`Generated ${newAlerts.length} new alerts`);
}
```

### Insight Service (`insight-service.ts`)

#### `getTutorInsights(tutorId: string, insightType?: InsightTypeType)`

Fetches active insights for a tutor.

**Parameters**:
- `insightType` - Filter by 'strength', 'growth_area', or 'achievement'

**Returns**: `TutorInsight[]`

**Example**:
```typescript
const strengths = await getTutorInsights('tutor-123', 'strength');
const growthAreas = await getTutorInsights('tutor-123', 'growth_area');
```

#### `detectAndGenerateInsights(tutorId: string)`

Analyzes last 30 days of sessions and generates/updates insights.

**Strength Patterns Detected**:
- **high_engagement**: avg engagement >8.0
- **balanced_talk_ratio**: 35-50% in 70%+ sessions
- **frequent_understanding_checks**: avg >8 per session
- **strong_questioning**: >60% open-ended questions
- **high_visual_aids**: used in 70%+ sessions
- **positive_reinforcement**: avg >10 per session
- **first_session_expert**: convert rate >85%

**Growth Area Patterns Detected**:
- **low_engagement**: avg engagement <6.0
- **high_talk_ratio**: >65% in 70%+ sessions
- **infrequent_understanding_checks**: avg <4 per session
- **low_visual_aids**: used in <30% sessions

**Returns**: `TutorInsight[]` (newly created/updated insights)

**Features**:
- Auto-deactivates insights that no longer apply
- Updates existing insights with latest metric values
- Includes 3 sample sessions as evidence

**Example**:
```typescript
// Run this weekly or after significant session milestones
const insights = await detectAndGenerateInsights('tutor-123');
console.log(`Generated/updated ${insights.length} insights`);
```

#### `resolveInsight(insightId: string)`

Deactivates an insight (marks as resolved).

**Returns**: `TutorInsight`

**Use Case**: Admin manually resolves insight after coaching session.

## Performance Characteristics

### Query Performance

| Operation | Avg Time | Notes |
|-----------|----------|-------|
| Get session by ID | 50-100ms | Includes all metrics joins |
| Get sessions list | 20-50ms | Depends on limit |
| Get tutor profile | 20-50ms | Includes subjects join |
| Count sessions | <10ms | Database COUNT() |
| Cached metrics | <5ms | In-memory cache hit |
| Platform health | 500ms-2s | Expensive - use cache |
| Churn risk score | 200-500ms | Multiple factor calculations |
| Generate alerts | 100-300ms | Analyzes multiple conditions |
| Generate insights | 200-500ms | Pattern detection across sessions |

### Optimization Recommendations

1. **Use `Promise.all()`** for parallel queries
2. **Limit result sets** - use pagination
3. **Trust the cache** - cached functions are 50-100x faster
4. **Batch operations** - invalidate cache once after multiple updates
5. **Index recommendations**:
   - `sessions.tutor_id`
   - `sessions.student_id`
   - `sessions.scheduled_start`
   - `sessions.status`
   - `sessions.session_number`

## Database Indexing Recommendations

For optimal performance, ensure these indexes exist:

```sql
-- Sessions table (most queried)
CREATE INDEX idx_sessions_tutor_id ON sessions(tutor_id);
CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_scheduled_start ON sessions(scheduled_start);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_session_number ON sessions(session_number);
CREATE INDEX idx_sessions_completed_at ON sessions(completed_at);

-- Composite indexes for common queries
CREATE INDEX idx_sessions_tutor_status_date
  ON sessions(tutor_id, status, scheduled_start);
CREATE INDEX idx_sessions_student_status_date
  ON sessions(student_id, status, scheduled_start);

-- Alerts
CREATE INDEX idx_alerts_tutor_resolved ON alerts(tutor_id, resolved);
CREATE INDEX idx_alerts_severity ON alerts(severity);

-- Insights
CREATE INDEX idx_insights_tutor_active ON tutor_insights(tutor_id, is_active);
```

## Common Patterns & Examples

### Loading a Tutor Detail Page

```typescript
import {
  getTutorById,
  getTutorOverallScore,
  getTutorRebookRate,
  getTutorChurnRisk,
  getTutorStudentEngagement
} from '@/services/tutor-service';
import { getSessionsByTutorId } from '@/services/session-service';
import { getActiveAlerts } from '@/services/alert-service';
import { getTutorInsights } from '@/services/insight-service';

export default async function TutorPage({ params }: { params: { id: string } }) {
  // Fetch all data in parallel
  const [
    tutor,
    overallScore,
    rebookRate,
    churnRisk,
    engagement,
    recentSessions,
    alerts,
    strengths,
    growthAreas
  ] = await Promise.all([
    getTutorById(params.id),
    getTutorOverallScore(params.id),
    getTutorRebookRate(params.id),
    getTutorChurnRisk(params.id),
    getTutorStudentEngagement(params.id),
    getSessionsByTutorId(params.id, { status: 'completed', limit: 10 }),
    getActiveAlerts(params.id),
    getTutorInsights(params.id, 'strength'),
    getTutorInsights(params.id, 'growth_area')
  ]);

  if (!tutor) return <div>Not found</div>;

  return (
    <div>
      <h1>{tutor.name}</h1>
      <MetricsGrid
        overallScore={overallScore}
        rebookRate={rebookRate}
        churnRisk={churnRisk}
        engagement={engagement}
      />
      {alerts.length > 0 && <AlertsList alerts={alerts} />}
      <InsightsSection strengths={strengths} growthAreas={growthAreas} />
      <RecentSessions sessions={recentSessions} />
    </div>
  );
}
```

### Loading Platform Admin Dashboard

```typescript
import { getPlatformHealthMetrics, getTopPerformers, getNeedsAttention } from '@/services/platform-service';
import { getRecentSessions } from '@/services/session-service';

export default async function AdminDashboard() {
  const [health, topPerformers, needsAttention, flaggedSessions] = await Promise.all([
    getPlatformHealthMetrics(),
    getTopPerformers(10),
    getNeedsAttention(10),
    getRecentSessions(20, { status: 'completed', flagged_only: true })
  ]);

  return (
    <div>
      <HealthMetricsGrid metrics={health} />
      <TwoColumnLayout>
        <TopPerformersCard tutors={topPerformers} />
        <NeedsAttentionCard tutors={needsAttention} />
      </TwoColumnLayout>
      <FlaggedSessionsTable sessions={flaggedSessions} />
    </div>
  );
}
```

### Calculating Student Churn Risk

```typescript
import {
  getStudentById,
  getStudentChurnRiskScore,
  getStudentChurnFactors
} from '@/services/student-service';

export async function analyzeStudentChurnRisk(studentId: string) {
  const [student, riskScore, factors] = await Promise.all([
    getStudentById(studentId),
    getStudentChurnRiskScore(studentId),
    getStudentChurnFactors(studentId)
  ]);

  console.log(`${student?.name} - Risk Score: ${riskScore}/100`);

  console.log('\nRisk Factors:');
  factors.risk_factors.forEach(f => {
    console.log(`  - ${f.category}: ${f.value} (contribution: ${(f.contribution_to_risk * 100).toFixed(1)}%)`);
  });

  console.log('\nProtective Factors:');
  factors.protective_factors.forEach(f => {
    console.log(`  - ${f.category}: ${f.value}`);
  });

  return { riskScore, factors };
}
```

### Running Periodic Alert Generation

```typescript
import { getAllTutors } from '@/services/tutor-service';
import { checkAndGenerateAlerts } from '@/services/alert-service';

// Run this as a cron job every hour
export async function generateAlertsForAllTutors() {
  const tutors = await getAllTutors();

  for (const tutor of tutors) {
    try {
      const newAlerts = await checkAndGenerateAlerts(tutor.user_id);
      if (newAlerts.length > 0) {
        console.log(`Generated ${newAlerts.length} alerts for ${tutor.name}`);
        // Optionally send email/notification here
      }
    } catch (error) {
      console.error(`Failed to check alerts for ${tutor.name}:`, error);
    }
  }
}
```

### Running Periodic Insight Detection

```typescript
import { getAllTutors } from '@/services/tutor-service';
import { detectAndGenerateInsights } from '@/services/insight-service';

// Run this weekly
export async function generateInsightsForAllTutors() {
  const tutors = await getAllTutors();

  for (const tutor of tutors) {
    try {
      const insights = await detectAndGenerateInsights(tutor.user_id);
      console.log(`Updated ${insights.length} insights for ${tutor.name}`);
    } catch (error) {
      console.error(`Failed to generate insights for ${tutor.name}:`, error);
    }
  }
}
```

## Type Definitions

All service functions export their return type interfaces. Import them for type safety:

```typescript
import type {
  SessionWithMetrics,
  SessionSummary,
  SessionFilters
} from '@/services/session-service';

import type {
  TutorProfile,
  TutorSummary,
  PerformanceSnapshot
} from '@/services/tutor-service';

import type {
  StudentProfile,
  TutorHistory,
  ChurnFactor
} from '@/services/student-service';

import type {
  PlatformHealthMetrics,
  TutorPerformance,
  TutorAlert
} from '@/services/platform-service';

import type {
  Alert
} from '@/services/alert-service';

import type {
  TutorInsight
} from '@/services/insight-service';
```

## Best Practices

1. **Always handle null returns**: Service functions return `null` when data isn't found
2. **Use parallel fetching**: Leverage `Promise.all()` for independent queries
3. **Trust the cache**: Don't manually implement caching - services handle it
4. **Invalidate after mutations**: Call `invalidate*Cache()` functions after data changes
5. **Use date ranges carefully**: Avoid unbounded queries - always specify ranges or limits
6. **Check for optional metrics**: Video/screen metrics may be null - handle gracefully
7. **Provide meaningful errors**: If wrapping service calls, preserve error context
8. **Use TypeScript**: Import interfaces for full type safety and autocomplete

## Troubleshooting

### Slow Queries

1. Check if function is cached - look for `[CACHED: Xmin]` in docs
2. Verify database indexes are created (see recommendations above)
3. Reduce date range or add limit parameter
4. Use parallel fetching with `Promise.all()`

### Stale Data

1. Verify cache invalidation is called after mutations
2. Check TTL settings - may need to reduce for critical data
3. For development, clear cache: `getCacheManager().clear()`

### Missing Data (null returns)

1. Check if data actually exists in database
2. Verify IDs are correct (UUIDs are case-sensitive)
3. For metrics, check `has_audio_analysis`, `has_video_analysis` flags
4. Some calculations return null if insufficient data (e.g., need 5+ sessions)

### Type Errors

1. Import interfaces from service files, not from lib/db/types
2. Handle null returns with optional chaining: `score?.toFixed(1)`
3. Check that date objects are passed, not strings

## Migration Notes

When updating service functions:

1. **Never break interfaces**: Add optional fields instead
2. **Update JSDoc**: Keep examples and descriptions current
3. **Adjust cache TTL carefully**: Changes affect performance
4. **Test with real data**: Verify null handling and edge cases
5. **Update this guide**: Add new functions and examples

## Additional Resources

- **Database Schema**: `/lib/db/schema/`
- **Type Definitions**: `/lib/db/types.ts`
- **Cache Implementation**: `/lib/cache.ts`
- **Project Overview**: `/docs/project_overview.md`
