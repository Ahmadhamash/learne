import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertCourseSchema, insertLessonSchema, insertReviewSchema, insertLabSchema, insertNotificationSchema, insertLessonReviewSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadsDir = path.resolve(process.cwd(), "uploads", "videos");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = crypto.randomUUID() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم. يرجى رفع فيديو بصيغة MP4 أو WebM أو OGG"));
    }
  },
});

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: "غير مصرح - يرجى تسجيل الدخول" });
  }
  
  const user = await storage.getUser(userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "غير مصرح - صلاحيات المدير مطلوبة" });
  }
  
  (req as any).adminUser = user;
  next();
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: "غير مصرح - يرجى تسجيل الدخول" });
  }
  
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ error: "المستخدم غير موجود" });
  }
  
  (req as any).authUser = user;
  next();
}

async function requireInstructor(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: "غير مصرح - يرجى تسجيل الدخول" });
  }
  
  const user = await storage.getUser(userId);
  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return res.status(403).json({ error: "غير مصرح - صلاحيات المدرس مطلوبة" });
  }
  
  (req as any).instructorUser = user;
  next();
}

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email(),
  name: z.string().min(2),
});

const enrollmentSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  paymentMethod: z.enum(["cliq", "paypal"]),
  contactName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(1).optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
      }
      
      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }
      
      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة", details: result.error.flatten() });
      }

      const { username, password, email, name } = result.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "اسم المستخدم مستخدم مسبقاً" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "البريد الإلكتروني مستخدم مسبقاً" });
      }

      const user = await storage.createUser({
        username,
        password,
        email,
        name,
        role: "student",
        level: 1,
        xp: 0,
        points: 0,
        streak: 0,
        isActive: true,
      });

      const { password: _, ...safeUser } = user;
      res.status(201).json({ user: safeUser });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ password: _, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const users = await storage.getLeaderboard(limit);
      const safeUsers = users.map(({ password: _, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Courses routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getPublishedCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourseWithInstructor(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "الدورة غير موجودة" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const result = insertCourseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "بيانات الدورة غير صحيحة", details: result.error.flatten() });
      }
      const course = await storage.createCourse(result.data);
      res.status(201).json(course);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.updateCourse(req.params.id, req.body);
      if (!course) {
        return res.status(404).json({ error: "الدورة غير موجودة" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const success = await storage.deleteCourse(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "الدورة غير موجودة" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Course content route (sections with lessons) - requires approved enrollment
  app.get("/api/courses/:courseId/content", async (req, res) => {
    try {
      const userId = req.header("X-User-Id");
      if (!userId) {
        return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
      }
      
      // Check if user has approved enrollment
      const enrollment = await storage.getEnrollment(userId, req.params.courseId);
      if (!enrollment || enrollment.status !== "approved") {
        return res.status(403).json({ error: "يجب التسجيل في الدورة للوصول للمحتوى" });
      }
      
      const course = await storage.getCourseWithContent(req.params.courseId);
      if (!course) {
        return res.status(404).json({ error: "الدورة غير موجودة" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Lessons routes
  app.get("/api/courses/:courseId/lessons", async (req, res) => {
    try {
      const lessons = await storage.getLessonsByCourse(req.params.courseId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/lessons", async (req, res) => {
    try {
      const result = insertLessonSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "بيانات الدرس غير صحيحة", details: result.error.flatten() });
      }
      const lesson = await storage.createLesson(result.data);
      res.status(201).json(lesson);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/lessons/:id", async (req, res) => {
    try {
      const lesson = await storage.updateLesson(req.params.id, req.body);
      if (!lesson) {
        return res.status(404).json({ error: "الدرس غير موجود" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Enrollments routes
  app.get("/api/users/:userId/enrollments", async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByUser(req.params.userId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/users/:userId/lesson-progress", async (req, res) => {
    try {
      const progress = await storage.getLessonProgressByUser(req.params.userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const result = enrollmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "بيانات التسجيل غير صحيحة" });
      }
      
      const { userId, courseId, paymentMethod, contactName, contactEmail, contactPhone } = result.data;
      const existing = await storage.getEnrollment(userId, courseId);
      if (existing) {
        return res.status(400).json({ error: "المستخدم مسجل بالفعل في هذه الدورة" });
      }
      
      const enrollment = await storage.createEnrollment({ 
        userId, 
        courseId, 
        paymentMethod, 
        contactName,
        contactEmail,
        contactPhone,
        status: "pending" 
      });
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Reviews routes
  app.get("/api/courses/:courseId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByCourse(req.params.courseId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const result = insertReviewSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "بيانات التقييم غير صحيحة", details: result.error.flatten() });
      }
      const review = await storage.createReview(result.data);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Labs routes
  app.get("/api/labs", async (req, res) => {
    try {
      const labs = await storage.getAllLabs();
      const publishedLabs = labs.filter(lab => lab.isPublished);
      res.json(publishedLabs);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/labs/:id", async (req, res) => {
    try {
      const lab = await storage.getLab(req.params.id);
      if (!lab) {
        return res.status(404).json({ error: "المختبر غير موجود" });
      }
      res.json(lab);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/labs/:id/sections", async (req, res) => {
    try {
      const sections = await storage.getLabSections(req.params.id);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/labs/:id/sections/:sectionId/submit", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const lab = await storage.getLab(req.params.id);
      if (!lab) {
        return res.status(404).json({ error: "المختبر غير موجود" });
      }
      const section = await storage.getLabSection(req.params.sectionId);
      if (!section || section.labId !== req.params.id) {
        return res.status(404).json({ error: "القسم غير موجود" });
      }
      const { screenshotUrl, details } = req.body;
      const submission = await storage.createLabSubmission({
        userId,
        labId: req.params.id,
        sectionId: req.params.sectionId,
        screenshotUrl,
        details,
        timeSpent: 0,
        status: "pending",
      });
      res.status(201).json(submission);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/labs/:id/my-submissions", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const submissions = await storage.getLabSubmissionsByUserAndLab(userId, req.params.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/labs/all", async (req, res) => {
    try {
      const labs = await storage.getAllLabs();
      res.json(labs);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/labs", async (req, res) => {
    try {
      const result = insertLabSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "بيانات المختبر غير صحيحة", details: result.error.flatten() });
      }
      const lab = await storage.createLab(result.data);
      res.status(201).json(lab);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/labs/:id", async (req, res) => {
    try {
      const lab = await storage.updateLab(req.params.id, req.body);
      if (!lab) {
        return res.status(404).json({ error: "المختبر غير موجود" });
      }
      res.json(lab);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/labs/:id", async (req, res) => {
    try {
      const success = await storage.deleteLab(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "المختبر غير موجود" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Lab progress and submissions routes
  app.post("/api/labs/:id/start", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const lab = await storage.getLab(req.params.id);
      if (!lab) {
        return res.status(404).json({ error: "المختبر غير موجود" });
      }
      const progress = await storage.startLab(userId, req.params.id);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/labs/:id/progress", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const progress = await storage.getLabProgress(userId, req.params.id);
      res.json(progress || null);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/labs/:id/submit", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const lab = await storage.getLab(req.params.id);
      if (!lab) {
        return res.status(404).json({ error: "المختبر غير موجود" });
      }
      const { screenshotUrl, details, timeSpent } = req.body;
      const submission = await storage.createLabSubmission({
        userId,
        labId: req.params.id,
        screenshotUrl,
        details,
        timeSpent: timeSpent || 0,
        status: "pending",
      });
      // Award XP for completing the lab
      await storage.updateUserXP(userId, lab.xpReward);
      res.status(201).json(submission);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/user/lab-submissions", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const submissions = await storage.getLabSubmissionsByUser(userId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/user/completed-labs-count", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "غير مصرح" });
      }
      const count = await storage.getUserCompletedLabsCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Achievements routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/users/:userId/achievements", async (req, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.params.userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/users/:userId/achievements/:achievementId", async (req, res) => {
    try {
      const userAchievement = await storage.unlockAchievement(
        req.params.userId,
        req.params.achievementId
      );
      res.status(201).json(userAchievement);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Notifications routes
  app.get("/api/users/:userId/notifications", async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const result = insertNotificationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "بيانات الإشعار غير صحيحة" });
      }
      const notification = await storage.createNotification(result.data);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "الإشعار غير موجود" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/users/:userId/notifications/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin routes (all protected)
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/admin/courses", requireAdmin, async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin Users CRUD (protected)
  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ error: "اسم المستخدم مستخدم مسبقاً" });
      }
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ error: "البريد الإلكتروني مستخدم مسبقاً" });
      }
      const user = await storage.createUser(req.body);
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin Enrollment Requests (protected)
  app.get("/api/admin/enrollments/pending", requireAdmin, async (req, res) => {
    try {
      const enrollments = await storage.getPendingEnrollments();
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/enrollments/:id/approve", requireAdmin, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      const enrollment = await storage.approveEnrollment(req.params.id, adminUser.id);
      if (!enrollment) {
        return res.status(404).json({ error: "طلب التسجيل غير موجود" });
      }
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/enrollments/:id/reject", requireAdmin, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      const enrollment = await storage.rejectEnrollment(req.params.id, adminUser.id);
      if (!enrollment) {
        return res.status(404).json({ error: "طلب التسجيل غير موجود" });
      }
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin Lab Submissions management (protected)
  app.get("/api/admin/lab-submissions", requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getAllLabSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/admin/lab-submissions/pending", requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getPendingLabSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/lab-submissions/:id/approve", requireAdmin, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      const { notes } = req.body;
      const submission = await storage.reviewLabSubmission(req.params.id, adminUser.id, "approved", notes);
      if (!submission) {
        return res.status(404).json({ error: "طلب المختبر غير موجود" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/lab-submissions/:id/reject", requireAdmin, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      const { notes } = req.body;
      const submission = await storage.reviewLabSubmission(req.params.id, adminUser.id, "rejected", notes);
      if (!submission) {
        return res.status(404).json({ error: "طلب المختبر غير موجود" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin Cart Items - view all cart items
  app.get("/api/admin/cart-items", requireAdmin, async (req, res) => {
    try {
      const items = await storage.getAllCartItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin Favorites - view all favorites
  app.get("/api/admin/favorites", requireAdmin, async (req, res) => {
    try {
      const favorites = await storage.getAllFavorites();
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Instructor routes (for instructors to view their students' lab submissions)
  app.get("/api/instructor/lab-submissions", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const submissions = await storage.getLabSubmissionsForInstructor(instructorUser.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/instructor/courses", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const courses = await storage.getCoursesByInstructor(instructorUser.id);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Instructor Labs management - get labs linked to instructor's courses through lessons
  app.get("/api/instructor/labs", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const instructorCourses = await storage.getCoursesByInstructor(instructorUser.id);
      const courseIds = instructorCourses.map(c => c.id);
      
      const allLabs = await storage.getAllLabs();
      const allLessons = [];
      for (const courseId of courseIds) {
        const lessons = await storage.getLessonsByCourse(courseId);
        allLessons.push(...lessons);
      }
      
      const labIdsInCourses = new Set(allLessons.filter(l => l.labId).map(l => l.labId));
      const instructorLabs = allLabs.filter(lab => 
        labIdsInCourses.has(lab.id) || lab.creatorId === instructorUser.id
      );
      
      res.json(instructorLabs);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Instructor can update labs linked to their courses
  app.patch("/api/instructor/labs/:id", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const labId = req.params.id;
      const lab = await storage.getLab(labId);
      if (!lab) {
        return res.status(404).json({ error: "المختبر غير موجود" });
      }

      if (lab.creatorId !== instructorUser.id && instructorUser.role !== 'admin') {
        const instructorCourses = await storage.getCoursesByInstructor(instructorUser.id);
        const courseIds = instructorCourses.map(c => c.id);
        
        let hasAccess = false;
        for (const courseId of courseIds) {
          const lessons = await storage.getLessonsByCourse(courseId);
          if (lessons.some(l => l.labId === labId)) {
            hasAccess = true;
            break;
          }
        }
        
        if (!hasAccess) {
          return res.status(403).json({ error: "غير مصرح بتعديل هذا المختبر" });
        }
      }
      
      const updatedLab = await storage.updateLab(labId, req.body);
      res.json(updatedLab);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Instructor can create labs
  app.post("/api/instructor/labs", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const result = insertLabSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "بيانات المختبر غير صحيحة", details: result.error.flatten() });
      }
      const lab = await storage.createLab({ ...result.data, creatorId: instructorUser.id });
      res.status(201).json(lab);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Instructor can delete labs they own
  app.delete("/api/instructor/labs/:id", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const labId = req.params.id;
      if (instructorUser.role !== 'admin') {
        const instructorCourses = await storage.getCoursesByInstructor(instructorUser.id);
        const courseIds = instructorCourses.map(c => c.id);
        let hasAccess = false;
        for (const courseId of courseIds) {
          const lessons = await storage.getLessonsByCourse(courseId);
          if (lessons.some(l => l.labId === labId)) {
            hasAccess = true;
            break;
          }
        }
        if (!hasAccess) {
          return res.status(403).json({ error: "غير مصرح بحذف هذا المختبر" });
        }
      }
      const success = await storage.deleteLab(labId);
      if (!success) {
        return res.status(404).json({ error: "المختبر غير موجود" });
      }
      res.json({ message: "تم حذف المختبر بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Instructor lab content with sections (for lab-content page)
  app.get("/api/instructor/labs/:labId/content", requireInstructor, async (req, res) => {
    try {
      const lab = await storage.getLabWithSections(req.params.labId);
      if (!lab) {
        return res.status(404).json({ error: "المختبر غير موجود" });
      }
      res.json(lab);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Instructor lab sections management
  app.get("/api/instructor/labs/:labId/sections", requireInstructor, async (req, res) => {
    try {
      const sections = await storage.getLabSections(req.params.labId);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/instructor/labs/:labId/sections", requireInstructor, async (req, res) => {
    try {
      const section = await storage.createLabSection({
        ...req.body,
        labId: req.params.labId
      });
      res.status(201).json(section);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/instructor/lab-sections/:sectionId", requireInstructor, async (req, res) => {
    try {
      const section = await storage.updateLabSection(req.params.sectionId, req.body);
      if (!section) {
        return res.status(404).json({ error: "القسم غير موجود" });
      }
      res.json(section);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/instructor/lab-sections/:sectionId", requireInstructor, async (req, res) => {
    try {
      const deleted = await storage.deleteLabSection(req.params.sectionId);
      if (!deleted) {
        return res.status(404).json({ error: "القسم غير موجود" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Instructor course content management (allow instructors to manage their own courses)
  app.get("/api/instructor/courses/:courseId/content", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const course = await storage.getCourse(req.params.courseId);
      
      if (!course) {
        return res.status(404).json({ error: "الدورة غير موجودة" });
      }
      
      // Check if instructor owns this course or is admin
      if (course.instructorId !== instructorUser.id && instructorUser.role !== 'admin') {
        return res.status(403).json({ error: "غير مصرح بالوصول لهذه الدورة" });
      }
      
      const courseContent = await storage.getCourseWithContent(req.params.courseId);
      res.json(courseContent);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/instructor/courses/:courseId/sections", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const course = await storage.getCourse(req.params.courseId);
      
      if (!course || (course.instructorId !== instructorUser.id && instructorUser.role !== 'admin')) {
        return res.status(403).json({ error: "غير مصرح بالوصول لهذه الدورة" });
      }
      
      const section = await storage.createCourseSection({
        ...req.body,
        courseId: req.params.courseId
      });
      res.status(201).json(section);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/instructor/sections/:sectionId", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const section = await storage.getCourseSection(req.params.sectionId);
      
      if (!section) {
        return res.status(404).json({ error: "القسم غير موجود" });
      }
      
      const course = await storage.getCourse(section.courseId);
      if (!course || (course.instructorId !== instructorUser.id && instructorUser.role !== 'admin')) {
        return res.status(403).json({ error: "غير مصرح بتعديل هذا القسم" });
      }
      
      const updated = await storage.updateCourseSection(req.params.sectionId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/instructor/sections/:sectionId", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const section = await storage.getCourseSection(req.params.sectionId);
      
      if (!section) {
        return res.status(404).json({ error: "القسم غير موجود" });
      }
      
      const course = await storage.getCourse(section.courseId);
      if (!course || (course.instructorId !== instructorUser.id && instructorUser.role !== 'admin')) {
        return res.status(403).json({ error: "غير مصرح بحذف هذا القسم" });
      }
      
      await storage.deleteCourseSection(req.params.sectionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/instructor/courses/:courseId/lessons", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const course = await storage.getCourse(req.params.courseId);
      
      if (!course || (course.instructorId !== instructorUser.id && instructorUser.role !== 'admin')) {
        return res.status(403).json({ error: "غير مصرح بالوصول لهذه الدورة" });
      }
      
      const lesson = await storage.createLesson({
        ...req.body,
        courseId: req.params.courseId
      });
      res.status(201).json(lesson);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/instructor/lessons/:lessonId", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const lesson = await storage.getLesson(req.params.lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: "الدرس غير موجود" });
      }
      
      const course = await storage.getCourse(lesson.courseId);
      if (!course || (course.instructorId !== instructorUser.id && instructorUser.role !== 'admin')) {
        return res.status(403).json({ error: "غير مصرح بتعديل هذا الدرس" });
      }
      
      const updated = await storage.updateLesson(req.params.lessonId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/instructor/lessons/:lessonId", requireInstructor, async (req, res) => {
    try {
      const instructorUser = (req as any).instructorUser;
      const lesson = await storage.getLesson(req.params.lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: "الدرس غير موجود" });
      }
      
      const course = await storage.getCourse(lesson.courseId);
      if (!course || (course.instructorId !== instructorUser.id && instructorUser.role !== 'admin')) {
        return res.status(403).json({ error: "غير مصرح بحذف هذا الدرس" });
      }
      
      await storage.deleteLesson(req.params.lessonId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin Labs management (protected)
  app.get("/api/admin/labs", requireAdmin, async (req, res) => {
    try {
      const labs = await storage.getAllLabs();
      res.json(labs);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Course Content Management - Sections (protected)
  app.get("/api/admin/courses/:courseId/content", requireAdmin, async (req, res) => {
    try {
      const course = await storage.getCourseWithContent(req.params.courseId);
      if (!course) {
        return res.status(404).json({ error: "الدورة غير موجودة" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/admin/courses/:courseId/sections", requireAdmin, async (req, res) => {
    try {
      const sections = await storage.getCourseSections(req.params.courseId);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/courses/:courseId/sections", requireAdmin, async (req, res) => {
    try {
      const section = await storage.createCourseSection({
        ...req.body,
        courseId: req.params.courseId
      });
      res.status(201).json(section);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/admin/sections/:sectionId", requireAdmin, async (req, res) => {
    try {
      const section = await storage.updateCourseSection(req.params.sectionId, req.body);
      if (!section) {
        return res.status(404).json({ error: "القسم غير موجود" });
      }
      res.json(section);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/admin/sections/:sectionId", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteCourseSection(req.params.sectionId);
      if (!deleted) {
        return res.status(404).json({ error: "القسم غير موجود" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Course Lessons Management (protected)
  app.get("/api/admin/courses/:courseId/lessons", requireAdmin, async (req, res) => {
    try {
      const lessons = await storage.getLessonsByCourse(req.params.courseId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/courses/:courseId/lessons", requireAdmin, async (req, res) => {
    try {
      const lesson = await storage.createLesson({
        ...req.body,
        courseId: req.params.courseId
      });
      res.status(201).json(lesson);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/admin/lessons/:lessonId", requireAdmin, async (req, res) => {
    try {
      const lesson = await storage.updateLesson(req.params.lessonId, req.body);
      if (!lesson) {
        return res.status(404).json({ error: "الدرس غير موجود" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/admin/lessons/:lessonId", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteLesson(req.params.lessonId);
      if (!deleted) {
        return res.status(404).json({ error: "الدرس غير موجود" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Lab Content Management - Sections (protected)
  app.get("/api/admin/labs/:labId/content", requireAdmin, async (req, res) => {
    try {
      const lab = await storage.getLabWithSections(req.params.labId);
      if (!lab) {
        return res.status(404).json({ error: "المختبر غير موجود" });
      }
      res.json(lab);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/admin/labs/:labId/sections", requireAdmin, async (req, res) => {
    try {
      const sections = await storage.getLabSections(req.params.labId);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/labs/:labId/sections", requireAdmin, async (req, res) => {
    try {
      const section = await storage.createLabSection({
        ...req.body,
        labId: req.params.labId
      });
      res.status(201).json(section);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/admin/lab-sections/:sectionId", requireAdmin, async (req, res) => {
    try {
      const section = await storage.updateLabSection(req.params.sectionId, req.body);
      if (!section) {
        return res.status(404).json({ error: "القسم غير موجود" });
      }
      res.json(section);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/admin/lab-sections/:sectionId", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteLabSection(req.params.sectionId);
      if (!deleted) {
        return res.status(404).json({ error: "القسم غير موجود" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Instructor routes
  app.get("/api/instructor/stats", async (req, res) => {
    try {
      const instructorId = req.query.instructorId as string;
      if (!instructorId) {
        return res.status(400).json({ error: "معرف المحاضر مطلوب" });
      }
      const stats = await storage.getInstructorStats(instructorId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/instructor/courses", async (req, res) => {
    try {
      const instructorId = req.query.instructorId as string;
      if (!instructorId) {
        return res.status(400).json({ error: "معرف المحاضر مطلوب" });
      }
      const courses = await storage.getCoursesByInstructor(instructorId);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/instructor/reviews", async (req, res) => {
    try {
      const instructorId = req.query.instructorId as string;
      if (!instructorId) {
        return res.status(400).json({ error: "معرف المحاضر مطلوب" });
      }
      
      const courses = await storage.getCoursesByInstructor(instructorId);
      const allReviews = [];
      
      for (const course of courses) {
        const reviews = await storage.getReviewsByCourse(course.id);
        allReviews.push(...reviews);
      }
      
      res.json(allReviews);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Certificates routes
  app.get("/api/users/:userId/certificates", async (req, res) => {
    try {
      const certificates = await storage.getUserCertificates(req.params.userId);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/certificates", async (req, res) => {
    try {
      const certificate = await storage.createCertificate(req.body);
      res.status(201).json(certificate);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Lesson progress routes
  app.post("/api/lessons/:lessonId/complete", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "معرف المستخدم مطلوب" });
      }
      const progress = await storage.markLessonComplete(userId, req.params.lessonId);
      
      const lesson = await storage.getLesson(req.params.lessonId);
      if (lesson) {
        await storage.updateUserXP(userId, lesson.xpReward);
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Lab progress routes
  app.post("/api/labs/:labId/start", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "معرف المستخدم مطلوب" });
      }
      
      let progress = await storage.getLabProgress(userId, req.params.labId);
      if (!progress) {
        progress = await storage.createLabProgress({
          userId,
          labId: req.params.labId,
        });
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/labs/:labId/complete", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "معرف المستخدم مطلوب" });
      }
      
      let progress = await storage.getLabProgress(userId, req.params.labId);
      if (progress) {
        progress = await storage.updateLabProgress(progress.id, {
          isCompleted: true,
          progress: 100,
        });
        
        const lab = await storage.getLab(req.params.labId);
        if (lab) {
          await storage.updateUserXP(userId, lab.xpReward);
        }
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // User lab progress route
  app.get("/api/users/:userId/lab-progress", async (req, res) => {
    try {
      const progress = await storage.getUserLabProgress(req.params.userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Homepage Content routes (public)
  app.get("/api/homepage-content", async (req, res) => {
    try {
      const content = await storage.getAllHomepageContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin Homepage Content routes
  app.get("/api/admin/homepage-content", requireAdmin, async (req, res) => {
    try {
      const content = await storage.getAllHomepageContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/homepage-content", requireAdmin, async (req, res) => {
    try {
      const content = await storage.createHomepageContent(req.body);
      res.status(201).json(content);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/admin/homepage-content/:id", requireAdmin, async (req, res) => {
    try {
      const content = await storage.updateHomepageContent(req.params.id, req.body);
      if (!content) {
        return res.status(404).json({ error: "المحتوى غير موجود" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/admin/homepage-content/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteHomepageContent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Seed homepage content (admin only)
  app.post("/api/admin/seed-homepage", requireAdmin, async (req, res) => {
    try {
      await storage.seedHomepageContent();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Learning Paths routes (public)
  app.get("/api/learning-paths", async (req, res) => {
    try {
      const paths = await storage.getPublishedLearningPaths();
      res.json(paths);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/learning-paths/:id", async (req, res) => {
    try {
      const path = await storage.getLearningPathWithCourses(req.params.id);
      if (!path) {
        return res.status(404).json({ error: "المسار غير موجود" });
      }
      res.json(path);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin Learning Paths routes
  app.get("/api/admin/learning-paths", requireAdmin, async (req, res) => {
    try {
      const paths = await storage.getAllLearningPaths();
      res.json(paths);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/admin/learning-paths/:id", requireAdmin, async (req, res) => {
    try {
      const path = await storage.getLearningPathWithCourses(req.params.id);
      if (!path) {
        return res.status(404).json({ error: "المسار غير موجود" });
      }
      res.json(path);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/learning-paths", requireAdmin, async (req, res) => {
    try {
      const path = await storage.createLearningPath(req.body);
      res.status(201).json(path);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.patch("/api/admin/learning-paths/:id", requireAdmin, async (req, res) => {
    try {
      const path = await storage.updateLearningPath(req.params.id, req.body);
      if (!path) {
        return res.status(404).json({ error: "المسار غير موجود" });
      }
      res.json(path);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/admin/learning-paths/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteLearningPath(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "المسار غير موجود" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Path Courses (add/remove courses from paths)
  app.get("/api/admin/learning-paths/:pathId/courses", requireAdmin, async (req, res) => {
    try {
      const courses = await storage.getPathCourses(req.params.pathId);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/learning-paths/:pathId/courses", requireAdmin, async (req, res) => {
    try {
      const { courseId, order } = req.body;
      const assignment = await storage.addCourseToPath(req.params.pathId, courseId, order);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/admin/learning-paths/:pathId/courses/:courseId", requireAdmin, async (req, res) => {
    try {
      const success = await storage.removeCourseFromPath(req.params.pathId, req.params.courseId);
      if (!success) {
        return res.status(404).json({ error: "الدورة غير موجودة في المسار" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Lesson Reviews routes
  app.get("/api/lessons/:lessonId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getLessonReviewsByLesson(req.params.lessonId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/lessons/:lessonId/my-review", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const review = await storage.getUserLessonReview(userId, req.params.lessonId);
      res.json(review || null);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  const lessonReviewBodySchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
    courseId: z.string().min(1),
  });

  app.post("/api/lessons/:lessonId/reviews", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      // Validate request body
      const parseResult = lessonReviewBodySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "بيانات غير صالحة", details: parseResult.error.errors });
      }
      const { rating, comment, courseId } = parseResult.data;
      
      // Check if user already has a review for this lesson
      const existing = await storage.getUserLessonReview(userId, req.params.lessonId);
      if (existing) {
        // Update existing review
        const updated = await storage.updateLessonReview(existing.id, { rating, comment });
        return res.json(updated);
      }
      
      // Create new review
      const review = await storage.createLessonReview({
        userId,
        lessonId: req.params.lessonId,
        courseId,
        rating,
        comment,
      });
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/lessons/:lessonId/reviews/:reviewId", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const review = await storage.getLessonReview(req.params.reviewId);
      if (!review || review.userId !== userId) {
        return res.status(403).json({ error: "غير مصرح" });
      }
      await storage.deleteLessonReview(req.params.reviewId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Cart routes
  const cartItemSchema = z.object({
    itemId: z.string().min(1),
    itemType: z.enum(["course", "path"]),
  });

  app.get("/api/cart", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const items = await storage.getCartItems(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/cart/count", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const items = await storage.getCartItems(userId);
      res.json({ count: items.length });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/cart", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const parseResult = cartItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "بيانات غير صالحة" });
      }
      const { itemId, itemType } = parseResult.data;
      
      // Check if already in cart
      const existing = await storage.getCartItem(userId, itemId, itemType);
      if (existing) {
        return res.status(400).json({ error: "العنصر موجود بالفعل في السلة" });
      }
      
      const item = await storage.addToCart({ userId, itemId, itemType });
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/cart/:id", requireAuth, async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/cart", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      await storage.clearCart(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin: View all cart items
  app.get("/api/admin/cart-items", requireAdmin, async (req, res) => {
    try {
      const items = await storage.getAllCartItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Favorites routes
  const favoriteSchema = z.object({
    itemId: z.string().min(1),
    itemType: z.enum(["course", "path"]),
  });

  app.get("/api/favorites", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const favs = await storage.getFavorites(userId);
      res.json(favs);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/favorites/check", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { itemId, itemType } = req.query;
      if (!itemId || !itemType) {
        return res.status(400).json({ error: "بيانات ناقصة" });
      }
      const fav = await storage.getFavorite(userId, itemId as string, itemType as string);
      res.json({ isFavorite: !!fav, favoriteId: fav?.id });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/favorites", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const parseResult = favoriteSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "بيانات غير صالحة" });
      }
      const { itemId, itemType } = parseResult.data;
      
      // Check if already favorited
      const existing = await storage.getFavorite(userId, itemId, itemType);
      if (existing) {
        return res.status(400).json({ error: "العنصر موجود بالفعل في المفضلة" });
      }
      
      const fav = await storage.addToFavorites({ userId, itemId, itemType });
      res.status(201).json(fav);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/favorites/:id", requireAuth, async (req, res) => {
    try {
      await storage.removeFromFavorites(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin: View all favorites
  app.get("/api/admin/favorites", requireAdmin, async (req, res) => {
    try {
      const favs = await storage.getAllFavorites();
      res.json(favs);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Path enrollment: Buy path = enroll in all courses
  app.post("/api/paths/:pathId/enroll", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { contactName, contactEmail, contactPhone, paymentMethod } = req.body;
      
      // Get path courses
      const pathCourses = await storage.getPathCourses(req.params.pathId);
      if (pathCourses.length === 0) {
        return res.status(404).json({ error: "المسار لا يحتوي على دورات" });
      }
      
      // Create enrollment for each course
      const enrollments = [];
      for (const course of pathCourses) {
        // Check if already enrolled
        const existing = await storage.getUserEnrollment(userId, course.id);
        if (!existing) {
          const enrollment = await storage.createEnrollment({
            userId,
            courseId: course.id,
            contactName,
            contactEmail,
            contactPhone,
            paymentMethod,
            status: "pending",
          });
          enrollments.push(enrollment);
        }
      }
      
      res.status(201).json({ 
        message: "تم تقديم طلب التسجيل للمسار بنجاح", 
        enrollmentsCount: enrollments.length 
      });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // ===================== QUIZ ROUTES =====================
  
  // Get quiz by lesson ID (for students viewing a lesson)
  app.get("/api/lessons/:lessonId/quiz", async (req, res) => {
    try {
      const quiz = await storage.getQuizByLesson(req.params.lessonId);
      if (!quiz || !quiz.isPublished) {
        return res.json(null);
      }
      
      // Get questions but don't send correctAnswer to client
      const questions = await storage.getQuizQuestions(quiz.id);
      const sanitizedQuestions = questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        order: q.order
      }));
      
      res.json({ ...quiz, questions: sanitizedQuestions });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Submit quiz attempt
  app.post("/api/quizzes/:quizId/attempt", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { answers } = req.body; // array of answer indices
      
      const quiz = await storage.getQuizWithQuestions(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "الكويز غير موجود" });
      }
      
      // Calculate score
      let correctCount = 0;
      quiz.questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) {
          correctCount++;
        }
      });
      
      const score = quiz.questions.length > 0 
        ? Math.round((correctCount / quiz.questions.length) * 100) 
        : 0;
      const passed = score >= (quiz.passingScore || 70);
      
      const attempt = await storage.createQuizAttempt({
        userId,
        quizId: quiz.id,
        score,
        answers: answers.map(String),
        passed
      });
      
      // Award XP if passed
      if (passed && quiz.xpReward) {
        await storage.updateUserXP(userId, quiz.xpReward);
      }
      
      res.status(201).json({
        ...attempt,
        correctCount,
        totalQuestions: quiz.questions.length,
        passingScore: quiz.passingScore
      });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Get user's best attempt for a quiz
  app.get("/api/quizzes/:quizId/my-attempt", requireAuth, async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const attempt = await storage.getUserBestAttempt(userId, req.params.quizId);
      res.json(attempt || null);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // ===================== ADMIN QUIZ ROUTES =====================
  
  // Get all quizzes for a course (admin)
  app.get("/api/admin/courses/:courseId/quizzes", requireAdmin, async (req, res) => {
    try {
      const quizList = await storage.getQuizzesByCourse(req.params.courseId);
      res.json(quizList);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Get quiz with questions (admin)
  app.get("/api/admin/quizzes/:quizId", requireAdmin, async (req, res) => {
    try {
      const quiz = await storage.getQuizWithQuestions(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "الكويز غير موجود" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Create quiz for a lesson (admin)
  app.post("/api/admin/lessons/:lessonId/quiz", requireAdmin, async (req, res) => {
    try {
      const { title, description, passingScore, xpReward, isPublished } = req.body;
      
      // Check if lesson already has a quiz
      const existing = await storage.getQuizByLesson(req.params.lessonId);
      if (existing) {
        return res.status(400).json({ error: "هذا الدرس لديه كويز بالفعل" });
      }
      
      const quiz = await storage.createQuiz({
        lessonId: req.params.lessonId,
        title: title || "كويز الدرس",
        description,
        passingScore: passingScore || 70,
        xpReward: xpReward || 25,
        isPublished: isPublished || false
      });
      
      res.status(201).json(quiz);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Update quiz (admin)
  app.patch("/api/admin/quizzes/:quizId", requireAdmin, async (req, res) => {
    try {
      const quiz = await storage.updateQuiz(req.params.quizId, req.body);
      if (!quiz) {
        return res.status(404).json({ error: "الكويز غير موجود" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Delete quiz (admin)
  app.delete("/api/admin/quizzes/:quizId", requireAdmin, async (req, res) => {
    try {
      await storage.deleteQuiz(req.params.quizId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Add question to quiz (admin)
  app.post("/api/admin/quizzes/:quizId/questions", requireAdmin, async (req, res) => {
    try {
      const { question, options, correctAnswer, order } = req.body;
      
      if (!question || !options || options.length < 2 || correctAnswer === undefined) {
        return res.status(400).json({ error: "بيانات غير صالحة" });
      }
      
      const newQuestion = await storage.createQuizQuestion({
        quizId: req.params.quizId,
        question,
        options,
        correctAnswer,
        order: order || 0
      });
      
      res.status(201).json(newQuestion);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Update question (admin)
  app.patch("/api/admin/questions/:questionId", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateQuizQuestion(req.params.questionId, req.body);
      if (!updated) {
        return res.status(404).json({ error: "السؤال غير موجود" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Delete question (admin)
  app.delete("/api/admin/questions/:questionId", requireAdmin, async (req, res) => {
    try {
      await storage.deleteQuizQuestion(req.params.questionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Video upload endpoint (admin/instructor)
  app.post("/api/videos/upload", requireInstructor, videoUpload.single("video"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "لم يتم رفع ملف" });
      }
      const videoPath = `/api/videos/stream/${req.file.filename}`;
      res.json({ videoPath, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ error: "خطأ في رفع الفيديو" });
    }
  });

  // Protected video streaming endpoint with Range support
  app.get("/api/videos/stream/:filename", async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      if (!filename || filename.includes("..") || filename.includes("/")) {
        return res.status(400).json({ error: "اسم ملف غير صالح" });
      }
      const filePath = path.join(uploadsDir, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "الفيديو غير موجود" });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".ogg": "video/ogg",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
      };
      const contentType = mimeTypes[ext] || "video/mp4";

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": contentType,
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
        });
        file.pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": contentType,
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
        });
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      res.status(500).json({ error: "خطأ في تشغيل الفيديو" });
    }
  });

  // Delete uploaded video
  app.delete("/api/videos/:filename", requireInstructor, async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      if (!filename || filename.includes("..") || filename.includes("/")) {
        return res.status(400).json({ error: "اسم ملف غير صالح" });
      }
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطأ في حذف الفيديو" });
    }
  });

  return httpServer;
}
