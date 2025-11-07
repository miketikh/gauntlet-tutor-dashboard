# 🌱 Seed Data System Overview

## Quick Start

Run the seed script to populate your database with realistic tutoring platform data:

```bash
npm run seed
```

This creates a month's worth of tutoring activity with diverse tutors, students, and sessions.

## What Gets Generated

### The Cast of Characters

#### **6 Tutors** with distinct performance profiles:
- **2 Star Performers**: Excellence in teaching
  - Balanced talk ratios (35-45% tutor talking)
  - Frequent understanding checks (10-15 per session)
  - High student engagement (8.0-9.5 scores)
  - 4.5-5 star ratings consistently
  - 90% first session success rate
  - Almost never no-show (2% rate)

- **2 Solid Performers**: Reliable and effective
  - Good talk balance (45-55% tutor talking)
  - Regular understanding checks (6-10 per session)
  - Good engagement (6.5-8.0 scores)
  - 3.8-4.5 star ratings
  - 75% first session success rate
  - Occasional issues (5% no-show rate)

- **1 Struggling Tutor**: Needs coaching
  - Talks too much (60-75% of the time)
  - Few understanding checks (2-5 per session)
  - Lower engagement (4.0-6.5 scores)
  - 2.5-3.8 star ratings
  - 50% first session success rate
  - Reliability issues (15% no-show rate)

- **1 At-Risk Tutor**: Critical problems
  - Dominates conversation (70-85% talking)
  - Rarely checks understanding (0-3 times)
  - Poor engagement (2.0-4.5 scores)
  - 1.5-3.0 star ratings
  - Only 30% first session success
  - Major reliability issues (25% no-show rate)

#### **20 Students** with varying engagement levels:
- **8 Highly Engaged**: Active participants
  - High engagement scores (7.5-9.5)
  - Quick responses (1-3 second delay)
  - Ask many questions (5-10 per session)
  - Low frustration (5% probability)
  - High feedback rate (60% when engaged)
  - Low churn risk (10%)

- **8 Average Students**: Typical learners
  - Moderate engagement (5.0-7.5)
  - Normal response times (2-5 seconds)
  - Some questions (2-5 per session)
  - Occasional frustration (15% probability)
  - Moderate feedback rate (40% baseline)
  - Medium churn risk (25%)

- **4 Struggling Students**: Need extra support
  - Low engagement (2.0-5.0)
  - Slow responses (4-8 seconds)
  - Few questions (0-2 per session)
  - Higher frustration (35% probability)
  - Low feedback rate (20% when struggling)
  - High churn risk (50%)

### The Data Timeline

**~150 Sessions** distributed over the past 30 days with realistic patterns:

#### Time Distribution:
- **Peak Hours**: 3-8 PM (after school)
- **Busiest Days**: Tuesday-Thursday
- **Session Length**: Mostly 45-60 minutes, some 30 or 90
- **Recent Bias**: More sessions in recent days (recency effect)

#### Session Outcomes:
- ~88% Complete successfully
- ~6% Student no-shows
- ~3% Tutor no-shows (higher for at-risk tutors)
- ~3% Rescheduled
- ~5% Have technical issues

### Data Availability (Realistic Variance)

For completed sessions, not all data is always available:

