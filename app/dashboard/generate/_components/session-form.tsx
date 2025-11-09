'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTutors,
  getStudents,
  getCommonSubjects,
  getTutorSubjects,
  getSessionCount,
  getSessionPairings,
  createSession,
  addSubjectToStudent
} from '../actions';
import { AudioMetricsForm, type AudioMetricsData } from './metrics/audio-metrics-form';
import { VideoMetricsForm, type VideoMetricsData } from './metrics/video-metrics-form';
import { ScreenMetricsForm, type ScreenMetricsData } from './metrics/screen-metrics-form';
import { FeedbackForm, type FeedbackData } from './metrics/feedback-form';

type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'no_show_tutor' | 'no_show_student' | 'cancelled' | 'rescheduled';
type ScheduledDuration = 30 | 45 | 60 | 90;

interface SessionFormData {
  tutorId: string;
  studentId: string;
  scheduledStart: string;
  scheduledDuration: ScheduledDuration;
  subjectId: string;
  status: SessionStatus;
}

interface Subject {
  id: string;
  name: string;
  category: string;
}

interface Tutor {
  id: string;
  name: string;
  sessionCount: number;
  subjects: Subject[];
  sharedSessionCount?: number;
}

interface Student {
  id: string;
  name: string;
  gradeLevel: string | null;
  sessionCount: number;
  subjects: Subject[];
  sharedSessionCount?: number;
}

interface SessionPairing {
  tutor_id: string;
  student_id: string;
  session_count: number;
}

type TemplateType = 'good' | 'poor' | 'no_show' | 'technical' | 'first_success';

interface TemplateMetrics {
  audio: Partial<AudioMetricsData>;
  video?: Partial<VideoMetricsData>;
  screen?: Partial<ScreenMetricsData>;
  feedback?: Partial<FeedbackData>;
}

interface ScenarioTemplate {
  name: string;
  description: string;
  status: SessionStatus;
  duration: ScheduledDuration;
  metrics?: TemplateMetrics;
}

