'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PreviewModalProps {
  data: any;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function PreviewModal({ data, onClose, onConfirm, isSubmitting }: PreviewModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview User Creation</DialogTitle>
          <DialogDescription>
            Review the user details before creating
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Basic Information</h3>
              <Badge variant={data.userType === 'tutor' ? 'default' : 'secondary'}>
                {data.userType}
              </Badge>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{data.name || '(not set)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{data.email || '(not set)'}</span>
              </div>
              {data.preferredName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preferred Name:</span>
                  <span className="font-medium">{data.preferredName}</span>
                </div>
              )}
            </div>
          </div>

          {data.userType === 'tutor' && (
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-medium">Tutor Details</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span className="font-medium">{data.memberSince}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span className="font-medium">${data.hourlyRate}</span>
                </div>
                {data.bio && (
                  <div>
                    <span className="text-muted-foreground">Bio:</span>
                    <p className="mt-1 text-sm">{data.bio}</p>
                  </div>
                )}
                {data.experience && (
                  <div>
                    <span className="text-muted-foreground">Experience:</span>
                    <p className="mt-1 text-sm">{data.experience}</p>
                  </div>
                )}
                {data.education && (
                  <div>
                    <span className="text-muted-foreground">Education:</span>
                    <p className="mt-1 text-sm">{data.education}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {data.userType === 'student' && (
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-medium">Student Details</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grade Level:</span>
                  <span className="font-medium">{data.gradeLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={data.status === 'active' ? 'default' : 'secondary'}>
                    {data.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enrolled Since:</span>
                  <span className="font-medium">{data.enrolledSince}</span>
                </div>
                {data.parentEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parent Email:</span>
                    <span className="font-medium">{data.parentEmail}</span>
                  </div>
                )}
                {data.learningGoals && (
                  <div>
                    <span className="text-muted-foreground">Learning Goals:</span>
                    <p className="mt-1 text-sm">{data.learningGoals}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-medium">Subjects</h3>
            <div className="text-sm">
              {data.subjectIds.length > 0 ? (
                <p className="text-muted-foreground">
                  {data.subjectIds.length} subject(s) selected
                </p>
              ) : (
                <p className="text-amber-600">No subjects selected</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Confirm & Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
