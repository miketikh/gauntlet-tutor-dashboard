import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
  Clock,
  Target,
  MessageSquare,
  Activity,
  CheckCircle,
  ArrowRight,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">TutorReview</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Benefits
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in">
              <Button variant="ghost" className="text-sm font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="text-sm font-semibold">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-background py-20 md:py-32">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Badge className="w-fit bg-accent/10 text-accent hover:bg-accent/20" variant="secondary">
                <Activity className="mr-1.5 h-3.5 w-3.5" />
                Processing 3,000+ Daily Sessions
              </Badge>
              <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
                Elevate Your Tutoring Platform with Real-Time Insights
              </h1>
              <p className="text-pretty text-lg text-muted-foreground md:text-xl">
                Automated tutor quality scoring that identifies coaching opportunities, predicts churn, and delivers
                actionable insights within 1 hour of session completion.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="text-base font-semibold">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="lg" variant="outline" className="text-base font-semibold bg-transparent">
                    Watch Demo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span className="text-sm text-muted-foreground">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Setup in minutes</span>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="absolute -left-4 -top-4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute -bottom-8 -right-4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
              <Card className="relative overflow-hidden border-2 bg-card shadow-2xl">
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-accent/60" />
                    <div className="h-3 w-3 rounded-full bg-primary/60" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-card-foreground">Tutor Performance Overview</h3>
                    <Badge variant="outline" className="text-xs">
                      Live
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-primary/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Quality Score</p>
                          <p className="text-lg font-bold text-card-foreground">94.2%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-accent">+5.3%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-accent/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                          <Users className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Active Tutors</p>
                          <p className="text-lg font-bold text-card-foreground">1,247</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-accent">+12</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-destructive/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">At-Risk Tutors</p>
                          <p className="text-lg font-bold text-card-foreground">23</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Action Needed
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border bg-muted/30 py-12">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">3,000+</div>
              <div className="text-sm text-muted-foreground">Sessions Processed Daily</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">{"<"}1hr</div>
              <div className="text-sm text-muted-foreground">Insights Delivery Time</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">24%</div>
              <div className="text-sm text-muted-foreground">First Session Churn Detected</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">98.2%</div>
              <div className="text-sm text-muted-foreground">Reschedule Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b border-border py-20 md:py-32">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20" variant="secondary">
              Platform Features
            </Badge>
            <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Everything You Need to Optimize Tutor Performance
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              Powerful analytics and insights that help you build a world-class tutoring platform.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Automated Quality Scoring</h3>
              <p className="text-muted-foreground">
                Evaluate tutor performance across every session with AI-powered quality metrics and instant feedback.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Predictive Churn Detection</h3>
              <p className="text-muted-foreground">
                Identify tutors at risk of leaving before it happens with advanced pattern recognition and early warning
                signals.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Coaching Opportunities</h3>
              <p className="text-muted-foreground">
                Get actionable recommendations for tutor improvement based on session data and performance trends.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Real-Time Insights</h3>
              <p className="text-muted-foreground">
                Receive actionable insights within 1 hour of session completion to address issues immediately.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Student Feedback Integration</h3>
              <p className="text-muted-foreground">
                Students can log in and leave detailed feedback to create more personalized tutoring experiences.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <AlertCircle className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">No-Show Prevention</h3>
              <p className="text-muted-foreground">
                Flag tutors with high rescheduling rates and detect no-show patterns to improve platform reliability.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="border-b border-border bg-muted/30 py-20 md:py-32">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20" variant="secondary">
                For Platform Administrators
              </Badge>
              <h2 className="mb-6 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Complete Visibility Into Your Tutoring Ecosystem
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-card-foreground">Monitor Platform Health</h4>
                    <p className="text-muted-foreground">
                      Track all sessions, tutor quality, and student satisfaction in one unified dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-card-foreground">Reduce Tutor Churn</h4>
                    <p className="text-muted-foreground">
                      Identify at-risk tutors early and implement targeted retention strategies.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-card-foreground">Data-Driven Decisions</h4>
                    <p className="text-muted-foreground">
                      Make informed decisions backed by comprehensive analytics and performance metrics.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Badge className="mb-4 bg-accent/10 text-accent hover:bg-accent/20" variant="secondary">
                For Tutors & Students
              </Badge>
              <h2 className="mb-6 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Personalized Growth and Better Matches
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <CheckCircle className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-card-foreground">Actionable Tutor Insights</h4>
                    <p className="text-muted-foreground">
                      Tutors receive personalized coaching recommendations to improve their teaching skills.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <CheckCircle className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-card-foreground">Student Feedback Portal</h4>
                    <p className="text-muted-foreground">
                      Students can easily provide feedback to help match them with the perfect tutor.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <CheckCircle className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-card-foreground">Enhanced Learning Experience</h4>
                    <p className="text-muted-foreground">
                      Better tutor quality leads to improved student outcomes and satisfaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <Card className="relative overflow-hidden border-2 bg-primary p-12 text-center md:p-16">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary-foreground/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary-foreground/5 blur-3xl" />
            <div className="relative">
              <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl">
                Ready to Transform Your Tutoring Platform?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-primary-foreground/90">
                Join leading educational platforms using TutorReview to optimize tutor performance and improve student
                outcomes.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/auth/sign-up">
                  <Button size="lg" variant="secondary" className="text-base font-semibold">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Schedule Demo
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <BarChart3 className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">TutorReview</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Elevating tutoring platforms through data-driven insights and automated quality scoring.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 TutorReview. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}