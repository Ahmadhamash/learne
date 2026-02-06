import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Trophy,
  Search,
  Filter,
  Play
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CourseWithInstructor } from "@shared/schema";

function CourseCard({ course }: { course: CourseWithInstructor }) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="overflow-hidden hover-elevate group cursor-pointer h-full" data-testid={`card-course-${course.id}`}>
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
              {course.lessonsCount} درس
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
          <Button size="sm" className="bg-gradient-primary gap-1" data-testid={`button-view-course-${course.id}`}>
            <Play className="h-3 w-3" />
            عرض
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default function Courses() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");

  const { data: courses, isLoading } = useQuery<CourseWithInstructor[]>({
    queryKey: ["/api/courses"],
  });

  const filteredCourses = courses?.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || course.category === category;
    const matchesLevel = level === "all" || course.level === level;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const categories = Array.from(new Set(courses?.map(c => c.category) || []));
  const levels = Array.from(new Set(courses?.map(c => c.level) || []));

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">المسارات التعليمية</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اختر المسار المناسب لك وابدأ رحلتك في عالم الحوسبة السحابية
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن دورة..." 
              className="pr-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-courses"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-category">
              <SelectValue placeholder="الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-level">
              <SelectValue placeholder="المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              {levels.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        ) : filteredCourses?.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">لا توجد دورات مطابقة</h3>
              <p className="text-muted-foreground">جرب تغيير معايير البحث</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses?.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
