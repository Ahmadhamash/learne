import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Star, 
  BookOpen, 
  Trophy,
  Clock,
  Flame,
  Crown,
  Award,
  Target,
  ChevronLeft,
  Play,
  CheckCircle,
  FlaskConical,
  Medal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import type { Enrollment, Achievement, Course, UserAchievement } from "@shared/schema";

interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ["/api/users", user.id, "enrollments"],
  });

  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: userAchievements } = useQuery<UserAchievement[]>({
    queryKey: ["/api/users", user.id, "achievements"],
  });

  const { data: completedLabsData } = useQuery<{ count: number }>({
    queryKey: ["/api/user/completed-labs-count"],
    queryFn: async () => {
      const response = await fetch("/api/user/completed-labs-count", {
        headers: { "X-User-Id": user.id }
      });
      if (!response.ok) return { count: 0 };
      return response.json();
    },
  });

  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievementId) || []);
  const xpProgress = ((user.xp || 0) % 500) / 5;
  const currentLevel = user.level || 1;
  const nextLevelXP = currentLevel * 500;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10">
          <Avatar className="h-24 w-24 ring-4 ring-primary/30">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="bg-gradient-primary text-white text-3xl">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
            <p className="text-muted-foreground">{user.title || "طالب في سحابة الأردن"}</p>
            <div className="flex items-center gap-4 mt-3">
              <Badge className="bg-gradient-primary text-white">
                المستوى {currentLevel}
              </Badge>
              <div className="flex items-center gap-1 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{user.streak} يوم</span>
              </div>
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-4xl font-bold text-primary">{user.xp?.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">نقطة خبرة</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />
            <CardContent className="pt-6">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-primary rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-primary">{user.xp?.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">نقاط الخبرة</div>
              <Progress value={xpProgress} className="mt-3 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{nextLevelXP - (user.xp || 0)} للمستوى التالي</p>
            </CardContent>
          </Card>
          <Card className="text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500" />
            <CardContent className="pt-6">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-orange-500">{user.streak}</div>
              <div className="text-sm text-muted-foreground">يوم متتالي</div>
            </CardContent>
          </Card>
          <Card className="text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-chart-4 to-teal-500" />
            <CardContent className="pt-6">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-chart-4 to-teal-500 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-chart-4">{enrollments?.length || 0}</div>
              <div className="text-sm text-muted-foreground">دورة مسجلة</div>
            </CardContent>
          </Card>
          <Card className="text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-orange-500" />
            <CardContent className="pt-6">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-accent to-orange-500 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-accent">{userAchievements?.length || 0}</div>
              <div className="text-sm text-muted-foreground">إنجاز</div>
            </CardContent>
          </Card>
          <Card className="text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <CardContent className="pt-6">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <FlaskConical className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-purple-500" data-testid="text-completed-labs">
                {completedLabsData?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">مختبر مكتمل</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  دوراتي
                </CardTitle>
                <Link href="/courses">
                  <Button variant="ghost" size="sm" className="gap-1">
                    تصفح المزيد
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {enrollmentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : enrollments && enrollments.length > 0 ? (
                  <div className="space-y-4">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                        <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold">دورة {enrollment.courseId.slice(0, 8)}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {enrollment.progress}% مكتمل
                            </span>
                          </div>
                          <Progress value={enrollment.progress} className="mt-2 h-2" />
                        </div>
                        <Link href={`/courses/${enrollment.courseId}`}>
                          <Button size="sm" className="bg-gradient-primary gap-1">
                            <Play className="h-3 w-3" />
                            متابعة
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-bold mb-2">لم تسجل في أي دورة بعد</h3>
                    <p className="text-muted-foreground mb-4">ابدأ رحلتك التعليمية الآن</p>
                    <Link href="/courses">
                      <Button className="bg-gradient-primary gap-2">
                        <BookOpen className="h-4 w-4" />
                        تصفح الدورات
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-secondary" />
                  المختبرات الأخيرة
                </CardTitle>
                <Link href="/labs">
                  <Button variant="ghost" size="sm" className="gap-1">
                    عرض الكل
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FlaskConical className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-bold mb-2">لم تبدأ أي مختبر بعد</h3>
                  <p className="text-muted-foreground mb-4">جرب المختبرات التفاعلية لتطبيق ما تعلمته</p>
                  <Link href="/labs">
                    <Button className="bg-gradient-primary gap-2">
                      <FlaskConical className="h-4 w-4" />
                      استكشف المختبرات
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-accent" />
                  الإنجازات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements && achievements.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {achievements.map((achievement) => {
                      const isUnlocked = unlockedIds.has(achievement.id);
                      return (
                        <div 
                          key={achievement.id} 
                          className={`text-center p-3 rounded-xl ${isUnlocked ? 'bg-gradient-to-br from-accent/20 to-orange-500/20' : 'bg-muted/50 opacity-50'}`}
                          title={achievement.description}
                        >
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-gradient-to-r from-accent to-orange-500' : 'bg-muted'}`}>
                            <Award className={`h-6 w-6 ${isUnlocked ? 'text-white' : 'text-muted-foreground'}`} />
                          </div>
                          <p className="text-xs font-medium line-clamp-1">{achievement.title}</p>
                          {isUnlocked && (
                            <CheckCircle className="h-4 w-4 text-chart-4 mx-auto mt-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Trophy className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">ستظهر إنجازاتك هنا</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-chart-4" />
                  الأهداف اليومية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-chart-4/20 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-chart-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">أكمل درس واحد</p>
                    <Progress value={100} className="mt-1 h-2" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">ادرس 30 دقيقة</p>
                    <Progress value={60} className="mt-1 h-2" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <FlaskConical className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">أكمل مختبر</p>
                    <Progress value={0} className="mt-1 h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
