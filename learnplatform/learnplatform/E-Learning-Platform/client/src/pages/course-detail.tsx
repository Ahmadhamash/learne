import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Trophy, 
  Play, 
  CheckCircle,
  Lock,
  ChevronLeft,
  Loader2,
  Award,
  CreditCard,
  Wallet,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Heart,
  ShoppingCart
} from "lucide-react";
import { SiPaypal } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CourseWithInstructor, Lesson, ReviewWithUser, Enrollment } from "@shared/schema";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const courseId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState<1 | 2>(1);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<"cliq" | "paypal" | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const { data: course, isLoading } = useQuery<CourseWithInstructor>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ["/api/courses", courseId, "lessons"],
    enabled: !!courseId,
  });

  const { data: reviews } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/courses", courseId, "reviews"],
    enabled: !!courseId,
  });

  // Check if user already enrolled
  const { data: userEnrollment } = useQuery<Enrollment | null>({
    queryKey: ["/api/users", user?.id, "enrollments", courseId],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/users/${user.id}/enrollments`);
      if (!res.ok) return null;
      const enrollments: Enrollment[] = await res.json();
      return enrollments.find(e => e.courseId === courseId) || null;
    },
    enabled: !!user && !!courseId,
  });

  const enrollMutation = useMutation({
    mutationFn: async (data: { paymentMethod: "cliq" | "paypal"; contactName: string; contactEmail: string; contactPhone: string }) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");
      return apiRequest("POST", "/api/enrollments", { 
        userId: user.id, 
        courseId, 
        paymentMethod: data.paymentMethod,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone
      });
    },
    onSuccess: () => {
      setPaymentModalOpen(false);
      setSuccessModalOpen(true);
      setEnrollmentStep(1);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "enrollments", courseId] });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  // Check if course is in favorites
  const { data: favorites } = useQuery<{ itemId: string }[]>({
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

  // Check if course is in cart
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

  const isInFavorites = favorites?.some(f => f.itemId === courseId);
  const isInCart = cartItems?.some(c => c.itemId === courseId);

  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/favorites", { itemId: courseId, itemType: "course" });
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
      const fav = favorites?.find(f => f.itemId === courseId);
      if (fav && 'id' in fav) {
        return apiRequest("DELETE", `/api/favorites/${(fav as any).id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: "تمت الإزالة من المفضلة" });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cart", { itemId: courseId, itemType: "course" });
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

  const handleEnrollClick = () => {
    if (!user) return;
    setSelectedPayment(null);
    setEnrollmentStep(1);
    setContactName(user.name || "");
    setContactEmail(user.email || "");
    setContactPhone("");
    setPaymentModalOpen(true);
  };

  const handleNextStep = () => {
    if (!contactName.trim()) {
      toast({ title: "خطأ", description: "الرجاء إدخال الاسم الكامل", variant: "destructive" });
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      toast({ title: "خطأ", description: "الرجاء إدخال بريد إلكتروني صحيح", variant: "destructive" });
      return;
    }
    if (!contactPhone.trim()) {
      toast({ title: "خطأ", description: "الرجاء إدخال رقم الهاتف", variant: "destructive" });
      return;
    }
    setEnrollmentStep(2);
  };

  const handleConfirmPayment = () => {
    if (!selectedPayment) {
      toast({ title: "خطأ", description: "الرجاء اختيار طريقة الدفع", variant: "destructive" });
      return;
    }
    enrollMutation.mutate({ 
      paymentMethod: selectedPayment, 
      contactName, 
      contactEmail, 
      contactPhone 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10">
        <div className="container mx-auto px-4">
          <Skeleton className="h-80 w-full rounded-2xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <Card className="text-center p-8">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">الدورة غير موجودة</h2>
          <Link href="/courses">
            <Button>العودة للدورات</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="relative h-80 overflow-hidden">
        <img 
          src={course.image || "https://placehold.co/1200x400"} 
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Link href="/courses" className="inline-flex items-center gap-1 text-white/70 hover:text-white mb-4">
              <ChevronLeft className="h-4 w-4" />
              العودة للدورات
            </Link>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-primary">{course.category}</Badge>
              <Badge variant="secondary">{course.level}</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>{course.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.studentsCount?.toLocaleString()} طالب</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{course.lessonsCount} درس</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>عن الدورة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{course.description}</p>
                <div className="flex flex-wrap gap-2 mt-6">
                  {course.skills?.map((skill) => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  محتوى الدورة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lessons && lessons.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {lessons.map((lesson, index) => (
                      <AccordionItem key={lesson.id} value={lesson.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                              {index + 1}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{lesson.title}</p>
                              <p className="text-xs text-muted-foreground">{lesson.duration} دقيقة</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pr-11 space-y-2">
                            <p className="text-muted-foreground">{lesson.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-chart-4">
                                <Award className="h-3 w-3" />
                                {lesson.xpReward} XP
                              </span>
                              {lesson.videoUrl && (
                                <Badge variant="outline" className="text-xs">
                                  <Play className="h-3 w-3 ml-1" />
                                  فيديو
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">سيتم إضافة الدروس قريباً</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  تقييمات الطلاب
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex gap-4 p-4 rounded-lg bg-muted/50">
                        <Avatar>
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">لا توجد تقييمات بعد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-primary mb-1">{course.price} د.أ</div>
                  {course.originalPrice && (
                    <div className="text-lg text-muted-foreground line-through">{course.originalPrice} د.أ</div>
                  )}
                </div>

                {user ? (
                  userEnrollment ? (
                    userEnrollment.status === "approved" ? (
                      <Link href={`/learn/${courseId}`}>
                        <Button 
                          className="w-full bg-gradient-primary mb-4" 
                          size="lg"
                          data-testid="button-start-learning"
                        >
                          <Play className="h-4 w-4 ml-2" />
                          بدء التعلم
                        </Button>
                      </Link>
                    ) : userEnrollment.status === "pending" ? (
                      <Button 
                        className="w-full mb-4" 
                        size="lg"
                        variant="secondary"
                        disabled
                        data-testid="button-enrollment-pending"
                      >
                        <Clock className="h-4 w-4 ml-2" />
                        في انتظار الموافقة
                      </Button>
                    ) : (
                      <Button 
                        className="w-full mb-4" 
                        size="lg"
                        variant="destructive"
                        disabled
                        data-testid="button-enrollment-rejected"
                      >
                        تم رفض الطلب
                      </Button>
                    )
                  ) : (
                    <Button 
                      className="w-full bg-gradient-primary mb-4" 
                      size="lg"
                      onClick={handleEnrollClick}
                      disabled={enrollMutation.isPending}
                      data-testid="button-enroll-course"
                    >
                      {enrollMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <CreditCard className="h-4 w-4 ml-2" />
                      )}
                      التسجيل في الدورة
                    </Button>
                  )
                ) : (
                  <Link href="/login">
                    <Button className="w-full bg-gradient-primary mb-4" size="lg">
                      <Play className="h-4 w-4 ml-2" />
                      سجل دخول للتسجيل
                    </Button>
                  </Link>
                )}

                {user && !userEnrollment && (
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={isInFavorites ? "secondary" : "outline"}
                      className="flex-1"
                      onClick={() => isInFavorites ? removeFromFavoritesMutation.mutate() : addToFavoritesMutation.mutate()}
                      disabled={addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending}
                      data-testid="button-toggle-favorite"
                    >
                      <Heart className={`h-4 w-4 ml-2 ${isInFavorites ? 'fill-red-500 text-red-500' : ''}`} />
                      {isInFavorites ? 'في المفضلة' : 'أضف للمفضلة'}
                    </Button>
                    <Button
                      variant={isInCart ? "secondary" : "outline"}
                      className="flex-1"
                      onClick={() => addToCartMutation.mutate()}
                      disabled={addToCartMutation.isPending || isInCart}
                      data-testid="button-add-to-cart"
                    >
                      <ShoppingCart className="h-4 w-4 ml-2" />
                      {isInCart ? 'في السلة' : 'أضف للسلة'}
                    </Button>
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-chart-4" />
                    <span>{course.lessonsCount} درس تفاعلي</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-chart-4" />
                    <span>{course.projectsCount} مشروع عملي</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-chart-4" />
                    <span>شهادة إتمام</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-chart-4" />
                    <span>وصول مدى الحياة</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">المحاضر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={course.instructor.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xl">
                      {course.instructor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold">{course.instructor.name}</p>
                    <p className="text-sm text-muted-foreground">{course.instructor.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enrollment Modal - 2 Steps */}
      <Dialog open={paymentModalOpen} onOpenChange={(open) => {
        setPaymentModalOpen(open);
        if (!open) setEnrollmentStep(1);
      }}>
        <DialogContent className="max-w-md">
          {enrollmentStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle>معلومات التواصل</DialogTitle>
                <DialogDescription>
                  أدخل معلوماتك للتواصل معك بخصوص عملية الدفع
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">الاسم الكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactName"
                      placeholder="أدخل اسمك الكامل"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="pr-10"
                      data-testid="input-contact-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="example@email.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="07XXXXXXXX"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                      data-testid="input-contact-phone"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleNextStep} data-testid="button-next-step">
                  التالي
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>اختر طريقة الدفع</DialogTitle>
                <DialogDescription>
                  اختر طريقة الدفع المناسبة لك للتسجيل في الدورة
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedPayment === "cliq" 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPayment("cliq")}
                  data-testid="payment-option-cliq"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">CliQ</h3>
                      <p className="text-sm text-muted-foreground">الدفع عبر كليك - التحويل الفوري</p>
                    </div>
                  </div>
                </div>
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedPayment === "paypal" 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPayment("paypal")}
                  data-testid="payment-option-paypal"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center">
                      <SiPaypal className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">PayPal</h3>
                      <p className="text-sm text-muted-foreground">الدفع عبر باي بال</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEnrollmentStep(1)} data-testid="button-back">
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  رجوع
                </Button>
                <Button 
                  onClick={handleConfirmPayment}
                  disabled={!selectedPayment || enrollMutation.isPending}
                  data-testid="button-confirm-payment"
                >
                  {enrollMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : null}
                  تأكيد الطلب
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl">تم استلام طلبك بنجاح</DialogTitle>
            <DialogDescription className="text-lg mt-4">
              سيتم التواصل معك قريباً لإتمام عملية الدفع وتفعيل اشتراكك في الدورة
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              طريقة الدفع المختارة: {selectedPayment === "cliq" ? "CliQ" : "PayPal"}
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setSuccessModalOpen(false)} data-testid="button-close-success">
              حسناً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