- **Audio Analysis**: 100% (always present for completed sessions)
- **Video Analysis**: 50% of sessions (was on camera)
- **Screen Monitoring**: 40% of sessions (screen share enabled)
- **Student Feedback**: 40% of sessions (students don't always leave feedback)

## Smart Correlations

The data follows realistic cause-and-effect patterns:

### Behavioral Correlations:
- **High Tutor Talk Ratio (>65%)** leads to:
  - 30% reduction in student engagement
  - 50% fewer student questions
  - +2 frustration events
  - -1.0 star in ratings

- **Frequent Understanding Checks (>10)** results in:
  - 30% boost in engagement
  - 50% less confusion
  - +0.5 stars in ratings
  - Higher follow-up booking rate

- **First Sessions** typically have:
  - 50% more confusion
  - 30% more student questions
  - Higher feedback probability (+15%)
  - Critical for retention (weighted 2x in churn calculation)

### Quality Indicators:
- **Student Frustration (>5 events)** caps satisfaction at 2 stars
- **Balanced Conversation (40-50% tutor talk)** adds +1.5 engagement
- **Gaming Detected** drops score to 3.0 immediately
- **Note-Taking (>15 min)** indicates high engagement

## The Stories in the Data

### Success Patterns:
- Star tutors maintain consistent quality across sessions
- Engaged students with star tutors rarely churn
- First sessions with >7.0 score lead to 85% rebooking
- Sessions with frequent understanding checks show higher satisfaction

### Problem Patterns:
- At-risk tutors show cascading failures (no-shows → poor sessions → churn)
- Struggling students paired with struggling tutors almost always churn
- Technical issues significantly impact satisfaction (-1.5 score)
- High tutor talk ratio correlates with student disengagement

### Realistic Variations:
- Even star tutors have occasional off days
- Engaged students sometimes get frustrated
- Technical issues happen randomly but slightly more for new users
- Not all poor sessions result in negative feedback

## Configuration

The seed system is configurable through several files:

### Main Configuration (`scripts/seed/index.ts`):
- `SEED_VALUE`: Random seed for reproducible data (default: 42)
- `TOTAL_SESSIONS`: Number of sessions to generate (default: 150)
- `CLEAR_EXISTING_DATA`: Whether to clear existing data (default: true)

### Probability Configurations (`scripts/seed/config/probabilities.ts`):
- Session trait probabilities (video, screen, feedback rates)
- Time distributions (peak hours, days of week)
- Event probabilities (frustration, confusion, technical issues)

### Persona Definitions (`scripts/seed/config/personas.ts`):
- Tutor performance characteristics
- Student engagement patterns
- Behavioral traits and ranges

### Correlation Rules (`scripts/seed/config/correlations.ts`):
- Cause-and-effect relationships
- Metric interactions
- Quality impact rules

## Use Cases

This seed data enables you to:

1. **Test Dashboard Features**: See how different performance levels appear
2. **Validate Scoring Algorithms**: Check if correlations work correctly
3. **Demo the Platform**: Show realistic data patterns to stakeholders
4. **Test Edge Cases**: At-risk tutors, churning students, technical issues
5. **Develop Features**: Have consistent data while building
6. **Load Testing**: Generate larger datasets by increasing TOTAL_SESSIONS

## Understanding the Output

After running the seed script, you'll see a summary:
```
✅ Created 1 admin user
✅ Created 6 tutors
✅ Created 20 students
✅ Generated 150 sessions
✅ Saved 132 completed sessions with metrics
✅ Generated 53 feedback entries
✅ Generated 412 transcript highlights
```

The variation in feedback and completed sessions reflects realistic scenarios where:
- Not all sessions complete successfully
- Not all students provide feedback
- Some sessions have technical issues or no-shows

## Reproducibility

Using the same `SEED_VALUE` will generate identical data every time, which is useful for:
- Consistent testing environments
- Debugging specific scenarios
- Demonstrating features with known data
- Regression testing

## Next Steps

After seeding:
1. Check the data in your database or Drizzle Studio (`npm run db:studio`)
2. Start the app (`npm run dev`) to see the seeded data in action
3. Look for patterns like struggling tutors or at-risk students
4. Test alert generation and churn predictions
5. Verify that dashboard metrics calculate correctly

## Customization

To adjust the data generation:
- Modify persona definitions in `config/personas.ts`
- Adjust probabilities in `config/probabilities.ts`
- Add new correlation rules in `config/correlations.ts`
- Change the number of tutors/students in persona counts
- Adjust TOTAL_SESSIONS for more or less data

The system is designed to be highly configurable while maintaining realistic data relationships.