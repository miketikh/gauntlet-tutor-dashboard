# Session Detail Page - Implementation Tasks

## Context

Phase 4.4 builds the **Session Detail Page**, a forensic analysis interface that provides comprehensive insights into individual tutoring sessions. This page is critical for coaching conversations and understanding what makes sessions successful or where tutors need support.

The Session Detail Page is accessed from multiple entry points: the admin dashboard's recent sessions feed, the tutor detail page's session history, and the student detail page's session list. It must handle variable data availability gracefully - not all sessions have video analysis (camera off) or screen monitoring enabled, yet the page must provide valuable insights from whatever data exists.

**Current State**: Phase 4.1 (Platform Metrics & Data Layer) is complete, providing session data access through `services/session-service.ts` including `getSessionById()` with full metrics loading. Phase 3 (Reusable Components) is complete, providing all UI components needed for this page: MetricCard, ScoreBadge, TrendIndicator, DataTable, PerformanceChart, InsightList, SessionCard, and RiskBadge.

**Data Architecture**: Sessions have three optional metrics tables (`session_audio_metrics` is always present for completed sessions, but `session_video_metrics` and `session_screen_metrics` are optional). The page must check availability flags (`has_audio_analysis`, `has_video_analysis`, `has_screen_monitoring`) on the session record and display data availability badges prominently. Student feedback (`session_feedback`) is also optional with ~60% response rate.

**Key Design Requirements** (from project_overview.md lines 124-196):
1. **Session Overview Header**: Date, time, duration (scheduled vs actual), tutor/student links, subject, session number, large prominent overall score
2. **Key Metrics Breakdown**: Tabbed or accordion sections for Engagement, Communication, Student Response, Visual (if available), Technical (if available) - each with specific metrics and context labels
3. **AI Analysis Summary**: Natural language summary with "What Went Well" and "Growth Opportunities" bullet lists, specific moment callouts with timestamps
4. **Transcript Highlights**: 3-5 key moments with timestamp, speaker, text snippet, highlight type (strong_question, breakthrough, confusion, positive_reinforcement, concern, concept_explanation)
5. **Student Feedback Section**: Star rating, feedback tags (from enum), freeform text, "Not yet submitted" state
6. **Session Outcomes**: Homework assigned (yes/no), follow-up booked (yes/no with date), link to follow-up session if exists
7. **Data Availability Indicators**: Clear badges showing which analysis types are available

**Navigation Context**: This page is view-only for MVP (no edit/update functionality). Must include breadcrumb navigation and links back to tutor detail page and student detail page (when Phase 4.5 is complete).

## Instructions for AI Agent

**Standard Workflow:**
1. **Read Phase**: Start each PR by reading all files listed in the "Read these files first" section
2. **Implement Tasks**: Complete tasks in order, mark each with [x] when finished
3. **Test**: Follow the "What to Test" section to validate changes
4. **Summary**: Provide completion summary with files changed and functionality added
5. **Wait for Approval**: Do not proceed to next PR until current one is approved

**Important Patterns:**
- Use Server Components for data fetching (Next.js 15 App Router pattern)
- Fetch data in page component, pass to client components via props
- Use service layer (`services/session-service.ts`) for all data access
- Handle missing data gracefully (show "N/A", disable sections, display helpful messages)
- Follow existing patterns from `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx`
- Use components from `/Users/mike/gauntlet/tutor-dashboard/components/ui/`
- Import types from `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts`

**Error Handling:**
- If session not found, show 404-style error state
- If session incomplete (status != 'completed'), show appropriate message
- Always validate data availability before rendering metric sections

---

## Phase 1: Page Structure & Session Overview

**Estimated Time:** 3-4 hours

This phase creates the page routing, layout structure, and session overview header with navigation.

### PR 1.1: Session Page Route & Basic Layout

