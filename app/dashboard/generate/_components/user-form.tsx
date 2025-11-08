'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { generateRandomName } from './field-generators/name-generator';
import { generateRandomEmail } from './field-generators/email-generator';
import { SubjectSelector } from './subject-selector';
import { PreviewModal } from './preview-modal';
import { ResultSummary } from './result-summary';
import { createUser } from '../actions';
import { toast } from 'sonner';

type UserType = 'student' | 'tutor';
type StudentStatus = 'active' | 'churned' | 'paused';
type GradeLevel = '6th' | '7th' | '8th' | '9th' | '10th' | '11th' | '12th' | 'college' | 'adult';

interface UserFormData {
  userType: UserType;
  email: string;
  name: string;
  preferredName: string;
  avatarUrl: string;

  // Tutor fields
  memberSince: string;
  hourlyRate: string;
  bio: string;
  experience: string;
  education: string;
  teachingStyle: string;

  // Student fields
  gradeLevel: GradeLevel;
  status: StudentStatus;
  parentEmail: string;
  learningGoals: string;
  enrolledSince: string;

  // Subject IDs
  subjectIds: string[];
}

export function UserForm() {
  const [formData, setFormData] = useState<UserFormData>({
    userType: 'student',
    email: '',
    name: '',
    preferredName: '',
    avatarUrl: '',
    memberSince: new Date().toISOString().split('T')[0],
    hourlyRate: '50',
    bio: '',
    experience: '',
    education: '',
    teachingStyle: '',
    gradeLevel: '9th',
    status: 'active',
    parentEmail: '',
    learningGoals: '',
    enrolledSince: new Date().toISOString().split('T')[0],
    subjectIds: [],
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const handleGenerateRandomName = () => {
    const name = generateRandomName();
    setFormData((prev) => ({
      ...prev,
      name: name.full,
      preferredName: name.first,
      email: prev.email || generateRandomEmail(name),
    }));
  };

  const handleGenerateRandomEmail = () => {
    const nameParts = formData.name.split(' ');
    const name = nameParts.length >= 2
      ? { first: nameParts[0], last: nameParts[nameParts.length - 1] }
      : undefined;
    setFormData((prev) => ({
      ...prev,
      email: generateRandomEmail(name),
    }));
  };

  const handlePresetTutor = (preset: 'new' | 'experienced' | 'premium') => {
    const presets = {
      new: { hourlyRate: '30', memberSince: new Date().toISOString().split('T')[0] },
      experienced: {
        hourlyRate: '60',
        memberSince: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      premium: {
        hourlyRate: '100',
        memberSince: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
    };
    setFormData((prev) => ({ ...prev, ...presets[preset] }));
  };

  const handlePresetStudent = (preset: 'elementary' | 'high_school' | 'adult') => {
    const presets = {
      elementary: { gradeLevel: '6th' as GradeLevel, status: 'active' as StudentStatus },
      high_school: { gradeLevel: '10th' as GradeLevel, status: 'active' as StudentStatus },
      adult: { gradeLevel: 'adult' as GradeLevel, status: 'active' as StudentStatus },
    };
    setFormData((prev) => ({ ...prev, ...presets[preset] }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.email || !formData.name) {
      toast.error('Email and name are required');
      return;
    }

    if (formData.subjectIds.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createUser(formData);

      if (result.success) {
        setCreatedUser(result.user);
        toast.success('User created successfully!');
        // Reset form
        setFormData({
          userType: 'student',
          email: '',
          name: '',
          preferredName: '',
          avatarUrl: '',
          memberSince: new Date().toISOString().split('T')[0],
          hourlyRate: '50',
          bio: '',
          experience: '',
          education: '',
          teachingStyle: '',
          gradeLevel: '9th',
          status: 'active',
          parentEmail: '',
          learningGoals: '',
          enrolledSince: new Date().toISOString().split('T')[0],
          subjectIds: [],
        });
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('An error occurred while creating the user');
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setShowPreview(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
          <CardDescription>
            Generate test users with realistic data for tutors or students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Type Selection */}
          <div className="space-y-2">
            <Label>User Type</Label>
            <RadioGroup
              value={formData.userType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, userType: value as UserType }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tutor" id="tutor" />
                <Label htmlFor="tutor">Tutor</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Basic Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateRandomName}
                  title="Generate Random Name"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@email.com"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateRandomEmail}
                  title="Generate Random Email"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredName">Preferred Name (Optional)</Label>
              <Input
                id="preferredName"
                value={formData.preferredName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, preferredName: e.target.value }))
                }
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
              <Input
                id="avatarUrl"
                value={formData.avatarUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Tutor-Specific Fields */}
          {formData.userType === 'tutor' && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Tutor Fields</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetTutor('new')}
                  >
                    New Tutor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetTutor('experienced')}
                  >
                    Experienced
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetTutor('premium')}
                  >
                    Premium
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="memberSince">Member Since</Label>
                  <Input
                    id="memberSince"
                    type="date"
                    value={formData.memberSince}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, memberSince: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="25"
                    max="150"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hourlyRate: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Student-Specific Fields */}
          {formData.userType === 'student' && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Student Fields</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetStudent('elementary')}
                  >
                    Elementary
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetStudent('high_school')}
                  >
                    High School
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetStudent('adult')}
                  >
                    Adult Learner
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Select
                    value={formData.gradeLevel}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, gradeLevel: value as GradeLevel }))
                    }
                  >
                    <SelectTrigger id="gradeLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6th">6th Grade</SelectItem>
                      <SelectItem value="7th">7th Grade</SelectItem>
                      <SelectItem value="8th">8th Grade</SelectItem>
                      <SelectItem value="9th">9th Grade</SelectItem>
                      <SelectItem value="10th">10th Grade</SelectItem>
                      <SelectItem value="11th">11th Grade</SelectItem>
                      <SelectItem value="12th">12th Grade</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                      <SelectItem value="adult">Adult</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <RadioGroup
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, status: value as StudentStatus }))
                    }
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="active" id="active" />
                        <Label htmlFor="active">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="churned" id="churned" />
                        <Label htmlFor="churned">Churned</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paused" id="paused" />
                        <Label htmlFor="paused">Paused</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* Subject Assignment */}
          <SubjectSelector
            selectedSubjectIds={formData.subjectIds}
            onChange={(subjectIds) => setFormData((prev) => ({ ...prev, subjectIds }))}
          />

          {/* Advanced Fields (Collapsible) */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>Advanced Fields</span>
                {showAdvanced ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {formData.userType === 'tutor' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                      placeholder="Brief description of teaching background..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      value={formData.experience}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, experience: e.target.value }))
                      }
                      placeholder="Years of teaching, subjects taught..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Textarea
                      id="education"
                      value={formData.education}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, education: e.target.value }))
                      }
                      placeholder="Degrees, certifications..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teachingStyle">Teaching Style</Label>
                    <Textarea
                      id="teachingStyle"
                      value={formData.teachingStyle}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, teachingStyle: e.target.value }))
                      }
                      placeholder="Description of teaching approach..."
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Parent Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, parentEmail: e.target.value }))
                      }
                      placeholder="parent@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="learningGoals">Learning Goals</Label>
                    <Textarea
                      id="learningGoals"
                      value={formData.learningGoals}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, learningGoals: e.target.value }))
                      }
                      placeholder="What the student hopes to achieve..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enrolledSince">Enrolled Since</Label>
                    <Input
                      id="enrolledSince"
                      type="date"
                      value={formData.enrolledSince}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, enrolledSince: e.target.value }))
                      }
                    />
                  </div>
                </>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              Preview
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          data={formData}
          onClose={() => setShowPreview(false)}
          onConfirm={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Result Summary */}
      {createdUser && (
        <ResultSummary
          user={createdUser}
          onClose={() => setCreatedUser(null)}
        />
      )}
    </>
  );
}