const SCENARIO_TEMPLATES: Record<TemplateType, ScenarioTemplate> = {
  good: {
    name: 'Good Session',
    description: 'High engagement, no issues, follow-up booked',
    status: 'completed' as SessionStatus,
    duration: 60 as ScheduledDuration,
    metrics: {
      audio: {
        tutorTalkRatio: 0.38,
        studentTalkRatio: 0.50,
        productiveSilenceRatio: 0.10,
        awkwardPauseRatio: 0.02,
        studentEngagementScore: 8.5,
        tutorEnthusiasmScore: 8.5,
        studentInitiatedQuestions: 8,
        tutorChecksUnderstandingCount: 12,
        tutorPositiveReinforcementCount: 10,
        avgStudentResponseDelay: 2.0,
        longPausesCount: 1,
        studentFrustrationCount: 0,
        studentConfusionCount: 1,
        positiveMomentsCount: 8,
        conceptReExplanationCount: 1,
        openEndedQuestions: 14,
        closedEndedQuestions: 6,
        rhetoricalQuestions: 3,
      },
      video: {
        studentOnScreenAttentionPct: 0.88,
        studentVisualEngagementScore: 8.5,
        distractionEventsCount: 1,
        confusionMomentsCount: 1,
        tutorUsesVisualAids: true,
        studentTakingNotesDuration: 22,
      },
      screen: {
        activeTabFocusPct: 0.92,
        tabSwitchesCount: 3,
        whiteboardUsageMinutes: 25,
        messagingAppDetected: false,
        gamingDetected: false,
      },
      feedback: {
        studentSatisfactionRating: 5,
        feedbackText: 'Excellent session! My tutor explained everything clearly and made sure I understood before moving on. I feel much more confident now.',
        tags: ['clear_explanations', 'patient', 'helpful_examples', 'encouraging'],
      },
    },
  },
  poor: {
    name: 'Poor Session',
    description: 'Low engagement, frustration, no follow-up',
    status: 'completed' as SessionStatus,
    duration: 60 as ScheduledDuration,
    metrics: {
      audio: {
        tutorTalkRatio: 0.78,
        studentTalkRatio: 0.12,
        productiveSilenceRatio: 0.01,
        awkwardPauseRatio: 0.09,
        studentEngagementScore: 3.5,
        tutorEnthusiasmScore: 4.0,
        studentInitiatedQuestions: 1,
        tutorChecksUnderstandingCount: 2,
        tutorPositiveReinforcementCount: 1,
        avgStudentResponseDelay: 6.5,
        longPausesCount: 6,
        studentFrustrationCount: 4,
        studentConfusionCount: 5,
        positiveMomentsCount: 2,
        conceptReExplanationCount: 2,
        openEndedQuestions: 4,
        closedEndedQuestions: 14,
        rhetoricalQuestions: 2,
      },
      video: {
        studentOnScreenAttentionPct: 0.52,
        studentVisualEngagementScore: 3.5,
        distractionEventsCount: 8,
        confusionMomentsCount: 6,
        tutorUsesVisualAids: false,
        studentTakingNotesDuration: 3,
      },
      screen: {
        activeTabFocusPct: 0.65,
        tabSwitchesCount: 15,
        whiteboardUsageMinutes: 5,
        messagingAppDetected: true,
        gamingDetected: false,
      },
      feedback: {
        studentSatisfactionRating: 2,
        feedbackText: 'The session was confusing. My tutor talked too much and didn\'t really check if I understood. I felt lost.',
        tags: ['too_fast', 'too_much_talking', 'didnt_check_understanding', 'confusing_examples'],
      },
    },
  },
  no_show: {
    name: 'No Show',
    description: 'Student or tutor didn\'t attend',
    status: 'no_show_student' as SessionStatus,
    duration: 60 as ScheduledDuration,
    // No metrics for no-show sessions
  },
  technical: {
    name: 'Technical Issues',
    description: 'Connection problems, reduced duration',
    status: 'completed' as SessionStatus,
    duration: 45 as ScheduledDuration,
    metrics: {
      audio: {
        tutorTalkRatio: 0.42,
        studentTalkRatio: 0.33,
        productiveSilenceRatio: 0.07,
        awkwardPauseRatio: 0.18,
        studentEngagementScore: 5.5,
        tutorEnthusiasmScore: 6.0,
        studentInitiatedQuestions: 3,
        tutorChecksUnderstandingCount: 5,
        tutorPositiveReinforcementCount: 4,
        avgStudentResponseDelay: 4.0,
        longPausesCount: 7,
        studentFrustrationCount: 3,
        studentConfusionCount: 2,
        positiveMomentsCount: 3,
        conceptReExplanationCount: 1,
        openEndedQuestions: 8,
        closedEndedQuestions: 8,
        rhetoricalQuestions: 2,
      },
      video: {
        studentOnScreenAttentionPct: 0.70,
        studentVisualEngagementScore: 5.5,
        distractionEventsCount: 5,
        confusionMomentsCount: 3,
        tutorUsesVisualAids: true,
        studentTakingNotesDuration: 8,
      },
      screen: {
        activeTabFocusPct: 0.75,
        tabSwitchesCount: 10,
        whiteboardUsageMinutes: 12,
        messagingAppDetected: false,
        gamingDetected: false,
      },
      feedback: {
        studentSatisfactionRating: 3,
        feedbackText: 'We had a lot of connection problems which made it hard to focus. The content was okay when we could hear each other.',
        tags: ['technical_issues'],
      },
    },
  },
  first_success: {
    name: 'First Session Success',
    description: 'Strong first impression metrics',
    status: 'completed' as SessionStatus,
    duration: 60 as ScheduledDuration,
    metrics: {
      audio: {
        tutorTalkRatio: 0.43,
        studentTalkRatio: 0.44,
        productiveSilenceRatio: 0.11,
        awkwardPauseRatio: 0.02,
        studentEngagementScore: 8.0,
        tutorEnthusiasmScore: 9.0,
        studentInitiatedQuestions: 6,
        tutorChecksUnderstandingCount: 10,
        tutorPositiveReinforcementCount: 12,
        avgStudentResponseDelay: 2.5,
        longPausesCount: 1,
        studentFrustrationCount: 0,
        studentConfusionCount: 1,
        positiveMomentsCount: 9,
        conceptReExplanationCount: 1,
        openEndedQuestions: 15,
        closedEndedQuestions: 7,
        rhetoricalQuestions: 3,
      },
      video: {
        studentOnScreenAttentionPct: 0.85,
        studentVisualEngagementScore: 8.0,
        distractionEventsCount: 2,
        confusionMomentsCount: 1,
        tutorUsesVisualAids: true,
        studentTakingNotesDuration: 18,
      },
      screen: {
        activeTabFocusPct: 0.90,
        tabSwitchesCount: 4,
        whiteboardUsageMinutes: 22,
        messagingAppDetected: false,
        gamingDetected: false,
      },
      feedback: {
        studentSatisfactionRating: 5,
        feedbackText: 'Great first session! My tutor was welcoming, patient, and really took the time to understand what I needed help with. Looking forward to our next session!',
        tags: ['clear_explanations', 'patient', 'encouraging', 'made_learning_fun'],
      },
    },
  },
};