**Goal:** Create the session detail page route with header, navigation, and data fetching

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` (pattern for Server Component with auth)
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` (getSessionById function)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts` (SessionStatus, HighlightType, FeedbackTag enums)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/sessions.ts` (session schema)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/metrics.ts` (metrics schemas)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx`
- [ ] Implement Server Component with:
  - Auth check using `createClient()` from `@/lib/supabase/server`
  - Redirect to sign-in if not authenticated
  - Extract sessionId from params
  - Fetch session data using `getSessionById(sessionId)` from session-service
  - Handle not found case (show error state if session doesn't exist)
  - Handle incomplete session (status != 'completed') with message
  - Pass data to client components as props
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/session-header.tsx`
- [ ] Implement SessionHeader component:
  - Display date/time formatted with date-fns (format: "MMM dd, yyyy 'at' h:mm a")
  - Show scheduled duration vs actual duration (e.g., "60 min session (actual: 58 min)")
  - Tutor name as link to `/tutors/[tutorId]` (use Next.js Link)
  - Student ID (anonymized, not a link for MVP)
  - Subject name with icon
  - Session number indicator (e.g., "Session #3 with this student")
  - Large, prominent overall_session_score using ScoreBadge component (size="lg")
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/data-availability-badges.tsx`
- [ ] Implement DataAvailabilityBadges component:
  - Show badges for: Audio Analysis (always ✓ for completed), Video Analysis, Screen Monitoring
  - Use has_audio_analysis, has_video_analysis, has_screen_monitoring flags
  - Green badge with checkmark for available, muted/gray badge with X for unavailable
  - Add tooltips explaining what each analysis type provides (use shadcn/ui Tooltip if available, otherwise plain Badge)
- [ ] Update page.tsx to include:
  - Header component from `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` pattern (TutorReview Dashboard branding)
  - Breadcrumb navigation: Dashboard > Sessions > [Session ID]
  - SessionHeader component
  - DataAvailabilityBadges component
  - Placeholder sections for metrics (will be built in Phase 2)

**What to Test:**
1. Build project - verify no compilation errors
2. Navigate to `/sessions/[valid-session-id]` - verify header renders with all details
3. Check auth redirect - unauthenticated users should redirect to sign-in
4. Test with session that has no video analysis - verify badge shows unavailable state
5. Test with invalid session ID - verify error state displays
6. Test navigation - clicking tutor name should link to tutor detail page
7. Verify date/time formatting is human-readable

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx` - Main session detail page with data fetching
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/session-header.tsx` - Session overview header component
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/data-availability-badges.tsx` - Data availability indicator badges

**Notes:**
- Use `(dashboard)` route group to inherit shared layout if it exists, otherwise create standalone layout
- Format duration intelligently: show hours if >= 60 minutes (e.g., "1h 30min")
- SessionHeader should be responsive - stack elements on mobile
- If actual_duration is null, show only scheduled_duration
- Student ID should be displayed as anonymized (e.g., "Student #xxxx")

---

### PR 1.2: Metrics Layout Structure (Tabs/Accordion)

**Goal:** Create the tabbed/accordion layout structure for organizing metric sections

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/card.tsx` (Card component pattern)
- Look for shadcn/ui Tabs component in `/Users/mike/gauntlet/tutor-dashboard/components/ui/` (install if not present)

**Tasks:**
- [ ] Install shadcn/ui Tabs component if not present: `npx shadcn@latest add tabs`
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/metrics-section.tsx`
- [ ] Implement MetricsSection component:
  - Wrapper component accepting session data and availability flags
  - Use Tabs component for desktop view (>= md breakpoint)
  - Tab list: "Engagement", "Communication", "Student Response", "Visual" (if available), "Technical" (if available)
  - Each TabContent renders a specific metrics panel (to be built in Phase 2)
  - Gray out/disable tabs for unavailable metric types
  - Add note under unavailable tabs: "Video analysis not available for this session"
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/metrics-layout-wrapper.tsx`
- [ ] Implement MetricsLayoutWrapper:
  - Determine which tabs to show based on availability flags
  - Handle case where only audio metrics exist (most common)
  - Render sections in order: Engagement → Communication → Student Response → Visual → Technical
  - Use Card component for section container
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx`:
  - Add MetricsSection component below DataAvailabilityBadges
  - Pass session data and metrics to component
  - Add placeholder panels for each metric type (will populate in Phase 2)

**What to Test:**
1. Build project - verify Tabs component works
2. Render page with session that has only audio metrics - verify only 3 tabs show (Engagement, Communication, Student Response)
3. Render page with session that has all metrics - verify all 5 tabs show
4. Test tab navigation - clicking tabs should switch content
5. Verify unavailable tabs are disabled/grayed out with explanatory text
6. Test responsive behavior - ensure layout works on mobile (consider accordion view on small screens)

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/metrics-section.tsx` - Tabbed metrics container
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/metrics-layout-wrapper.tsx` - Layout logic for metric availability
- `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx` - Add metrics section

**Notes:**
- Consider using Accordion for mobile view (< md breakpoint) for better UX
- Keep tab bar sticky on scroll for easy navigation on desktop
- Default to "Engagement" tab when page loads
- Ensure disabled tabs have clear visual indication and tooltip/text explaining why

---

## Phase 2: Metrics Display Panels

**Estimated Time:** 4-5 hours

This phase builds the individual metric display panels for each category with proper formatting and context labels.

### PR 2.1: Engagement & Communication Metrics Panels

**Goal:** Build the Engagement and Communication tabs with all relevant metrics

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/metrics.ts` (audio metrics fields)
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/metric-card.tsx` (MetricCard component)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 138-148 for exact metrics to display)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/engagement-panel.tsx`
- [ ] Implement EngagementPanel component:
  - Accept session audio metrics as props
  - Display Student Engagement Score (0-10) with visual progress bar and ScoreBadge
  - Display Student Talk Ratio as percentage with horizontal bar visualization (e.g., "42%" with colored bar)
  - Display Tutor Talk Ratio as percentage with horizontal bar (complementary color)
  - Display Understanding Checks Count with context label:
    - Count >= 10: "Excellent" (green)
    - Count 5-9: "Good" (default)
    - Count < 5: "Needs Improvement" (yellow/warning)
  - Use MetricCard components for each metric
  - Grid layout: 2 columns on desktop, 1 column on mobile
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/communication-panel.tsx`
- [ ] Implement CommunicationPanel component:
  - Accept session audio metrics as props
  - Display Tutor Enthusiasm Score (0-10) with ScoreBadge
  - Display Positive Reinforcement Count with icon (Heart or ThumbsUp)
  - Display Question Quality Breakdown:
    - Open-ended questions count
    - Closed-ended questions count
    - Rhetorical questions count
    - Calculate and show percentage of open-ended (open / total * 100)
    - Context label: >= 60% open-ended is "Excellent" (green), 40-59% is "Good", < 40% is "Consider more open-ended questions" (yellow)
  - Use MetricCard components with appropriate icons from lucide-react
  - Grid layout matching engagement panel
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/components/sessions/metrics-section.tsx`:
  - Import EngagementPanel and CommunicationPanel
  - Render EngagementPanel in "Engagement" tab content
  - Render CommunicationPanel in "Communication" tab content
  - Pass appropriate audio metrics data to each panel

**What to Test:**
1. Build project - verify no TypeScript errors
2. Navigate to session detail page - verify Engagement tab shows all 4 metrics correctly
3. Switch to Communication tab - verify all metrics display with proper formatting
4. Test with session where understanding_checks_count < 5 - verify "Needs Improvement" label shows
5. Test question breakdown calculation - verify percentage is accurate
6. Verify visual bars for talk ratios render correctly and are distinguishable
7. Test responsive layout - verify 2-column desktop, 1-column mobile

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/engagement-panel.tsx` - Engagement metrics display
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/communication-panel.tsx` - Communication metrics display
- `/Users/mike/gauntlet/tutor-dashboard/components/sessions/metrics-section.tsx` - Wire up panels to tabs

**Notes:**
- Use Progress component from shadcn/ui for visual bars (install if not present: `npx shadcn@latest add progress`)
- Talk ratios should be displayed as complementary bars (tutor + student should visually add to ~100%)
- Ensure all metrics handle null/undefined values gracefully (show "N/A" if missing)
- Icons should be semantically appropriate: MessageSquare for talk ratio, HelpCircle for questions, Smile for enthusiasm

---

### PR 2.2: Student Response & Optional Metrics Panels

**Goal:** Build Student Response panel and conditional Visual/Technical panels

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/metrics.ts` (all metrics schemas)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 149-166 for metric specifications)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/student-response-panel.tsx`
- [ ] Implement StudentResponsePanel component:
  - Accept session audio metrics as props
  - Display Avg Response Delay (seconds) with context:
    - < 3s: "Great" (green)
    - 3-5s: "Good" (default)
    - > 5s: "Consider pacing" (yellow)
  - Display Frustration Signals Count with severity indicator:
    - 0-1: Low severity (green)
    - 2-3: Medium severity (yellow)
    - 4+: High severity (red)
  - Display Student Initiated Questions count with icon (MessageCircle)
  - Display Pause Analysis:
    - Productive silence ratio (percentage)
    - Awkward pause ratio (percentage)
    - Visual comparison bars
    - Note: "Productive silence is healthy for thinking time"
  - Grid layout matching other panels
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/visual-engagement-panel.tsx`
- [ ] Implement VisualEngagementPanel component (only renders if has_video_analysis):
  - Accept session video metrics as props
  - Display On-Screen Attention Percentage with progress bar
  - Display Visual Engagement Score (0-10) with ScoreBadge
  - Display Note-Taking Duration (minutes) with icon (FileText)
  - Display Distraction Events count with severity:
    - 0-2: "Focused" (green)
    - 3-5: "Some distractions" (yellow)
    - 6+: "Frequently distracted" (red)
  - If tutor_uses_visual_aids is true, show positive badge "Visual aids used" (green)
  - Grid layout
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/technical-environment-panel.tsx`
- [ ] Implement TechnicalEnvironmentPanel component (only renders if has_screen_monitoring):
  - Accept session screen metrics as props
  - Display Active Tab Focus Percentage with progress bar
  - Display Whiteboard Usage Duration (minutes) with icon (PenTool)
  - Display Tab Switch Count with context:
    - < 10: "Focused" (green)
    - 10-20: "Moderate" (default)
    - > 20: "Highly distracted" (yellow)
  - Display Off-task Application Usage:
    - messaging_app_detected: Show warning badge "Messaging detected" (yellow)
    - gaming_detected: Show warning badge "Gaming detected" (red)
    - If both false: Show success badge "No off-task apps" (green)
  - Grid layout
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/components/sessions/metrics-section.tsx`:
  - Import all three new panels
  - Render StudentResponsePanel in "Student Response" tab
  - Conditionally render VisualEngagementPanel in "Visual" tab (only if session.has_video_analysis)
  - Conditionally render TechnicalEnvironmentPanel in "Technical" tab (only if session.has_screen_monitoring)
  - For unavailable tabs, show placeholder message: "This analysis type was not available for this session"

**What to Test:**
1. Build project - verify no compilation errors
2. Test Student Response panel - verify all metrics display correctly
3. Test response delay context labels - verify "Great" shows for < 3s
4. Test frustration count severity - verify color coding works
5. Test with session that has video metrics - verify Visual panel renders
6. Test with session without video metrics - verify Visual tab is disabled with message
7. Test with session that has screen monitoring - verify Technical panel renders
8. Test off-task app detection - verify warning badges show correctly
9. Verify all panels are responsive and match layout of other panels

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/student-response-panel.tsx` - Student response metrics
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/visual-engagement-panel.tsx` - Video analysis metrics (conditional)
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/technical-environment-panel.tsx` - Screen monitoring metrics (conditional)
- `/Users/mike/gauntlet/tutor-dashboard/components/sessions/metrics-section.tsx` - Wire up all panels

**Notes:**
- Ensure conditional rendering checks session flags before rendering panels
- Use AlertCircle icon for warnings/concerns
- Pause analysis visualization should clearly distinguish productive vs awkward pauses
- All duration fields should be formatted as "X min" or "X.X min" for sub-minute values
- Handle edge cases: if video_metrics object exists but fields are null, show "N/A"

---

## Phase 3: AI Analysis & Transcript Highlights

**Estimated Time:** 2-3 hours

This phase adds the AI analysis summary section and transcript highlights display.

### PR 3.1: AI Analysis Summary Section

**Goal:** Display AI-generated summary with "What Went Well" and "Growth Opportunities" sections

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/sessions.ts` (ai_summary field)
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/card.tsx` (Card component)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 167-172 for AI summary structure)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/ai-analysis-section.tsx`
- [ ] Implement AIAnalysisSection component:
  - Accept session.ai_summary (text) as props
  - If ai_summary is null, show message "AI analysis not yet available for this session"
  - Parse ai_summary text to extract structured sections (assumes format with "What Went Well:" and "Growth Opportunities:" headers)
  - Display natural language summary paragraph at top
  - "What Went Well" section with CheckCircle icons (green) for each bullet point
  - "Growth Opportunities" section with Lightbulb icons (yellow) for each bullet point
  - Optional: "Key Moments" section with Clock icons for timestamped callouts (if included in summary)
  - Use Card component for container with prominent header "AI Analysis"
- [ ] Create helper function `parseAISummary(summaryText: string)`:
  - Extract summary intro paragraph (first paragraph before "What Went Well")
  - Extract "What Went Well" bullets (lines after that header, before "Growth Opportunities")
  - Extract "Growth Opportunities" bullets (lines after that header)
  - Return structured object: { summary: string, strengths: string[], growthAreas: string[], keyMoments?: { timestamp: string, description: string }[] }
  - Handle various formatting variations gracefully
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx`:
  - Add AIAnalysisSection component below MetricsSection
  - Pass session.ai_summary to component
  - Ensure full-width layout (not in tabs)

