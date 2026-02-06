import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Users, 
  BookOpen, 
  Star, 
  DollarSign,
  TrendingUp,
  MessageSquare,
  Play,
  Edit,
  Plus,
  BarChart3,
  Eye,
  Clock,
  ClipboardList,
  Check,
  X,
  FileText,
  Settings,
  FlaskConical,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import type { Course, InstructorStats, ReviewWithUser, LabSubmissionWithDetails, Lab } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient,
  trend 
}: { 
  title: string; 
  value: string; 
  icon: React.ElementType; 
  gradient: string;
  trend?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 ${gradient} opacity-20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-chart-4">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">{trend}</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseCard({ 
  course, 
  onEdit, 
  onManageContent 
}: { 
  course: Course; 
  onEdit: (course: Course) => void;
  onManageContent: (courseId: string) => void;
}) {
  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-instructor-course-${course.id}`}>
      <div className="relative h-40 overflow-hidden">
        <img 
          src={course.image || "https://placehold.co/800x400/4A88FF/FFFFFF?text=Course"} 
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <Badge 
          variant={course.isPublished ? "default" : "secondary"} 
          className={`absolute top-3 right-3 ${course.isPublished ? "bg-chart-4" : ""}`}
        >
          {course.isPublished ? "منشور" : "مسودة"}
        </Badge>
        <div className="absolute bottom-3 right-3 left-3">
          <h4 className="text-white font-bold line-clamp-1">{course.title}</h4>
          <p className="text-white/70 text-sm">{course.category}</p>
        </div>
      </div>
      <CardContent className="pt-4">
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div>
            <p className="text-lg font-bold text-primary">{course.studentsCount}</p>
            <p className="text-xs text-muted-foreground">طالب</p>
          </div>
          <div>
            <p className="text-lg font-bold text-accent flex items-center justify-center gap-1">
              <Star className="h-4 w-4 fill-current" />
              {course.rating}
            </p>
            <p className="text-xs text-muted-foreground">تقييم</p>
          </div>
          <div>
            <p className="text-lg font-bold text-chart-4">{course.price}</p>
            <p className="text-xs text-muted-foreground">د.أ</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => onEdit(course)}
          >
            <Edit className="h-3 w-3" />
            تعديل
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => onManageContent(course.id)}
          >
            <Settings className="h-3 w-3" />
            إدارة المحتوى
          </Button>
          <Button size="sm" className="bg-gradient-primary gap-1">
            <Eye className="h-3 w-3" />
            عرض
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewCard({ review }: { review: ReviewWithUser }) {
  return (
    <Card className="hover-elevate">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.user.avatar || undefined} />
            <AvatarFallback className="bg-gradient-primary text-white">
              {review.user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium">{review.user.name}</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3 w-3 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} 
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{review.comment}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString("ar") : ""}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price: number;
  lessonsCount: number;
  projectsCount: number;
  difficulty: number;
  isPublished: boolean;
}

const initialCourseForm: CourseFormData = {
  title: "",
  description: "",
  category: "AWS",
  level: "مبتدئ",
  duration: "",
  price: 0,
  lessonsCount: 0,
  projectsCount: 0,
  difficulty: 1,
  isPublished: false,
};

interface LabFormData {
  title: string;
  description: string;
  about: string;
  environment: string;
  level: string;
  duration: number;
  xpReward: number;
  color: string;
  technologies: string;
}

const initialLabForm: LabFormData = {
  title: "",
  description: "",
  about: "",
  environment: "",
  level: "مبتدئ",
  duration: 30,
  xpReward: 100,
  color: "bg-gradient-to-r from-blue-500 to-cyan-500",
  technologies: "",
};

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<LabSubmissionWithDetails | null>(null);
  
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormData>(initialCourseForm);
  
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [labForm, setLabForm] = useState<LabFormData>(initialLabForm);

  if (!user || (user.role !== "instructor" && user.role !== "admin")) {
    setLocation("/");
    return null;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<InstructorStats>({
    queryKey: ["/api/instructor/stats", user.id],
  });

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/instructor/courses"],
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/instructor/reviews", user.id],
  });

  const { data: labSubmissions, isLoading: submissionsLoading } = useQuery<LabSubmissionWithDetails[]>({
    queryKey: ["/api/instructor/lab-submissions"],
  });

  const { data: instructorLabs, isLoading: labsLoading } = useQuery<Lab[]>({
    queryKey: ["/api/instructor/labs"],
    enabled: !!user,
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData & { instructorId: string }) => {
      return apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/stats"] });
      toast({ title: "تم إنشاء الدورة بنجاح" });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({ 
        title: "خطأ", 
        description: error.message || "فشل إنشاء الدورة", 
        variant: "destructive" 
      });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CourseFormData> }) => {
      return apiRequest("PATCH", `/api/courses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/courses"] });
      toast({ title: "تم تحديث الدورة بنجاح" });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({ 
        title: "خطأ", 
        description: error.message || "فشل تحديث الدورة", 
        variant: "destructive" 
      });
    }
  });

  const createLabMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/instructor/labs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/labs"] });
      toast({ title: "تم إنشاء المختبر بنجاح" });
      handleCloseLabModal();
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل إنشاء المختبر", variant: "destructive" });
    }
  });

  const updateLabMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/instructor/labs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/labs"] });
      toast({ title: "تم تحديث المختبر بنجاح" });
      setLabModalOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "خطأ", 
        description: error.message || "فشل تحديث المختبر", 
        variant: "destructive" 
      });
    }
  });

  const deleteLabMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/instructor/labs/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/labs"] });
      toast({ title: "تم حذف المختبر بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل حذف المختبر", variant: "destructive" });
    }
  });

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setCourseForm(initialCourseForm);
    setCourseModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      price: course.price,
      lessonsCount: course.lessonsCount,
      projectsCount: course.projectsCount,
      difficulty: course.difficulty,
      isPublished: course.isPublished,
    });
    setCourseModalOpen(true);
  };

  const handleCloseModal = () => {
    setCourseModalOpen(false);
    setEditingCourse(null);
    setCourseForm(initialCourseForm);
  };

  const handleManageContent = (courseId: string) => {
    setLocation(`/admin/courses/${courseId}/content`);
  };

  const handleSubmitCourse = () => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: courseForm });
    } else {
      createCourseMutation.mutate({ ...courseForm, instructorId: user.id });
    }
  };

  const handleOpenEditLabModal = (lab: Lab) => {
    setEditingLab(lab);
    setLabForm({
      title: lab.title,
      description: lab.description,
      about: lab.about || "",
      environment: lab.environment || "",
      level: lab.level,
      duration: lab.duration,
      xpReward: lab.xpReward,
      color: lab.color,
      technologies: lab.technologies?.join(", ") || "",
    });
    setLabModalOpen(true);
  };

  const handleCloseLabModal = () => {
    setLabModalOpen(false);
    setEditingLab(null);
    setLabForm(initialLabForm);
  };

  const handleSubmitLab = () => {
    const technologiesArray = labForm.technologies
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const labData = {
      title: labForm.title,
      description: labForm.description,
      about: labForm.about,
      environment: labForm.environment,
      level: labForm.level,
      duration: labForm.duration,
      xpReward: labForm.xpReward,
      color: labForm.color,
      technologies: technologiesArray,
    };

    if (editingLab) {
      updateLabMutation.mutate({ id: editingLab.id, data: labData });
    } else {
      createLabMutation.mutate(labData);
    }
  };

  const handleOpenCreateLabModal = () => {
    setEditingLab(null);
    setLabForm(initialLabForm);
    setLabModalOpen(true);
  };

  const handleManageLabContent = (labId: string) => {
    setLocation(`/admin/labs/${labId}/content`);
  };

  const isSubmitting = createCourseMutation.isPending || updateCourseMutation.isPending;
  const isLabSubmitting = updateLabMutation.isPending || createLabMutation.isPending;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10">
          <Avatar className="h-20 w-20 ring-4 ring-primary/30">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="bg-gradient-primary text-white text-2xl">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
            <p className="text-muted-foreground">{user.title || "محاضر معتمد"}</p>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-gradient-primary gap-2" 
              data-testid="button-add-new-course"
              onClick={handleOpenCreateModal}
            >
              <Plus className="h-4 w-4" />
              إضافة دورة جديدة
            </Button>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              تعديل الملف
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard 
                title="إجمالي الطلاب" 
                value={stats?.totalStudents?.toString() || "0"} 
                icon={Users} 
                gradient="bg-gradient-to-r from-primary to-blue-400"
                trend="+15% هذا الشهر"
              />
              <StatCard 
                title="عدد الدورات" 
                value={stats?.totalCourses?.toString() || "0"} 
                icon={BookOpen} 
                gradient="bg-gradient-to-r from-chart-4 to-teal-400"
              />
              <StatCard 
                title="متوسط التقييم" 
                value={stats?.averageRating?.toString() || "0"} 
                icon={Star} 
                gradient="bg-gradient-to-r from-accent to-orange-400"
              />
              <StatCard 
                title="إجمالي الإيرادات" 
                value={`${stats?.totalRevenue?.toLocaleString() || 0} د.أ`} 
                icon={DollarSign} 
                gradient="bg-gradient-to-r from-secondary to-pink-400"
                trend="+20% هذا الشهر"
              />
            </>
          )}
        </div>

        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="courses" className="gap-1" data-testid="tab-my-courses">
              <BookOpen className="h-4 w-4" />
              دوراتي
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-1" data-testid="tab-submissions">
              <ClipboardList className="h-4 w-4" />
              التسليمات
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1" data-testid="tab-reviews">
              <MessageSquare className="h-4 w-4" />
              التقييمات
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="labs" className="gap-1" data-testid="tab-labs">
              <FlaskConical className="h-4 w-4" />
              المختبرات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">دوراتي التعليمية</h2>
                <p className="text-muted-foreground">إدارة الدورات والمسارات الخاصة بك</p>
              </div>
            </div>
            
            {coursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="pt-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : courses?.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">لا توجد دورات بعد</h3>
                  <p className="text-muted-foreground mb-4">ابدأ بإنشاء أول دورة تعليمية لك</p>
                  <Button className="bg-gradient-primary gap-2" onClick={handleOpenCreateModal}>
                    <Plus className="h-4 w-4" />
                    إنشاء دورة جديدة
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses?.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onEdit={handleOpenEditModal}
                    onManageContent={handleManageContent}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  تسليمات المختبرات
                </CardTitle>
                <CardDescription>
                  عرض تسليمات الطلاب للمختبرات المرتبطة بدوراتك
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : !labSubmissions || labSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">لا توجد تسليمات</h3>
                    <p className="text-muted-foreground">
                      سيظهر هنا تسليمات الطلاب للمختبرات المرتبطة بدوراتك
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الطالب</TableHead>
                          <TableHead className="text-right">المختبر</TableHead>
                          <TableHead className="text-right">الوقت المستغرق</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">تاريخ التسليم</TableHead>
                          <TableHead className="text-right">التفاصيل</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {labSubmissions.map((submission) => (
                          <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={submission.user.avatar || undefined} />
                                  <AvatarFallback className="bg-gradient-primary text-white text-xs">
                                    {submission.user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{submission.user.name}</p>
                                  <p className="text-xs text-muted-foreground">{submission.user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className="gap-1"
                                style={{ borderColor: submission.lab.color, color: submission.lab.color }}
                              >
                                <span>{submission.lab.icon}</span>
                                {submission.lab.title}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span className="text-sm">
                                  {Math.floor(submission.timeSpent / 60)} دقيقة
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  submission.status === "approved" ? "default" :
                                  submission.status === "pending" ? "secondary" : "destructive"
                                }
                                className={submission.status === "approved" ? "bg-chart-4" : ""}
                              >
                                {submission.status === "pending" ? "قيد المراجعة" :
                                 submission.status === "approved" ? "مقبول" : "مرفوض"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {submission.submittedAt 
                                ? new Date(submission.submittedAt).toLocaleDateString("ar", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric"
                                  })
                                : "-"
                              }
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => setSelectedSubmission(submission)}
                                data-testid={`button-view-submission-${submission.id}`}
                              >
                                <Eye className="h-3 w-3" />
                                عرض
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>تفاصيل التسليم</DialogTitle>
                  <DialogDescription>
                    معلومات تفصيلية عن تسليم المختبر
                  </DialogDescription>
                </DialogHeader>
                {selectedSubmission && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedSubmission.user.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {selectedSubmission.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{selectedSubmission.user.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedSubmission.user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">المختبر</p>
                        <Badge 
                          variant="outline" 
                          className="gap-1 mt-1"
                          style={{ borderColor: selectedSubmission.lab.color, color: selectedSubmission.lab.color }}
                        >
                          <span>{selectedSubmission.lab.icon}</span>
                          {selectedSubmission.lab.title}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">الوقت المستغرق</p>
                        <p className="font-medium mt-1">{Math.floor(selectedSubmission.timeSpent / 60)} دقيقة</p>
                      </div>
                    </div>

                    {selectedSubmission.details && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">تفاصيل التسليم</p>
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-sm whitespace-pre-wrap">{selectedSubmission.details}</p>
                        </div>
                      </div>
                    )}

                    {selectedSubmission.screenshotUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">لقطة الشاشة</p>
                        <img 
                          src={selectedSubmission.screenshotUrl} 
                          alt="Screenshot" 
                          className="rounded-lg border max-h-64 w-full object-contain"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge
                        variant={
                          selectedSubmission.status === "approved" ? "default" :
                          selectedSubmission.status === "pending" ? "secondary" : "destructive"
                        }
                        className={selectedSubmission.status === "approved" ? "bg-chart-4" : ""}
                      >
                        {selectedSubmission.status === "pending" ? "قيد المراجعة" :
                         selectedSubmission.status === "approved" ? "مقبول" : "مرفوض"}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {selectedSubmission.submittedAt 
                          ? new Date(selectedSubmission.submittedAt).toLocaleDateString("ar", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : "-"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">تقييمات الطلاب</h2>
                <p className="text-muted-foreground">آراء وتقييمات الطلاب على دوراتك</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>ملخص التقييمات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {stats?.averageRating || 0}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${i < Math.round(stats?.averageRating || 0) ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      من {stats?.totalReviews || 0} تقييم
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-12">
                          <span className="text-sm">{rating}</span>
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        </div>
                        <Progress value={rating === 5 ? 70 : rating === 4 ? 20 : 10} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground w-8">
                          {rating === 5 ? "70%" : rating === 4 ? "20%" : "10%"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                {reviewsLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="pt-4">
                          <div className="flex gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : reviews?.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-bold mb-2">لا توجد تقييمات بعد</h3>
                      <p className="text-muted-foreground">سيظهر هنا تقييمات الطلاب على دوراتك</p>
                    </CardContent>
                  </Card>
                ) : (
                  reviews?.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">إحصائيات الأداء</h2>
                <p className="text-muted-foreground">تتبع أداء دوراتك وتفاعل الطلاب</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    معدل الإكمال
                  </CardTitle>
                  <CardDescription>نسبة الطلاب الذين أكملوا الدورات</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="url(#gradient)"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${75 * 3.51} ${100 * 3.51}`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" />
                            <stop offset="100%" stopColor="hsl(var(--secondary))" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold">75%</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">متوسط معدل الإكمال</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" />
                    وقت المشاهدة
                  </CardTitle>
                  <CardDescription>إجمالي وقت المشاهدة هذا الشهر</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-5xl font-bold text-accent mb-2">248</div>
                    <p className="text-xl text-muted-foreground">ساعة</p>
                    <div className="flex items-center justify-center gap-1 mt-4 text-chart-4">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">+18% من الشهر الماضي</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-chart-4" />
                    نشاط الطلاب
                  </CardTitle>
                  <CardDescription>عدد المشاهدات اليومية خلال الأسبوع الماضي</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-2 h-48 pt-4">
                    {["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day, i) => {
                      const heights = [60, 80, 45, 90, 75, 85, 50];
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-md transition-all duration-300 hover:opacity-80"
                            style={{ height: `${heights[i]}%` }}
                          />
                          <span className="text-xs text-muted-foreground">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="labs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">المختبرات التعليمية</h2>
                <p className="text-muted-foreground">إدارة المختبرات العملية الخاصة بك</p>
              </div>
              <Button className="bg-gradient-primary gap-2" onClick={handleOpenCreateLabModal}>
                <Plus className="h-4 w-4" />
                إنشاء مختبر جديد
              </Button>
            </div>
            
            {labsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !instructorLabs || instructorLabs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FlaskConical className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">لا توجد مختبرات بعد</h3>
                  <p className="text-muted-foreground">لم يتم تعيين أي مختبرات لك حتى الآن</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instructorLabs.map((lab) => (
                  <Card key={lab.id} className="overflow-hidden hover-elevate">
                    <div className={`h-2 ${lab.color}`} />
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{lab.icon}</span>
                          <h4 className="font-bold">{lab.title}</h4>
                        </div>
                        <Badge variant={lab.isPublished ? "default" : "secondary"}>
                          {lab.isPublished ? "منشور" : "مسودة"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{lab.description}</p>
                      
                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div>
                          <p className="text-sm font-medium text-primary">{lab.level}</p>
                          <p className="text-xs text-muted-foreground">المستوى</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-accent">{lab.duration} د</p>
                          <p className="text-xs text-muted-foreground">المدة</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-chart-4">{lab.xpReward} XP</p>
                          <p className="text-xs text-muted-foreground">المكافأة</p>
                        </div>
                      </div>
                      
                      {lab.technologies && lab.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {lab.technologies.slice(0, 3).map((tech, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                          {lab.technologies.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{lab.technologies.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full gap-1"
                          onClick={() => handleOpenEditLabModal(lab)}
                        >
                          <Edit className="h-3 w-3" />
                          تعديل
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full gap-1"
                          onClick={() => handleManageLabContent(lab.id)}
                        >
                          <Settings className="h-3 w-3" />
                          إدارة المحتوى
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="w-full gap-1"
                          onClick={() => {
                            if (window.confirm("هل أنت متأكد من حذف هذا المختبر؟")) {
                              deleteLabMutation.mutate(lab.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                          حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={courseModalOpen} onOpenChange={setCourseModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "تعديل الدورة" : "إضافة دورة جديدة"}
              </DialogTitle>
              <DialogDescription>
                {editingCourse 
                  ? "قم بتعديل بيانات الدورة التعليمية" 
                  : "أدخل بيانات الدورة التعليمية الجديدة"
                }
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">عنوان الدورة</Label>
                <Input
                  id="title"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="أدخل عنوان الدورة"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">وصف الدورة</Label>
                <Textarea
                  id="description"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="أدخل وصفاً تفصيلياً للدورة"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <Select
                    value={courseForm.category}
                    onValueChange={(value) => setCourseForm({ ...courseForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AWS">AWS</SelectItem>
                      <SelectItem value="Azure">Azure</SelectItem>
                      <SelectItem value="GCP">GCP</SelectItem>
                      <SelectItem value="DevOps">DevOps</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Database">Database</SelectItem>
                      <SelectItem value="Networking">Networking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="level">المستوى</Label>
                  <Select
                    value={courseForm.level}
                    onValueChange={(value) => setCourseForm({ ...courseForm, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="مبتدئ">مبتدئ</SelectItem>
                      <SelectItem value="متوسط">متوسط</SelectItem>
                      <SelectItem value="متقدم">متقدم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">المدة</Label>
                  <Input
                    id="duration"
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                    placeholder="مثال: 10 ساعات"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="price">السعر (د.أ)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lessonsCount">عدد الدروس</Label>
                  <Input
                    id="lessonsCount"
                    type="number"
                    min="0"
                    value={courseForm.lessonsCount}
                    onChange={(e) => setCourseForm({ ...courseForm, lessonsCount: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="projectsCount">عدد المشاريع</Label>
                  <Input
                    id="projectsCount"
                    type="number"
                    min="0"
                    value={courseForm.projectsCount}
                    onChange={(e) => setCourseForm({ ...courseForm, projectsCount: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="difficulty">الصعوبة (1-5)</Label>
                  <Input
                    id="difficulty"
                    type="number"
                    min="1"
                    max="5"
                    value={courseForm.difficulty}
                    onChange={(e) => setCourseForm({ ...courseForm, difficulty: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublished">نشر الدورة</Label>
                  <p className="text-sm text-muted-foreground">
                    عند التفعيل، ستكون الدورة مرئية للطلاب
                  </p>
                </div>
                <Switch
                  id="isPublished"
                  checked={courseForm.isPublished}
                  onCheckedChange={(checked) => setCourseForm({ ...courseForm, isPublished: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSubmitCourse} 
                disabled={isSubmitting || !courseForm.title || !courseForm.description || !courseForm.duration}
                className="bg-gradient-primary"
              >
                {isSubmitting ? "جاري الحفظ..." : (editingCourse ? "تحديث الدورة" : "إنشاء الدورة")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={labModalOpen} onOpenChange={setLabModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLab ? "تعديل المختبر" : "إنشاء مختبر جديد"}</DialogTitle>
              <DialogDescription>
                {editingLab ? "قم بتعديل بيانات المختبر التعليمي" : "أدخل بيانات المختبر التعليمي الجديد"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lab-title">عنوان المختبر</Label>
                <Input
                  id="lab-title"
                  value={labForm.title}
                  onChange={(e) => setLabForm({ ...labForm, title: e.target.value })}
                  placeholder="أدخل عنوان المختبر"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lab-description">وصف المختبر</Label>
                <Textarea
                  id="lab-description"
                  value={labForm.description}
                  onChange={(e) => setLabForm({ ...labForm, description: e.target.value })}
                  placeholder="أدخل وصفاً تفصيلياً للمختبر"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lab-about">عن المختبر</Label>
                <Textarea
                  id="lab-about"
                  value={labForm.about}
                  onChange={(e) => setLabForm({ ...labForm, about: e.target.value })}
                  placeholder="نبذة تفصيلية عن المختبر وأهدافه ومخرجاته التعليمية"
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lab-environment">بيئة المختبر</Label>
                <Textarea
                  id="lab-environment"
                  value={labForm.environment}
                  onChange={(e) => setLabForm({ ...labForm, environment: e.target.value })}
                  placeholder="وصف البيئة التقنية للمختبر، مثل: نظام التشغيل، الأدوات المطلوبة، الإعدادات..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lab-level">المستوى</Label>
                  <Select
                    value={labForm.level}
                    onValueChange={(value) => setLabForm({ ...labForm, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="مبتدئ">مبتدئ</SelectItem>
                      <SelectItem value="متوسط">متوسط</SelectItem>
                      <SelectItem value="متقدم">متقدم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lab-duration">المدة بالدقائق</Label>
                  <Input
                    id="lab-duration"
                    type="number"
                    min="1"
                    value={labForm.duration}
                    onChange={(e) => setLabForm({ ...labForm, duration: parseInt(e.target.value) || 30 })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lab-xpReward">نقاط الخبرة</Label>
                  <Input
                    id="lab-xpReward"
                    type="number"
                    min="0"
                    value={labForm.xpReward}
                    onChange={(e) => setLabForm({ ...labForm, xpReward: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lab-color">اللون</Label>
                  <Input
                    id="lab-color"
                    value={labForm.color}
                    onChange={(e) => setLabForm({ ...labForm, color: e.target.value })}
                    placeholder="bg-gradient-to-r from-blue-500 to-cyan-500"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lab-technologies">التقنيات</Label>
                <Input
                  id="lab-technologies"
                  value={labForm.technologies}
                  onChange={(e) => setLabForm({ ...labForm, technologies: e.target.value })}
                  placeholder="Docker, Kubernetes, AWS (مفصولة بفاصلة)"
                />
                <p className="text-xs text-muted-foreground">أدخل التقنيات مفصولة بفاصلة</p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCloseLabModal} disabled={isLabSubmitting}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSubmitLab} 
                disabled={isLabSubmitting || !labForm.title || !labForm.description}
                className="bg-gradient-primary"
              >
                {isLabSubmitting ? "جاري الحفظ..." : editingLab ? "تحديث المختبر" : "إنشاء المختبر"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
