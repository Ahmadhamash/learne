import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, Trash2, BookOpen, GraduationCap, ArrowLeft, Loader2, ShoppingCart, Clock, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FavoriteWithDetails } from "@shared/schema";

export default function Favorites() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: favorites, isLoading } = useQuery<FavoriteWithDetails[]>({
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

  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      return apiRequest("DELETE", `/api/favorites/${favoriteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: "تم إزالة العنصر من المفضلة" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ itemId, itemType }: { itemId: string; itemType: string }) => {
      return apiRequest("POST", "/api/cart", { itemId, itemType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      toast({ title: "تم إضافة العنصر إلى السلة" });
    },
    onError: () => {
      toast({ title: "العنصر موجود بالفعل في السلة", variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center pt-24">
        <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold mb-2">يرجى تسجيل الدخول</h1>
        <p className="text-muted-foreground mb-6">لعرض المفضلة الخاصة بك</p>
        <Link href="/login">
          <Button>تسجيل الدخول</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Heart className="h-8 w-8 text-red-500" />
          المفضلة
        </h1>
        <p className="text-muted-foreground mt-1">
          {favorites?.length || 0} عناصر في المفضلة
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : favorites && favorites.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => (
            <Card key={fav.id} className="h-full" data-testid={`favorite-item-${fav.id}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: fav.itemType === 'path' ? (fav.path?.color || '#4A88FF') : '#4A88FF' }}
                  >
                    {fav.itemType === 'course' ? (
                      <BookOpen className="h-7 w-7 text-white" />
                    ) : (
                      <GraduationCap className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-2">
                      {fav.itemType === 'course' ? 'دورة' : 'مسار'}
                    </Badge>
                    <CardTitle className="text-lg line-clamp-2">
                      {fav.course?.title || fav.path?.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {fav.course?.description || fav.path?.description}
                </p>
                
                {fav.course && (
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{fav.course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{fav.course.studentsCount} طالب</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span>{fav.course.rating}</span>
                    </div>
                  </div>
                )}
                
                {fav.path && (
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <Badge variant="secondary">{fav.path.level}</Badge>
                    {fav.path.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{fav.path.duration}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="font-bold text-lg text-primary">
                    {fav.course?.price || 99} د.أ
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromFavoritesMutation.mutate(fav.id)}
                      disabled={removeFromFavoritesMutation.isPending}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-remove-fav-${fav.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => addToCartMutation.mutate({ itemId: fav.itemId, itemType: fav.itemType })}
                      disabled={addToCartMutation.isPending}
                      data-testid={`button-add-to-cart-${fav.id}`}
                    >
                      {addToCartMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 ml-1" />
                          أضف للسلة
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">المفضلة فارغة</h2>
          <p className="text-muted-foreground mb-6">ابدأ بإضافة الدورات والمسارات إلى المفضلة</p>
          <div className="flex justify-center gap-4">
            <Link href="/courses">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 ml-2" />
                تصفح الدورات
              </Button>
            </Link>
            <Link href="/paths">
              <Button>
                <ArrowLeft className="h-4 w-4 ml-2" />
                تصفح المسارات
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