**What to Test:**
1. Build project - verify no compilation errors
2. Navigate to session with ai_summary - verify summary displays correctly
3. Test parsing - verify "What Went Well" and "Growth Opportunities" sections separate correctly
4. Test with null ai_summary - verify fallback message shows
5. Verify icons display correctly (CheckCircle for strengths, Lightbulb for growth areas)
6. Verify section is visually distinct from metrics tabs (standalone Card)
7. Test with various ai_summary formats - ensure parsing doesn't crash on edge cases

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/ai-analysis-section.tsx` - AI analysis summary display
- `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx` - Add AI analysis section

**Notes:**
- ai_summary format may vary; parsing should be defensive with fallbacks
- If parsing fails, display entire ai_summary as plain text rather than crashing
- Consider using Separator component from shadcn/ui between sections
- Bullet points should be actual list elements (<ul>/<li>) for accessibility
- Growth opportunities should be framed constructively, not negatively

---

### PR 3.2: Transcript Highlights Display

**Goal:** Show key moments from session transcript with timestamps and highlight types

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/metrics.ts` (session_transcript_highlights table)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts` (HighlightType, TranscriptSpeaker enums)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 173-178 for highlight requirements)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/transcript-highlights-section.tsx`
- [ ] Implement TranscriptHighlightsSection component:
  - Accept transcript_highlights array as props (from session data)
  - If array is empty, show message "No transcript highlights available for this session"
  - Display 3-5 highlights (limit to top 5 if more exist)
  - Each highlight card shows:
    - Timestamp formatted as "MM:SS" (convert timestamp_seconds to minutes:seconds)
    - Speaker badge (Tutor or Student) with distinct colors
    - Text snippet (the actual transcript text)
    - Highlight type badge with icon:
      - strong_question: HelpCircle icon (blue)
      - breakthrough: Lightbulb icon (green)
      - confusion: AlertCircle icon (yellow)
      - positive_reinforcement: Heart icon (green)
      - concern: AlertTriangle icon (red)
      - concept_explanation: BookOpen icon (blue)
  - Use Card component for each highlight (or list items in single Card)
  - Note at bottom: "View Full Transcript" (not implemented in MVP, gray out or remove link)
