import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { 
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Video,
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  PlayCircle,
  HelpCircle,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CourseSection, Lesson, CourseWithContent, Lab, Quiz, QuizQuestion, QuizWithQuestions } from "@shared/schema";

export default function CourseContentPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'section' | 'lesson', id: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const [sectionForm, setSectionForm] = useState({
    title: "",
    description: "",
    order: 0,
    isPublished: true
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    content: "",
    videoUrl: "",
    labId: null as string | null,
    duration: 0,
    order: 0,
    xpReward: 50,
    isPublished: false,
    sectionId: null as string | null
  });

  // Quiz management state
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [currentLessonForQuiz, setCurrentLessonForQuiz] = useState<Lesson | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizWithQuestions | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: "كويز الدرس",
    description: "",
    passingScore: 70,
    xpReward: 25,
    isPublished: false
  });
  const [questionForm, setQuestionForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0
  });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Redirect if not admin or instructor
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "instructor")) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Return early if not admin or instructor (after useEffect check)
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return null;
  }

  // Determine API base path based on role
  const apiBase = user.role === "admin" ? "/api/admin" : "/api/instructor";

  // Fetch available labs (endpoint to get all labs including unpublished)
  const { data: labs } = useQuery<Lab[]>({
    queryKey: [`${apiBase}/labs`],
    enabled: !!user && (user.role === "admin" || user.role === "instructor")
  });

  const { data: courseContent, isLoading } = useQuery<CourseWithContent>({
    queryKey: [apiBase, "courses", courseId, "content"],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/courses/${courseId}/content`, {
        headers: { "X-User-Id": user.id }
      });
      if (!res.ok) throw new Error("Failed to fetch course content");
      return res.json();
    },
    enabled: !!courseId && !!user
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Section mutations
  const createSectionMutation = useMutation({
    mutationFn: async (data: typeof sectionForm) => {
      return apiRequest("POST", `${apiBase}/courses/${courseId}/sections`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase, "courses", courseId, "content"] });
      setSectionModalOpen(false);
      resetSectionForm();
      toast({ title: "تم إنشاء القسم بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof sectionForm> }) => {
      return apiRequest("PATCH", `${apiBase}/sections/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase, "courses", courseId, "content"] });
      setSectionModalOpen(false);
      setEditingSection(null);
      resetSectionForm();
      toast({ title: "تم تحديث القسم بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `${apiBase}/sections/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase, "courses", courseId, "content"] });
      setDeleteTarget(null);
      toast({ title: "تم حذف القسم بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  // Lesson mutations
  const createLessonMutation = useMutation({
    mutationFn: async (data: typeof lessonForm) => {
      return apiRequest("POST", `${apiBase}/courses/${courseId}/lessons`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase, "courses", courseId, "content"] });
      setLessonModalOpen(false);
      resetLessonForm();
      toast({ title: "تم إنشاء الدرس بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof lessonForm> }) => {
      return apiRequest("PATCH", `${apiBase}/lessons/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase, "courses", courseId, "content"] });
      setLessonModalOpen(false);
      setEditingLesson(null);
      resetLessonForm();
      toast({ title: "تم تحديث الدرس بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `${apiBase}/lessons/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase, "courses", courseId, "content"] });
      setDeleteTarget(null);
      toast({ title: "تم حذف الدرس بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  // Quiz mutations
  const createQuizMutation = useMutation({
    mutationFn: async ({ lessonId, data }: { lessonId: string; data: typeof quizForm }) => {
      return apiRequest("POST", `${apiBase}/lessons/${lessonId}/quiz`, data);
    },
    onSuccess: async (quiz: Quiz) => {
      toast({ title: "تم إنشاء الكويز بنجاح" });
      // Fetch the full quiz with questions
      const res = await fetch(`${apiBase}/quizzes/${quiz.id}`, {
        headers: { "X-User-Id": user?.id || "" }
      });
      if (res.ok) {
        const fullQuiz = await res.json();
        setCurrentQuiz(fullQuiz);
      }
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateQuizMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof quizForm> }) => {
      return apiRequest("PATCH", `${apiBase}/quizzes/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "تم تحديث الكويز بنجاح" });
      if (currentQuiz) {
        setCurrentQuiz({ ...currentQuiz, ...quizForm });
      }
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `${apiBase}/quizzes/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "تم حذف الكويز بنجاح" });
      setCurrentQuiz(null);
      setQuizModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const addQuestionMutation = useMutation({
    mutationFn: async ({ quizId, data }: { quizId: string; data: typeof questionForm }) => {
      return apiRequest("POST", `${apiBase}/quizzes/${quizId}/questions`, {
        ...data,
        order: currentQuiz?.questions?.length || 0
      });
    },
    onSuccess: async (newQuestion: QuizQuestion) => {
      toast({ title: "تم إضافة السؤال بنجاح" });
      if (currentQuiz) {
        setCurrentQuiz({
          ...currentQuiz,
          questions: [...(currentQuiz.questions || []), newQuestion]
        });
      }
      resetQuestionForm();
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof questionForm> }) => {
      return apiRequest("PATCH", `${apiBase}/questions/${id}`, data);
    },
    onSuccess: (updatedQuestion: QuizQuestion) => {
      toast({ title: "تم تحديث السؤال بنجاح" });
      if (currentQuiz) {
        setCurrentQuiz({
          ...currentQuiz,
          questions: currentQuiz.questions.map(q => 
            q.id === updatedQuestion.id ? updatedQuestion : q
          )
        });
      }
      setEditingQuestionId(null);
      resetQuestionForm();
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `${apiBase}/questions/${id}`, {});
    },
    onSuccess: (_, deletedId) => {
      toast({ title: "تم حذف السؤال بنجاح" });
      if (currentQuiz) {
        setCurrentQuiz({
          ...currentQuiz,
          questions: currentQuiz.questions.filter(q => q.id !== deletedId)
        });
      }
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const resetQuestionForm = () => {
    setQuestionForm({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0
    });
    setEditingQuestionId(null);
  };

  const openQuizModal = async (lesson: Lesson) => {
    setCurrentLessonForQuiz(lesson);
    setQuizModalOpen(true);
    
    // Try to fetch existing quiz for this lesson
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/quiz`);
      if (res.ok) {
        const quiz = await res.json();
        if (quiz) {
          // Fetch full quiz with questions from admin/instructor endpoint
          const quizRes = await fetch(`${apiBase}/quizzes/${quiz.id}`, {
            headers: { "X-User-Id": user?.id || "" }
          });
          if (quizRes.ok) {
            const fullQuiz = await quizRes.json();
            setCurrentQuiz(fullQuiz);
            setQuizForm({
              title: fullQuiz.title,
              description: fullQuiz.description || "",
              passingScore: fullQuiz.passingScore,
              xpReward: fullQuiz.xpReward,
              isPublished: fullQuiz.isPublished
            });
          }
        } else {
          setCurrentQuiz(null);
          setQuizForm({
            title: "كويز الدرس",
            description: "",
            passingScore: 70,
            xpReward: 25,
            isPublished: false
          });
        }
      }
    } catch {
      setCurrentQuiz(null);
    }
    resetQuestionForm();
  };

  const resetSectionForm = () => {
    setSectionForm({ title: "", description: "", order: 0, isPublished: true });
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: "", description: "", content: "", videoUrl: "", labId: null,
      duration: 0, order: 0, xpReward: 50, isPublished: false, sectionId: null
    });
  };

  const openEditSection = (section: CourseSection) => {
    setEditingSection(section);
    setSectionForm({
      title: section.title,
      description: section.description || "",
      order: section.order,
      isPublished: section.isPublished
    });
    setSectionModalOpen(true);
  };

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || "",
      content: lesson.content || "",
      videoUrl: lesson.videoUrl || "",
      labId: lesson.labId || null,
      duration: lesson.duration,
      order: lesson.order,
      xpReward: lesson.xpReward,
      isPublished: lesson.isPublished,
      sectionId: lesson.sectionId
    });
    setLessonModalOpen(true);
  };

  const openAddLesson = (sectionId: string | null) => {
    setCurrentSectionId(sectionId);
    resetLessonForm();
    setLessonForm(prev => ({ ...prev, sectionId }));
    setLessonModalOpen(true);
  };

  const handleSectionSubmit = () => {
    if (editingSection) {
      updateSectionMutation.mutate({ id: editingSection.id, data: sectionForm });
    } else {
      createSectionMutation.mutate(sectionForm);
    }
  };

  const handleLessonSubmit = () => {
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, data: lessonForm });
    } else {
      createLessonMutation.mutate(lessonForm);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!courseContent) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">الدورة غير موجودة</p>
        <Link href="/admin">
          <Button className="mt-4">العودة للوحة التحكم</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{courseContent.title}</h1>
            <p className="text-muted-foreground">إدارة محتوى الدورة</p>
          </div>
        </div>
        <Button onClick={() => { resetSectionForm(); setEditingSection(null); setSectionModalOpen(true); }} data-testid="button-add-section">
          <Plus className="h-4 w-4 ml-2" />
          إضافة قسم
        </Button>
      </div>

      {/* Course Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Badge variant={courseContent.isPublished ? "default" : "secondary"}>
              {courseContent.isPublished ? "منشور" : "مسودة"}
            </Badge>
            <span className="text-muted-foreground">المستوى: {courseContent.level}</span>
            <span className="text-muted-foreground">الفئة: {courseContent.category}</span>
            <span className="text-muted-foreground">المدة: {courseContent.duration}</span>
          </div>
        </CardContent>
      </Card>

      {/* Sections List */}
      <div className="space-y-4">
        {courseContent.sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد أقسام بعد</p>
              <Button 
                className="mt-4" 
                onClick={() => { resetSectionForm(); setEditingSection(null); setSectionModalOpen(true); }}
                data-testid="button-add-first-section"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول قسم
              </Button>
            </CardContent>
          </Card>
        ) : (
          courseContent.sections.map((section, index) => (
            <Card key={section.id} className="overflow-hidden">
              <Collapsible open={expandedSections.has(section.id)} onOpenChange={() => toggleSection(section.id)}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">القسم {index + 1}:</span>
                        <span className="font-medium">{section.title}</span>
                        <Badge variant={section.isPublished ? "default" : "secondary"} className="text-xs">
                          {section.isPublished ? "منشور" : "مخفي"}
                        </Badge>
                      </div>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {section.lessons.length} دروس
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditSection(section)}
                      data-testid={`button-edit-section-${section.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setDeleteTarget({ type: 'section', id: section.id })}
                      data-testid={`button-delete-section-${section.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-toggle-section-${section.id}`}>
                        {expandedSections.has(section.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0 border-t">
                    <div className="space-y-2 mt-4">
                      {section.lessons.map((lesson, lessonIndex) => (
                        <div 
                          key={lesson.id} 
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            {lesson.videoUrl ? (
                              <PlayCircle className="h-5 w-5 text-primary" />
                            ) : (
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{lessonIndex + 1}. {lesson.title}</span>
                                <Badge variant={lesson.isPublished ? "default" : "secondary"} className="text-xs">
                                  {lesson.isPublished ? "منشور" : "مخفي"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                {lesson.duration > 0 && <span>{lesson.duration} دقيقة</span>}
                                <span>{lesson.xpReward} XP</span>
                                {lesson.videoUrl && <span className="text-primary">فيديو</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openQuizModal(lesson)}
                              title="إدارة الكويز"
                              data-testid={`button-quiz-lesson-${lesson.id}`}
                            >
                              <HelpCircle className="h-4 w-4 text-primary" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditLesson(lesson)}
                              data-testid={`button-edit-lesson-${lesson.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeleteTarget({ type: 'lesson', id: lesson.id })}
                              data-testid={`button-delete-lesson-${lesson.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => openAddLesson(section.id)}
                        data-testid={`button-add-lesson-to-${section.id}`}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة درس
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>

      {/* Section Modal */}
      <Dialog open={sectionModalOpen} onOpenChange={setSectionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSection ? "تعديل القسم" : "إضافة قسم جديد"}</DialogTitle>
            <DialogDescription>
              {editingSection ? "قم بتعديل بيانات القسم" : "أدخل بيانات القسم الجديد"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان القسم</Label>
              <Input
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                placeholder="مثال: مقدمة في AWS"
                data-testid="input-section-title"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                placeholder="وصف موجز للقسم..."
                data-testid="input-section-description"
              />
            </div>
            <div className="space-y-2">
              <Label>الترتيب</Label>
              <Input
                type="number"
                value={sectionForm.order}
                onChange={(e) => setSectionForm({ ...sectionForm, order: parseInt(e.target.value) || 0 })}
                data-testid="input-section-order"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>منشور</Label>
              <Switch
                checked={sectionForm.isPublished}
                onCheckedChange={(checked) => setSectionForm({ ...sectionForm, isPublished: checked })}
                data-testid="switch-section-published"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionModalOpen(false)}>إلغاء</Button>
            <Button 
              onClick={handleSectionSubmit}
              disabled={!sectionForm.title || createSectionMutation.isPending || updateSectionMutation.isPending}
              data-testid="button-save-section"
            >
              <Save className="h-4 w-4 ml-2" />
              {editingSection ? "تحديث" : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Modal */}
      <Dialog open={lessonModalOpen} onOpenChange={setLessonModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "تعديل الدرس" : "إضافة درس جديد"}</DialogTitle>
            <DialogDescription>
              {editingLesson ? "قم بتعديل بيانات الدرس" : "أدخل بيانات الدرس الجديد"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pl-1">
            <div className="space-y-2">
              <Label>عنوان الدرس</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="مثال: إنشاء حساب AWS"
                data-testid="input-lesson-title"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                placeholder="وصف موجز للدرس..."
                data-testid="input-lesson-description"
              />
            </div>
            <div className="space-y-2">
              <Label>رابط الفيديو</Label>
              <Input
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                dir="ltr"
                data-testid="input-lesson-video"
              />
            </div>
            <div className="space-y-2">
              <Label>المحتوى النصي</Label>
              <Textarea
                value={lessonForm.content}
                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                placeholder="محتوى الدرس..."
                rows={4}
                data-testid="input-lesson-content"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المدة (دقائق)</Label>
                <Input
                  type="number"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })}
                  data-testid="input-lesson-duration"
                />
              </div>
              <div className="space-y-2">
                <Label>نقاط XP</Label>
                <Input
                  type="number"
                  value={lessonForm.xpReward}
                  onChange={(e) => setLessonForm({ ...lessonForm, xpReward: parseInt(e.target.value) || 50 })}
                  data-testid="input-lesson-xp"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الترتيب</Label>
              <Input
                type="number"
                value={lessonForm.order}
                onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 0 })}
                data-testid="input-lesson-order"
              />
            </div>
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select
                value={lessonForm.sectionId || "none"}
                onValueChange={(value) => setLessonForm({ ...lessonForm, sectionId: value === "none" ? null : value })}
              >
                <SelectTrigger data-testid="select-lesson-section">
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون قسم</SelectItem>
                  {courseContent?.sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>مختبر مرتبط (اختياري)</Label>
              <Select
                value={lessonForm.labId || "none"}
                onValueChange={(value) => setLessonForm({ ...lessonForm, labId: value === "none" ? null : value })}
              >
                <SelectTrigger data-testid="select-lesson-lab">
                  <SelectValue placeholder="اختر مختبر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مختبر</SelectItem>
                  {labs?.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">اختر مختبر ليظهر للطالب بعد إكمال هذا الدرس</p>
            </div>
            <div className="flex items-center justify-between">
              <Label>منشور</Label>
              <Switch
                checked={lessonForm.isPublished}
                onCheckedChange={(checked) => setLessonForm({ ...lessonForm, isPublished: checked })}
                data-testid="switch-lesson-published"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonModalOpen(false)}>إلغاء</Button>
            <Button 
              onClick={handleLessonSubmit}
              disabled={!lessonForm.title || createLessonMutation.isPending || updateLessonMutation.isPending}
              data-testid="button-save-lesson"
            >
              <Save className="h-4 w-4 ml-2" />
              {editingLesson ? "تحديث" : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Modal */}
      <Dialog open={quizModalOpen} onOpenChange={(open) => {
        if (!open) {
          setQuizModalOpen(false);
          setCurrentLessonForQuiz(null);
          setCurrentQuiz(null);
          resetQuestionForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              إدارة الكويز - {currentLessonForQuiz?.title}
            </DialogTitle>
            <DialogDescription>
              أضف أسئلة للكويز الذي سيظهر للطلاب بعد الدرس
            </DialogDescription>
          </DialogHeader>
          
          {!currentQuiz ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">لا يوجد كويز لهذا الدرس بعد. أنشئ كويز جديد:</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>عنوان الكويز</Label>
                  <Input
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    placeholder="كويز الدرس"
                    data-testid="input-quiz-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوصف (اختياري)</Label>
                  <Textarea
                    value={quizForm.description}
                    onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                    placeholder="وصف قصير للكويز..."
                    data-testid="input-quiz-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نسبة النجاح (%)</Label>
                    <Input
                      type="number"
                      value={quizForm.passingScore}
                      onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) || 70 })}
                      min={0}
                      max={100}
                      data-testid="input-quiz-passing-score"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>مكافأة XP</Label>
                    <Input
                      type="number"
                      value={quizForm.xpReward}
                      onChange={(e) => setQuizForm({ ...quizForm, xpReward: parseInt(e.target.value) || 25 })}
                      min={0}
                      data-testid="input-quiz-xp"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => currentLessonForQuiz && createQuizMutation.mutate({ 
                    lessonId: currentLessonForQuiz.id, 
                    data: quizForm 
                  })}
                  disabled={createQuizMutation.isPending}
                  data-testid="button-create-quiz"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء الكويز
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quiz Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">إعدادات الكويز</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>عنوان الكويز</Label>
                      <Input
                        value={quizForm.title}
                        onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                        data-testid="input-quiz-title-edit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نسبة النجاح (%)</Label>
                      <Input
                        type="number"
                        value={quizForm.passingScore}
                        onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) || 70 })}
                        min={0}
                        max={100}
                        data-testid="input-quiz-passing-score-edit"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>مكافأة XP</Label>
                      <Input
                        type="number"
                        value={quizForm.xpReward}
                        onChange={(e) => setQuizForm({ ...quizForm, xpReward: parseInt(e.target.value) || 25 })}
                        min={0}
                        data-testid="input-quiz-xp-edit"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>منشور</Label>
                      <Switch
                        checked={quizForm.isPublished}
                        onCheckedChange={(checked) => setQuizForm({ ...quizForm, isPublished: checked })}
                        data-testid="switch-quiz-published"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => updateQuizMutation.mutate({ id: currentQuiz.id, data: quizForm })}
                      disabled={updateQuizMutation.isPending}
                      data-testid="button-update-quiz"
                    >
                      <Save className="h-4 w-4 ml-2" />
                      حفظ الإعدادات
                    </Button>
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteQuizMutation.mutate(currentQuiz.id)}
                      disabled={deleteQuizMutation.isPending}
                      data-testid="button-delete-quiz"
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف الكويز
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Questions List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>الأسئلة ({currentQuiz.questions?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentQuiz.questions?.map((q, idx) => (
                    <div key={q.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">س{idx + 1}: {q.question}</p>
                          <div className="mt-2 space-y-1">
                            {q.options?.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 text-sm">
                                {optIdx === q.correctAnswer ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <div className="h-4 w-4 border rounded-full" />
                                )}
                                <span className={optIdx === q.correctAnswer ? "text-green-600 font-medium" : ""}>
                                  {opt}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditingQuestionId(q.id);
                              setQuestionForm({
                                question: q.question,
                                options: [...(q.options || ["", "", "", ""])],
                                correctAnswer: q.correctAnswer
                              });
                            }}
                            data-testid={`button-edit-question-${q.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteQuestionMutation.mutate(q.id)}
                            data-testid={`button-delete-question-${q.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add/Edit Question Form */}
                  <div className="p-4 border-2 border-dashed rounded-lg space-y-4">
                    <h4 className="font-medium">
                      {editingQuestionId ? "تعديل السؤال" : "إضافة سؤال جديد"}
                    </h4>
                    <div className="space-y-2">
                      <Label>السؤال</Label>
                      <Input
                        value={questionForm.question}
                        onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                        placeholder="أدخل السؤال..."
                        data-testid="input-question-text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الخيارات</Label>
                      {questionForm.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={questionForm.correctAnswer === idx}
                            onChange={() => setQuestionForm({ ...questionForm, correctAnswer: idx })}
                            className="h-4 w-4"
                            data-testid={`radio-correct-${idx}`}
                          />
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...questionForm.options];
                              newOptions[idx] = e.target.value;
                              setQuestionForm({ ...questionForm, options: newOptions });
                            }}
                            placeholder={`الخيار ${idx + 1}`}
                            className="flex-1"
                            data-testid={`input-option-${idx}`}
                          />
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">حدد الإجابة الصحيحة بالنقر على الدائرة</p>
                    </div>
                    <div className="flex gap-2">
                      {editingQuestionId ? (
                        <>
                          <Button
                            onClick={() => updateQuestionMutation.mutate({ 
                              id: editingQuestionId, 
                              data: questionForm 
                            })}
                            disabled={!questionForm.question || questionForm.options.some(o => !o) || updateQuestionMutation.isPending}
                            data-testid="button-update-question"
                          >
                            <Save className="h-4 w-4 ml-2" />
                            تحديث السؤال
                          </Button>
                          <Button variant="outline" onClick={resetQuestionForm}>
                            إلغاء
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => addQuestionMutation.mutate({ 
                            quizId: currentQuiz.id, 
                            data: questionForm 
                          })}
                          disabled={!questionForm.question || questionForm.options.some(o => !o) || addQuestionMutation.isPending}
                          data-testid="button-add-question"
                        >
                          <Plus className="h-4 w-4 ml-2" />
                          إضافة السؤال
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              هل أنت متأكد من الحذف؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'section' 
                ? "سيتم حذف هذا القسم. الدروس الموجودة فيه ستبقى بدون قسم."
                : "سيتم حذف هذا الدرس نهائياً ولا يمكن استرجاعه."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget?.type === 'section') {
                  deleteSectionMutation.mutate(deleteTarget.id);
                } else if (deleteTarget?.type === 'lesson') {
                  deleteLessonMutation.mutate(deleteTarget.id);
                }
              }}
              data-testid="button-confirm-delete"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
