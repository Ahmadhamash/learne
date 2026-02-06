import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export type UserRole = "student" | "instructor" | "admin";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  role: text("role").notNull().default("student"),
  title: text("title"),
  bio: text("bio"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  points: integer("points").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Courses/Paths table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  category: text("category").notNull(),
  level: text("level").notNull(),
  duration: text("duration").notNull(),
  price: real("price").notNull().default(0),
  originalPrice: real("original_price"),
  instructorId: varchar("instructor_id").notNull(),
  rating: real("rating").notNull().default(0),
  studentsCount: integer("students_count").notNull().default(0),
  lessonsCount: integer("lessons_count").notNull().default(0),
  projectsCount: integer("projects_count").notNull().default(0),
  skills: text("skills").array(),
  difficulty: integer("difficulty").notNull().default(1),
  isPublished: boolean("is_published").notNull().default(false),
  isSpecialOffer: boolean("is_special_offer").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  rating: true,
  studentsCount: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Course Sections table (modules within a course)
export const courseSections = pgTable("course_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
});

export const insertCourseSectionSchema = createInsertSchema(courseSections).omit({
  id: true,
});

export type InsertCourseSection = z.infer<typeof insertCourseSectionSchema>;
export type CourseSection = typeof courseSections.$inferSelect;

// Lessons table (videos/content within sections)
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull(),
  sectionId: varchar("section_id"),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  videoUrl: text("video_url"),
  labId: varchar("lab_id"), // Link to lab for this lesson
  duration: integer("duration").notNull().default(0),
  order: integer("order").notNull().default(0),
  xpReward: integer("xp_reward").notNull().default(50),
  isPublished: boolean("is_published").notNull().default(false),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Enrollment status type
export type EnrollmentStatus = "pending" | "approved" | "rejected";

// Payment method type
export type PaymentMethod = "cliq" | "paypal";

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  courseId: varchar("course_id").notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method"), // cliq or paypal
  // Contact info for enrollment request
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  progress: integer("progress").notNull().default(0),
  completedLessons: integer("completed_lessons").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
  completedAt: true,
  reviewedAt: true,
  reviewedBy: true,
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// Lesson Progress table
export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  lessonId: varchar("lesson_id").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({
  id: true,
  completedAt: true,
});

export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  courseId: varchar("course_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Achievements table
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  xpReward: integer("xp_reward").notNull().default(100),
  requirement: text("requirement"),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// User Achievements table
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  achievementId: varchar("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

// Labs table
export const labs = pgTable("labs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  about: text("about"),
  environment: text("environment"),
  instructions: text("instructions").array(),
  learningObjectives: text("learning_objectives").array(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  image: text("image"),
  creatorId: varchar("creator_id"),
  duration: integer("duration").notNull(),
  level: text("level").notNull(),
  technologies: text("technologies").array(),
  xpReward: integer("xp_reward").notNull().default(100),
  isPublished: boolean("is_published").notNull().default(false),
});

export const insertLabSchema = createInsertSchema(labs).omit({
  id: true,
});

export type InsertLab = z.infer<typeof insertLabSchema>;
export type Lab = typeof labs.$inferSelect;

// Lab Sections table (content sections within a lab)
export const labSections = pgTable("lab_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labId: varchar("lab_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  instructions: text("instructions"),
  order: integer("order").notNull().default(0),
  xpReward: integer("xp_reward").notNull().default(25),
  isPublished: boolean("is_published").notNull().default(true),
});

export const insertLabSectionSchema = createInsertSchema(labSections).omit({
  id: true,
});

export type InsertLabSection = z.infer<typeof insertLabSectionSchema>;
export type LabSection = typeof labSections.$inferSelect;

// Lab Progress table
export const labProgress = pgTable("lab_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  labId: varchar("lab_id").notNull(),
  progress: integer("progress").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertLabProgressSchema = createInsertSchema(labProgress).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export type InsertLabProgress = z.infer<typeof insertLabProgressSchema>;
export type LabProgress = typeof labProgress.$inferSelect;

// Lab Submissions table (student lab completions with screenshots)
export const labSubmissions = pgTable("lab_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  labId: varchar("lab_id").notNull(),
  sectionId: varchar("section_id"),
  screenshotUrl: text("screenshot_url"),
  details: text("details"),
  timeSpent: integer("time_spent").notNull().default(0), // in seconds
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
  reviewNotes: text("review_notes"),
});

export const insertLabSubmissionSchema = createInsertSchema(labSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  reviewNotes: true,
});

export type InsertLabSubmission = z.infer<typeof insertLabSubmissionSchema>;
export type LabSubmission = typeof labSubmissions.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Certificates table
export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  courseId: varchar("course_id").notNull(),
  issuedAt: timestamp("issued_at").defaultNow(),
  certificateUrl: text("certificate_url"),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  issuedAt: true,
});

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

// Extended types for API responses
export type CourseWithInstructor = Course & {
  instructor: Pick<User, "id" | "name" | "avatar" | "title">;
};

export type EnrollmentWithCourse = Enrollment & {
  course: Course;
};

