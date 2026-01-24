import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Clock, Users, GraduationCap, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LearningPathWithCourses } from "@shared/schema";

export default function Paths() {
  const { data: paths, isLoading } = useQuery<LearningPathWithCourses[]>({
    queryKey: ["/api/learning-paths"],
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">مسارات التعلم</h1>
        <p className="text-muted-foreground text-lg">
          اختر مسار تعليمي يناسب أهدافك المهنية وابدأ رحلتك في عالم الحوسبة السحابية
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : paths && paths.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => (
            <Link key={path.id} href={`/paths/${path.id}`}>
              <Card className="h-full hover-elevate cursor-pointer transition-all" data-testid={`path-card-${path.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: path.color }}
                    >
                      <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-1 line-clamp-2">{path.title}</CardTitle>
                      <Badge variant="outline">{path.level}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 line-clamp-2">{path.description}</CardDescription>
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
                  {path.courses && path.courses.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">الدورات المتضمنة:</p>
                      <div className="flex flex-wrap gap-1">
                        {path.courses.slice(0, 3).map((course) => (
                          <Badge key={course.id} variant="secondary" className="text-xs">
                            {course.title}
                          </Badge>
                        ))}
                        {path.courses.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{path.courses.length - 3} أخرى
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">لا توجد مسارات متاحة حالياً</h2>
          <p className="text-muted-foreground mb-6">سيتم إضافة مسارات تعليمية جديدة قريباً</p>
          <Link href="/courses">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 ml-2" />
              تصفح الدورات
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
