import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/header";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Admin from "@/pages/admin";
import Instructor from "@/pages/instructor";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import Labs from "@/pages/labs";
import LabDetail from "@/pages/lab-detail";
import StudentDashboard from "@/pages/student-dashboard";
import CourseContentPage from "@/pages/course-content";
import LabContentPage from "@/pages/lab-content";
import CourseLearn from "@/pages/course-learn";
import NotFound from "@/pages/not-found";
import Paths from "@/pages/paths";
import PathDetail from "@/pages/path-detail";
import Cart from "@/pages/cart";
import Favorites from "@/pages/favorites";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/courses/:courseId/content" component={CourseContentPage} />
      <Route path="/admin/labs/:labId/content" component={LabContentPage} />
      <Route path="/instructor" component={Instructor} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/learn/:id" component={CourseLearn} />
      <Route path="/paths" component={Paths} />
      <Route path="/paths/:id" component={PathDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/labs" component={Labs} />
      <Route path="/labs/:id" component={LabDetail} />
      <Route path="/dashboard" component={StudentDashboard} />
      <Route path="/student" component={StudentDashboard} />
      <Route path="/community" component={Home} />
      <Route path="/achievements" component={StudentDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background" dir="rtl">
              <Header />
              <Router />
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
