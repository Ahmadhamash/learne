import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShoppingCart, Trash2, BookOpen, GraduationCap, ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CartItemWithDetails, LearningPath } from "@shared/schema";

export default function Cart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cliq" | "paypal">("cliq");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: cartItems, isLoading } = useQuery<CartItemWithDetails[]>({
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

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      toast({ title: "تم إزالة العنصر من السلة" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      toast({ title: "تم تفريغ السلة" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cartItems || cartItems.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const courseIds: string[] = [];
      
      for (const item of cartItems) {
        if (item.itemType === 'course' && item.course) {
          courseIds.push(item.course.id);
        } else if (item.itemType === 'path' && item.path) {
          const pathRes = await fetch(`/api/learning-paths/${item.path.id}`);
          if (pathRes.ok) {
            const pathData: LearningPath & { courses?: { id: string }[] } = await pathRes.json();
            if (pathData.courses) {
              for (const course of pathData.courses) {
                courseIds.push(course.id);
              }
            }
          }
        }
      }

      for (const courseId of courseIds) {
        await apiRequest("POST", "/api/enrollments", {
          userId: user.id,
          courseId,
          paymentMethod,
          contactName,
          contactEmail,
          contactPhone,
        });
      }

      await apiRequest("DELETE", "/api/cart");
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      
      setCheckoutOpen(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setPaymentMethod("cliq");
      
      toast({ title: "تم إرسال طلب التسجيل بنجاح", description: "سيتم مراجعة طلبك والتواصل معك قريباً" });
    } catch (error) {
      toast({ title: "حدث خطأ أثناء إتمام الطلب", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold mb-2">يرجى تسجيل الدخول</h1>
        <p className="text-muted-foreground mb-6">لعرض سلة التسوق الخاصة بك</p>
        <Link href="/login">
          <Button>تسجيل الدخول</Button>
        </Link>
      </div>
    );
  }

  const calculateTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((total, item) => {
      if (item.course) return total + (item.course.price || 0);
      if (item.path) {
        // Path price could be calculated from courses or set separately
        return total + 99; // Default path price
      }
      return total;
    }, 0);
  };

  return (
    <div className="container mx-auto py-8 px-4 pt-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            سلة التسوق
          </h1>
          <p className="text-muted-foreground mt-1">
            {cartItems?.length || 0} عناصر في السلة
          </p>
        </div>
        {cartItems && cartItems.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => clearCartMutation.mutate()}
            disabled={clearCartMutation.isPending}
            data-testid="button-clear-cart"
          >
            {clearCartMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Trash2 className="h-4 w-4 ml-2" />
            )}
            تفريغ السلة
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : cartItems && cartItems.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: item.itemType === 'path' ? (item.path?.color || '#4A88FF') : '#4A88FF' }}
                    >
                      {item.itemType === 'course' ? (
                        <BookOpen className="h-7 w-7 text-white" />
                      ) : (
                        <GraduationCap className="h-7 w-7 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {item.itemType === 'course' ? 'دورة' : 'مسار'}
                          </Badge>
                          <h3 className="font-bold text-lg">
                            {item.course?.title || item.path?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.course?.description || item.path?.description}
                          </p>
                        </div>
                        <div className="text-left shrink-0">
                          <p className="font-bold text-lg text-primary">
                            {item.course?.price || 99} د.أ
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCartMutation.mutate(item.id)}
                            disabled={removeFromCartMutation.isPending}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد العناصر</span>
                  <span>{cartItems.length}</span>
                </div>
                <div className="flex justify-between border-t pt-4">
                  <span className="font-bold">المجموع</span>
                  <span className="font-bold text-lg text-primary">{calculateTotal()} د.أ</span>
                </div>
                <Button 
                  className="w-full" 
                  size="lg" 
                  data-testid="button-checkout"
                  onClick={() => setCheckoutOpen(true)}
                >
                  <CreditCard className="h-4 w-4 ml-2" />
                  إتمام الشراء
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  سيتم التواصل معك لإتمام عملية الدفع
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">سلة التسوق فارغة</h2>
          <p className="text-muted-foreground mb-6">ابدأ بإضافة الدورات والمسارات إلى سلتك</p>
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

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إتمام الشراء</DialogTitle>
            <DialogDescription>
              يرجى ملء البيانات التالية لإتمام عملية التسجيل
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">الاسم الكامل</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">البريد الإلكتروني</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">رقم الهاتف</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                required
              />
            </div>
            <div className="space-y-3">
              <Label>طريقة الدفع</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "cliq" | "paypal")}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="cliq" id="cliq" />
                  <Label htmlFor="cliq" className="cursor-pointer">CliQ</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="cursor-pointer">PayPal</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="font-bold">المجموع: {calculateTotal()} د.أ</span>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <CreditCard className="h-4 w-4 ml-2" />
                )}
                تأكيد الطلب
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
