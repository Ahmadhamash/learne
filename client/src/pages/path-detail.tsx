import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { BookOpen, Clock, Users, GraduationCap, Star, ArrowLeft, Play, Heart, ShoppingCart, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LearningPathWithCourses, CourseWithInstructor } from "@shared/schema";

export default function PathDetail() {
  const [, params] = useRoute("/paths/:id");
  const pathId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: path, isLoading: pathLoading } = useQuery<LearningPathWithCourses>({
    queryKey: ["/api/learning-paths", pathId],
    enabled: !!pathId,
  });

  const { data: publishedCourses } = useQuery<CourseWithInstructor[]>({
    queryKey: ["/api/courses"],
  });

  // Check if path is in favorites
  const { data: favorites } = useQuery<{ id: string; itemId: string }[]>({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites", {
        headers: { "X-User-Id": user?.id || "" }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  // Check if path is in cart
  const { data: cartItems } = useQuery<{ itemId: string }[]>({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      const res = await fetch("/api/cart", {
        headers: { "X-User-Id": user?.id || "" }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const isInFavorites = favorites?.some(f => f.itemId === pathId);
  const isInCart = cartItems?.some(c => c.itemId === pathId);

  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/favorites", { itemId: pathId, itemType: "path" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: "تمت الإضافة إلى المفضلة" });
    },
    onError: () => {
      toast({ title: "العنصر موجود بالفعل في المفضلة", variant: "destructive" });
    },
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: async () => {
      const fav = favorites?.find(f => f.itemId === pathId);
      if (fav) {
        return apiRequest("DELETE", `/api/favorites/${fav.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: "تمت الإزالة من المفضلة" });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cart", { itemId: pathId, itemType: "path" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      toast({ title: "تمت الإضافة إلى السلة" });
    },
    onError: () => {
      toast({ title: "العنصر موجود بالفعل في السلة", variant: "destructive" });
    },
  });

  if (pathLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-6 w-full max-w-2xl mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="container mx-auto py-16 text-center">
        <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold mb-2">المسار غير موجود</h1>
        <p className="text-muted-foreground mb-6">لم نتمكن من العثور على المسار المطلوب</p>
        <Link href="/paths">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة للمسارات
          </Button>
        </Link>
      </div>
    );
  }

  const pathCourses = path.courses || [];
  const courseInstructors = pathCourses
    .map(c => {
      const full = publishedCourses?.find(pc => pc.id === c.id);
      return full?.instructor;
    })
    .filter((v, i, a) => v && a.findIndex(t => t?.id === v?.id) === i);

  return (
    <div className="container mx-auto py-8 px-4">
      <Link href="/paths">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 ml-2" />
          جميع المسارات
        </Button>
      </Link>

      <div 
        className="rounded-2xl p-8 mb-8 text-white"
        style={{ backgroundColor: path.color }}
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <GraduationCap className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <Badge className="mb-3 bg-white/20 text-white border-0">{path.level}</Badge>
            <h1 className="text-3xl font-bold mb-3">{path.title}</h1>
            <p className="text-white/90 text-lg mb-4 max-w-2xl">{path.description}</p>
            <div className="flex flex-wrap gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span>{path.coursesCount} دورات</span>
              </div>
              {path.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{path.duration}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{path.studentsCount} طالب</span>
              </div>
            </div>
            {user && (
              <div className="flex gap-3 mt-4">
                <Button
                  variant={isInFavorites ? "secondary" : "outline"}
                  className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
                  onClick={() => isInFavorites ? removeFromFavoritesMutation.mutate() : addToFavoritesMutation.mutate()}
                  disabled={addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending}
                  data-testid="button-toggle-favorite-path"
                >
                  <Heart className={`h-4 w-4 ml-2 ${isInFavorites ? 'fill-red-500 text-red-500' : ''}`} />
                  {isInFavorites ? 'في المفضلة' : 'أضف للمفضلة'}
                </Button>
                <Button
                  variant={isInCart ? "secondary" : "outline"}
                  className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
                  onClick={() => addToCartMutation.mutate()}
                  disabled={addToCartMutation.isPending || isInCart}
                  data-testid="button-add-to-cart-path"
                >
                  <ShoppingCart className="h-4 w-4 ml-2" />
                  {isInCart ? 'في السلة' : 'أضف للسلة'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">دورات المسار</h2>
          {pathCourses.length > 0 ? (
            <div className="space-y-4">
              {pathCourses.map((course, index) => {
                const fullCourse = publishedCourses?.find(c => c.id === course.id);
                return (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <Card className="hover-elevate cursor-pointer transition-all" data-testid={`path-course-${course.id}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-lg font-bold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{course.description}</p>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  <Badge variant="outline">{course.category}</Badge>
                                  <span>{course.level}</span>
                                  <span>{course.duration}</span>
                                  {fullCourse && (
                                    <span className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                      {fullCourse.rating.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button variant="outline" size="sm" className="shrink-0">
                                <Play className="h-4 w-4 ml-1" />
                                ابدأ
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد دورات في هذا المسار حالياً</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">معلومات المسار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">المستوى</h4>
                <Badge variant="secondary">{path.level}</Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">عدد الدورات</h4>
                <p className="text-muted-foreground">{path.coursesCount} دورات</p>
              </div>
              {path.duration && (
                <div>
                  <h4 className="font-medium mb-2">المدة المتوقعة</h4>
                  <p className="text-muted-foreground">{path.duration}</p>
                </div>
              )}
              {courseInstructors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">المدربون</h4>
                  <div className="space-y-2">
                    {courseInstructors.map((instructor) => (
                      <div key={instructor?.id} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={instructor?.avatar || undefined} />
                          <AvatarFallback>{instructor?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{instructor?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button className="w-full">
                <Play className="h-4 w-4 ml-2" />
                ابدأ المسار
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