export type EnrollmentWithUserAndCourse = Enrollment & {
  user: Pick<User, "id" | "name" | "avatar" | "email" | "username">;
  course: Pick<Course, "id" | "title" | "category" | "level">;
};

export type ReviewWithUser = Review & {
  user: Pick<User, "id" | "name" | "avatar">;
};

export type UserStats = {
  totalStudents: number;
  totalCourses: number;
  totalLabs: number;
  totalEnrollments: number;
  totalRevenue: number;
  averageRating: number;
};

export type InstructorStats = {
  totalStudents: number;
  totalCourses: number;
  totalReviews: number;
  averageRating: number;
  totalRevenue: number;
};

// Course with sections and lessons
export type CourseSectionWithLessons = CourseSection & {
  lessons: Lesson[];
};

export type CourseWithContent = Course & {
  instructor: Pick<User, "id" | "name" | "avatar" | "title">;
  sections: CourseSectionWithLessons[];
};

// Lab with sections
export type LabWithSections = Lab & {
  sections: LabSection[];
};

// Lab submission with user and lab info
export type LabSubmissionWithDetails = LabSubmission & {
  user: Pick<User, "id" | "name" | "avatar" | "email" | "username">;
  lab: Pick<Lab, "id" | "title" | "icon" | "color">;
};

// Homepage content table for admin management
export const homepageContent = pgTable("homepage_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // e.g., hero_title, hero_subtitle, stats_students
  value: text("value").notNull(),
  type: text("type").notNull().default("text"), // text, number, image
  order: integer("order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHomepageContentSchema = createInsertSchema(homepageContent).omit({
  id: true,
  updatedAt: true,
});

export type InsertHomepageContent = z.infer<typeof insertHomepageContentSchema>;
export type HomepageContent = typeof homepageContent.$inferSelect;

// Enrollment with user and course info for admin
export type EnrollmentWithDetails = Enrollment & {
  user: Pick<User, "id" | "name" | "avatar" | "email" | "username">;
  course: Pick<Course, "id" | "title" | "image" | "price">;
};

// Learning Paths table (مسارات التعلم)
export const learningPaths = pgTable("learning_paths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  icon: text("icon"),
  color: text("color").notNull().default("#3b82f6"),
  level: text("level").notNull().default("مبتدئ"),
  duration: text("duration"),
  coursesCount: integer("courses_count").notNull().default(0),
  studentsCount: integer("students_count").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true,
  coursesCount: true,
  studentsCount: true,
});

export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type LearningPath = typeof learningPaths.$inferSelect;

// Path Courses junction table (many-to-many relationship)
export const pathCourses = pgTable("path_courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pathId: varchar("path_id").notNull(),
  courseId: varchar("course_id").notNull(),
  order: integer("order").notNull().default(0),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertPathCourseSchema = createInsertSchema(pathCourses).omit({
  id: true,
  addedAt: true,
});

export type InsertPathCourse = z.infer<typeof insertPathCourseSchema>;
export type PathCourse = typeof pathCourses.$inferSelect;

// Lesson Reviews table (تقييمات الدروس)
export const lessonReviews = pgTable("lesson_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  lessonId: varchar("lesson_id").notNull(),
  courseId: varchar("course_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLessonReviewSchema = createInsertSchema(lessonReviews).omit({
  id: true,
  createdAt: true,
});

export type InsertLessonReview = z.infer<typeof insertLessonReviewSchema>;
export type LessonReview = typeof lessonReviews.$inferSelect;

// Learning path with courses
export type LearningPathWithCourses = LearningPath & {
  courses: Course[];
};

// Lesson review with user
export type LessonReviewWithUser = LessonReview & {
  user: Pick<User, "id" | "name" | "avatar">;
};

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  itemId: varchar("item_id").notNull(),
  itemType: text("item_type").notNull(), // 'course' | 'path'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

// Cart item with course/path details
export type CartItemWithDetails = CartItem & {
  course?: Course;
  path?: LearningPath;
};

// Favorites table
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  itemId: varchar("item_id").notNull(),
  itemType: text("item_type").notNull(), // 'course' | 'path'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Favorite with course/path details
export type FavoriteWithDetails = Favorite & {
  course?: Course;
  path?: LearningPath;
  user?: Pick<User, "id" | "name" | "email" | "avatar">;
};

// Quizzes table - one quiz per lesson
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull().default(70), // percentage to pass
  xpReward: integer("xp_reward").notNull().default(25),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Quiz questions table
export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull(),
  question: text("question").notNull(),
  options: text("options").array().notNull(), // array of answer options
  correctAnswer: integer("correct_answer").notNull(), // index of correct option (0-based)
  order: integer("order").notNull().default(0),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

// Quiz attempts table - tracks student quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  quizId: varchar("quiz_id").notNull(),
  score: integer("score").notNull(), // percentage score
  answers: text("answers").array(), // JSON array of user's answers
  passed: boolean("passed").notNull().default(false),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// Quiz with questions
export type QuizWithQuestions = Quiz & {
  questions: QuizQuestion[];
};

// Quiz attempt with quiz details
export type QuizAttemptWithQuiz = QuizAttempt & {
  quiz: Quiz;
};
