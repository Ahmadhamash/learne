import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { 
  Clock, 
  FlaskConical, 
  Trophy,
  Play, 
  CheckCircle,
  ChevronLeft,
  Loader2,
  Terminal,
  Zap,
  Upload,
  Image as ImageIcon,
  X,
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lab, LabProgress } from "@shared/schema";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function LabDetail() {
  const [, params] = useRoute("/labs/:id");
  const labId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();

  const [labStarted, setLabStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [details, setDetails] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const { data: lab, isLoading } = useQuery<Lab>({
    queryKey: ["/api/labs", labId],
    enabled: !!labId,
  });

  const { data: labProgress } = useQuery<LabProgress | null>({
    queryKey: ["/api/labs", labId, "progress"],
    queryFn: async () => {
      if (!user) return null;
      const response = await fetch(`/api/labs/${labId}/progress`, {
        headers: { "X-User-Id": user.id }
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!labId && !!user,
  });

  // Check if lab was already started
  useEffect(() => {
    if (labProgress && !labProgress.isCompleted) {
      setLabStarted(true);
      // Calculate elapsed time from when the lab was started
      const startTime = new Date(labProgress.startedAt!).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
      startTimeRef.current = startTime;
    }
  }, [labProgress]);

  // Timer effect
  useEffect(() => {
    if (labStarted && !labProgress?.isCompleted) {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          setElapsedTime(Math.floor((now - startTimeRef.current) / 1000));
        } else {
          setElapsedTime(prev => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [labStarted, labProgress?.isCompleted]);

  const startLabMutation = useMutation({
    mutationFn: async (): Promise<LabProgress> => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");
      const response = await apiRequest("POST", `/api/labs/${labId}/start`, {});
      return response.json();
    },
    onSuccess: (data: LabProgress) => {
      setLabStarted(true);
      startTimeRef.current = new Date(data.startedAt!).getTime();
      setElapsedTime(0);
      toast({ title: "تم بدء المختبر", description: "يمكنك الآن البدء بالتجربة - الوقت يعمل!" });
      queryClient.invalidateQueries({ queryKey: ["/api/labs", labId, "progress"] });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const submitLabMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");
      
      let screenshotUrl = null;
      
      // If there's a screenshot, convert to base64 data URL
      if (screenshotFile) {
        screenshotUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(screenshotFile);
        });
      }
      
      return apiRequest("POST", `/api/labs/${labId}/submit`, {
        screenshotUrl,
        details,
        timeSpent: elapsedTime,
      });
    },
    onSuccess: () => {
      setLabStarted(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setSubmitModalOpen(false);
      setScreenshotPreview(null);
      setScreenshotFile(null);
      setDetails("");
      toast({ 
        title: "تم تسليم المختبر!", 
        description: `تم إرسال المختبر للمراجعة وحصلت على ${lab?.xpReward} XP` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/labs", labId, "progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/lab-submissions"] });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10">
        <div className="container mx-auto px-4">
          <Skeleton className="h-64 w-full rounded-2xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <Card className="text-center p-8">
          <FlaskConical className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">المختبر غير موجود</h2>
          <Link href="/labs">
            <Button>العودة للمختبرات</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isCompleted = labProgress?.isCompleted;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className={`relative h-64 overflow-hidden bg-gradient-to-r ${lab.color}`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <FlaskConical className="h-32 w-32 text-white/20" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Link href="/labs" className="inline-flex items-center gap-1 text-white/70 hover:text-white mb-4">
              <ChevronLeft className="h-4 w-4" />
              العودة للمختبرات
            </Link>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-white/20 text-white">{lab.level}</Badge>
              <Badge className="bg-white/20 text-white">
                <Clock className="h-3 w-3 ml-1" />
                {lab.duration} دقيقة
              </Badge>
              {isCompleted && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 ml-1" />
                  مكتمل
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{lab.title}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>عن المختبر</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-6">{lab.description}</p>
                <div className="flex flex-wrap gap-2">
                  {lab.technologies?.map((tech) => (
                    <Badge key={tech} variant="outline">{tech}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" />
                  بيئة المختبر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono text-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <p className="mb-2">$ cloud-lab init {lab.title.replace(/\s/g, '-').toLowerCase()}</p>
                  <p className="text-gray-500 mb-2"># Initializing lab environment...</p>
                  <p className="text-gray-500 mb-2"># Setting up {lab.technologies?.join(', ')}...</p>
                  {labStarted ? (
                    <p className="text-white">Lab is running! Complete the exercises and submit when done.</p>
                  ) : (
                    <p className="text-white">Ready to start! Click "بدء المختبر" to begin.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-chart-4" />
                  ما ستتعلمه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5" />
                    <span>فهم أساسيات {lab.technologies?.[0] || "التقنية"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5" />
                    <span>تطبيق المفاهيم في بيئة عملية</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5" />
                    <span>حل المشكلات واستكشاف الأخطاء</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5" />
                    <span>الحصول على {lab.xpReward} نقطة خبرة</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${lab.color} flex items-center justify-center`}>
                  <FlaskConical className="h-10 w-10 text-white" />
                </div>

                {/* Timer Display */}
                {labStarted && !isCompleted && (
                  <div className="mb-6 p-4 bg-muted rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                      <Timer className="h-4 w-4" />
                      <span>الوقت المنقضي</span>
                    </div>
                    <div className="text-3xl font-mono font-bold text-primary" data-testid="text-timer">
                      {formatTime(elapsedTime)}
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 text-2xl font-bold text-chart-4">
                    <Zap className="h-6 w-6" />
                    {lab.xpReward} XP
                  </div>
                  <p className="text-sm text-muted-foreground">نقاط الخبرة عند الإكمال</p>
                </div>

                {user ? (
                  <div className="space-y-3">
                    {isCompleted ? (
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <p className="font-semibold text-green-700 dark:text-green-300">تم إكمال هذا المختبر</p>
                      </div>
                    ) : !labStarted ? (
                      <Button 
                        className="w-full bg-gradient-primary" 
                        size="lg"
                        onClick={() => startLabMutation.mutate()}
                        disabled={startLabMutation.isPending}
                        data-testid="button-start-lab"
                      >
                        {startLabMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <Play className="h-4 w-4 ml-2" />
                        )}
                        بدء المختبر
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-primary" 
                        size="lg"
                        onClick={() => setSubmitModalOpen(true)}
                        data-testid="button-complete-lab"
                      >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        إتمام المختبر
                      </Button>
                    )}
                  </div>
                ) : (
                  <Link href="/login">
                    <Button className="w-full bg-gradient-primary" size="lg">
                      <Play className="h-4 w-4 ml-2" />
                      سجل دخول للبدء
                    </Button>
                  </Link>
                )}

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>المدة: {lab.duration} دقيقة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Trophy className="h-4 w-4 text-accent" />
                    <span>المستوى: {lab.level}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Terminal className="h-4 w-4 text-chart-4" />
                    <span>بيئة تفاعلية كاملة</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Lab Modal */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تسليم المختبر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">الوقت المستغرق</p>
              <p className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshot">صورة من المختبر (اختياري)</Label>
              {screenshotPreview ? (
                <div className="relative">
                  <img 
                    src={screenshotPreview} 
                    alt="Screenshot preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 left-2"
                    onClick={removeScreenshot}
                    data-testid="button-remove-screenshot"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid="input-screenshot"
                  />
                  <label htmlFor="screenshot" className="cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">اضغط لرفع صورة من المختبر</p>
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">تفاصيل عن العمل المنجز</Label>
              <Textarea
                id="details"
                placeholder="اكتب ملخصاً عما أنجزته في هذا المختبر..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                data-testid="input-details"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSubmitModalOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={() => submitLabMutation.mutate()}
              disabled={submitLabMutation.isPending}
              data-testid="button-submit-lab"
            >
              {submitLabMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <CheckCircle className="h-4 w-4 ml-2" />
              )}
              تسليم المختبر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
