import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { 
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  FileText,
  Save,
  FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LabSection, LabWithSections } from "@shared/schema";

export default function LabContentPage() {
  const { labId } = useParams<{ labId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<LabSection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [sectionForm, setSectionForm] = useState({
    title: "",
    content: "",
    instructions: "",
    order: 0,
    xpReward: 25,
    isPublished: true
  });

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Return early if not admin (after useEffect check)
  if (!user || user.role !== "admin") {
    return null;
  }

  const { data: labContent, isLoading } = useQuery<LabWithSections>({
    queryKey: ["/api/admin/labs", labId, "content"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/labs/${labId}/content`, {
        headers: { "X-User-Id": user.id }
      });
      if (!res.ok) throw new Error("Failed to fetch lab content");
      return res.json();
    },
    enabled: !!labId && !!user
  });

  // Section mutations
  const createSectionMutation = useMutation({
    mutationFn: async (data: typeof sectionForm) => {
      return apiRequest("POST", `/api/admin/labs/${labId}/sections`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/labs", labId, "content"] });
      setSectionModalOpen(false);
      resetSectionForm();
      toast({ title: "تم إنشاء القسم بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof sectionForm> }) => {
      return apiRequest("PATCH", `/api/admin/lab-sections/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/labs", labId, "content"] });
      setSectionModalOpen(false);
      setEditingSection(null);
      resetSectionForm();
      toast({ title: "تم تحديث القسم بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/lab-sections/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/labs", labId, "content"] });
      setDeleteTarget(null);
      toast({ title: "تم حذف القسم بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const resetSectionForm = () => {
    setSectionForm({ 
      title: "", 
      content: "", 
      instructions: "", 
      order: 0, 
      xpReward: 25,
      isPublished: true 
    });
  };

  const openEditSection = (section: LabSection) => {
    setEditingSection(section);
    setSectionForm({
      title: section.title,
      content: section.content || "",
      instructions: section.instructions || "",
      order: section.order,
      xpReward: section.xpReward,
      isPublished: section.isPublished
    });
    setSectionModalOpen(true);
  };

  const handleSectionSubmit = () => {
    if (editingSection) {
      updateSectionMutation.mutate({ id: editingSection.id, data: sectionForm });
    } else {
      createSectionMutation.mutate(sectionForm);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!labContent) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">المختبر غير موجود</p>
        <Link href="/admin">
          <Button className="mt-4">العودة للوحة التحكم</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-6 w-6" />
              <h1 className="text-2xl font-bold">{labContent.title}</h1>
            </div>
            <p className="text-muted-foreground">إدارة محتوى المختبر</p>
          </div>
        </div>
        <Button onClick={() => { resetSectionForm(); setEditingSection(null); setSectionModalOpen(true); }} data-testid="button-add-lab-section">
          <Plus className="h-4 w-4 ml-2" />
          إضافة قسم
        </Button>
      </div>

      {/* Lab Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant={labContent.isPublished ? "default" : "secondary"}>
              {labContent.isPublished ? "منشور" : "مسودة"}
            </Badge>
            <span className="text-muted-foreground">المستوى: {labContent.level}</span>
            <span className="text-muted-foreground">المدة: {labContent.duration} دقيقة</span>
            <span className="text-muted-foreground">{labContent.xpReward} XP</span>
            {labContent.technologies && labContent.technologies.length > 0 && (
              <div className="flex items-center gap-1">
                {labContent.technologies.map((tech, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                ))}
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{labContent.description}</p>
        </CardContent>
      </Card>

      {/* Sections List */}
      <div className="space-y-4">
        {labContent.sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد أقسام بعد</p>
              <Button 
                className="mt-4" 
                onClick={() => { resetSectionForm(); setEditingSection(null); setSectionModalOpen(true); }}
                data-testid="button-add-first-lab-section"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول قسم
              </Button>
            </CardContent>
          </Card>
        ) : (
          labContent.sections.map((section, index) => (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 py-4">
                <div className="flex items-start gap-3 flex-1">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">الخطوة {index + 1}:</span>
                      <span className="font-medium">{section.title}</span>
                      <Badge variant={section.isPublished ? "default" : "secondary"} className="text-xs">
                        {section.isPublished ? "منشور" : "مخفي"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{section.xpReward} XP</Badge>
                    </div>
                    {section.content && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{section.content}</p>
                    )}
                    {section.instructions && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium">التعليمات:</span>
                        <p className="text-muted-foreground line-clamp-2">{section.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openEditSection(section)}
                    data-testid={`button-edit-lab-section-${section.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDeleteTarget(section.id)}
                    data-testid={`button-delete-lab-section-${section.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Section Modal */}
      <Dialog open={sectionModalOpen} onOpenChange={setSectionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSection ? "تعديل القسم" : "إضافة قسم جديد"}</DialogTitle>
            <DialogDescription>
              {editingSection ? "قم بتعديل بيانات القسم" : "أدخل بيانات القسم الجديد"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pl-1">
            <div className="space-y-2">
              <Label>عنوان القسم</Label>
              <Input
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                placeholder="مثال: إعداد البيئة"
                data-testid="input-lab-section-title"
              />
            </div>
            <div className="space-y-2">
              <Label>المحتوى</Label>
              <Textarea
                value={sectionForm.content}
                onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })}
                placeholder="شرح تفصيلي للخطوة..."
                rows={4}
                data-testid="input-lab-section-content"
              />
            </div>
            <div className="space-y-2">
              <Label>التعليمات</Label>
              <Textarea
                value={sectionForm.instructions}
                onChange={(e) => setSectionForm({ ...sectionForm, instructions: e.target.value })}
                placeholder="التعليمات التي يجب على الطالب اتباعها..."
                rows={3}
                data-testid="input-lab-section-instructions"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  value={sectionForm.order}
                  onChange={(e) => setSectionForm({ ...sectionForm, order: parseInt(e.target.value) || 0 })}
                  data-testid="input-lab-section-order"
                />
              </div>
              <div className="space-y-2">
                <Label>نقاط XP</Label>
                <Input
                  type="number"
                  value={sectionForm.xpReward}
                  onChange={(e) => setSectionForm({ ...sectionForm, xpReward: parseInt(e.target.value) || 25 })}
                  data-testid="input-lab-section-xp"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>منشور</Label>
              <Switch
                checked={sectionForm.isPublished}
                onCheckedChange={(checked) => setSectionForm({ ...sectionForm, isPublished: checked })}
                data-testid="switch-lab-section-published"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionModalOpen(false)}>إلغاء</Button>
            <Button 
              onClick={handleSectionSubmit}
              disabled={!sectionForm.title || createSectionMutation.isPending || updateSectionMutation.isPending}
              data-testid="button-save-lab-section"
            >
              <Save className="h-4 w-4 ml-2" />
              {editingSection ? "تحديث" : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              هل أنت متأكد من الحذف؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا القسم نهائياً ولا يمكن استرجاعه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteSectionMutation.mutate(deleteTarget);
                }
              }}
              data-testid="button-confirm-delete-lab-section"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
