import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, User, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface StudentFeedbackSectionProps {
  feedback: {
    student_satisfaction_rating: number
    feedback_text: string | null
    submitted_at: Date
  } | null
  // feedbackTags would be added here when available
}

/**
 * Render star rating display
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium text-muted-foreground">
        ({rating}/5)
      </span>
    </div>
  )
}

export default function StudentFeedbackSection({ feedback }: StudentFeedbackSectionProps) {
  if (!feedback) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <Info className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Student has not yet submitted feedback for this session
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const timeAgo = formatDistanceToNow(new Date(feedback.submitted_at), { addSuffix: true })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Student Feedback
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Submitted {timeAgo}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Satisfaction Rating
          </p>
          <StarRating rating={feedback.student_satisfaction_rating} />
        </div>

        {/* Feedback Tags */}
        {/* Note: Tags would be displayed here when available in the data structure */}
        {/* Example:
        {feedbackTags && feedbackTags.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Feedback Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {feedbackTags.map((tag) => (
                <Badge key={tag} variant={getTagVariant(tag)}>
                  {formatTagLabel(tag)}
                </Badge>
              ))}
            </div>
          </div>
        )}
        */}

        {/* Freeform Text */}
        {feedback.feedback_text && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Comments
            </p>
            <blockquote className="border-l-4 border-blue-500 bg-muted/50 p-4 italic">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                <p className="text-sm leading-relaxed text-foreground">
                  "{feedback.feedback_text}"
                </p>
              </div>
            </blockquote>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
