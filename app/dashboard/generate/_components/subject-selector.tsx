'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSubjects } from '../actions';

interface Subject {
  id: string;
  name: string;
  category: string;
}

interface SubjectSelectorProps {
  selectedSubjectIds: string[];
  onChange: (subjectIds: string[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  math: 'Math',
  science: 'Science',
  language_arts: 'Language Arts',
  social_studies: 'Social Studies',
  foreign_language: 'Foreign Language',
  test_prep: 'Test Prep',
  computer_science: 'Computer Science',
  arts: 'Arts',
  other: 'Other',
};

export function SubjectSelector({ selectedSubjectIds, onChange }: SubjectSelectorProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (error) {
        console.error('Failed to load subjects:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  const handleToggleSubject = (subjectId: string) => {
    if (selectedSubjectIds.includes(subjectId)) {
      onChange(selectedSubjectIds.filter((id) => id !== subjectId));
    } else {
      onChange([...selectedSubjectIds, subjectId]);
    }
  };

  // Group subjects by category
  const subjectsByCategory = subjects.reduce((acc, subject) => {
    if (!acc[subject.category]) {
      acc[subject.category] = [];
    }
    acc[subject.category].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
          <CardDescription>Loading subjects...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subjects</CardTitle>
        <CardDescription>Select subjects to assign to this user</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(subjectsByCategory).map(([category, categorySubjects]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {CATEGORY_LABELS[category] || category}
              </h4>
              <div className="space-y-2">
                {categorySubjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject.id}
                      checked={selectedSubjectIds.includes(subject.id)}
                      onCheckedChange={() => handleToggleSubject(subject.id)}
                    />
                    <Label
                      htmlFor={subject.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {subject.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {selectedSubjectIds.length === 0 && (
          <p className="text-sm text-amber-600 mt-4">
            Please select at least one subject
          </p>
        )}
      </CardContent>
    </Card>
  );
}
