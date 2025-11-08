'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type FeedbackTag =
  | 'clear_explanations'
  | 'patient'
  | 'encouraging'
  | 'helpful_examples'
  | 'good_pace'
  | 'too_fast'
  | 'too_slow'
  | 'didnt_check_understanding'
  | 'too_much_talking'
  | 'confusing_examples'
  | 'technical_issues'
  | 'made_learning_fun';

export interface FeedbackData {
  enabled: boolean;
  studentSatisfactionRating: number;
  feedbackText: string;
  tags: FeedbackTag[];
}

interface FeedbackFormProps {
  data: FeedbackData;
  onChange: (data: FeedbackData) => void;
}

const POSITIVE_TAGS: FeedbackTag[] = [
  'clear_explanations',
  'patient',
  'encouraging',
  'helpful_examples',
  'good_pace',
  'made_learning_fun',
];

const NEGATIVE_TAGS: FeedbackTag[] = [
  'too_fast',
  'too_slow',
  'didnt_check_understanding',
  'too_much_talking',
  'confusing_examples',
];

const NEUTRAL_TAGS: FeedbackTag[] = ['technical_issues'];

const TAG_LABELS: Record<FeedbackTag, string> = {
  clear_explanations: 'Clear Explanations',
  patient: 'Patient',
  encouraging: 'Encouraging',
  helpful_examples: 'Helpful Examples',
  good_pace: 'Good Pace',
  made_learning_fun: 'Made Learning Fun',
  too_fast: 'Too Fast',
  too_slow: 'Too Slow',
  didnt_check_understanding: "Didn't Check Understanding",
  too_much_talking: 'Too Much Talking',
  confusing_examples: 'Confusing Examples',
  technical_issues: 'Technical Issues',
};

const FEEDBACK_TEMPLATES = {
  5: "This was an amazing session! My tutor explained everything so clearly and made learning enjoyable. I feel much more confident about the material now.",
  4: "Great session overall. My tutor was patient and helpful. I learned a lot and feel like I'm making good progress.",
  3: "The session was okay. Some parts were helpful but there were a few things that could be improved.",
  2: "The session wasn't very helpful. I'm still confused about several topics and didn't feel very engaged.",
  1: "I was disappointed with this session. The explanations were unclear and I didn't learn much.",
};

export function FeedbackForm({ data, onChange }: FeedbackFormProps) {
  const handleToggle = (checked: boolean) => {
    onChange({ ...data, enabled: checked });
  };

  const handleRatingChange = (rating: number) => {
    onChange({ ...data, studentSatisfactionRating: rating });
  };

  const handleTextChange = (text: string) => {
    onChange({ ...data, feedbackText: text });
  };

  const handleTagToggle = (tag: FeedbackTag) => {
    const newTags = data.tags.includes(tag)
      ? data.tags.filter((t) => t !== tag)
      : [...data.tags, tag];
    onChange({ ...data, tags: newTags });
  };

  const applyTemplate = (rating: number) => {
    onChange({
      ...data,
      studentSatisfactionRating: rating,
      feedbackText: FEEDBACK_TEMPLATES[rating as keyof typeof FEEDBACK_TEMPLATES],
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student Feedback</CardTitle>
            <CardDescription>Optional feedback from student (60% default probability)</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="feedback-enabled"
              checked={data.enabled}
              onCheckedChange={handleToggle}
            />
            <Label htmlFor="feedback-enabled" className="cursor-pointer">
              Include Feedback
            </Label>
          </div>
        </div>
      </CardHeader>

      {data.enabled && (
        <CardContent className="space-y-6">
          {/* Satisfaction Rating */}
          <div className="space-y-2">
            <Label>Satisfaction Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingChange(rating)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      rating <= data.studentSatisfactionRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click to rate from 1 (poor) to 5 (excellent)
            </p>
          </div>

          {/* Template Suggestions */}
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <Button
                  key={rating}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(rating)}
                  className="text-xs"
                >
                  {rating} {rating === 1 ? 'Star' : 'Stars'}
                </Button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <Label htmlFor="feedbackText">Feedback Text</Label>
            <Textarea
              id="feedbackText"
              value={data.feedbackText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Write feedback from the student's perspective..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Feedback Tags */}
          <div className="space-y-4">
            <Label>Feedback Tags</Label>

            <div className="space-y-3">
              {/* Positive Tags */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">Positive</p>
                <div className="flex flex-wrap gap-2">
                  {POSITIVE_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={data.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {TAG_LABELS[tag]}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Negative Tags */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Negative</p>
                <div className="flex flex-wrap gap-2">
                  {NEGATIVE_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={data.tags.includes(tag) ? 'destructive' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {TAG_LABELS[tag]}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Neutral Tags */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Neutral</p>
                <div className="flex flex-wrap gap-2">
                  {NEUTRAL_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={data.tags.includes(tag) ? 'secondary' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {TAG_LABELS[tag]}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