- [ ] Create helper function `formatTimestamp(seconds: number): string`:
  - Convert seconds to "MM:SS" format
  - Handle edge cases (negative, null, very large numbers)
- [ ] Create helper function `getHighlightIcon(type: HighlightTypeType)`:
  - Return appropriate lucide-react icon component for each type
  - Map highlight types to icons with consistent styling
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx`:
  - Add TranscriptHighlightsSection below AIAnalysisSection
  - Pass session.transcript_highlights to component
  - Ensure data is sorted by timestamp_seconds (ascending) before passing

**What to Test:**
1. Build project - verify no compilation errors
2. Navigate to session with transcript highlights - verify all highlights display
3. Verify timestamp formatting: 125 seconds should show as "02:05"
4. Test speaker badges - verify Tutor and Student have distinct colors
5. Verify highlight type badges render with correct icons
6. Test with empty highlights array - verify fallback message shows
7. Verify highlights are ordered chronologically
8. Test responsive layout - ensure cards are readable on mobile

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/transcript-highlights-section.tsx` - Transcript highlights display
- `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx` - Add transcript highlights section

**Notes:**
- Speaker badges should use Badge component with variants (e.g., "default" for tutor, "secondary" for student)
- Highlight type colors should be semantically meaningful (green for positive, red for concerns)
- Text snippets may be long; consider truncating with "Read more" if > 200 characters
- Timestamps should be clickable in future (link to video player), but not functional in MVP
- Limit display to 5 highlights; if more exist, note "Showing 5 of X highlights"

