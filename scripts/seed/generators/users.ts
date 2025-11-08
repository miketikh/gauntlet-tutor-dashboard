// User generation module

import { SeededRandom } from '../utils/random';
import { tutorPersonas, studentPersonas } from '../config/personas';
import type { TutorPersona, StudentPersona } from '../config/personas';

export interface GeneratedUser {
  id: string;
  email: string;
  name: string;
  preferredName?: string;
  avatarUrl?: string;
  role: 'admin' | 'tutor' | 'student';
  createdAt: Date;
  // Additional metadata for generation tracking
  _meta?: {
    persona?: string;
    personaTraits?: any;
  };
}

export interface GeneratedTutor {
  userId: string;
  memberSince: Date;
  bio: string;
  experience: string;
  education: string;
  teachingStyle?: string;
  hourlyRate: number;
  persona: string;
  traits: TutorPersona['traits'];
}

export interface GeneratedStudent {
  userId: string;
  enrolledSince: Date;
  gradeLevel?: '6th' | '7th' | '8th' | '9th' | '10th' | '11th' | '12th' | 'college' | 'adult';
  parentEmail?: string;
  bio?: string;
  learningGoals?: string;
  status: 'active' | 'churned' | 'paused';
  persona: string;
  traits: StudentPersona['traits'];
}

export class UserGenerator {
  constructor(private random: SeededRandom) {}