export function SessionForm() {
  const [formData, setFormData] = useState<SessionFormData>({
    tutorId: '',
    studentId: '',
    scheduledStart: new Date().toISOString().slice(0, 16),
    scheduledDuration: 60,
    subjectId: '',
    status: 'scheduled',
  });

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessionPairings, setSessionPairings] = useState<SessionPairing[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [usingTutorSubjects, setUsingTutorSubjects] = useState(false);
  const [willAddSubjectToStudent, setWillAddSubjectToStudent] = useState(false);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [createdSession, setCreatedSession] = useState<any>(null);

  // Metrics state
  const [audioMetrics, setAudioMetrics] = useState<AudioMetricsData>({
    tutorTalkRatio: 0.4,
    studentTalkRatio: 0.45,
    productiveSilenceRatio: 0.1,
    awkwardPauseRatio: 0.05,
    studentEngagementScore: 7.5,
    tutorEnthusiasmScore: 8.0,
    studentInitiatedQuestions: 5,
    tutorChecksUnderstandingCount: 8,
    tutorPositiveReinforcementCount: 10,
    avgStudentResponseDelay: 2.5,
    longPausesCount: 2,
    studentFrustrationCount: 0,
    studentConfusionCount: 1,
    positiveMomentsCount: 6,
    conceptReExplanationCount: 1,
    openEndedQuestions: 12,
    closedEndedQuestions: 8,
    rhetoricalQuestions: 3,
  });

  const [videoMetrics, setVideoMetrics] = useState<VideoMetricsData>({
    enabled: false,
    studentOnScreenAttentionPct: 0.85,
    studentVisualEngagementScore: 7.5,
    distractionEventsCount: 3,
    confusionMomentsCount: 2,
    tutorUsesVisualAids: true,
    studentTakingNotesDuration: 15,
  });

  const [screenMetrics, setScreenMetrics] = useState<ScreenMetricsData>({
    enabled: false,
    activeTabFocusPct: 0.9,
    tabSwitchesCount: 5,
    whiteboardUsageMinutes: 20,
    messagingAppDetected: false,
    gamingDetected: false,
  });

  const [feedback, setFeedback] = useState<FeedbackData>({
    enabled: true,
    studentSatisfactionRating: 4,
    feedbackText: 'Great session overall. My tutor was patient and helpful. I learned a lot and feel like I\'m making good progress.',
    tags: ['clear_explanations', 'patient', 'helpful_examples'],
  });

  // Load tutors, students, and session pairings on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [tutorsData, studentsData, pairingsData] = await Promise.all([
          getTutors(),
          getStudents(),
          getSessionPairings(),
        ]);
        setTutors(tutorsData);
        setStudents(studentsData);
        setSessionPairings(pairingsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load tutors and students');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Load subjects and session count when both tutor and student are selected
  useEffect(() => {
    const loadSubjectsData = async () => {
      if (!formData.tutorId || !formData.studentId) {
        setAvailableSubjects([]);
        setSessionCount(0);
        setUsingTutorSubjects(false);
        setWillAddSubjectToStudent(false);
        return;
      }

      try {
        const [commonSubjects, tutorSubjects, count] = await Promise.all([
          getCommonSubjects(formData.tutorId, formData.studentId),
          getTutorSubjects(formData.tutorId),
          getSessionCount(formData.tutorId, formData.studentId),
        ]);

        setSessionCount(count);

        // If there are common subjects, use them
        if (commonSubjects.length > 0) {
          setAvailableSubjects(commonSubjects);
          setUsingTutorSubjects(false);
          setWillAddSubjectToStudent(false);
        } else {
          // No common subjects, use tutor's subjects
          setAvailableSubjects(tutorSubjects);
          setUsingTutorSubjects(true);
          setWillAddSubjectToStudent(true); // Will add to student on session creation
          toast.info('No common subjects found. Using tutor\'s subjects - will add to student upon creation.');
        }

        // Reset subject if it's not in available subjects
        if (formData.subjectId && !availableSubjects.find(s => s.id === formData.subjectId)) {
          setFormData(prev => ({ ...prev, subjectId: '' }));
        }
      } catch (error) {
        console.error('Error loading subjects data:', error);
        toast.error('Failed to load subjects');
      }
    };

    loadSubjectsData();
  }, [formData.tutorId, formData.studentId]);

  // Smart status default based on date
  useEffect(() => {
    const scheduledDate = new Date(formData.scheduledStart);
    const now = new Date();

    if (scheduledDate < now) {
      setFormData(prev => ({ ...prev, status: 'completed' }));
    } else {
      setFormData(prev => ({ ...prev, status: 'scheduled' }));
    }
  }, [formData.scheduledStart]);

  const handleTemplateSelect = (template: TemplateType) => {
    const templateData = SCENARIO_TEMPLATES[template];

    // Update form data (status and duration)
    setFormData(prev => ({
      ...prev,
      status: templateData.status,
      scheduledDuration: templateData.duration,
    }));

    // Apply metrics if available
    if (templateData.metrics) {
      // Apply audio metrics
      if (templateData.metrics.audio) {
        setAudioMetrics(prev => ({
          ...prev,
          ...templateData.metrics!.audio,
        }));
      }

      // Apply video metrics
      if (templateData.metrics.video) {
        setVideoMetrics(prev => ({
          ...prev,
          enabled: true,
          ...templateData.metrics!.video,
        }));
      }

      // Apply screen metrics
      if (templateData.metrics.screen) {
        setScreenMetrics(prev => ({
          ...prev,
          enabled: true,
          ...templateData.metrics!.screen,
        }));
      }

      // Apply feedback
      if (templateData.metrics.feedback) {
        setFeedback(prev => ({
          ...prev,
          enabled: true,
          ...templateData.metrics!.feedback,
        }));
      }
    }

    toast.success(`Applied "${templateData.name}" template`);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.tutorId || !formData.studentId) {
      toast.error('Please select both tutor and student');
      return;
    }

    if (!formData.subjectId) {
      toast.error('Please select a subject');
      return;
    }

    if (availableSubjects.length === 0) {
      toast.error('No subjects available for this pairing');
      return;
    }

    // Validate metrics for completed sessions
    if (formData.status === 'completed') {
      const talkRatioSum = audioMetrics.tutorTalkRatio + audioMetrics.studentTalkRatio +
                           audioMetrics.productiveSilenceRatio + audioMetrics.awkwardPauseRatio;
      if (Math.abs(talkRatioSum - 1.0) > 0.01) {
        toast.error('Talk ratios must sum to 1.0');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // If using tutor's subjects and subject should be added to student
      if (willAddSubjectToStudent) {
        const addResult = await addSubjectToStudent(formData.studentId, formData.subjectId);
        if (addResult.success) {
          toast.info('Subject added to student');
        }
      }

      const result = await createSession({
        ...formData,
        sessionNumber: sessionCount + 1,
        // Include metrics only for completed sessions
        audioMetrics: formData.status === 'completed' ? audioMetrics : undefined,
        videoMetrics: formData.status === 'completed' && videoMetrics.enabled ? videoMetrics : undefined,
        screenMetrics: formData.status === 'completed' && screenMetrics.enabled ? screenMetrics : undefined,
        feedback: formData.status === 'completed' && feedback.enabled ? feedback : undefined,
      });

      if (result.success) {
        setCreatedSession(result.session);
        toast.success('Session created successfully!');
        // Reset form
        setFormData({
          tutorId: '',
          studentId: '',
          scheduledStart: new Date().toISOString().slice(0, 16),
          scheduledDuration: 60,
          subjectId: '',
          status: 'scheduled',
        });
        setSessionCount(0);
        setAvailableSubjects([]);
        setUsingTutorSubjects(false);
        setWillAddSubjectToStudent(false);
      } else {
        toast.error(result.error || 'Failed to create session');
      }
    } catch (error) {
      toast.error('An error occurred while creating the session');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort students based on selected tutor - show those with sessions with this tutor first
  const getStudentSessionsWithTutor = (studentId: string, tutorId: string) => {
    const pairing = sessionPairings.find(
      p => p.tutor_id === tutorId && p.student_id === studentId
    );
    return pairing ? pairing.session_count : 0;
  };

  const sortedStudents = [...students].sort((a, b) => {
    if (!formData.tutorId) {
      // No tutor selected, sort by total session count
      return b.sessionCount - a.sessionCount;
    }

    // Get session counts with the selected tutor
    const aSessions = getStudentSessionsWithTutor(a.id, formData.tutorId);
    const bSessions = getStudentSessionsWithTutor(b.id, formData.tutorId);

    // Sort by sessions with this tutor first, then by name
    if (aSessions !== bSessions) {
      return bSessions - aSessions;
    }
    return a.name.localeCompare(b.name);
  });

  // Sort tutors based on selected student - show those with sessions with this student first
  const sortedTutors = [...tutors].sort((a, b) => {
    if (!formData.studentId) {
      // No student selected, sort by total session count
      return b.sessionCount - a.sessionCount;
    }

    // Get session counts with the selected student
    const aSessions = getStudentSessionsWithTutor(formData.studentId, a.id);
    const bSessions = getStudentSessionsWithTutor(formData.studentId, b.id);

    // Sort by sessions with this student first, then by name
    if (aSessions !== bSessions) {
      return bSessions - aSessions;
    }
    return a.name.localeCompare(b.name);
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create Session</CardTitle>
          <CardDescription>
            Generate test sessions with realistic data and metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Scenario Templates */}
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SCENARIO_TEMPLATES) as TemplateType[]).map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateSelect(key)}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {SCENARIO_TEMPLATES[key].name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Templates apply preset configurations for common scenarios
            </p>
          </div>

          {/* Participant Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tutor">Tutor</Label>
              <Select
                value={formData.tutorId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tutorId: value }))
                }
              >
                <SelectTrigger id="tutor">
                  <SelectValue placeholder="Select a tutor" />
                </SelectTrigger>
                <SelectContent>
                  {sortedTutors.map((tutor) => {
                    const sessionsWithStudent = formData.studentId
                      ? getStudentSessionsWithTutor(formData.studentId, tutor.id)
                      : 0;

                    return (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {tutor.name}
                        {formData.studentId && sessionsWithStudent > 0 && (
                          <span className="text-muted-foreground ml-2">
                            ({sessionsWithStudent} with this student)
                          </span>
                        )}
                        {(!formData.studentId || sessionsWithStudent === 0) && tutor.sessionCount > 0 && (
                          <span className="text-muted-foreground ml-2">
                            ({tutor.sessionCount} total)
                          </span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student">Student</Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, studentId: value }))
                }
              >
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {sortedStudents.map((student) => {
                    const sessionsWithTutor = formData.tutorId
                      ? getStudentSessionsWithTutor(student.id, formData.tutorId)
                      : 0;

                    return (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                        {student.gradeLevel && ` (${student.gradeLevel})`}
                        {formData.tutorId && sessionsWithTutor > 0 && (
                          <span className="text-muted-foreground ml-2">
                            - {sessionsWithTutor} with this tutor
                          </span>
                        )}
                        {(!formData.tutorId || sessionsWithTutor === 0) && student.sessionCount > 0 && (
                          <span className="text-muted-foreground ml-2">
                            - {student.sessionCount} total
                          </span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Session Info */}
          {formData.tutorId && formData.studentId && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Session #{sessionCount + 1} for this tutor-student pair
                </p>
                {usingTutorSubjects ? (
                  <div className="flex gap-2 items-center">
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Using tutor's subjects</Badge>
                    {willAddSubjectToStudent && (
                      <span className="text-xs text-muted-foreground">
                        (will add to student)
                      </span>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary">{availableSubjects.length} common subjects</Badge>
                )}
              </div>
            </div>
          )}

          {/* Session Configuration */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">Scheduled Start</Label>
              <Input
                id="scheduledStart"
                type="datetime-local"
                value={formData.scheduledStart}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, scheduledStart: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select
                value={formData.scheduledDuration.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduledDuration: parseInt(value) as ScheduledDuration
                  }))
                }
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, subjectId: value }))
                }
                disabled={availableSubjects.length === 0}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder={
                    availableSubjects.length === 0
                      ? "Select tutor & student first"
                      : "Select a subject"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                      <span className="text-muted-foreground ml-2">
                        ({subject.category})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {usingTutorSubjects && (
                <p className="text-xs text-muted-foreground">
                  Showing tutor's subjects. Selected subject will be added to student.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value as SessionStatus }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show_tutor">No Show - Tutor</SelectItem>
                  <SelectItem value="no_show_student">No Show - Student</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Auto-set based on scheduled date (past = completed, future = scheduled)
              </p>
            </div>
          </div>

          {/* Metrics Forms - Only show for completed sessions */}
          {formData.status === 'completed' && (
            <div className="space-y-4 pt-6 border-t">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Session Metrics</h3>
                <p className="text-sm text-muted-foreground">
                  Configure detailed metrics for this completed session
                </p>
              </div>

              <AudioMetricsForm data={audioMetrics} onChange={setAudioMetrics} />
              <VideoMetricsForm data={videoMetrics} onChange={setVideoMetrics} maxDuration={formData.scheduledDuration} />
              <ScreenMetricsForm data={screenMetrics} onChange={setScreenMetrics} maxDuration={formData.scheduledDuration} />
              <FeedbackForm data={feedback} onChange={setFeedback} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.tutorId || !formData.studentId || !formData.subjectId}
            >
              {isSubmitting ? 'Creating...' : 'Create Session'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result Display */}
      {createdSession && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Session Created Successfully</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Session ID:</span> {createdSession.id}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Session Number:</span> {createdSession.sessionNumber}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Status:</span> {createdSession.status}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Scheduled:</span>{' '}
                  {new Date(createdSession.scheduledStart).toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Duration:</span> {createdSession.scheduledDuration} minutes
                </p>
              </div>

              {/* Metrics Summary */}
              {createdSession.overallScore !== null && (
                <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                  <p className="text-sm font-semibold">Metrics Created</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={createdSession.hasAudioMetrics ? 'default' : 'outline'}>
                        Audio Metrics
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={createdSession.hasVideoMetrics ? 'default' : 'outline'}>
                        Video Metrics
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={createdSession.hasScreenMetrics ? 'default' : 'outline'}>
                        Screen Metrics
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={createdSession.hasFeedback ? 'default' : 'outline'}>
                        Student Feedback
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm pt-2">
                    <span className="font-medium">Overall Session Score:</span>{' '}
                    <span className="text-lg font-bold">
                      {createdSession.overallScore.toFixed(1)}/10
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreatedSession(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
