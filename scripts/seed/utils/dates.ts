// Date and time generation utilities

import { SeededRandom } from './random';
import { sessionTimeDistribution, dayOfWeekDistribution } from '../config/probabilities';

export class DateGenerator {
  constructor(private random: SeededRandom) {}

  // Generate a random date within a range
  between(start: Date, end: Date): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = this.random.float(startTime, endTime);
    return new Date(randomTime);
  }

  // Generate dates for the past N days
  pastDays(days: number, from: Date = new Date()): Date {
    const past = new Date(from);
    past.setDate(past.getDate() - days);
    return this.between(past, from);
  }

  // Generate a realistic session time based on distribution
  sessionTime(baseDate?: Date): Date {
    const date = baseDate ? new Date(baseDate) : this.pastDays(30);

    // Pick day of week based on distribution
    const currentDayOfWeek = date.getDay();
    const dayWeights = Object.values(dayOfWeekDistribution);
    const days = Object.keys(dayOfWeekDistribution).map(Number);

    // Adjust date to a weighted day of the same week
    const targetDay = this.random.weightedPick(days, dayWeights);
    const dayDiff = targetDay - currentDayOfWeek;
    date.setDate(date.getDate() + dayDiff);

    // Pick hour based on distribution
    const hours = Object.keys(sessionTimeDistribution).map(Number);
    const hourWeights = hours.map(h => sessionTimeDistribution[h] || 0.1);
    const hour = this.random.weightedPick(hours, hourWeights);

    // Set time
    date.setHours(hour);
    date.setMinutes(this.random.int(0, 59));
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date;
  }

  // Generate sequential session times for a tutor-student pair
  sessionSeries(
    count: number,
    startFrom?: Date
  ): Date[] {
    const sessions: Date[] = [];
    let currentDate = startFrom || this.pastDays(30);

    for (let i = 0; i < count; i++) {
      if (i > 0) {
        // Sessions typically 3-10 days apart
        const daysApart = this.random.gaussianInRange(3, 10, 0.4);
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + Math.round(daysApart));
      }

      // Apply time distribution to the date
      const sessionDate = this.sessionTime(currentDate);
      sessions.push(sessionDate);
      currentDate = sessionDate;
    }

    return sessions;
  }

  // Generate a duration in minutes
  sessionDuration(): number {
    // Most sessions are 45-60 minutes, some 30, fewer 90
    const durations = [30, 45, 60, 90];
    const weights = [0.15, 0.25, 0.50, 0.10];
    return this.random.weightedPick(durations, weights);
  }

  // Generate actual duration based on scheduled (with some variance)
  actualDuration(scheduled: number, hasIssues: boolean = false): number | null {
    if (hasIssues) {
      // Technical issues might cut session short
      return this.random.int(10, Math.floor(scheduled * 0.7));
    }

    // Normal variance: -5 to +10 minutes
    const variance = this.random.gaussianInRange(-5, 10, 0.3);
    return Math.max(10, scheduled + Math.round(variance));
  }

  // Check if date is in the first week of a range
  isFirstWeek(date: Date, rangeStart: Date): boolean {
    const weekLater = new Date(rangeStart);
    weekLater.setDate(weekLater.getDate() + 7);
    return date >= rangeStart && date < weekLater;
  }

  // Format date for database
  toTimestamp(date: Date): string {
    return date.toISOString();
  }

  // Calculate completed_at based on start time and duration
  completedAt(start: Date, durationMinutes: number): Date {
    const completed = new Date(start);
    completed.setMinutes(completed.getMinutes() + durationMinutes);
    return completed;
  }
}

// Time-based session distribution helpers
export function getSessionDistribution(
  totalSessions: number,
  days: number = 30
): Map<string, number> {
  const distribution = new Map<string, number>();
  const sessionsPerDay = Math.ceil(totalSessions / days);

  // Create a more realistic distribution over time
  // More sessions in recent days (recency bias)
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    // Recent days have more sessions
    const recencyFactor = 1 - (i / days) * 0.5; // 50% reduction for oldest days
    const dayDistribution = Math.round(sessionsPerDay * recencyFactor);

    distribution.set(dateKey, dayDistribution);
  }

  return distribution;
}

// Helper to spread sessions across tutors realistically
export function distributeTutoringLoad(
  tutorIds: string[],
  tutorQualities: Map<string, 'star' | 'solid' | 'struggling' | 'atRisk'>,
  totalSessions: number
): Map<string, number> {
  const distribution = new Map<string, number>();

  // Quality-based session weights
  const qualityWeights = {
    star: 1.5,      // Star tutors handle more sessions
    solid: 1.2,     // Solid tutors have normal load
    struggling: 0.8, // Struggling tutors have fewer sessions
    atRisk: 0.5,    // At-risk tutors have minimal sessions
  };

  // Calculate total weight
  let totalWeight = 0;
  for (const tutorId of tutorIds) {
    const quality = tutorQualities.get(tutorId) || 'solid';
    totalWeight += qualityWeights[quality];
  }

  // Distribute sessions based on weights
  let remainingSessions = totalSessions;
  for (const tutorId of tutorIds) {
    const quality = tutorQualities.get(tutorId) || 'solid';
    const weight = qualityWeights[quality];
    const sessions = Math.floor((weight / totalWeight) * totalSessions);
    distribution.set(tutorId, sessions);
    remainingSessions -= sessions;
  }

  // Distribute remaining sessions to top performers
  const topPerformers = tutorIds.filter(
    id => tutorQualities.get(id) === 'star' || tutorQualities.get(id) === 'solid'
  );
  for (let i = 0; i < remainingSessions; i++) {
    const tutorId = topPerformers[i % topPerformers.length];
    distribution.set(tutorId, (distribution.get(tutorId) || 0) + 1);
  }

  return distribution;
}