  // Generate a Firebase-like UID
  private generateFirebaseUid(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 28 }, () =>
      this.random.pick([...chars])
    ).join('');
  }

  // Generate admin user
  generateAdmin(): GeneratedUser {
    return {
      id: this.generateFirebaseUid(),
      email: 'admin@tutorplatform.com',
      name: 'Platform Admin',
      preferredName: 'Admin',
      role: 'admin',
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    };
  }

  // Generate tutors based on personas
  generateTutors(): { users: GeneratedUser[]; tutors: GeneratedTutor[] } {
    const users: GeneratedUser[] = [];
    const tutors: GeneratedTutor[] = [];

    for (const [personaKey, persona] of Object.entries(tutorPersonas)) {
      for (let i = 0; i < persona.count; i++) {
        const name = this.random.name();
        const user: GeneratedUser = {
          id: this.generateFirebaseUid(),
          email: this.random.email(name),
          name: name.full,
          preferredName: name.first,
          role: 'tutor',
          createdAt: new Date(
            Date.now() - this.random.int(30, 365) * 24 * 60 * 60 * 1000
          ),
          _meta: {
            persona: personaKey,
            personaTraits: persona.traits,
          },
        };

        const tutor: GeneratedTutor = {
          userId: user.id,
          memberSince: user.createdAt,
          bio: this.generateTutorBio(persona),
          experience: this.generateTutorExperience(persona),
          education: this.generateTutorEducation(persona),
          teachingStyle: this.generateTeachingStyle(persona),
          hourlyRate: this.generateHourlyRate(persona),
          persona: personaKey,
          traits: persona.traits,
        };

        users.push(user);
        tutors.push(tutor);
      }
    }

    return { users, tutors };
  }

  // Generate students based on personas
  generateStudents(): { users: GeneratedUser[]; students: GeneratedStudent[] } {
    const users: GeneratedUser[] = [];
    const students: GeneratedStudent[] = [];

    for (const [personaKey, persona] of Object.entries(studentPersonas)) {
      for (let i = 0; i < persona.count; i++) {
        const name = this.random.name();
        const parentName = this.random.name();
        const enrolledDays = this.random.int(7, 180);

        const user: GeneratedUser = {
          id: this.generateFirebaseUid(),
          email: this.random.email(name),
          name: name.full,
          preferredName: name.first,
          role: 'student',
          createdAt: new Date(Date.now() - enrolledDays * 24 * 60 * 60 * 1000),
          _meta: {
            persona: personaKey,
            personaTraits: persona.traits,
          },
        };

        // Determine status based on persona and random factors
        let status: 'active' | 'churned' | 'paused' = 'active';
        if (this.random.boolean(persona.traits.churnRisk)) {
          status = this.random.boolean(0.7) ? 'churned' : 'paused';
        }

        const student: GeneratedStudent = {
          userId: user.id,
          enrolledSince: user.createdAt,
          gradeLevel: this.generateGradeLevel(),
          parentEmail: this.random.email(parentName),
          bio: this.generateStudentBio(persona),
          learningGoals: this.generateLearningGoals(persona),
          status,
          persona: personaKey,
          traits: persona.traits,
        };

        users.push(user);
        students.push(student);
      }
    }

    return { users, students };
  }

  // Bio generation helpers
  private generateTutorBio(persona: TutorPersona): string {
    const bios = {
      star: [
        'Award-winning educator with 10+ years of experience helping students excel.',
        'Passionate about making learning engaging and fun. Specialized in personalized instruction.',
        'Former teacher with expertise in differentiated instruction and student engagement.',
      ],
      solid: [
        'Dedicated tutor with 5+ years of experience in online education.',
        'Committed to helping students build confidence and achieve their goals.',
        'Experienced educator focused on clear communication and understanding.',
      ],
      struggling: [
        'New to online tutoring but eager to help students learn.',
        'Working on improving teaching methods and student engagement.',
        'Recently started tutoring and learning best practices.',
      ],
      atRisk: [
        'Part-time tutor with limited availability.',
        'Exploring tutoring as a potential career path.',
        'New to the platform.',
      ],
    };

    const personaKey = Object.keys(tutorPersonas).find(
      key => tutorPersonas[key].name === persona.name
    ) || 'solid';

    return this.random.pick(bios[personaKey as keyof typeof bios] || bios.solid);
  }

  private generateTutorExperience(persona: TutorPersona): string {
    const experiences = {
      star: '10+ years tutoring, 500+ students helped',
      solid: '5+ years tutoring experience',
      struggling: '1-2 years tutoring experience',
      atRisk: 'Less than 1 year experience',
    };

    const personaKey = Object.keys(tutorPersonas).find(
      key => tutorPersonas[key].name === persona.name
    ) || 'solid';

    return experiences[personaKey as keyof typeof experiences] || experiences.solid;
  }

  private generateTutorEducation(persona: TutorPersona): string {
    const educations = [
      "Bachelor's in Education",
      "Master's in Mathematics",
      "Bachelor's in Engineering",
      "Master's in Education",
      "Bachelor's in Science",
      'Teaching Certificate',
    ];

    return this.random.pick(educations);
  }

  private generateTeachingStyle(persona: TutorPersona): string {
    const styles = {
      star: [
        'Interactive and engaging with focus on understanding',
        'Student-centered approach with frequent check-ins',
        'Adaptive teaching based on student needs',
      ],
      solid: [
        'Clear explanations with practical examples',
        'Structured lessons with regular practice',
        'Patient and methodical approach',
      ],
      struggling: [
        'Traditional lecture-based approach',
        'Working on incorporating more interaction',
        'Developing personalized teaching methods',
      ],
      atRisk: [
        'Still developing teaching style',
        'Primarily lecture-based',
        'Limited adaptation to student needs',
      ],
    };

    const personaKey = Object.keys(tutorPersonas).find(
      key => tutorPersonas[key].name === persona.name
    ) || 'solid';

    return this.random.pick(styles[personaKey as keyof typeof styles] || styles.solid);
  }

  private generateHourlyRate(persona: TutorPersona): number {
    const rates = {
      star: { min: 60, max: 100 },
      solid: { min: 40, max: 60 },
      struggling: { min: 25, max: 40 },
      atRisk: { min: 20, max: 30 },
    };

    const personaKey = Object.keys(tutorPersonas).find(
      key => tutorPersonas[key].name === persona.name
    ) || 'solid';

    const range = rates[personaKey as keyof typeof rates] || rates.solid;
    return this.random.int(range.min, range.max);
  }

  private generateGradeLevel(): '6th' | '7th' | '8th' | '9th' | '10th' | '11th' | '12th' | 'college' | 'adult' {
    const grades: Array<'6th' | '7th' | '8th' | '9th' | '10th' | '11th' | '12th' | 'college' | 'adult'> = ['6th', '7th', '8th', '9th', '10th', '11th', '12th', 'college'];
    return this.random.pick(grades);
  }

  private generateStudentBio(persona: StudentPersona): string {
    const bios = {
      engaged: 'Motivated student eager to learn and improve',
      average: 'Looking for help with homework and test prep',
      struggling: 'Needs extra support to keep up with schoolwork',
    };

    const personaKey = Object.keys(studentPersonas).find(
      key => studentPersonas[key].name === persona.name
    ) || 'average';

    return bios[personaKey as keyof typeof bios] || bios.average;
  }

  private generateLearningGoals(persona: StudentPersona): string {
    const goals = {
      engaged: 'Achieve straight As and prepare for advanced classes',
      average: 'Improve grades and build confidence',
      struggling: 'Pass classes and understand fundamental concepts',
    };

    const personaKey = Object.keys(studentPersonas).find(
      key => studentPersonas[key].name === persona.name
    ) || 'average';

    return goals[personaKey as keyof typeof goals] || goals.average;
  }

  // Generate subject assignments
  generateSubjectAssignments(
    userIds: string[],
    subjectIds: string[],
    role: 'tutor' | 'student'
  ): Array<{ userId: string; subjectId: string }> {
    const assignments: Array<{ userId: string; subjectId: string }> = [];

    for (const userId of userIds) {
      // Tutors typically teach 2-4 subjects, students study 2-3
      const count = role === 'tutor'
        ? this.random.int(2, 4)
        : this.random.int(2, 3);

      const selectedSubjects = this.random.pickMultiple(subjectIds, count);
      for (const subjectId of selectedSubjects) {
        assignments.push({ userId, subjectId });
      }
    }

    return assignments;
  }
}