import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, 
  BookOpen, 
  FlaskConical, 
  Trophy, 
  Clock, 
  Star, 
  Rocket,
  Play,
  ChevronLeft,
  Cloud,
  Flame,
  Crown,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import type { CourseWithInstructor, Lab, User, LearningPathWithCourses } from "@shared/schema";

function StatCard({ icon: Icon, value, label, gradient }: { 
  icon: React.ElementType; 
  value: string; 
  label: string; 
  gradient: string;
}) {
  return (
    <Card className="text-center hover-elevate">
      <CardContent className="pt-6">
        <div className={`w-14 h-14 mx-auto mb-4 ${gradient} rounded-xl flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-primary mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function CourseCard({ course }: { course: CourseWithInstructor }) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="overflow-hidden hover-elevate group cursor-pointer" data-testid={`card-course-${course.id}`}>
        <div className="relative h-48 overflow-hidden">
          <img 
            src={course.image || "https://placehold.co/800x400/4A88FF/FFFFFF?text=Course"} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge className="bg-primary/90">{course.category}</Badge>
            <Badge variant="secondary">{course.level}</Badge>
          </div>
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-white font-medium">{course.rating}</span>
          </div>
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2">
            <div className="text-lg font-bold text-foreground">{course.price} د.أ</div>
            {course.originalPrice && (
              <div className="text-xs text-muted-foreground line-through">{course.originalPrice} د.أ</div>
            )}
          </div>
        </div>
        <CardHeader className="pb-2">
          <h4 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              {course.duration}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-chart-4" />
              {course.studentsCount?.toLocaleString()} طالب
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-secondary" />
              {course.lessonsCount} دورة
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-accent" />
              {course.projectsCount} مشروع
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {course.skills?.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {(course.skills?.length || 0) > 3 && (
              <Badge variant="outline" className="text-xs text-primary">
                +{(course.skills?.length || 0) - 3}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center gap-3 pt-2 border-t">
          <Avatar className="h-8 w-8">
            <AvatarImage src={course.instructor.avatar || undefined} />
            <AvatarFallback className="bg-gradient-primary text-white text-xs">
              {course.instructor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{course.instructor.name}</p>
            <p className="text-xs text-muted-foreground truncate">{course.instructor.title || "مدرب معتمد"}</p>
          </div>
          <Button size="sm" className="bg-gradient-primary gap-1" data-testid={`button-enroll-${course.id}`}>
            <Play className="h-3 w-3" />
            عرض
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

function LabCard({ lab }: { lab: Lab }) {
  return (
    <Link href={`/labs/${lab.id}`}>
      <Card className="text-center hover-elevate group cursor-pointer" data-testid={`card-lab-${lab.id}`}>
        <CardContent className="pt-6">
          <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${lab.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <FlaskConical className="h-7 w-7 text-white" />
          </div>
          <h4 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{lab.title}</h4>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{lab.description}</p>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              {lab.duration} دقيقة
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-chart-4" />
              {lab.level}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 justify-center mb-4">
            {lab.technologies?.map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
          <Button className="w-full bg-gradient-primary" data-testid={`button-start-lab-${lab.id}`}>
            <FlaskConical className="h-4 w-4 ml-2" />
            بدء المختبر
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

function LeaderboardItem({ user, rank }: { user: User; rank: number }) {
  const getRankStyle = (r: number) => {
    if (r === 1) return "from-yellow-500 to-orange-500";
    if (r === 2) return "from-gray-400 to-gray-600";
    if (r === 3) return "from-orange-600 to-yellow-600";
    return "bg-muted";
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${rank <= 3 ? `bg-gradient-to-r ${getRankStyle(rank)}/10` : 'bg-muted/50'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r ${getRankStyle(rank)} text-white font-bold`}>
        {rank}
      </div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.avatar || undefined} />
        <AvatarFallback className="bg-gradient-primary text-white text-xs">
          {user.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-medium text-sm">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.points?.toLocaleString()} نقطة</p>
      </div>
      {rank === 1 && <Trophy className="h-5 w-5 text-yellow-500" />}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  
  const { data: courses, isLoading: coursesLoading } = useQuery<CourseWithInstructor[]>({
    queryKey: ["/api/courses"],
  });

  const { data: labs, isLoading: labsLoading } = useQuery<Lab[]>({
    queryKey: ["/api/labs"],
  });

  const { data: learningPaths, isLoading: pathsLoading } = useQuery<LearningPathWithCourses[]>({
    queryKey: ["/api/learning-paths"],
  });

  const { data: leaderboard } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

  // Fetch homepage content for logo
  const { data: homepageContent } = useQuery<{ key: string; value: string; isVisible: boolean }[]>({
    queryKey: ["/api/homepage-content"],
    queryFn: async () => {
      const res = await fetch("/api/homepage-content");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Get site logo from homepage content
  const siteLogoContent = homepageContent?.find(c => c.key === "site_logo");
  const siteLogo = siteLogoContent?.isVisible && siteLogoContent?.value ? siteLogoContent.value : null;

  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-2xl animate-float" style={{ animationDelay: "-2s" }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              اكتشف مسارك نحو
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                التميز السحابي
              </span>
              <br />
              في الأردن
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              منصة مسارات سحابية متكاملة تجمع بين أحدث التقنيات والتطبيق العملي لإعدادك لسوق العمل.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {user ? (
                <Link href="/courses">
                  <Button size="lg" className="text-lg px-8 py-6 bg-gradient-accent pulse-glow" data-testid="button-explore-courses">
                    <Rocket className="h-5 w-5 ml-2" />
                    استكشف المسارات
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button size="lg" className="text-lg px-8 py-6 bg-gradient-accent pulse-glow" data-testid="button-start-journey">
                    <Rocket className="h-5 w-5 ml-2" />
                    ابدأ رحلتك المجانية
                  </Button>
                </Link>
              )}
              <Link href="/courses">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="button-browse-courses">
                  <Play className="h-5 w-5 ml-2" />
                  تصفح المسارات
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            <StatCard icon={Users} value="8,500+" label="متعلم نشط" gradient="bg-gradient-to-r from-primary to-secondary" />
            <StatCard icon={BookOpen} value="12+" label="مسار سحابي" gradient="bg-gradient-to-r from-chart-4 to-teal-500" />
            <StatCard icon={FlaskConical} value="60+" label="مختبر تفاعلي" gradient="bg-gradient-to-r from-secondary to-accent" />
            <StatCard icon={Trophy} value="98.1%" label="معدل النجاح" gradient="bg-gradient-to-r from-accent to-orange-500" />
          </div>
        </div>
      </section>

      {user && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">لوحة التحكم الشخصية</h3>
              <p className="text-muted-foreground">تتبع تقدمك السحابي وإنجازاتك</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Card className="text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Star className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-primary">{user.xp?.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">نقاط الخبرة</div>
                  <Progress value={(user.xp || 0) % 500 / 5} className="mt-3 h-2" />
                </CardContent>
              </Card>
              <Card className="text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <Flame className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-orange-500">{user.streak}</div>
                  <div className="text-sm text-muted-foreground">يوم متتالي</div>
                </CardContent>
              </Card>
              <Card className="text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-chart-4 to-teal-500" />
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-chart-4 to-teal-500 rounded-full flex items-center justify-center">
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-chart-4">2</div>
                  <div className="text-sm text-muted-foreground">مسار مكتمل</div>
                </CardContent>
              </Card>
              <Card className="text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-orange-500" />
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-accent to-orange-500 rounded-full flex items-center justify-center">
                    <Crown className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-accent">#5</div>
                  <div className="text-sm text-muted-foreground">الترتيب العام</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Learning Paths Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-2">مسارات التعلم</h3>
              <p className="text-muted-foreground">اختر مسار تعليمي متكامل وابدأ رحلة التميز</p>
            </div>
            <Link href="/paths">
              <Button variant="outline" className="gap-1" data-testid="button-view-all-paths">
                عرض الكل
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {pathsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : learningPaths && learningPaths.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningPaths.slice(0, 3).map((path) => (
                <Link key={path.id} href={`/paths/${path.id}`}>
                  <Card className="h-full hover-elevate cursor-pointer transition-all" data-testid={`home-path-card-${path.id}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: path.color }}
                        >
                          <GraduationCap className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-bold mb-1 line-clamp-2">{path.title}</h4>
                          <Badge variant="outline">{path.level}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-2">{path.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{path.coursesCount} دورات</span>
                        </div>
                        {path.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{path.duration}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{path.studentsCount} طالب</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">سيتم إضافة مسارات تعليمية قريباً</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-2">الدورات السحابية</h3>
              <p className="text-muted-foreground">اختر دورتك وابدأ رحلة التميز</p>
            </div>
            <Link href="/courses">
              <Button variant="outline" className="gap-1" data-testid="button-view-all-courses">
                عرض الكل
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.slice(0, 6).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-2">المختبرات التفاعلية</h3>
              <p className="text-muted-foreground">بيئات سحابية جاهزة لتطبيق ما تعلمته</p>
            </div>
            <Link href="/labs">
              <Button variant="outline" className="gap-1" data-testid="button-view-all-labs">
                عرض الكل
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {labsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-xl" />
                    <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {labs?.slice(0, 4).map((lab) => (
                <LabCard key={lab.id} lab={lab} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">لوحة الصدارة</h3>
            <p className="text-muted-foreground">أفضل المتعلمين هذا الشهر</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="pt-6 space-y-3">
                {leaderboard?.slice(0, 5).map((u, index) => (
                  <LeaderboardItem key={u.id} user={u} rank={index + 1} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              {siteLogo ? (
                <img 
                  src={siteLogo} 
                  alt="سحابة الأردن" 
                  className="h-10 w-auto max-w-[150px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center ${siteLogo ? 'hidden' : ''}`}>
                <Cloud className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                سحابة الأردن
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              منصة مسارات الحوسبة السحابية المتقدمة - جميع الحقوق محفوظة © 2024
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
