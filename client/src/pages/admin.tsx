import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Users, 
  BookOpen, 
  FlaskConical, 
  DollarSign, 
  Star,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  Filter,
  Check,
  X,
  ClipboardList,
  Clock,
  FileText,
  ShoppingCart,
  Heart,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Course, Lab, UserStats, EnrollmentWithUserAndCourse, LabSubmissionWithDetails, HomepageContent, LearningPath, LearningPathWithCourses } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Home, Save, Cloud } from "lucide-react";

// Helper function to get human-readable labels for content keys
function getContentLabel(key: string): string {
  const labels: Record<string, string> = {
    site_logo: "شعار الموقع",
    hero_title: "العنوان الرئيسي",
    hero_subtitle: "العنوان الفرعي",
    hero_cta: "نص زر البدء",
    stats_students: "عدد الطلاب",
    stats_students_label: "نص عدد الطلاب",
    stats_courses: "عدد الدورات",
    stats_courses_label: "نص عدد الدورات",
    stats_labs: "عدد المختبرات",
    stats_labs_label: "نص عدد المختبرات",
    stats_certificates: "عدد الشهادات",
    stats_certificates_label: "نص عدد الشهادات",
    features_title: "عنوان قسم المميزات",
    paths_title: "عنوان قسم المسارات",
    labs_title: "عنوان قسم المختبرات",
  };
  return labels[key] || key;
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient,
  trend 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
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
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    email: "",
    name: "",
    role: "student",
    title: "",
    bio: "",
  });
  
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    category: "AWS",
    level: "مبتدئ",
    duration: "",
    price: 0,
    instructorId: "",
    lessonsCount: 0,
    projectsCount: 0,
    difficulty: 1,
    isPublished: false,
  });

  const [labForm, setLabForm] = useState({
    title: "",
    description: "",
    icon: "flask-conical",
    color: "from-blue-500 to-indigo-500",
    duration: 30,
    level: "مبتدئ",
    xpReward: 100,
    isPublished: false,
  });

  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [pathCoursesModalOpen, setPathCoursesModalOpen] = useState(false);
  const [selectedPathForCourses, setSelectedPathForCourses] = useState<LearningPathWithCourses | null>(null);

  const [pathForm, setPathForm] = useState({
    title: "",
    description: "",
    icon: "route",
    color: "#3b82f6",
    level: "مبتدئ",
    duration: "",
    isPublished: false,
    order: 0,
  });

  if (!user || user.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  const { data: labs, isLoading: labsLoading } = useQuery<Lab[]>({
    queryKey: ["/api/admin/labs"],
  });

  const { data: pendingEnrollments, isLoading: enrollmentsLoading } = useQuery<EnrollmentWithUserAndCourse[]>({
    queryKey: ["/api/admin/enrollments/pending"],
  });

  const { data: labSubmissions, isLoading: submissionsLoading } = useQuery<LabSubmissionWithDetails[]>({
    queryKey: ["/api/admin/lab-submissions"],
  });

  const { data: homepageContent, isLoading: homepageLoading } = useQuery<HomepageContent[]>({
    queryKey: ["/api/admin/homepage-content"],
  });

  const { data: learningPaths, isLoading: pathsLoading } = useQuery<LearningPath[]>({
    queryKey: ["/api/admin/learning-paths"],
  });

  const { data: allCartItems, isLoading: cartLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/cart-items"],
  });

  const { data: allFavorites, isLoading: favoritesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/favorites"],
  });

  const [editingContent, setEditingContent] = useState<Record<string, string>>({});

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      return apiRequest("PATCH", `/api/admin/homepage-content/${id}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/homepage-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/homepage-content"] });
      toast({ title: "تم تحديث المحتوى بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const toggleContentVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: string; isVisible: boolean }) => {
      return apiRequest("PATCH", `/api/admin/homepage-content/${id}`, { isVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/homepage-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/homepage-content"] });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const instructors = users?.filter(u => u.role === "instructor") || [];

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof userForm) => {
      return apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setUserModalOpen(false);
      resetUserForm();
      toast({ title: "تم إنشاء المستخدم بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof userForm> }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setUserModalOpen(false);
      setEditingUser(null);
      resetUserForm();
      toast({ title: "تم تحديث المستخدم بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      toast({ title: "تم حذف المستخدم بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof courseForm) => {
      return apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setCourseModalOpen(false);
      resetCourseForm();
      toast({ title: "تم إنشاء الدورة بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof courseForm> }) => {
      return apiRequest("PATCH", `/api/courses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      setCourseModalOpen(false);
      setEditingCourse(null);
      resetCourseForm();
      toast({ title: "تم تحديث الدورة بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      toast({ title: "تم حذف الدورة بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const createLabMutation = useMutation({
    mutationFn: async (data: typeof labForm) => {
      return apiRequest("POST", "/api/labs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/labs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setLabModalOpen(false);
      resetLabForm();
      toast({ title: "تم إنشاء المختبر بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateLabMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof labForm> }) => {
      return apiRequest("PATCH", `/api/labs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/labs"] });
      setLabModalOpen(false);
      setEditingLab(null);
      resetLabForm();
      toast({ title: "تم تحديث المختبر بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteLabMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/labs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/labs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      toast({ title: "تم حذف المختبر بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const approveEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      return apiRequest("POST", `/api/admin/enrollments/${enrollmentId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "تم قبول طلب التسجيل" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const rejectEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      return apiRequest("POST", `/api/admin/enrollments/${enrollmentId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments/pending"] });
      toast({ title: "تم رفض طلب التسجيل" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const approveLabSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return apiRequest("POST", `/api/admin/lab-submissions/${submissionId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lab-submissions"] });
      toast({ title: "تم قبول تسليم المختبر" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const rejectLabSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return apiRequest("POST", `/api/admin/lab-submissions/${submissionId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lab-submissions"] });
      toast({ title: "تم رفض تسليم المختبر" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const createPathMutation = useMutation({
    mutationFn: async (data: typeof pathForm) => {
      return apiRequest("POST", "/api/admin/learning-paths", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/learning-paths"] });
      setPathModalOpen(false);
      resetPathForm();
      toast({ title: "تم إنشاء المسار بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updatePathMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof pathForm> }) => {
      return apiRequest("PATCH", `/api/admin/learning-paths/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/learning-paths"] });
      setPathModalOpen(false);
      setEditingPath(null);
      resetPathForm();
      toast({ title: "تم تحديث المسار بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deletePathMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/learning-paths/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/learning-paths"] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      toast({ title: "تم حذف المسار بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const addCourseToPathMutation = useMutation({
    mutationFn: async ({ pathId, courseId }: { pathId: string; courseId: string }) => {
      return apiRequest("POST", `/api/admin/learning-paths/${pathId}/courses`, { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/learning-paths"] });
      if (selectedPathForCourses) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/learning-paths", selectedPathForCourses.id] });
      }
      toast({ title: "تم إضافة الدورة للمسار" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const removeCourseFromPathMutation = useMutation({
    mutationFn: async ({ pathId, courseId }: { pathId: string; courseId: string }) => {
      return apiRequest("DELETE", `/api/admin/learning-paths/${pathId}/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/learning-paths"] });
      if (selectedPathForCourses) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/learning-paths", selectedPathForCourses.id] });
      }
      toast({ title: "تم إزالة الدورة من المسار" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const resetUserForm = () => {
    setUserForm({ username: "", password: "", email: "", name: "", role: "student", title: "", bio: "" });
  };

  const resetCourseForm = () => {
    setCourseForm({ title: "", description: "", category: "AWS", level: "مبتدئ", duration: "", price: 0, instructorId: "", lessonsCount: 0, projectsCount: 0, difficulty: 1, isPublished: false });
  };

  const resetLabForm = () => {
    setLabForm({ title: "", description: "", icon: "flask-conical", color: "from-blue-500 to-indigo-500", duration: 30, level: "مبتدئ", xpReward: 100, isPublished: false });
  };

  const resetPathForm = () => {
    setPathForm({ title: "", description: "", icon: "route", color: "#3b82f6", level: "مبتدئ", duration: "", isPublished: false, order: 0 });
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      password: "",
      email: u.email,
      name: u.name,
      role: u.role,
      title: u.title || "",
      bio: u.bio || "",
    });
    setUserModalOpen(true);
  };

  const openEditCourse = (c: Course) => {
    setEditingCourse(c);
    setCourseForm({
      title: c.title,
      description: c.description,
      category: c.category,
      level: c.level,
      duration: c.duration,
      price: c.price,
      instructorId: c.instructorId,
      lessonsCount: c.lessonsCount,
      projectsCount: c.projectsCount,
      difficulty: c.difficulty,
      isPublished: c.isPublished,
    });
    setCourseModalOpen(true);
  };

  const openEditLab = (l: Lab) => {
    setEditingLab(l);
    setLabForm({
      title: l.title,
      description: l.description,
      icon: l.icon,
      color: l.color,
      duration: l.duration,
      level: l.level,
      xpReward: l.xpReward,
      isPublished: l.isPublished,
    });
    setLabModalOpen(true);
  };

  const handleUserSubmit = () => {
    if (editingUser) {
      const data = { ...userForm };
      if (!data.password) delete (data as any).password;
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(userForm);
    }
  };

  const handleCourseSubmit = () => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: courseForm });
    } else {
      createCourseMutation.mutate(courseForm);
    }
  };

  const handleLabSubmit = () => {
    if (editingLab) {
      updateLabMutation.mutate({ id: editingLab.id, data: labForm });
    } else {
      createLabMutation.mutate(labForm);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "user") {
      deleteUserMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === "course") {
      deleteCourseMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === "lab") {
      deleteLabMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === "path") {
      deletePathMutation.mutate(deleteTarget.id);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-destructive">مدير</Badge>;
      case "instructor":
        return <Badge className="bg-primary">محاضر</Badge>;
      default:
        return <Badge variant="secondary">طالب</Badge>;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">لوحة تحكم الإدارة</h1>
            <p className="text-muted-foreground">مرحباً {user.name}، إدارة كاملة للمنصة</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button 
              className="bg-gradient-primary gap-2" 
              data-testid="button-add-course"
              onClick={() => { resetCourseForm(); setEditingCourse(null); setCourseModalOpen(true); }}
            >
              <Plus className="h-4 w-4" />
              إضافة دورة
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              data-testid="button-add-user"
              onClick={() => { resetUserForm(); setEditingUser(null); setUserModalOpen(true); }}
            >
              <Plus className="h-4 w-4" />
              إضافة مستخدم
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
                trend="+12% هذا الشهر"
              />
              <StatCard 
                title="إجمالي الدورات" 
                value={stats?.totalCourses?.toString() || "0"} 
                icon={BookOpen} 
                gradient="bg-gradient-to-r from-chart-4 to-teal-400"
                trend="+2 دورات جديدة"
              />
              <StatCard 
                title="المختبرات" 
                value={stats?.totalLabs?.toString() || "0"} 
                icon={FlaskConical} 
                gradient="bg-gradient-to-r from-secondary to-pink-400"
              />
              <StatCard 
                title="إجمالي الإيرادات" 
                value={`${stats?.totalRevenue?.toLocaleString() || 0} د.أ`} 
                icon={DollarSign} 
                gradient="bg-gradient-to-r from-accent to-orange-400"
                trend="+25% هذا الشهر"
              />
            </>
          )}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <Star className="h-8 w-8 text-white" />
              </div>
              <p className="text-3xl font-bold">{stats?.averageRating?.toFixed(1) || 0}</p>
              <p className="text-sm text-muted-foreground">متوسط التقييم</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-chart-4 to-teal-400 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <p className="text-3xl font-bold">{stats?.totalEnrollments || 0}</p>
              <p className="text-sm text-muted-foreground">إجمالي التسجيلات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-accent to-orange-400 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <p className="text-3xl font-bold">{users?.filter(u => u.role === "instructor").length || 0}</p>
              <p className="text-sm text-muted-foreground">المحاضرون</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 w-full max-w-5xl">
            <TabsTrigger value="users" data-testid="tab-users">المستخدمون</TabsTrigger>
            <TabsTrigger value="courses" data-testid="tab-courses">الدورات</TabsTrigger>
            <TabsTrigger value="paths" data-testid="tab-paths">المسارات</TabsTrigger>
            <TabsTrigger value="labs" data-testid="tab-labs">المختبرات</TabsTrigger>
            <TabsTrigger value="enrollments" data-testid="tab-enrollments">طلبات التسجيل</TabsTrigger>
            <TabsTrigger value="submissions" data-testid="tab-submissions">التسليمات</TabsTrigger>
            <TabsTrigger value="cart" data-testid="tab-cart">سلات التسوق</TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites">المفضلات</TabsTrigger>
            <TabsTrigger value="homepage" data-testid="tab-homepage">الصفحة الرئيسية</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>إدارة المستخدمين</CardTitle>
                    <CardDescription>جميع المستخدمين المسجلين في المنصة</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="بحث..." className="pr-9 w-64" data-testid="input-search-users" />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>المستوى</TableHead>
                        <TableHead>النقاط</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((u) => (
                        <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={u.avatar || undefined} />
                                <AvatarFallback className="bg-gradient-primary text-white text-xs">
                                  {u.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{u.name}</p>
                                <p className="text-xs text-muted-foreground">@{u.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>{getRoleBadge(u.role)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.level}</Badge>
                          </TableCell>
                          <TableCell>{u.points?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={u.isActive ? "default" : "secondary"} className={u.isActive ? "bg-chart-4" : ""}>
                              {u.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-menu-user-${u.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditUser(u)}>
                                  <Edit className="h-4 w-4 ml-2" /> تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => { setDeleteTarget({ type: "user", id: u.id, name: u.name }); setDeleteDialogOpen(true); }}
                                >
                                  <Trash2 className="h-4 w-4 ml-2" /> حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>إدارة الدورات</CardTitle>
                    <CardDescription>جميع الدورات والمسارات التعليمية</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="بحث..." className="pr-9 w-64" data-testid="input-search-courses" />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الدورة</TableHead>
                        <TableHead>الفئة</TableHead>
                        <TableHead>المستوى</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>الطلاب</TableHead>
                        <TableHead>التقييم</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses?.map((course) => (
                        <TableRow key={course.id} data-testid={`row-course-${course.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img 
                                src={course.image || "https://placehold.co/80x60"} 
                                alt={course.title}
                                className="w-16 h-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium line-clamp-1">{course.title}</p>
                                <p className="text-xs text-muted-foreground">{course.duration}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{course.category}</Badge></TableCell>
                          <TableCell>{course.level}</TableCell>
                          <TableCell className="font-medium">{course.price} د.أ</TableCell>
                          <TableCell>{course.studentsCount?.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              <span>{course.rating}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={course.isPublished ? "default" : "secondary"} className={course.isPublished ? "bg-chart-4" : ""}>
                              {course.isPublished ? "منشور" : "مسودة"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-menu-course-${course.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setLocation(`/courses/${course.id}`)}>
                                  <Eye className="h-4 w-4 ml-2" /> عرض
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLocation(`/admin/courses/${course.id}/content`)}>
                                  <FileText className="h-4 w-4 ml-2" /> إدارة المحتوى
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditCourse(course)}>
                                  <Edit className="h-4 w-4 ml-2" /> تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => { setDeleteTarget({ type: "course", id: course.id, name: course.title }); setDeleteDialogOpen(true); }}
                                >
                                  <Trash2 className="h-4 w-4 ml-2" /> حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paths">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>إدارة المسارات التعليمية</CardTitle>
                    <CardDescription>مسارات التعلم التي تجمع الدورات ذات الصلة</CardDescription>
                  </div>
                  <Button onClick={() => { resetPathForm(); setEditingPath(null); setPathModalOpen(true); }} data-testid="button-add-path">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مسار
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {pathsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : learningPaths && learningPaths.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المسار</TableHead>
                        <TableHead>المستوى</TableHead>
                        <TableHead>عدد الدورات</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {learningPaths.map((path) => (
                        <TableRow key={path.id} data-testid={`path-row-${path.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: path.color }}>
                                <BookOpen className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium">{path.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{path.description}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{path.level}</Badge>
                          </TableCell>
                          <TableCell>{path.coursesCount} دورات</TableCell>
                          <TableCell>
                            <Badge variant={path.isPublished ? "default" : "secondary"}>
                              {path.isPublished ? "منشور" : "مسودة"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-path-menu-${path.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={async () => {
                                  const pathWithCourses = await fetch(`/api/admin/learning-paths/${path.id}`, {
                                    headers: { "x-user-id": user?.id || "" }
                                  }).then(r => r.json());
                                  setSelectedPathForCourses(pathWithCourses);
                                  setPathCoursesModalOpen(true);
                                }}>
                                  <BookOpen className="h-4 w-4 ml-2" />
                                  إدارة الدورات
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setEditingPath(path);
                                  setPathForm({
                                    title: path.title,
                                    description: path.description,
                                    icon: path.icon || "route",
                                    color: path.color,
                                    level: path.level,
                                    duration: path.duration || "",
                                    isPublished: path.isPublished,
                                    order: path.order,
                                  });
                                  setPathModalOpen(true);
                                }}>
                                  <Edit className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => {
                                    setDeleteTarget({ type: "path", id: path.id, name: path.title });
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد مسارات تعليمية حالياً</p>
                    <Button variant="outline" className="mt-4" onClick={() => { resetPathForm(); setPathModalOpen(true); }}>
                      <Plus className="h-4 w-4 ml-2" />
                      إنشاء مسار جديد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="labs">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>إدارة المختبرات</CardTitle>
                    <CardDescription>جميع المختبرات التفاعلية</CardDescription>
                  </div>
                  <Button 
                    className="bg-gradient-primary gap-2" 
                    data-testid="button-add-lab"
                    onClick={() => { resetLabForm(); setEditingLab(null); setLabModalOpen(true); }}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مختبر
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {labsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {labs?.map((lab) => (
                      <Card key={lab.id} className="hover-elevate" data-testid={`card-lab-${lab.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${lab.color} flex items-center justify-center`}>
                              <FlaskConical className="h-6 w-6 text-white" />
                            </div>
                            <Badge variant={lab.isPublished ? "default" : "secondary"} className={lab.isPublished ? "bg-chart-4" : ""}>
                              {lab.isPublished ? "منشور" : "مسودة"}
                            </Badge>
                          </div>
                          <h4 className="font-bold mb-2">{lab.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{lab.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{lab.duration} دقيقة</span>
                            <span>{lab.level}</span>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="flex-1" 
                              onClick={() => setLocation(`/admin/labs/${lab.id}/content`)}
                              data-testid={`button-lab-content-${lab.id}`}
                            >
                              <FileText className="h-3 w-3 ml-1" /> المحتوى
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditLab(lab)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => { setDeleteTarget({ type: "lab", id: lab.id, name: lab.title }); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      طلبات التسجيل
                      {pendingEnrollments && pendingEnrollments.length > 0 && (
                        <Badge className="bg-accent">{pendingEnrollments.length}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      طلبات تحتاج إلى موافقة الإدارة بعد استلام الدفعة
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {enrollmentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : pendingEnrollments && pendingEnrollments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead>معلومات التواصل</TableHead>
                        <TableHead>الدورة</TableHead>
                        <TableHead>طريقة الدفع</TableHead>
                        <TableHead>تاريخ الطلب</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingEnrollments.map((enrollment) => (
                        <TableRow key={enrollment.id} data-testid={`row-enrollment-${enrollment.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={enrollment.user.avatar || undefined} />
                                <AvatarFallback className="bg-gradient-primary text-white text-xs">
                                  {enrollment.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{enrollment.user.name}</p>
                                <p className="text-xs text-muted-foreground">{enrollment.user.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <p className="font-medium">{enrollment.contactName || "-"}</p>
                              <p className="text-muted-foreground text-xs" dir="ltr">{enrollment.contactEmail || "-"}</p>
                              <p className="text-muted-foreground text-xs" dir="ltr">{enrollment.contactPhone || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{enrollment.course.title}</p>
                              <Badge variant="outline" className="text-xs">{enrollment.course.category}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={enrollment.paymentMethod === "cliq" ? "bg-green-500" : "bg-blue-500"}>
                              {enrollment.paymentMethod === "cliq" ? "CliQ" : enrollment.paymentMethod === "paypal" ? "PayPal" : "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString("ar-JO") : "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-chart-4 gap-1"
                                onClick={() => approveEnrollmentMutation.mutate(enrollment.id)}
                                disabled={approveEnrollmentMutation.isPending}
                                data-testid={`button-approve-enrollment-${enrollment.id}`}
                              >
                                <Check className="h-3 w-3" />
                                قبول
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="gap-1"
                                onClick={() => rejectEnrollmentMutation.mutate(enrollment.id)}
                                disabled={rejectEnrollmentMutation.isPending}
                                data-testid={`button-reject-enrollment-${enrollment.id}`}
                              >
                                <X className="h-3 w-3" />
                                رفض
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">لا توجد طلبات تسجيل معلقة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  تسليمات المختبرات
                </CardTitle>
                <CardDescription>
                  عرض وإدارة تسليمات المختبرات من الطلاب
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
                    <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">لا توجد تسليمات بعد</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead>المختبر</TableHead>
                        <TableHead>الوقت المستغرق</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ التسليم</TableHead>
                        <TableHead>التفاصيل</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labSubmissions.map((submission) => (
                        <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={submission.user.avatar || undefined} />
                                <AvatarFallback>{submission.user.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{submission.user.name}</p>
                                <p className="text-xs text-muted-foreground">{submission.user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`bg-gradient-to-r ${submission.lab.color} text-white border-0`}>
                              {submission.lab.title}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(submission.timeSpent / 60)} دقيقة
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              submission.status === "approved" ? "default" :
                              submission.status === "rejected" ? "destructive" : "secondary"
                            }>
                              {submission.status === "approved" ? "مقبول" :
                               submission.status === "rejected" ? "مرفوض" : "معلق"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString("ar-JO") : "-"}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const modal = document.getElementById(`submission-${submission.id}`);
                                  if (modal) (modal as HTMLDialogElement).showModal();
                                }}
                                data-testid={`button-view-${submission.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Dialog>
                          </TableCell>
                          <TableCell>
                            {submission.status === "pending" && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => approveLabSubmissionMutation.mutate(submission.id)}
                                  disabled={approveLabSubmissionMutation.isPending}
                                  data-testid={`button-approve-submission-${submission.id}`}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => rejectLabSubmissionMutation.mutate(submission.id)}
                                  disabled={rejectLabSubmissionMutation.isPending}
                                  data-testid={`button-reject-submission-${submission.id}`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Submission Details Dialogs */}
            {labSubmissions?.map((submission) => (
              <dialog 
                key={submission.id} 
                id={`submission-${submission.id}`}
                className="p-6 rounded-lg shadow-xl backdrop:bg-black/50 max-w-lg w-full"
              >
                <div className="space-y-4" dir="rtl">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold">{submission.lab.title}</h3>
                    <button 
                      onClick={() => {
                        const modal = document.getElementById(`submission-${submission.id}`);
                        if (modal) (modal as HTMLDialogElement).close();
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>الطالب:</strong> {submission.user.name}</p>
                    <p className="text-sm"><strong>الوقت:</strong> {Math.floor(submission.timeSpent / 60)} دقيقة</p>
                    <p className="text-sm"><strong>التفاصيل:</strong> {submission.details || "لا توجد تفاصيل"}</p>
                  </div>
                  {submission.screenshotUrl && (
                    <div>
                      <p className="text-sm font-medium mb-2">الصورة:</p>
                      <img 
                        src={submission.screenshotUrl} 
                        alt="Screenshot" 
                        className="w-full rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </dialog>
            ))}
          </TabsContent>

          <TabsContent value="cart">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  سلات التسوق
                </CardTitle>
                <CardDescription>
                  عرض جميع العناصر في سلات تسوق المستخدمين
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cartLoading ? (
                  <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                ) : allCartItems && allCartItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>نوع العنصر</TableHead>
                        <TableHead>اسم العنصر</TableHead>
                        <TableHead>تاريخ الإضافة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCartItems.map((item: any) => (
                        <TableRow key={item.id} data-testid={`admin-cart-item-${item.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{item.user?.name?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{item.user?.name || 'مستخدم'}</p>
                                <p className="text-xs text-muted-foreground">{item.user?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.itemType === 'course' ? 'default' : 'secondary'}>
                              {item.itemType === 'course' ? (
                                <><BookOpen className="h-3 w-3 ml-1" /> دورة</>
                              ) : (
                                <><GraduationCap className="h-3 w-3 ml-1" /> مسار</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.course?.title || item.path?.title || '-'}</TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleDateString('ar-JO')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد عناصر في سلات التسوق</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  المفضلات
                </CardTitle>
                <CardDescription>
                  عرض جميع العناصر المفضلة لدى المستخدمين
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favoritesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                ) : allFavorites && allFavorites.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>نوع العنصر</TableHead>
                        <TableHead>اسم العنصر</TableHead>
                        <TableHead>تاريخ الإضافة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allFavorites.map((fav: any) => (
                        <TableRow key={fav.id} data-testid={`admin-favorite-${fav.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{fav.user?.name?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{fav.user?.name || 'مستخدم'}</p>
                                <p className="text-xs text-muted-foreground">{fav.user?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={fav.itemType === 'course' ? 'default' : 'secondary'}>
                              {fav.itemType === 'course' ? (
                                <><BookOpen className="h-3 w-3 ml-1" /> دورة</>
                              ) : (
                                <><GraduationCap className="h-3 w-3 ml-1" /> مسار</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>{fav.course?.title || fav.path?.title || '-'}</TableCell>
                          <TableCell>{new Date(fav.createdAt).toLocaleDateString('ar-JO')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد عناصر في المفضلات</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homepage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  إدارة محتوى الصفحة الرئيسية
                </CardTitle>
                <CardDescription>
                  تعديل النصوص والأرقام المعروضة في الصفحة الرئيسية
                </CardDescription>
              </CardHeader>
              <CardContent>
                {homepageLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : homepageContent && homepageContent.length > 0 ? (
                  <div className="space-y-6">
                    {/* Logo Section */}
                    {(() => {
                      const logoContent = homepageContent.find(c => c.key === "site_logo");
                      if (!logoContent) return null;
                      return (
                        <div className="space-y-4">
                          <h3 className="font-bold text-lg border-b pb-2">شعار الموقع</h3>
                          <Card className="p-4" data-testid="homepage-content-site_logo">
                            <div className="flex flex-col md:flex-row items-start gap-6">
                              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/50">
                                {(editingContent[logoContent.id] || logoContent.value) ? (
                                  <img 
                                    src={editingContent[logoContent.id] ?? logoContent.value} 
                                    alt="شعار الموقع" 
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="text-center text-muted-foreground">
                                    <Cloud className="h-10 w-10 mx-auto mb-2" />
                                    <span className="text-xs">لا يوجد شعار</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-4">
                                <div className="space-y-2">
                                  <Label>رابط صورة الشعار (URL)</Label>
                                  <Input
                                    placeholder="https://example.com/logo.png"
                                    value={editingContent[logoContent.id] ?? logoContent.value}
                                    onChange={(e) => setEditingContent({...editingContent, [logoContent.id]: e.target.value})}
                                    data-testid="input-homepage-site_logo"
                                  />
                                  <p className="text-xs text-muted-foreground">أدخل رابط URL لصورة الشعار. يُفضل استخدام صورة بصيغة PNG أو SVG بخلفية شفافة.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Button 
                                    onClick={() => {
                                      if (editingContent[logoContent.id] !== undefined && editingContent[logoContent.id] !== logoContent.value) {
                                        updateContentMutation.mutate({ id: logoContent.id, value: editingContent[logoContent.id] });
                                      }
                                    }}
                                    disabled={editingContent[logoContent.id] === undefined || editingContent[logoContent.id] === logoContent.value}
                                    data-testid="button-save-site_logo"
                                  >
                                    <Save className="h-4 w-4 ml-2" />
                                    حفظ الشعار
                                  </Button>
                                  <div className="flex items-center gap-2">
                                    <Switch 
                                      checked={logoContent.isVisible}
                                      onCheckedChange={(checked) => toggleContentVisibilityMutation.mutate({ id: logoContent.id, isVisible: checked })}
                                      data-testid="switch-visibility-site_logo"
                                    />
                                    <span className="text-sm text-muted-foreground">إظهار الشعار</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      );
                    })()}

                    {/* Group content by category */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg border-b pb-2">قسم الترحيب (Hero)</h3>
                      {homepageContent
                        .filter(c => c.key.startsWith("hero_"))
                        .map((content) => (
                          <div key={content.id} className="flex items-center gap-4 p-4 rounded-lg border" data-testid={`homepage-content-${content.key}`}>
                            <div className="flex-1 space-y-2">
                              <Label className="text-muted-foreground">{getContentLabel(content.key)}</Label>
                              <Input
                                value={editingContent[content.id] ?? content.value}
                                onChange={(e) => setEditingContent({...editingContent, [content.id]: e.target.value})}
                                data-testid={`input-homepage-${content.key}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={content.isVisible}
                                onCheckedChange={(checked) => toggleContentVisibilityMutation.mutate({ id: content.id, isVisible: checked })}
                                data-testid={`switch-visibility-${content.key}`}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  if (editingContent[content.id] !== undefined && editingContent[content.id] !== content.value) {
                                    updateContentMutation.mutate({ id: content.id, value: editingContent[content.id] });
                                  }
                                }}
                                disabled={editingContent[content.id] === undefined || editingContent[content.id] === content.value}
                                data-testid={`button-save-${content.key}`}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-lg border-b pb-2">الإحصائيات</h3>
                      {homepageContent
                        .filter(c => c.key.startsWith("stats_"))
                        .map((content) => (
                          <div key={content.id} className="flex items-center gap-4 p-4 rounded-lg border" data-testid={`homepage-content-${content.key}`}>
                            <div className="flex-1 space-y-2">
                              <Label className="text-muted-foreground">{getContentLabel(content.key)}</Label>
                              <Input
                                type={content.type === "number" ? "number" : "text"}
                                value={editingContent[content.id] ?? content.value}
                                onChange={(e) => setEditingContent({...editingContent, [content.id]: e.target.value})}
                                data-testid={`input-homepage-${content.key}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={content.isVisible}
                                onCheckedChange={(checked) => toggleContentVisibilityMutation.mutate({ id: content.id, isVisible: checked })}
                                data-testid={`switch-visibility-${content.key}`}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  if (editingContent[content.id] !== undefined && editingContent[content.id] !== content.value) {
                                    updateContentMutation.mutate({ id: content.id, value: editingContent[content.id] });
                                  }
                                }}
                                disabled={editingContent[content.id] === undefined || editingContent[content.id] === content.value}
                                data-testid={`button-save-${content.key}`}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-lg border-b pb-2">عناوين الأقسام</h3>
                      {homepageContent
                        .filter(c => c.key.endsWith("_title") && !c.key.startsWith("hero_"))
                        .map((content) => (
                          <div key={content.id} className="flex items-center gap-4 p-4 rounded-lg border" data-testid={`homepage-content-${content.key}`}>
                            <div className="flex-1 space-y-2">
                              <Label className="text-muted-foreground">{getContentLabel(content.key)}</Label>
                              <Input
                                value={editingContent[content.id] ?? content.value}
                                onChange={(e) => setEditingContent({...editingContent, [content.id]: e.target.value})}
                                data-testid={`input-homepage-${content.key}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={content.isVisible}
                                onCheckedChange={(checked) => toggleContentVisibilityMutation.mutate({ id: content.id, isVisible: checked })}
                                data-testid={`switch-visibility-${content.key}`}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  if (editingContent[content.id] !== undefined && editingContent[content.id] !== content.value) {
                                    updateContentMutation.mutate({ id: content.id, value: editingContent[content.id] });
                                  }
                                }}
                                disabled={editingContent[content.id] === undefined || editingContent[content.id] === content.value}
                                data-testid={`button-save-${content.key}`}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">لا يوجد محتوى للصفحة الرئيسية</p>
                    <Button 
                      className="mt-4"
                      onClick={() => {
                        apiRequest("POST", "/api/admin/seed-homepage", {});
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/homepage-content"] });
                      }}
                    >
                      إنشاء المحتوى الافتراضي
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "تعديل بيانات المستخدم" : "إنشاء حساب مستخدم جديد في المنصة"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">الاسم</Label>
              <Input 
                id="name" 
                value={userForm.name} 
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                data-testid="input-user-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input 
                id="username" 
                value={userForm.username} 
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                data-testid="input-user-username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input 
                id="email" 
                type="email"
                value={userForm.email} 
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                data-testid="input-user-email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{editingUser ? "كلمة المرور (اتركها فارغة لعدم التغيير)" : "كلمة المرور"}</Label>
              <Input 
                id="password" 
                type="password"
                value={userForm.password} 
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                data-testid="input-user-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">الدور</Label>
              <Select value={userForm.role} onValueChange={(val) => setUserForm({...userForm, role: val})}>
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="instructor">محاضر</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">اللقب</Label>
              <Input 
                id="title" 
                value={userForm.title} 
                onChange={(e) => setUserForm({...userForm, title: e.target.value})}
                data-testid="input-user-title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserModalOpen(false)}>إلغاء</Button>
            <Button 
              onClick={handleUserSubmit}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
              data-testid="button-submit-user"
            >
              {editingUser ? "حفظ التغييرات" : "إنشاء المستخدم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={courseModalOpen} onOpenChange={setCourseModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "تعديل الدورة" : "إضافة دورة جديدة"}</DialogTitle>
            <DialogDescription>
              {editingCourse ? "تعديل بيانات الدورة" : "إنشاء دورة تعليمية جديدة"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="courseTitle">عنوان الدورة</Label>
              <Input 
                id="courseTitle" 
                value={courseForm.title} 
                onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                data-testid="input-course-title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="courseDesc">الوصف</Label>
              <Textarea 
                id="courseDesc" 
                value={courseForm.description} 
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                rows={3}
                data-testid="input-course-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">الفئة</Label>
                <Select value={courseForm.category} onValueChange={(val) => setCourseForm({...courseForm, category: val})}>
                  <SelectTrigger data-testid="select-course-category">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AWS">AWS</SelectItem>
                    <SelectItem value="Azure">Azure</SelectItem>
                    <SelectItem value="GCP">GCP</SelectItem>
                    <SelectItem value="Kubernetes">Kubernetes</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="level">المستوى</Label>
                <Select value={courseForm.level} onValueChange={(val) => setCourseForm({...courseForm, level: val})}>
                  <SelectTrigger data-testid="select-course-level">
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
                  onChange={(e) => setCourseForm({...courseForm, duration: e.target.value})}
                  placeholder="مثال: 40 ساعة"
                  data-testid="input-course-duration"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">السعر (د.أ)</Label>
                <Input 
                  id="price" 
                  type="number"
                  value={courseForm.price} 
                  onChange={(e) => setCourseForm({...courseForm, price: parseFloat(e.target.value) || 0})}
                  data-testid="input-course-price"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instructor">المحاضر</Label>
              <Select value={courseForm.instructorId} onValueChange={(val) => setCourseForm({...courseForm, instructorId: val})}>
                <SelectTrigger data-testid="select-course-instructor">
                  <SelectValue placeholder="اختر المحاضر" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isPublished"
                checked={courseForm.isPublished}
                onChange={(e) => setCourseForm({...courseForm, isPublished: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="isPublished">نشر الدورة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseModalOpen(false)}>إلغاء</Button>
            <Button 
              onClick={handleCourseSubmit}
              disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
              data-testid="button-submit-course"
            >
              {editingCourse ? "حفظ التغييرات" : "إنشاء الدورة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={labModalOpen} onOpenChange={setLabModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLab ? "تعديل المختبر" : "إضافة مختبر جديد"}</DialogTitle>
            <DialogDescription>
              {editingLab ? "تعديل بيانات المختبر" : "إنشاء مختبر تفاعلي جديد"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="labTitle">عنوان المختبر</Label>
              <Input 
                id="labTitle" 
                value={labForm.title} 
                onChange={(e) => setLabForm({...labForm, title: e.target.value})}
                data-testid="input-lab-title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="labDesc">الوصف</Label>
              <Textarea 
                id="labDesc" 
                value={labForm.description} 
                onChange={(e) => setLabForm({...labForm, description: e.target.value})}
                rows={3}
                data-testid="input-lab-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="labDuration">المدة (دقيقة)</Label>
                <Input 
                  id="labDuration" 
                  type="number"
                  value={labForm.duration} 
                  onChange={(e) => setLabForm({...labForm, duration: parseInt(e.target.value) || 30})}
                  data-testid="input-lab-duration"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="labLevel">المستوى</Label>
                <Select value={labForm.level} onValueChange={(val) => setLabForm({...labForm, level: val})}>
                  <SelectTrigger data-testid="select-lab-level">
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
            <div className="grid gap-2">
              <Label htmlFor="xpReward">نقاط الخبرة</Label>
              <Input 
                id="xpReward" 
                type="number"
                value={labForm.xpReward} 
                onChange={(e) => setLabForm({...labForm, xpReward: parseInt(e.target.value) || 100})}
                data-testid="input-lab-xp"
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="labPublished"
                checked={labForm.isPublished}
                onChange={(e) => setLabForm({...labForm, isPublished: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="labPublished">نشر المختبر</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLabModalOpen(false)}>إلغاء</Button>
            <Button 
              onClick={handleLabSubmit}
              disabled={createLabMutation.isPending || updateLabMutation.isPending}
              data-testid="button-submit-lab"
            >
              {editingLab ? "حفظ التغييرات" : "إنشاء المختبر"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pathModalOpen} onOpenChange={setPathModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPath ? "تعديل المسار" : "إضافة مسار جديد"}</DialogTitle>
            <DialogDescription>
              {editingPath ? "قم بتعديل بيانات المسار التعليمي" : "أنشئ مسار تعليمي جديد يجمع الدورات ذات الصلة"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pathTitle">اسم المسار</Label>
              <Input 
                id="pathTitle" 
                value={pathForm.title} 
                onChange={(e) => setPathForm({...pathForm, title: e.target.value})}
                placeholder="مثال: مسار DevOps"
                data-testid="input-path-title"
              />
            </div>
            <div>
              <Label htmlFor="pathDescription">الوصف</Label>
              <Textarea 
                id="pathDescription" 
                value={pathForm.description} 
                onChange={(e) => setPathForm({...pathForm, description: e.target.value})}
                placeholder="وصف المسار التعليمي..."
                data-testid="input-path-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pathLevel">المستوى</Label>
                <Select value={pathForm.level} onValueChange={(v) => setPathForm({...pathForm, level: v})}>
                  <SelectTrigger id="pathLevel" data-testid="select-path-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="مبتدئ">مبتدئ</SelectItem>
                    <SelectItem value="متوسط">متوسط</SelectItem>
                    <SelectItem value="متقدم">متقدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pathDuration">المدة</Label>
                <Input 
                  id="pathDuration" 
                  value={pathForm.duration} 
                  onChange={(e) => setPathForm({...pathForm, duration: e.target.value})}
                  placeholder="مثال: 3 أشهر"
                  data-testid="input-path-duration"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pathColor">اللون</Label>
              <div className="flex gap-2">
                <Input 
                  id="pathColor" 
                  type="color"
                  value={pathForm.color} 
                  onChange={(e) => setPathForm({...pathForm, color: e.target.value})}
                  className="w-16 h-10 p-1"
                  data-testid="input-path-color"
                />
                <Input 
                  value={pathForm.color} 
                  onChange={(e) => setPathForm({...pathForm, color: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="pathPublished"
                checked={pathForm.isPublished}
                onChange={(e) => setPathForm({...pathForm, isPublished: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="pathPublished">نشر المسار</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPathModalOpen(false)}>إلغاء</Button>
            <Button 
              onClick={() => {
                if (editingPath) {
                  updatePathMutation.mutate({ id: editingPath.id, data: pathForm });
                } else {
                  createPathMutation.mutate(pathForm);
                }
              }}
              disabled={createPathMutation.isPending || updatePathMutation.isPending}
              data-testid="button-submit-path"
            >
              {editingPath ? "حفظ التغييرات" : "إنشاء المسار"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pathCoursesModalOpen} onOpenChange={setPathCoursesModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إدارة دورات المسار: {selectedPathForCourses?.title}</DialogTitle>
            <DialogDescription>
              أضف أو أزل الدورات من هذا المسار التعليمي
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">الدورات في المسار</h4>
              {selectedPathForCourses?.courses && selectedPathForCourses.courses.length > 0 ? (
                <div className="space-y-2">
                  {selectedPathForCourses.courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-sm text-muted-foreground">{course.category} - {course.level}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={async () => {
                          await removeCourseFromPathMutation.mutateAsync({ 
                            pathId: selectedPathForCourses.id, 
                            courseId: course.id 
                          });
                          const updatedPath = await fetch(`/api/admin/learning-paths/${selectedPathForCourses.id}`, {
                            headers: { "x-user-id": user?.id || "" }
                          }).then(r => r.json());
                          setSelectedPathForCourses(updatedPath);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد دورات في هذا المسار</p>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-2">إضافة دورة</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {courses?.filter(c => !selectedPathForCourses?.courses?.some(pc => pc.id === c.id)).map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground">{course.category} - {course.level}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        if (selectedPathForCourses) {
                          await addCourseToPathMutation.mutateAsync({ 
                            pathId: selectedPathForCourses.id, 
                            courseId: course.id 
                          });
                          const updatedPath = await fetch(`/api/admin/learning-paths/${selectedPathForCourses.id}`, {
                            headers: { "x-user-id": user?.id || "" }
                          }).then(r => r.json());
                          setSelectedPathForCourses(updatedPath);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPathCoursesModalOpen(false)}>تم</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف "{deleteTarget?.name}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