---

## Phase 4: Student Feedback & Session Outcomes

**Estimated Time:** 2-3 hours

This phase adds student feedback display and session outcomes (homework, follow-up booking).

### PR 4.1: Student Feedback Section

**Goal:** Display student satisfaction rating, feedback tags, and freeform text

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/metrics.ts` (session_feedback, session_feedback_tags tables)
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/types.ts` (FeedbackTag enum)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 179-184 for feedback requirements)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/student-feedback-section.tsx`
- [ ] Implement StudentFeedbackSection component:
  - Accept session_feedback and feedback_tags as props (both optional)
  - If feedback is null, show prominent message "Student has not yet submitted feedback for this session" with info icon
  - If feedback exists, display:
    - Star rating (1-5 stars) - use filled stars for rating, outline stars for remainder
    - Feedback tags as colored badges:
      - Positive tags (clear_explanations, patient, encouraging, helpful_examples, good_pace, made_learning_fun): Green/success variant
      - Negative tags (too_fast, too_slow, didnt_check_understanding, too_much_talking, confusing_examples, technical_issues): Yellow/warning variant
    - Freeform text response (if provided) in quote-style block with user icon
    - Submission timestamp formatted as "Submitted [relative time]" (e.g., "Submitted 2 hours ago") using date-fns
  - Use Card component for container with header "Student Feedback"
- [ ] Install shadcn/ui Avatar component if not present (for user icon): `npx shadcn@latest add avatar`
- [ ] Create helper function `getTagVariant(tag: FeedbackTagType): "success" | "warning"`:
  - Return "success" for positive tags, "warning" for negative tags
  - Maintain consistent mapping
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx`:
  - Add StudentFeedbackSection below TranscriptHighlightsSection
  - Pass session.feedback and session.feedback_tags to component
  - Ensure proper null handling

**What to Test:**
1. Build project - verify no compilation errors
2. Test with session that has feedback - verify all elements render correctly
3. Test star rating display - 3-star rating should show 3 filled, 2 outline stars
4. Test feedback tags - verify positive tags are green, negative tags are yellow
5. Test with session without feedback - verify "not yet submitted" message shows
6. Test freeform text display - verify proper formatting and readability
7. Verify timestamp relative formatting (use formatDistanceToNow from date-fns)
8. Test responsive layout - ensure readable on mobile

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/student-feedback-section.tsx` - Student feedback display
- `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx` - Add feedback section

**Notes:**
- Use Star icon from lucide-react for rating display (filled vs outline)
- Feedback text should be in quotation block with subtle border/background
- Consider max-height for very long feedback text with "Read more" expansion
- Tags should wrap properly on small screens
- "Not yet submitted" state should be informative, not alarming (use neutral color)

---

### PR 4.2: Session Outcomes Section

**Goal:** Display homework assignment status and follow-up booking information

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/lib/db/schema/sessions.ts` (homework_assigned, follow_up_booked fields)
- `/Users/mike/gauntlet/tutor-dashboard/docs/project_overview.md` (lines 185-189 for session outcomes)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/session-outcomes-section.tsx`
- [ ] Implement SessionOutcomesSection component:
  - Accept homework_assigned (boolean), follow_up_booked (boolean), and optionally follow_up_session_id as props
  - Display as two-column grid on desktop, stacked on mobile
  - Homework Assignment status:
    - If homework_assigned is true: CheckCircle icon (green) + "Homework assigned"
    - If false: XCircle icon (gray) + "No homework assigned"
  - Follow-up Booking status:
    - If follow_up_booked is true: CheckCircle icon (green) + "Follow-up session booked"
    - If follow_up_session_id exists, show link: "View next session →" (links to `/sessions/[follow_up_session_id]`)
    - If false: XCircle icon (gray) + "No follow-up booked yet"
  - Use Card component for container with header "Session Outcomes"
- [ ] Add query to `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts`:
  - Update getSessionById to include follow-up session lookup
  - Find session where tutor_id + student_id match and session_number is current + 1
  - Return follow_up_session_id if exists (otherwise null)
  - Update SessionWithMetrics type to include follow_up_session_id?: string | null
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx`:
  - Add SessionOutcomesSection at bottom of page (after feedback)
  - Pass homework_assigned, follow_up_booked, and follow_up_session_id
  - Ensure proper styling/spacing

