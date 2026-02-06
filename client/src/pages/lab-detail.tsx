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
  Zap,
  Upload,
  Image as ImageIcon,
  X,
  Timer,
  ListOrdered,
  Send,
  FileText,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lab, LabProgress, LabSection, LabSubmission } from "@shared/schema";

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [sectionScreenshots, setSectionScreenshots] = useState<Record<string, { file: File; preview: string }>>({});
  const [sectionDetails, setSectionDetails] = useState<Record<string, string>>({});

  const { data: lab, isLoading } = useQuery<Lab>({
    queryKey: ["/api/labs", labId],
    enabled: !!labId,
  });

  const { data: sections = [] } = useQuery<LabSection[]>({
    queryKey: ["/api/labs", labId, "sections"],
    queryFn: async () => {
      const response = await fetch(`/api/labs/${labId}/sections`);
      if (!response.ok) return [];
      return response.json();
    },
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

  const { data: mySubmissions = [] } = useQuery<LabSubmission[]>({
    queryKey: ["/api/labs", labId, "my-submissions"],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/labs/${labId}/my-submissions`, {
        headers: { "X-User-Id": user.id }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!labId && !!user,
  });

  useEffect(() => {
    if (labProgress && !labProgress.isCompleted) {
      setLabStarted(true);
      const startTime = new Date(labProgress.startedAt!).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
      startTimeRef.current = startTime;
    }
  }, [labProgress]);

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
      toast({ title: "تم بدء المختبر", description: "يمكنك الآن البدء بالتجربة" });
      queryClient.invalidateQueries({ queryKey: ["/api/labs", labId, "progress"] });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const submitSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");
      
      let screenshotUrl: string | null = null;
      const screenshotData = sectionScreenshots[sectionId];
      if (screenshotData?.file) {
        screenshotUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(screenshotData.file);
        });
      }
      
      return apiRequest("POST", `/api/labs/${labId}/sections/${sectionId}/submit`, {
        screenshotUrl,
        details: sectionDetails[sectionId] || "",
      });
    },
    onSuccess: (_data, sectionId) => {
      setSectionScreenshots(prev => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
      setSectionDetails(prev => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
      setActiveSectionId(null);
      toast({ title: "تم تسليم القسم بنجاح!", description: "تم إرسال عملك للمراجعة" });
      queryClient.invalidateQueries({ queryKey: ["/api/labs", labId, "my-submissions"] });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const submitLabMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");
      return apiRequest("POST", `/api/labs/${labId}/submit`, {
        details: "تم إكمال جميع الأقسام",
        timeSpent: elapsedTime,
      });
    },
    onSuccess: () => {
      setLabStarted(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast({ 
        title: "تم إكمال المختبر!", 
        description: `حصلت على ${lab?.xpReward} XP` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/labs", labId, "progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleSectionFileChange = (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSectionScreenshots(prev => ({
          ...prev,
          [sectionId]: { file, preview: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSectionScreenshot = (sectionId: string) => {
    setSectionScreenshots(prev => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  };

  const getSectionSubmission = (sectionId: string) => {
    return mySubmissions.find(s => s.sectionId === sectionId);
  };

  const allSectionsSubmitted = sections.length > 0 && sections.every(s => getSectionSubmission(s.id));

  const isCompleted = labProgress?.isCompleted;

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
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>عن المختبر</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">{lab.description}</p>
                <div className="flex flex-wrap gap-2">
                  {lab.technologies?.map((tech) => (
                    <Badge key={tech} variant="outline">{tech}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {sections.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ListOrdered className="h-5 w-5 text-primary" />
                  أقسام المختبر ({sections.length} أقسام)
                </h2>

                {sections.map((section, index) => {
                  const submission = getSectionSubmission(section.id);
                  const isActive = activeSectionId === section.id;
                  const isPending = submission?.status === "pending";
                  const isApproved = submission?.status === "approved";
                  const isRejected = submission?.status === "rejected";

                  return (
                    <Card key={section.id} className={`transition-all ${isApproved ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : isPending ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20' : isRejected ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isApproved ? 'bg-green-500 text-white' : isPending ? 'bg-yellow-500 text-white' : isRejected ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                              {isApproved ? <CheckCircle className="h-4 w-4" /> : index + 1}
                            </span>
                            <div>
                              <CardTitle className="text-lg">{section.title}</CardTitle>
                              {submission && (
                                <Badge variant="outline" className={`mt-1 ${isApproved ? 'text-green-600 border-green-500' : isPending ? 'text-yellow-600 border-yellow-500' : 'text-red-600 border-red-500'}`}>
                                  {isApproved ? "تمت الموافقة" : isPending ? "قيد المراجعة" : "مرفوض"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {section.content && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
                          </div>
                        )}

                        {section.instructions && (
                          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              المهمة المطلوبة
                            </h4>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.instructions}</p>
                          </div>
                        )}

                        {submission && submission.screenshotUrl && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">التسليم السابق:</p>
                            <img 
                              src={submission.screenshotUrl} 
                              alt="التسليم" 
                              className="w-full max-h-64 object-cover rounded-lg border"
                            />
                            {submission.details && (
                              <p className="text-sm text-muted-foreground mt-2 bg-muted p-3 rounded-lg">{submission.details}</p>
                            )}
                          </div>
                        )}

                        {submission && !submission.screenshotUrl && submission.details && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">التسليم السابق:</p>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{submission.details}</p>
                          </div>
                        )}

                        {isRejected && submission?.reviewNotes && (
                          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>ملاحظات المراجع: {submission.reviewNotes}</span>
                            </p>
                          </div>
                        )}

                        {user && labStarted && !isCompleted && !isApproved && !isPending && (
                          <>
                            {!isActive ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setActiveSectionId(section.id)}
                                className="w-full"
                              >
                                <Send className="h-4 w-4 ml-2" />
                                {isRejected ? "إعادة التسليم" : "تسليم هذا القسم"}
                              </Button>
                            ) : (
                              <div className="space-y-3 border-t pt-4">
                                <div className="space-y-2">
                                  <Label>صورة من العمل المنجز</Label>
                                  {sectionScreenshots[section.id]?.preview ? (
                                    <div className="relative">
                                      <img 
                                        src={sectionScreenshots[section.id].preview} 
                                        alt="معاينة" 
                                        className="w-full h-48 object-cover rounded-lg"
                                      />
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 left-2 h-7 w-7"
                                        onClick={() => removeSectionScreenshot(section.id)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                                      <Input
                                        id={`screenshot-${section.id}`}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleSectionFileChange(section.id, e)}
                                      />
                                      <label htmlFor={`screenshot-${section.id}`} className="cursor-pointer">
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                                        <p className="text-xs text-muted-foreground">اضغط لرفع صورة</p>
                                      </label>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label>وصف العمل المنجز</Label>
                                  <Textarea
                                    placeholder="اكتب عما أنجزته في هذا القسم..."
                                    value={sectionDetails[section.id] || ""}
                                    onChange={(e) => setSectionDetails(prev => ({ ...prev, [section.id]: e.target.value }))}
                                    rows={3}
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => submitSectionMutation.mutate(section.id)}
                                    disabled={submitSectionMutation.isPending}
                                    size="sm"
                                  >
                                    {submitSectionMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                    ) : (
                                      <Send className="h-4 w-4 ml-2" />
                                    )}
                                    إرسال التسليم
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setActiveSectionId(null)}
                                  >
                                    إلغاء
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {sections.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <ListOrdered className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لم يتم إضافة أقسام لهذا المختبر بعد</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${lab.color} flex items-center justify-center`}>
                  <FlaskConical className="h-10 w-10 text-white" />
                </div>

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

                {labStarted && !isCompleted && sections.length > 0 && (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">تقدم الأقسام</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${sections.length > 0 ? (sections.filter(s => getSectionSubmission(s.id)).length / sections.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono">
                        {sections.filter(s => getSectionSubmission(s.id)).length}/{sections.length}
                      </span>
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
                        onClick={() => submitLabMutation.mutate()}
                        disabled={submitLabMutation.isPending || (sections.length > 0 && !allSectionsSubmitted)}
                        data-testid="button-complete-lab"
                      >
                        {submitLabMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 ml-2" />
                        )}
                        إتمام المختبر
                      </Button>
                    )}
                    {labStarted && !isCompleted && sections.length > 0 && !allSectionsSubmitted && (
                      <p className="text-xs text-center text-muted-foreground">
                        يجب تسليم جميع الأقسام قبل إتمام المختبر
                      </p>
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
                    <ListOrdered className="h-4 w-4 text-chart-4" />
                    <span>{sections.length} أقسام</span>
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
