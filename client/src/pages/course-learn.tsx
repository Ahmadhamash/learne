import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { 
  ChevronRight, 
  ChevronLeft,
  Play, 
  CheckCircle,
  Lock,
  BookOpen,
  Clock,
  Award,
  Loader2,
  FlaskConical,
  ArrowLeft,
  Star,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CourseWithContent, Enrollment, LessonProgress, Lab, LessonReviewWithUser, LessonReview, QuizWithQuestions, QuizAttempt } from "@shared/schema";

function extractVideoId(url: string): { type: "youtube" | "vimeo" | "unknown"; id: string | null } {
  if (!url) return { type: "unknown", id: null };
  
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) return { type: "youtube", id: youtubeMatch[1] };
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { type: "vimeo", id: vimeoMatch[1] };
  
  return { type: "unknown", id: null };
}

export default function CourseLearn() {
  const { id: courseId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  // Fetch course content - requires approved enrollment
  const { data: course, isLoading: courseLoading } = useQuery<CourseWithContent>({
    queryKey: ["/api/courses", courseId, "content"],
    queryFn: async () => {
      if (!user) throw new Error("يجب تسجيل الدخول");
      const res = await fetch(`/api/courses/${courseId}/content`, {
        headers: { "X-User-Id": user.id }
      });
      if (!res.ok) throw new Error("Failed to fetch course content");
      return res.json();
    },
    enabled: !!courseId && !!user,
  });

  // Fetch user enrollment
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery<Enrollment | null>({
    queryKey: ["/api/users", user?.id, "enrollments", courseId],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/users/${user.id}/enrollments`);
      if (!res.ok) return null;
      const enrollments: Enrollment[] = await res.json();
      return enrollments.find(e => e.courseId === courseId) || null;
    },
    enabled: !!user && !!courseId,
  });

  // Fetch lesson progress
  const { data: lessonProgress } = useQuery<LessonProgress[]>({
    queryKey: ["/api/users", user?.id, "lesson-progress"],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/users/${user.id}/lesson-progress`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  // Mark lesson as complete
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return apiRequest("POST", `/api/lessons/${lessonId}/complete`, { userId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "lesson-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "enrollments"] });
      toast({ title: "تم إكمال الدرس بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; xpEarned: number } | null>(null);

  // Fetch lesson reviews
  const { data: lessonReviews } = useQuery<LessonReviewWithUser[]>({
    queryKey: ["/api/lessons", currentLessonId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/${currentLessonId}/reviews`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentLessonId,
  });

  // Fetch user's own review for this lesson
  const { data: myReview } = useQuery<LessonReview | null>({
    queryKey: ["/api/lessons", currentLessonId, "my-review"],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/${currentLessonId}/my-review`, {
        headers: { "X-User-Id": user?.id || "" }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!currentLessonId && !!user,
  });

  // Update form when myReview changes
  useEffect(() => {
    if (myReview) {
      setReviewRating(myReview.rating);
      setReviewComment(myReview.comment || "");
    } else {
      setReviewRating(0);
      setReviewComment("");
    }
  }, [myReview, currentLessonId]);

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/lessons/${currentLessonId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
        courseId: courseId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", currentLessonId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", currentLessonId, "my-review"] });
      toast({ title: myReview ? "تم تحديث التقييم" : "تم إضافة التقييم بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ في إرسال التقييم", variant: "destructive" });
    },
  });

  // Get all lessons flattened
  const allLessons = course?.sections?.flatMap(s => s.lessons) || [];
  
  // Set first lesson as current if not set
  useEffect(() => {
    if (allLessons.length > 0 && !currentLessonId) {
      setCurrentLessonId(allLessons[0].id);
    }
  }, [allLessons, currentLessonId]);

  const currentLesson = allLessons.find(l => l.id === currentLessonId);

  // Fetch linked lab if the current lesson has one
  const { data: linkedLab } = useQuery<Lab>({
    queryKey: ["/api/labs", currentLesson?.labId],
    queryFn: async () => {
      const res = await fetch(`/api/labs/${currentLesson?.labId}`);
      if (!res.ok) throw new Error("Failed to fetch lab");
      return res.json();
    },
    enabled: !!currentLesson?.labId,
  });

  // Fetch quiz for current lesson
  const { data: lessonQuiz, isLoading: quizLoading } = useQuery<QuizWithQuestions | null>({
    queryKey: ["/api/lessons", currentLessonId, "quiz"],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/${currentLessonId}/quiz`);
      if (!res.ok) return null;
      const quiz = await res.json();
      if (!quiz || !quiz.isPublished) return null;
      return quiz;
    },
    enabled: !!currentLessonId,
  });

  // Fetch user's quiz attempts for this lesson
  const { data: quizAttempts } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/users", user?.id, "quiz-attempts", lessonQuiz?.id],
    queryFn: async () => {
      if (!lessonQuiz) return [];
      const res = await fetch(`/api/quizzes/${lessonQuiz.id}/attempts`, {
        headers: { "X-User-Id": user?.id || "" }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && !!lessonQuiz?.id,
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (answers: Record<string, number>): Promise<{ score: number; passed: boolean; xpEarned: number }> => {
      const res = await apiRequest("POST", `/api/quizzes/${lessonQuiz?.id}/submit`, { answers });
      return res.json();
    },
    onSuccess: (result: { score: number; passed: boolean; xpEarned: number }) => {
      setQuizResult(result);
      setQuizSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "quiz-attempts", lessonQuiz?.id] });
      if (result.passed) {
        toast({ title: `مبروك! نجحت بنسبة ${result.score}%`, description: `حصلت على ${result.xpEarned} XP` });
      } else {
        toast({ title: `لم تنجح - نسبتك ${result.score}%`, description: "حاول مرة أخرى", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "حدث خطأ في إرسال الإجابات", variant: "destructive" });
    },
  });

  // Reset quiz state when lesson changes
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  }, [currentLessonId]);

  const hasPassed = quizAttempts?.some(a => a.passed) || false;

  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLessonId);
  const isLessonCompleted = (lessonId: string) => lessonProgress?.some(p => p.lessonId === lessonId && p.isCompleted) || false;

  // Calculate progress
  const completedCount = lessonProgress?.filter(p => allLessons.some(l => l.id === p.lessonId) && p.isCompleted).length || 0;
  const progressPercent = allLessons.length > 0 ? (completedCount / allLessons.length) * 100 : 0;

  // Loading state
  if (courseLoading || enrollmentLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Skeleton className="h-[600px] lg:col-span-3" />
            <Skeleton className="h-[600px]" />
          </div>
        </div>
      </div>
    );
  }

  // Check if user is enrolled and approved
  if (!enrollment || enrollment.status !== "approved") {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">المحتوى مقفل</h2>
          <p className="text-muted-foreground mb-4">
            {!enrollment 
              ? "يجب التسجيل في الدورة للوصول للمحتوى" 
              : enrollment.status === "pending"
              ? "طلب التسجيل قيد المراجعة، سيتم التواصل معك قريباً"
              : "تم رفض طلب التسجيل"
            }
          </p>
          <Link href={`/courses/${courseId}`}>
            <Button>العودة لصفحة الدورة</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <Card className="text-center p-8">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">الدورة غير موجودة</h2>
          <Link href="/courses">
            <Button>العودة للدورات</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const videoInfo = currentLesson?.videoUrl ? extractVideoId(currentLesson.videoUrl) : null;
  const isUploadedVideo = currentLesson?.videoUrl?.startsWith("/api/videos/stream/");

  return (
    <div className="min-h-screen pt-16">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Video and Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="bg-black aspect-video w-full">
            {currentLesson?.videoUrl && isUploadedVideo ? (
              <div
                className="relative w-full h-full select-none"
                onContextMenu={(e) => e.preventDefault()}
                style={{ WebkitUserSelect: "none", userSelect: "none" }}
              >
                <video
                  className="w-full h-full"
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  data-testid="video-player"
                  playsInline
                  key={currentLesson.videoUrl}
                >
                  <source src={currentLesson.videoUrl} type="video/mp4" />
                  المتصفح لا يدعم تشغيل الفيديو
                </video>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "transparent",
                    zIndex: 1,
                  }}
                />
              </div>
            ) : currentLesson?.videoUrl && videoInfo?.id ? (
              videoInfo.type === "youtube" ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoInfo.id}?rel=0`}
                  title={currentLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="video-player"
                />
              ) : videoInfo.type === "vimeo" ? (
                <iframe
                  className="w-full h-full"
                  src={`https://player.vimeo.com/video/${videoInfo.id}`}
                  title={currentLesson.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  data-testid="video-player"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <p>صيغة الفيديو غير مدعومة</p>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">لا يوجد فيديو لهذا الدرس</p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Info */}
          <div className="p-6 flex-1 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{currentLesson?.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {currentLesson?.duration} دقيقة
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {currentLesson?.xpReward} XP
                  </span>
                </div>
              </div>
              {currentLesson && !isLessonCompleted(currentLesson.id) && (
                <Button
                  onClick={() => completeLessonMutation.mutate(currentLesson.id)}
                  disabled={completeLessonMutation.isPending}
                  data-testid="button-complete-lesson"
                >
                  {completeLessonMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 ml-2" />
                  )}
                  إكمال الدرس
                </Button>
              )}
              {currentLesson && isLessonCompleted(currentLesson.id) && (
                <Badge className="bg-chart-4">
                  <CheckCircle className="h-3 w-3 ml-1" />
                  مكتمل
                </Badge>
              )}
            </div>

            {currentLesson?.description && (
              <p className="text-muted-foreground mb-4">{currentLesson.description}</p>
            )}

            {currentLesson?.content && (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <p className="whitespace-pre-wrap">{currentLesson.content}</p>
                </CardContent>
              </Card>
            )}

            {/* Linked Lab Card */}
            {linkedLab && (
              <Card className="mt-6 border-2" style={{ borderColor: linkedLab.color }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${linkedLab.color}20` }}
                    >
                      {linkedLab.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5" style={{ color: linkedLab.color }} />
                        مختبر عملي
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        أكمل هذا المختبر لتطبيق ما تعلمته في هذا الدرس
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg">{linkedLab.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {linkedLab.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {linkedLab.duration} دقيقة
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {linkedLab.xpReward} XP
                        </span>
                        <Badge variant="outline" style={{ borderColor: linkedLab.color, color: linkedLab.color }}>
                          {linkedLab.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href={`/labs/${linkedLab.id}`}>
                      <Button 
                        className="w-full gap-2" 
                        style={{ backgroundColor: linkedLab.color }}
                        data-testid="button-go-to-lab"
                      >
                        <FlaskConical className="h-4 w-4" />
                        الذهاب للمختبر
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lesson Quiz Section */}
            {lessonQuiz && lessonQuiz.questions?.length > 0 && (
              <Card className="mt-6 border-2 border-primary/30" data-testid="lesson-quiz-section">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      {lessonQuiz.title}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {lessonQuiz.questions.length} أسئلة
                      </Badge>
                      <Badge variant="outline" className="text-primary">
                        {lessonQuiz.xpReward} XP
                      </Badge>
                      {hasPassed && (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          ناجح
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                  {lessonQuiz.description && (
                    <p className="text-sm text-muted-foreground">{lessonQuiz.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    نسبة النجاح المطلوبة: {lessonQuiz.passingScore}%
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasPassed && !quizSubmitted ? (
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-lg font-medium text-green-600">لقد نجحت في هذا الكويز!</p>
                      <p className="text-sm text-muted-foreground">يمكنك المتابعة للدرس التالي</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                          setQuizResult(null);
                        }}
                        data-testid="button-retake-quiz"
                      >
                        <RotateCcw className="h-4 w-4 ml-2" />
                        إعادة المحاولة
                      </Button>
                    </div>
                  ) : quizSubmitted && quizResult ? (
                    <div className="text-center py-4">
                      {quizResult.passed ? (
                        <>
                          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                          <p className="text-lg font-medium text-green-600">مبروك! نجحت!</p>
                          <p className="text-2xl font-bold">{quizResult.score}%</p>
                          <p className="text-sm text-muted-foreground">حصلت على {quizResult.xpEarned} XP</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
                          <p className="text-lg font-medium text-destructive">لم تنجح</p>
                          <p className="text-2xl font-bold">{quizResult.score}%</p>
                          <p className="text-sm text-muted-foreground">تحتاج {lessonQuiz.passingScore}% للنجاح</p>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                          setQuizResult(null);
                        }}
                        data-testid="button-retry-quiz"
                      >
                        <RotateCcw className="h-4 w-4 ml-2" />
                        حاول مرة أخرى
                      </Button>
                    </div>
                  ) : (
                    <>
                      {lessonQuiz.questions.map((q, idx) => (
                        <div key={q.id} className="p-4 border rounded-lg space-y-3">
                          <p className="font-medium">
                            س{idx + 1}: {q.question}
                          </p>
                          <div className="space-y-2">
                            {q.options?.map((opt, optIdx) => (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  quizAnswers[q.id] === optIdx
                                    ? "border-primary bg-primary/10"
                                    : "hover:bg-muted"
                                }`}
                                data-testid={`quiz-option-${q.id}-${optIdx}`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  checked={quizAnswers[q.id] === optIdx}
                                  onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                                  className="h-4 w-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button
                        className="w-full"
                        onClick={() => submitQuizMutation.mutate(quizAnswers)}
                        disabled={
                          Object.keys(quizAnswers).length < (lessonQuiz.questions?.length || 0) ||
                          submitQuizMutation.isPending
                        }
                        data-testid="button-submit-quiz"
                      >
                        {submitQuizMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 ml-2" />
                        )}
                        إرسال الإجابات
                      </Button>
                      {Object.keys(quizAnswers).length < (lessonQuiz.questions?.length || 0) && (
                        <p className="text-xs text-center text-muted-foreground">
                          أجب على جميع الأسئلة ({Object.keys(quizAnswers).length}/{lessonQuiz.questions?.length})
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lesson Review Section */}
            {user && (
              <Card className="mt-6" data-testid="lesson-review-section">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-yellow-500" />
                    تقييم الدرس
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {myReview ? "تحديث تقييمك" : "أضف تقييمك لهذا الدرس"}
                    </p>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                          data-testid={`rating-star-${star}`}
                        >
                          <Star 
                            className={`h-6 w-6 ${star <= reviewRating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                          />
                        </button>
                      ))}
                      <span className="mr-2 text-sm text-muted-foreground">
                        {reviewRating > 0 && `${reviewRating}/5`}
                      </span>
                    </div>
                    <Textarea
                      placeholder="اكتب تعليقك على الدرس (اختياري)"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="min-h-[80px]"
                      data-testid="review-comment"
                    />
                    <Button
                      className="mt-3"
                      onClick={() => submitReviewMutation.mutate()}
                      disabled={reviewRating === 0 || submitReviewMutation.isPending}
                      data-testid="button-submit-review"
                    >
                      {submitReviewMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <MessageSquare className="h-4 w-4 ml-2" />
                      )}
                      {myReview ? "تحديث التقييم" : "إرسال التقييم"}
                    </Button>
                  </div>

                  {/* Other Reviews */}
                  {lessonReviews && lessonReviews.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">تقييمات الطلاب ({lessonReviews.length})</h4>
                        {lessonReviews.length > 3 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowAllReviews(!showAllReviews)}
                          >
                            {showAllReviews ? "عرض أقل" : "عرض الكل"}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {(showAllReviews ? lessonReviews : lessonReviews.slice(0, 3)).map((review) => (
                          <div 
                            key={review.id} 
                            className="flex gap-3 p-3 rounded-lg bg-muted/50"
                            data-testid={`review-item-${review.id}`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.user?.avatar || undefined} />
                              <AvatarFallback>{review.user?.name?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{review.user?.name || "مستخدم"}</span>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star}
                                      className={`h-3 w-3 ${star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-muted-foreground">{review.comment}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentLessonId(allLessons[currentLessonIndex - 1]?.id)}
                disabled={currentLessonIndex <= 0}
                data-testid="button-prev-lesson"
              >
                <ChevronRight className="h-4 w-4 ml-2" />
                الدرس السابق
              </Button>
              <Button
                onClick={() => setCurrentLessonId(allLessons[currentLessonIndex + 1]?.id)}
                disabled={currentLessonIndex >= allLessons.length - 1}
                data-testid="button-next-lesson"
              >
                الدرس التالي
                <ChevronLeft className="h-4 w-4 mr-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar - Course Content */}
        <div className="lg:w-96 border-r bg-card">
          <div className="p-4 border-b">
            <Link href={`/courses/${courseId}`}>
              <h2 className="font-bold text-lg hover:text-primary transition-colors">{course.title}</h2>
            </Link>
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>التقدم</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {completedCount} من {allLessons.length} درس
              </p>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-4 space-y-4">
              {course.sections.map((section) => (
                <div key={section.id}>
                  <h3 className="font-medium mb-2 text-sm text-muted-foreground">{section.title}</h3>
                  <div className="space-y-1">
                    {section.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setCurrentLessonId(lesson.id)}
                        className={`w-full text-right p-3 rounded-lg transition-colors flex items-center gap-3 ${
                          currentLessonId === lesson.id 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted"
                        }`}
                        data-testid={`lesson-item-${lesson.id}`}
                      >
                        {isLessonCompleted(lesson.id) ? (
                          <CheckCircle className="h-5 w-5 text-chart-4 shrink-0" />
                        ) : lesson.videoUrl ? (
                          <Play className="h-5 w-5 shrink-0" />
                        ) : (
                          <BookOpen className="h-5 w-5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{lesson.title}</p>
                            {lesson.labId && (
                              <FlaskConical className="h-3 w-3 text-accent shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {lesson.duration} دقيقة
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