**What to Test:**
1. Build project - verify no compilation errors
2. Test with session where homework_assigned is true - verify green checkmark shows
3. Test with session where follow_up_booked is true - verify booking status shows
4. Test follow-up session link - verify clicking navigates to correct session detail page
5. Test with session that has no follow-up - verify appropriate message shows
6. Verify two-column layout on desktop, stacked on mobile
7. Test edge cases: homework true but follow-up false, and vice versa

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/session-outcomes-section.tsx` - Session outcomes display
- `/Users/mike/gauntlet/tutor-dashboard/services/session-service.ts` - Add follow-up session lookup to getSessionById
- `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx` - Add outcomes section

**Notes:**
- Follow-up session link should use Next.js Link component for client-side navigation
- Icons should be sized consistently (h-5 w-5 standard)
- Consider adding date/time of follow-up session if available (show scheduled_start)
- Outcomes section should be concise - focus on yes/no status, not detailed explanations
- Use neutral colors for "no" states, not negative/red (they're not failures, just absence)

---

## Phase 5: Polish & Error Handling

**Estimated Time:** 2 hours

This phase adds final polish, comprehensive error handling, and responsive design improvements.

### PR 5.1: Error States & Loading States

**Goal:** Implement comprehensive error handling and loading states

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx` (main page file)

**Tasks:**
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/session-not-found.tsx`
- [ ] Implement SessionNotFound component:
  - Display prominent "Session Not Found" message with AlertCircle icon
  - Show session ID that was requested
  - Provide link back to dashboard
  - Suggest possible reasons (deleted, invalid ID, no access)
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/session-incomplete.tsx`
- [ ] Implement SessionIncomplete component:
  - Display message for sessions that aren't completed (status != 'completed')
  - Show current status badge (scheduled, in_progress, cancelled, etc.)
  - Explain that detailed metrics are only available after session completion
  - Show limited info: scheduled time, tutor, student, subject
  - Provide link back to dashboard
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/loading.tsx`
- [ ] Implement loading.tsx:
  - Create skeleton loaders for all major sections
  - Use Skeleton component from shadcn/ui (install if not present: `npx shadcn@latest add skeleton`)
  - Match layout of actual page: header skeleton, tabs skeleton, cards skeleton
- [ ] Update `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx`:
  - Add try-catch around data fetching
  - Return SessionNotFound if session is null
  - Return SessionIncomplete if session.status !== 'completed'
  - Handle errors from service layer gracefully
  - Log errors for debugging but show user-friendly messages

**What to Test:**
1. Build project - verify no compilation errors
2. Navigate to `/sessions/invalid-id-12345` - verify SessionNotFound component renders
3. Navigate to session with status='scheduled' - verify SessionIncomplete component renders
4. Test loading state - verify skeletons display briefly during fetch (may need to throttle network)
5. Verify error boundaries don't crash entire app
6. Test link navigation from error states - verify back to dashboard works
7. Test with database connection issues - verify error handling is graceful

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/session-not-found.tsx` - 404-style error state
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/session-incomplete.tsx` - Incomplete session state
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/loading.tsx` - Loading skeletons
- `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx` - Enhanced error handling

**Notes:**
- Skeleton loaders should match the actual content layout for smooth transition
- Error messages should be helpful, not technical (avoid showing raw error messages)
- SessionIncomplete should still show basic session info (scheduled time, participants)
- Consider adding "Refresh" button to loading/error states
- Ensure loading state doesn't flash too quickly (minimum display time consideration)

---

### PR 5.2: Responsive Design & Accessibility

**Goal:** Ensure page is fully responsive and accessible

**Read these files first:**
- All session component files created in previous PRs
- `/Users/mike/gauntlet/tutor-dashboard/components/ui/card.tsx` (responsive patterns)

