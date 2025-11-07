CREATE TYPE "public"."achievement_type" AS ENUM('engagement_master', 'question_guru', 'first_session_expert', 'consistency_champion', 'student_favorite', 'rising_star');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('high_talk_ratio', 'low_understanding_checks', 'student_frustration_detected', 'poor_first_session', 'high_reschedule_rate', 'no_show_pattern', 'declining_performance', 'student_churn_risk');--> statement-breakpoint
CREATE TYPE "public"."feedback_tag" AS ENUM('clear_explanations', 'patient', 'encouraging', 'helpful_examples', 'good_pace', 'too_fast', 'too_slow', 'didnt_check_understanding', 'too_much_talking', 'confusing_examples', 'technical_issues', 'made_learning_fun');--> statement-breakpoint
CREATE TYPE "public"."highlight_type" AS ENUM('strong_question', 'breakthrough', 'confusion', 'positive_reinforcement', 'concern', 'concept_explanation');--> statement-breakpoint
CREATE TYPE "public"."transcript_speaker" AS ENUM('tutor', 'student');--> statement-breakpoint
CREATE TYPE "public"."reschedule_by" AS ENUM('tutor', 'student');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'in_progress', 'completed', 'no_show_tutor', 'no_show_student', 'cancelled', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."churn_reason" AS ENUM('poor_first_session', 'tutor_mismatch', 'no_progress', 'scheduling_difficulty', 'price_concerns', 'technical_issues', 'found_competitor', 'completed_goals', 'personal_circumstances', 'other');--> statement-breakpoint
CREATE TYPE "public"."grade_level" AS ENUM('6th', '7th', '8th', '9th', '10th', '11th', '12th', 'college', 'adult');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('active', 'churned', 'paused');--> statement-breakpoint
CREATE TYPE "public"."insight_category" AS ENUM('high_engagement', 'low_engagement', 'high_talk_ratio', 'balanced_talk_ratio', 'frequent_understanding_checks', 'infrequent_understanding_checks', 'strong_questioning', 'low_visual_aids', 'high_visual_aids', 'positive_reinforcement', 'first_session_expert');--> statement-breakpoint
CREATE TYPE "public"."insight_type" AS ENUM('strength', 'growth_area', 'achievement');--> statement-breakpoint
CREATE TYPE "public"."snapshot_period" AS ENUM('daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."subject_category" AS ENUM('math', 'science', 'language_arts', 'social_studies', 'foreign_language', 'test_prep', 'computer_science', 'arts', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'tutor', 'student');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" varchar(128) NOT NULL,
	"achievement_type" "achievement_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"earned_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" varchar(128) NOT NULL,
	"alert_type" "alert_type" NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"triggered_date" timestamp DEFAULT now() NOT NULL,
	"session_id" uuid,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_by" varchar(128),
	"acknowledged_at" timestamp,
	"action_taken" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "churn_algorithm_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer NOT NULL,
	"factor_category" varchar(50) NOT NULL,
	"weight" numeric(4, 3) NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weight_check" CHECK ("churn_algorithm_weights"."weight" >= 0 AND "churn_algorithm_weights"."weight" <= 1)
);
--> statement-breakpoint
CREATE TABLE "churn_weight_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer NOT NULL,
	"changed_by" varchar(128) NOT NULL,
	"change_reason" text NOT NULL,
	"case_study_session_id" uuid,
	"case_study_student_id" varchar(128),
	"old_weights" jsonb NOT NULL,
	"new_weights" jsonb NOT NULL,
	"accuracy_before" numeric(4, 3),
	"accuracy_after" numeric(4, 3),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accuracy_before_check" CHECK ("churn_weight_history"."accuracy_before" >= 0 AND "churn_weight_history"."accuracy_before" <= 1),
	CONSTRAINT "accuracy_after_check" CHECK ("churn_weight_history"."accuracy_after" >= 0 AND "churn_weight_history"."accuracy_after" <= 1)
);
--> statement-breakpoint
CREATE TABLE "session_audio_metrics" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"tutor_talk_ratio" numeric(4, 3),
	"student_talk_ratio" numeric(4, 3),
	"productive_silence_ratio" numeric(4, 3),
	"awkward_pause_ratio" numeric(4, 3),
	"student_engagement_score" numeric(3, 1),
	"tutor_enthusiasm_score" numeric(3, 1),
	"avg_student_response_delay" numeric(5, 2),
	"long_pauses_count" integer DEFAULT 0 NOT NULL,
	"student_initiated_questions" integer DEFAULT 0 NOT NULL,
	"student_frustration_count" integer DEFAULT 0 NOT NULL,
	"student_confusion_count" integer DEFAULT 0 NOT NULL,
	"positive_moments_count" integer DEFAULT 0 NOT NULL,
	"tutor_checks_understanding_count" integer DEFAULT 0 NOT NULL,
	"tutor_positive_reinforcement_count" integer DEFAULT 0 NOT NULL,
	"concept_re_explanation_count" integer DEFAULT 0 NOT NULL,
	"open_ended_questions" integer DEFAULT 0 NOT NULL,
	"closed_ended_questions" integer DEFAULT 0 NOT NULL,
	"rhetorical_questions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tutor_ratio_check" CHECK ("session_audio_metrics"."tutor_talk_ratio" >= 0 AND "session_audio_metrics"."tutor_talk_ratio" <= 1),
	CONSTRAINT "student_ratio_check" CHECK ("session_audio_metrics"."student_talk_ratio" >= 0 AND "session_audio_metrics"."student_talk_ratio" <= 1)
);
--> statement-breakpoint
CREATE TABLE "session_feedback" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"student_satisfaction_rating" integer NOT NULL,
	"feedback_text" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rating_check" CHECK ("session_feedback"."student_satisfaction_rating" >= 1 AND "session_feedback"."student_satisfaction_rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "session_feedback_tags" (
	"session_id" uuid NOT NULL,
	"tag" "feedback_tag" NOT NULL,
	CONSTRAINT "session_feedback_tags_session_id_tag_pk" PRIMARY KEY("session_id","tag")
);
--> statement-breakpoint
CREATE TABLE "session_screen_metrics" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"active_tab_focus_pct" numeric(4, 3),
	"tab_switches_count" integer DEFAULT 0 NOT NULL,
	"whiteboard_usage_minutes" integer DEFAULT 0 NOT NULL,
	"messaging_app_detected" boolean DEFAULT false NOT NULL,
	"gaming_detected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "focus_check" CHECK ("session_screen_metrics"."active_tab_focus_pct" >= 0 AND "session_screen_metrics"."active_tab_focus_pct" <= 1)
);
--> statement-breakpoint
CREATE TABLE "session_transcript_highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"timestamp_seconds" integer NOT NULL,
	"speaker" "transcript_speaker" NOT NULL,
	"text" text NOT NULL,
	"highlight_type" "highlight_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_video_metrics" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"student_on_screen_attention_pct" numeric(4, 3),
	"student_visual_engagement_score" numeric(3, 1),
	"distraction_events_count" integer DEFAULT 0 NOT NULL,
	"confusion_moments_count" integer DEFAULT 0 NOT NULL,
	"tutor_uses_visual_aids" boolean DEFAULT false NOT NULL,
	"student_taking_notes_duration" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attention_check" CHECK ("session_video_metrics"."student_on_screen_attention_pct" >= 0 AND "session_video_metrics"."student_on_screen_attention_pct" <= 1)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" varchar(128) NOT NULL,
	"student_id" varchar(128) NOT NULL,
	"scheduled_start" timestamp NOT NULL,
	"actual_start" timestamp,
	"scheduled_duration" integer NOT NULL,
	"actual_duration" integer,
	"subject_id" uuid NOT NULL,
	"session_number" integer NOT NULL,
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"tutor_showed_up" boolean DEFAULT true NOT NULL,
	"student_showed_up" boolean DEFAULT true NOT NULL,
	"rescheduled_by" "reschedule_by",
	"technical_issues" boolean DEFAULT false NOT NULL,
	"technical_issues_description" text,
	"has_audio_analysis" boolean DEFAULT false NOT NULL,
	"has_video_analysis" boolean DEFAULT false NOT NULL,
	"has_screen_monitoring" boolean DEFAULT false NOT NULL,
	"homework_assigned" boolean DEFAULT false NOT NULL,
	"follow_up_booked" boolean DEFAULT false NOT NULL,
	"overall_session_score" numeric(3, 1),
	"ai_summary" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "score_check" CHECK ("sessions"."overall_session_score" >= 0 AND "sessions"."overall_session_score" <= 10)
);
--> statement-breakpoint
CREATE TABLE "student_churn_reasons" (
	"student_id" varchar(128) NOT NULL,
	"reason" "churn_reason" NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_churn_reasons_student_id_reason_pk" PRIMARY KEY("student_id","reason")
);
--> statement-breakpoint
CREATE TABLE "student_subjects" (
	"student_id" varchar(128) NOT NULL,
	"subject_id" uuid NOT NULL,
	CONSTRAINT "student_subjects_student_id_subject_id_pk" PRIMARY KEY("student_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"user_id" varchar(128) PRIMARY KEY NOT NULL,
	"enrolled_since" date DEFAULT now() NOT NULL,
	"grade_level" "grade_level",
	"parent_email" varchar(255),
	"bio" text,
	"learning_goals" text,
	"status" "student_status" DEFAULT 'active' NOT NULL,
	"churned_date" date,
	"churn_survey_response" text
);
--> statement-breakpoint
CREATE TABLE "tutor_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" varchar(128) NOT NULL,
	"insight_type" "insight_type" NOT NULL,
	"category" "insight_category" NOT NULL,
	"display_text" text NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"last_confirmed_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"resolved_at" timestamp,
	"sample_sessions" uuid[],
	"metric_value" numeric(5, 2)
);
--> statement-breakpoint
CREATE TABLE "tutor_performance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" varchar(128) NOT NULL,
	"snapshot_date" date NOT NULL,
	"period_type" "snapshot_period" NOT NULL,
	"sessions_count" integer DEFAULT 0 NOT NULL,
	"avg_session_score" numeric(3, 2),
	"avg_engagement_score" numeric(3, 2),
	"avg_student_satisfaction" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutor_subjects" (
	"tutor_id" varchar(128) NOT NULL,
	"subject_id" uuid NOT NULL,
	CONSTRAINT "tutor_subjects_tutor_id_subject_id_pk" PRIMARY KEY("tutor_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "tutors" (
	"user_id" varchar(128) PRIMARY KEY NOT NULL,
	"member_since" date DEFAULT now() NOT NULL,
	"bio" text,
	"experience" text,
	"education" text,
	"teaching_style" text,
	"hourly_rate" numeric(6, 2)
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" "subject_category" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"preferred_name" varchar(255),
	"avatar_url" varchar(500),
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "churn_weight_history" ADD CONSTRAINT "churn_weight_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "churn_weight_history" ADD CONSTRAINT "churn_weight_history_case_study_session_id_sessions_id_fk" FOREIGN KEY ("case_study_session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "churn_weight_history" ADD CONSTRAINT "churn_weight_history_case_study_student_id_users_id_fk" FOREIGN KEY ("case_study_student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_audio_metrics" ADD CONSTRAINT "session_audio_metrics_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_feedback_tags" ADD CONSTRAINT "session_feedback_tags_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_screen_metrics" ADD CONSTRAINT "session_screen_metrics_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_transcript_highlights" ADD CONSTRAINT "session_transcript_highlights_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_video_metrics" ADD CONSTRAINT "session_video_metrics_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_churn_reasons" ADD CONSTRAINT "student_churn_reasons_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_insights" ADD CONSTRAINT "tutor_insights_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_performance_snapshots" ADD CONSTRAINT "tutor_performance_snapshots_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_subjects" ADD CONSTRAINT "tutor_subjects_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_subjects" ADD CONSTRAINT "tutor_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutors" ADD CONSTRAINT "tutors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;