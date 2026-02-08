import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  BookOpen, 
  FlaskConical, 
  Users, 
  Trophy, 
  Bell, 
  Search, 
  Menu, 
  X,
  LogIn,
  UserPlus,
  ChevronDown,
  Settings,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  Cloud,
  ShoppingCart,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/courses", label: "الدورات", icon: BookOpen },
  { href: "/paths", label: "المسارات", icon: GraduationCap },
  { href: "/labs", label: "المختبرات", icon: FlaskConical },
  { href: "/community", label: "المجتمع", icon: Users },
  { href: "/achievements", label: "الإنجازات", icon: Trophy },
];

export function Header() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  // Fetch homepage content for logo
  const { data: homepageContent } = useQuery<{ key: string; value: string; isVisible: boolean }[]>({
    queryKey: ["/api/homepage-content"],
    queryFn: async () => {
      const res = await fetch("/api/homepage-content");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Get site logo from homepage content
  const siteLogoContent = homepageContent?.find(c => c.key === "site_logo");
  const siteLogo = siteLogoContent?.isVisible && siteLogoContent?.value ? siteLogoContent.value : null;

  // Fetch cart count
  const { data: cartCount } = useQuery<{ count: number }>({
    queryKey: ["/api/cart/count"],
    queryFn: async () => {
      const res = await fetch("/api/cart/count", {
        headers: { "X-User-Id": user?.id || "" }
      });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch favorites count  
  const { data: favoritesData } = useQuery<any[]>({
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

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-border/40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
    {/* قمنا بإزالة الشرط {siteLogo ? ...} مؤقتاً لنجبر الصورة على الظهور */}
    <img 
      src="/favicon.png" 
      alt="سحابة الأردن" 
      className="h-12 w-auto object-contain"
      onError={(e) => {
        // كود احتياطي في حال فشل تحميل الصورة
        (e.target as HTMLImageElement).style.display = 'none';
        const fallback = (e.target as HTMLImageElement).nextElementSibling;
        if (fallback) (fallback as HTMLElement).style.display = 'flex';
      }}
    />
            ) : null}
            <div className={`w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center ${siteLogo ? 'hidden' : ''}`}>
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                سحابة الأردن
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-1">منصة مسارات الحوسبة السحابية</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`gap-2 ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                    data-testid={`nav-${item.label}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <Button variant="ghost" size="icon" className="text-muted-foreground" data-testid="button-search">
              <Search className="h-5 w-5" />
            </Button>

            {user && (
              <>
                <Link href="/favorites">
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-favorites">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                    {favoritesData && favoritesData.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500">
                        {favoritesData.length}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    {cartCount && cartCount.count > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                        {cartCount.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </>
            )}

            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                        2
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-3 border-b">
                      <h3 className="font-semibold">الإشعارات</h3>
                    </div>
                    <div className="p-2">
                      <p className="text-sm text-muted-foreground text-center py-4">لا توجد إشعارات جديدة</p>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="hidden md:flex items-center gap-4 mx-2 px-3 py-1 rounded-lg bg-muted/50">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">المستوى</p>
                    <p className="text-sm font-bold text-primary">{user.level}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">النقاط</p>
                    <p className="text-sm font-bold text-accent">{user.points?.toLocaleString()}</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 gap-2 pr-2" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/50">
                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-3 border-b">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-primary mt-1">{user.title || user.role}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="w-full cursor-pointer">
                        <LayoutDashboard className="ml-2 h-4 w-4" />
                        لوحة التحكم
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="w-full cursor-pointer">
                          <Settings className="ml-2 h-4 w-4" />
                          لوحة الإدارة
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "instructor" && (
                      <DropdownMenuItem asChild>
                        <Link href="/instructor" className="w-full cursor-pointer">
                          <GraduationCap className="ml-2 h-4 w-4" />
                          لوحة المحاضر
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                      <LogOut className="ml-2 h-4 w-4" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" className="gap-2" data-testid="button-login">
                    <LogIn className="h-4 w-4" />
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="gap-2 bg-gradient-primary" data-testid="button-register">
                    <UserPlus className="h-4 w-4" />
                    إنشاء حساب
                  </Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-2 ${isActive ? "bg-primary/10 text-primary" : ""}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              {!user && (
                <>
                  <Link href="/login">
                    <Button variant="outline" className="w-full gap-2 mt-2" onClick={() => setMobileMenuOpen(false)}>
                      <LogIn className="h-4 w-4" />
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full gap-2 mt-1 bg-gradient-primary" onClick={() => setMobileMenuOpen(false)}>
                      <UserPlus className="h-4 w-4" />
                      إنشاء حساب
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