**Tasks:**
- [ ] Audit all session components for responsive design:
  - Update SessionHeader for mobile stacking (date/time, participants, score stacked vertically)
  - Ensure metrics panels use responsive grid (2-col desktop → 1-col mobile)
  - Verify tabs switch to accordion on mobile if using Tabs (or ensure horizontal scroll works well)
  - Test data availability badges wrap properly on small screens
  - Verify transcript highlights are readable on mobile
  - Ensure feedback tags wrap properly and don't overflow
- [ ] Accessibility improvements:
  - Add proper ARIA labels to all interactive elements (tabs, links, buttons)
  - Ensure score badges have accessible text (not just color coding)
  - Add alt text or aria-label to all icons
  - Verify keyboard navigation works for tabs
  - Test with screen reader (at least basic VoiceOver/NVDA test)
  - Ensure sufficient color contrast on all badges/labels
- [ ] Performance optimizations:
  - Ensure images (if any) are optimized
  - Verify no unnecessary re-renders (use React DevTools)
  - Check for any client-side fetching that should be server-side
  - Ensure components are properly memoized if needed
- [ ] Documentation:
  - Add JSDoc comments to all component props interfaces
  - Document any complex helper functions
  - Add usage examples in component files

**What to Test:**
1. Test on multiple device sizes: mobile (375px), tablet (768px), desktop (1280px+)
2. Verify all text is readable at all sizes
3. Test touch interactions on mobile (tab switching, link clicking)
4. Run Lighthouse accessibility audit - aim for 90+ score
5. Test keyboard navigation - all interactive elements should be reachable via Tab key
6. Test with browser zoom at 200% - verify layout doesn't break
7. Verify color contrast meets WCAG AA standards (use browser dev tools)
8. Test with screen reader - verify all content is announced properly

**Files Changed:**
- ALL session component files: responsive and accessibility improvements
- `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx` - responsive layout tweaks

**Notes:**
- Mobile-first approach: start with mobile styles, add desktop enhancements with md: prefixes
- Avoid horizontal scroll on mobile (except for intentional carousel/tabs)
- Ensure tap targets are at least 44x44px for touch interfaces
- Use semantic HTML elements (nav, article, section, aside) for better accessibility
- Don't rely solely on color to convey information (use icons + text labels)
- Test with actual devices if possible, not just browser dev tools

---

## Phase 6: Integration & Navigation

**Estimated Time:** 1-2 hours

This phase connects the session detail page to other parts of the application and ensures proper navigation flows.

### PR 6.1: Cross-Page Navigation & Links

**Goal:** Integrate session detail page with admin dashboard and tutor detail pages

