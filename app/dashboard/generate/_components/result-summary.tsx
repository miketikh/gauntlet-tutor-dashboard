'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ResultSummaryProps {
  user: any;
  onClose: () => void;
}

export function ResultSummary({ user, onClose }: ResultSummaryProps) {
  const viewLink = user.role === 'tutor' ? `/tutors/${user.id}` : `/students/${user.id}`;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <DialogTitle>User Created Successfully</DialogTitle>
          </div>
          <DialogDescription>
            The {user.role} has been added to the database
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="font-medium text-right">{user.name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="font-medium text-right">{user.email}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge variant={user.role === 'tutor' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">User ID:</span>
                <span className="font-mono text-xs text-right break-all">{user.id}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={viewLink}>
                  View User Profile
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Create Another User
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
