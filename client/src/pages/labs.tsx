import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Clock, 
  FlaskConical, 
  Trophy,
  Search,
  Zap,
  Play
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Lab } from "@shared/schema";

function LabCard({ lab }: { lab: Lab }) {
  return (
    <Link href={`/labs/${lab.id}`}>
      <Card className="text-center hover-elevate group cursor-pointer h-full" data-testid={`card-lab-${lab.id}`}>
        <CardContent className="pt-6">
          <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-r ${lab.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <FlaskConical className="h-10 w-10 text-white" />
          </div>
          <h4 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{lab.title}</h4>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{lab.description}</p>
          
          <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              {lab.duration} دقيقة
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-accent" />
              {lab.level}
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-chart-4" />
              {lab.xpReward} XP
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
            <Play className="h-4 w-4 ml-2" />
            بدء المختبر
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Labs() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");

  const { data: labs, isLoading } = useQuery<Lab[]>({
    queryKey: ["/api/labs"],
  });

  const filteredLabs = labs?.filter((lab) => {
    const matchesSearch = lab.title.toLowerCase().includes(search.toLowerCase()) ||
      lab.description.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = level === "all" || lab.level === level;
    return matchesSearch && matchesLevel;
  });

  const levels = Array.from(new Set(labs?.map(l => l.level) || []));

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">المختبرات التفاعلية</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            بيئات سحابية جاهزة لتطبيق ما تعلمته واكتساب الخبرة العملية
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن مختبر..." 
              className="pr-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-labs"
            />
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="text-center">
                <CardContent className="pt-6">
                  <Skeleton className="w-20 h-20 mx-auto mb-4 rounded-2xl" />
                  <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLabs?.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FlaskConical className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">لا توجد مختبرات مطابقة</h3>
              <p className="text-muted-foreground">جرب تغيير معايير البحث</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredLabs?.map((lab) => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