**Read these files first:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` (dashboard structure)
- Any existing tutor detail page files (if Phase 4.3 is started)

**Tasks:**
- [ ] Update admin dashboard (`/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx`):
  - If recent sessions feed exists, ensure session cards link to `/sessions/[sessionId]`
  - If not yet built, add TODO comment for future integration
- [ ] Add breadcrumb navigation to session detail page:
  - Install shadcn/ui Breadcrumb component if not present: `npx shadcn@latest add breadcrumb`
  - Create breadcrumb: Home > Sessions > [Session Date/ID]
  - Update `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx`
  - Place breadcrumb above SessionHeader component
- [ ] Create NEW: `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/page.tsx` (Sessions list page):
  - Basic page listing recent sessions (simplified view)
  - Use DataTable component to display sessions
  - Columns: Date/Time, Tutor, Student ID, Subject, Score, Status
  - Each row clickable to navigate to session detail
  - Pagination or "Load more" functionality
  - Filters: Date range, Status (completed/all)
  - This provides parent page for sessions breadcrumb
- [ ] Update SessionHeader component:
  - Ensure tutor name link points to `/tutors/[tutorId]`
  - Add return link: "← Back to Sessions" or "← Back to Dashboard" depending on referrer
- [ ] Add metadata to session detail page:
  - Set page title: "[Tutor Name] - Session on [Date] | TutorReview"
  - Add meta description for better navigation/bookmarking

**What to Test:**
1. Navigate from dashboard to session detail - verify link works
2. Navigate from session detail back to dashboard - verify return link works
3. Navigate to sessions list page (/sessions) - verify table displays
4. Click session row in list - verify detail page loads correctly
5. Verify breadcrumb links work (clicking "Home" or "Sessions")
6. Verify page title appears correctly in browser tab
7. Test browser back button - ensure navigation history works properly
8. Bookmark a session detail page and reopen - verify it loads correctly

**Files Changed:**
- `/Users/mike/gauntlet/tutor-dashboard/app/dashboard/page.tsx` - Add session links (if recent sessions feed exists)
- `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/[sessionId]/page.tsx` - Add breadcrumb, metadata
- NEW: `/Users/mike/gauntlet/tutor-dashboard/app/(dashboard)/sessions/page.tsx` - Sessions list page
- `/Users/mike/gauntlet/tutor-dashboard/components/sessions/session-header.tsx` - Add return link

**Notes:**
- Sessions list page can be simplified for MVP - full featured table not required
- Breadcrumbs should reflect actual navigation structure
- Consider adding Open Graph meta tags for better link sharing
- Ensure all links use Next.js Link component for client-side navigation
- Page title should be dynamic based on session data

---

### PR 6.2: Final Testing & Documentation

**Goal:** Comprehensive end-to-end testing and documentation

**Read these files first:**
- All files created in Phase 4.4

**Tasks:**
- [ ] Create test scenarios document:
  - Document at least 10 user scenarios for session detail page
  - Include edge cases: no video, no feedback, technical issues, etc.
  - Create checklist for manual QA testing
- [ ] End-to-end testing:
  - Test complete flow: Dashboard → Session List → Session Detail → Back
  - Test with different session types (complete, incomplete, with/without video)
  - Test with different user roles (admin only for MVP)
  - Verify all links and navigation work correctly
  - Test error scenarios: invalid session ID, network issues
- [ ] Performance testing:
  - Measure page load time (should be < 2 seconds)
  - Verify no unnecessary re-renders
  - Check bundle size impact
  - Test with slower network (3G throttling)
- [ ] Create component documentation:
  - Document all session components in Storybook or similar (optional but recommended)
  - Add README.md in `/Users/mike/gauntlet/tutor-dashboard/components/sessions/` with component overview
  - Document props, usage examples, and gotchas
- [ ] Update project documentation:
  - Mark Phase 4.4 as complete in `/Users/mike/gauntlet/tutor-dashboard/docs/general_project_plan.md`
  - Add session detail page to feature list
  - Document any deviations from original plan
- [ ] Code review prep:
  - Review all code for consistency with project patterns
  - Ensure TypeScript strict mode compliance
  - Verify error handling is comprehensive
  - Check for any TODO comments and address or document them

**What to Test:**
1. Run full test suite (if tests exist)
2. Manual QA: Test all scenarios in test scenarios document
3. Performance: Measure with Lighthouse (aim for 90+ performance score)
4. Accessibility: Run axe DevTools scan (aim for 0 violations)
5. Cross-browser: Test in Chrome, Firefox, Safari, Edge
6. Mobile: Test on actual mobile devices (iOS and Android if possible)
7. Load testing: Verify page handles multiple rapid navigations without issues
8. Security: Verify session data is properly protected (no leaking sensitive info)

**Files Changed:**
- NEW: `/Users/mike/gauntlet/tutor-dashboard/components/sessions/README.md` - Component documentation
- NEW: `/Users/mike/gauntlet/tutor-dashboard/docs/testing/session-detail-test-scenarios.md` - Test scenarios
- `/Users/mike/gauntlet/tutor-dashboard/docs/general_project_plan.md` - Mark phase complete

**Notes:**
- This PR is about validation, not new features
- Document any known issues or limitations
- Create GitHub issues for any post-MVP enhancements identified during testing
- Ensure all components are properly exported and importable
- Consider adding E2E tests with Playwright or Cypress (optional for MVP)

---

## Success Criteria

Phase 4.4 is complete when:

- [x] Session detail page is accessible at `/sessions/[sessionId]` with proper auth protection
- [x] All 6 main sections render correctly: Overview Header, Key Metrics (with tabs), AI Analysis, Transcript Highlights, Student Feedback, Session Outcomes
- [x] Data availability indicators clearly show which analysis types are available
- [x] Page handles missing data gracefully (no crashes, shows appropriate messages)
- [x] All metrics display with proper formatting, context labels, and color coding
- [x] Navigation works seamlessly: breadcrumbs, back links, tutor links, follow-up session links
- [x] Page is fully responsive and accessible (responsive design implemented)
- [x] Error states are handled properly (not found, incomplete, network errors)
- [x] Loading states provide good UX with skeleton loaders
- [x] Code follows project patterns and is well-documented

**Implementation Status:** All PRs 1.1-5.1 completed successfully. Phase 4.4 Session Detail Page is fully functional.

---

## Dependencies

**Required before starting:**
- Phase 4.1: Platform Metrics & Data Layer (COMPLETE) - provides session-service.ts
- Phase 3: Reusable Components (COMPLETE) - provides UI components

**Optional future enhancements** (not in MVP scope):
- Full transcript viewer (currently just highlights)
- Video playback integration (timestamp links)
- Session editing/updating capability
- Export session report as PDF
- Session comparison tool
- Admin notes/annotations on sessions

---

## Estimated Total Time: 17-20 hours

**Breakdown:**
- Phase 1 (Structure & Header): 3-4 hours
- Phase 2 (Metrics Panels): 4-5 hours
- Phase 3 (AI & Transcript): 2-3 hours
- Phase 4 (Feedback & Outcomes): 2-3 hours
- Phase 5 (Polish & Errors): 2 hours
- Phase 6 (Integration & Testing): 3-4 hours
