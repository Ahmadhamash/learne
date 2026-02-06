import {
  type User, type InsertUser,
  type Course, type InsertCourse,
  type Lesson, type InsertLesson,
  type Enrollment, type InsertEnrollment,
  type LessonProgress, type InsertLessonProgress,
  type Review, type InsertReview,
  type Achievement, type InsertAchievement,
  type UserAchievement, type InsertUserAchievement,
  type Lab, type InsertLab,
  type LabProgress, type InsertLabProgress,
  type LabSubmission, type InsertLabSubmission,
  type Notification, type InsertNotification,
  type Certificate, type InsertCertificate,
  type CourseSection, type InsertCourseSection,
  type LabSection, type InsertLabSection,
  type HomepageContent, type InsertHomepageContent,
  type LearningPath, type InsertLearningPath,
  type PathCourse, type InsertPathCourse,
  type LessonReview, type InsertLessonReview,
  type CartItem, type InsertCartItem,
  type Favorite, type InsertFavorite,
  type Quiz, type InsertQuiz,
  type QuizQuestion, type InsertQuizQuestion,
  type QuizAttempt, type InsertQuizAttempt,
  type QuizWithQuestions,
  type CourseWithInstructor,
  type ReviewWithUser,
  type UserStats,
  type InstructorStats,
  type EnrollmentWithUserAndCourse,
  type CourseWithContent,
  type LabWithSections,
  type LabSubmissionWithDetails,
  type LearningPathWithCourses,
  type LessonReviewWithUser,
  type CartItemWithDetails,
  type FavoriteWithDetails,
  users, courses, lessons, enrollments, lessonProgress, reviews,
  achievements, userAchievements, labs, labProgress, labSubmissions, notifications, certificates,
  courseSections, labSections, homepageContent, learningPaths, pathCourses, lessonReviews,
  cartItems, favorites, quizzes, quizQuestions, quizAttempts,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, avg, count, sum, asc, inArray, isNotNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUserXP(userId: string, xpToAdd: number): Promise<User | undefined>;

  getCourse(id: string): Promise<Course | undefined>;
  getCourseWithInstructor(id: string): Promise<CourseWithInstructor | undefined>;
  getAllCourses(): Promise<Course[]>;
  getCoursesByInstructor(instructorId: string): Promise<Course[]>;
  getPublishedCourses(): Promise<CourseWithInstructor[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  updateCourseRating(courseId: string): Promise<void>;

  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonsByCourse(courseId: string): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<boolean>;

  getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: string): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]>;
  getPendingEnrollments(): Promise<EnrollmentWithUserAndCourse[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, data: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  approveEnrollment(id: string, reviewerId: string): Promise<Enrollment | undefined>;
  rejectEnrollment(id: string, reviewerId: string): Promise<Enrollment | undefined>;

  getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined>;
  getUserLessonProgress(userId: string, courseId: string): Promise<LessonProgress[]>;
  getLessonProgressByUser(userId: string): Promise<LessonProgress[]>;
  createLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress>;
  markLessonComplete(userId: string, lessonId: string): Promise<LessonProgress | undefined>;

  getReview(id: string): Promise<Review | undefined>;
  getReviewsByCourse(courseId: string): Promise<ReviewWithUser[]>;
  getReviewsByUser(userId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, data: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: string): Promise<boolean>;

  getAchievement(id: string): Promise<Achievement | undefined>;
  getAllAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement>;

  getLab(id: string): Promise<Lab | undefined>;
  getLabWithSections(id: string): Promise<LabWithSections | undefined>;
  getAllLabs(): Promise<Lab[]>;
  getPublishedLabs(): Promise<Lab[]>;
  createLab(lab: InsertLab): Promise<Lab>;
  updateLab(id: string, data: Partial<InsertLab>): Promise<Lab | undefined>;
  deleteLab(id: string): Promise<boolean>;

  // Course Sections CRUD
  getCourseSection(id: string): Promise<CourseSection | undefined>;
  getCourseSections(courseId: string): Promise<CourseSection[]>;
  getCourseWithContent(courseId: string): Promise<CourseWithContent | undefined>;
  createCourseSection(section: InsertCourseSection): Promise<CourseSection>;
  updateCourseSection(id: string, data: Partial<InsertCourseSection>): Promise<CourseSection | undefined>;
  deleteCourseSection(id: string): Promise<boolean>;

  // Lab Sections CRUD
  getLabSection(id: string): Promise<LabSection | undefined>;
  getLabSections(labId: string): Promise<LabSection[]>;
  createLabSection(section: InsertLabSection): Promise<LabSection>;
  updateLabSection(id: string, data: Partial<InsertLabSection>): Promise<LabSection | undefined>;
  deleteLabSection(id: string): Promise<boolean>;

  getLabProgress(userId: string, labId: string): Promise<LabProgress | undefined>;
  getUserLabProgress(userId: string): Promise<LabProgress[]>;
  createLabProgress(progress: InsertLabProgress): Promise<LabProgress>;
  updateLabProgress(id: string, data: Partial<InsertLabProgress>): Promise<LabProgress | undefined>;
  startLab(userId: string, labId: string): Promise<LabProgress>;

  // Lab Submissions CRUD
  getLabSubmission(id: string): Promise<LabSubmission | undefined>;
  getLabSubmissionsByUser(userId: string): Promise<LabSubmission[]>;
  getLabSubmissionsByUserAndLab(userId: string, labId: string): Promise<LabSubmission[]>;
  getLabSubmissionsByLab(labId: string): Promise<LabSubmission[]>;
  getLabSubmissionsForInstructor(instructorId: string): Promise<LabSubmissionWithDetails[]>;
  getAllLabSubmissions(): Promise<LabSubmissionWithDetails[]>;
  getPendingLabSubmissions(): Promise<LabSubmissionWithDetails[]>;
  createLabSubmission(submission: InsertLabSubmission): Promise<LabSubmission>;
  reviewLabSubmission(id: string, reviewerId: string, status: string, notes?: string): Promise<LabSubmission | undefined>;
  getUserCompletedLabsCount(userId: string): Promise<number>;

  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<boolean>;

  getCertificate(id: string): Promise<Certificate | undefined>;
  getUserCertificates(userId: string): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;

  getAdminStats(): Promise<UserStats>;
  getInstructorStats(instructorId: string): Promise<InstructorStats>;
  getLeaderboard(limit?: number): Promise<User[]>;

  // Homepage Content CRUD
  getAllHomepageContent(): Promise<HomepageContent[]>;
  getHomepageContentByKey(key: string): Promise<HomepageContent | undefined>;
  createHomepageContent(content: InsertHomepageContent): Promise<HomepageContent>;
  updateHomepageContent(id: string, data: Partial<InsertHomepageContent>): Promise<HomepageContent | undefined>;
  deleteHomepageContent(id: string): Promise<boolean>;
  seedHomepageContent(): Promise<void>;

  // Learning Paths CRUD
  getLearningPath(id: string): Promise<LearningPath | undefined>;
  getLearningPathWithCourses(id: string): Promise<LearningPathWithCourses | undefined>;
  getAllLearningPaths(): Promise<LearningPath[]>;
  getPublishedLearningPaths(): Promise<LearningPathWithCourses[]>;
  createLearningPath(path: InsertLearningPath): Promise<LearningPath>;
  updateLearningPath(id: string, data: Partial<InsertLearningPath>): Promise<LearningPath | undefined>;
  deleteLearningPath(id: string): Promise<boolean>;
  
  // Path Courses (course-path assignments)
  getPathCourses(pathId: string): Promise<Course[]>;
  addCourseToPath(pathId: string, courseId: string, order?: number): Promise<PathCourse>;
  removeCourseFromPath(pathId: string, courseId: string): Promise<boolean>;
  updatePathCourseOrder(pathId: string, courseId: string, order: number): Promise<PathCourse | undefined>;

  // Lesson Reviews CRUD
  getLessonReview(id: string): Promise<LessonReview | undefined>;
  getLessonReviewsByLesson(lessonId: string): Promise<LessonReviewWithUser[]>;
  getLessonReviewsByUser(userId: string): Promise<LessonReview[]>;
  getUserLessonReview(userId: string, lessonId: string): Promise<LessonReview | undefined>;
  createLessonReview(review: InsertLessonReview): Promise<LessonReview>;
  updateLessonReview(id: string, data: Partial<InsertLessonReview>): Promise<LessonReview | undefined>;
  deleteLessonReview(id: string): Promise<boolean>;

  // Cart CRUD
  getCartItems(userId: string): Promise<CartItemWithDetails[]>;
  getCartItem(userId: string, itemId: string, itemType: string): Promise<CartItem | undefined>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  getAllCartItems(): Promise<CartItemWithDetails[]>;

  // Favorites CRUD
  getFavorites(userId: string): Promise<FavoriteWithDetails[]>;
  getFavorite(userId: string, itemId: string, itemType: string): Promise<Favorite | undefined>;
  addToFavorites(favorite: InsertFavorite): Promise<Favorite>;
  removeFromFavorites(id: string): Promise<boolean>;
  getAllFavorites(): Promise<FavoriteWithDetails[]>;

  // Quiz CRUD
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizByLesson(lessonId: string): Promise<Quiz | undefined>;
  getQuizWithQuestions(id: string): Promise<QuizWithQuestions | undefined>;
  getQuizzesByCourse(courseId: string): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<boolean>;

  // Quiz Questions CRUD
  getQuizQuestion(id: string): Promise<QuizQuestion | undefined>;
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuizQuestion(id: string, data: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined>;
  deleteQuizQuestion(id: string): Promise<boolean>;

  // Quiz Attempts
  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  getUserQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]>;
  getUserBestAttempt(userId: string, quizId: string): Promise<QuizAttempt | undefined>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;

  seedInitialData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async updateUserXP(userId: string, xpToAdd: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    const newXP = user.xp + xpToAdd;
    const newLevel = Math.floor(newXP / 500) + 1;
    const [updated] = await db.update(users).set({
      xp: newXP,
      level: newLevel,
      points: user.points + xpToAdd
    }).where(eq(users.id, userId)).returning();
    return updated;
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getCourseWithInstructor(id: string): Promise<CourseWithInstructor | undefined> {
    const course = await this.getCourse(id);
    if (!course) return undefined;
    const instructor = await this.getUser(course.instructorId);
    if (!instructor) return undefined;
    return {
      ...course,
      instructor: { id: instructor.id, name: instructor.name, avatar: instructor.avatar, title: instructor.title }
    };
  }

  async getAllCourses(): Promise<Course[]> {
    return db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.instructorId, instructorId));
  }

  async getPublishedCourses(): Promise<CourseWithInstructor[]> {
    const allCourses = await db.select().from(courses).where(eq(courses.isPublished, true));
    const result: CourseWithInstructor[] = [];
    for (const course of allCourses) {
      const instructor = await this.getUser(course.instructorId);
      result.push({
        ...course,
        instructor: instructor
          ? { id: instructor.id, name: instructor.name, avatar: instructor.avatar, title: instructor.title }
          : { id: "", name: "Unknown", avatar: null, title: null }
      });
    }
    return result;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return course || undefined;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateCourseRating(courseId: string): Promise<void> {
    const courseReviews = await db.select().from(reviews).where(eq(reviews.courseId, courseId));
    if (courseReviews.length === 0) return;
    const avgRating = courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length;
    await db.update(courses).set({ rating: Math.round(avgRating * 10) / 10 }).where(eq(courses.id, courseId));
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.order));
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(insertLesson).returning();
    return lesson;
  }

  async updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [lesson] = await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
    return lesson || undefined;
  }

  async deleteLesson(id: string): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment || undefined;
  }

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getPendingEnrollments(): Promise<EnrollmentWithUserAndCourse[]> {
    const pending = await db.select().from(enrollments).where(eq(enrollments.status, "pending")).orderBy(desc(enrollments.enrolledAt));
    const result: EnrollmentWithUserAndCourse[] = [];
    for (const enrollment of pending) {
      const user = await this.getUser(enrollment.userId);
      const course = await this.getCourse(enrollment.courseId);
      if (user && course) {
        result.push({
          ...enrollment,
          user: { id: user.id, name: user.name, avatar: user.avatar, email: user.email, username: user.username },
          course: { id: course.id, title: course.title, category: course.category, level: course.level }
        });
      }
    }
    return result;
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values({
      ...insertEnrollment,
      status: "pending"
    }).returning();
    return enrollment;
  }

  async updateEnrollment(id: string, data: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const [enrollment] = await db.update(enrollments).set(data).where(eq(enrollments.id, id)).returning();
    return enrollment || undefined;
  }

  async approveEnrollment(id: string, reviewerId: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db.update(enrollments).set({
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: reviewerId
    }).where(eq(enrollments.id, id)).returning();
    
    if (enrollment) {
      const course = await this.getCourse(enrollment.courseId);
      if (course) {
        await db.update(courses).set({ studentsCount: course.studentsCount + 1 }).where(eq(courses.id, course.id));
      }
    }
    return enrollment || undefined;
  }

  async rejectEnrollment(id: string, reviewerId: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db.update(enrollments).set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: reviewerId
    }).where(eq(enrollments.id, id)).returning();
    return enrollment || undefined;
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined> {
    const [progress] = await db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));
    return progress || undefined;
  }

  async getUserLessonProgress(userId: string, courseId: string): Promise<LessonProgress[]> {
    const courseLessons = await this.getLessonsByCourse(courseId);
    const lessonIds = courseLessons.map(l => l.id);
    if (lessonIds.length === 0) return [];
    const allProgress = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
    return allProgress.filter(p => lessonIds.includes(p.lessonId));
  }

  async getLessonProgressByUser(userId: string): Promise<LessonProgress[]> {
    return db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
  }

  async createLessonProgress(insertProgress: InsertLessonProgress): Promise<LessonProgress> {
    const [progress] = await db.insert(lessonProgress).values(insertProgress).returning();
    return progress;
  }

  async markLessonComplete(userId: string, lessonId: string): Promise<LessonProgress | undefined> {
    const existing = await this.getLessonProgress(userId, lessonId);
    if (existing) {
      const [updated] = await db.update(lessonProgress).set({ isCompleted: true, completedAt: new Date() })
        .where(eq(lessonProgress.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(lessonProgress).values({
      userId, lessonId, isCompleted: true, completedAt: new Date()
    }).returning();
    return created;
  }

  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async getReviewsByCourse(courseId: string): Promise<ReviewWithUser[]> {
    const courseReviews = await db.select().from(reviews).where(eq(reviews.courseId, courseId));
    const result: ReviewWithUser[] = [];
    for (const review of courseReviews) {
      const user = await this.getUser(review.userId);
      if (user) {
        result.push({ ...review, user: { id: user.id, name: user.name, avatar: user.avatar } });
      }
    }
    return result;
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.userId, userId));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(insertReview).returning();
    await this.updateCourseRating(insertReview.courseId);
    return review;
  }

  async updateReview(id: string, data: Partial<InsertReview>): Promise<Review | undefined> {
    const [review] = await db.update(reviews).set(data).where(eq(reviews.id, id)).returning();
    if (review && data.rating) {
      await this.updateCourseRating(review.courseId);
    }
    return review || undefined;
  }

  async deleteReview(id: string): Promise<boolean> {
    const review = await this.getReview(id);
    const result = await db.delete(reviews).where(eq(reviews.id, id));
    if (review) {
      await this.updateCourseRating(review.courseId);
    }
    return (result.rowCount ?? 0) > 0;
  }

  async getAchievement(id: string): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement || undefined;
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db.insert(achievements).values(insertAchievement).returning();
    return achievement;
  }

  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const userAchs = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
    const result: (UserAchievement & { achievement: Achievement })[] = [];
    for (const ua of userAchs) {
      const achievement = await this.getAchievement(ua.achievementId);
      if (achievement) {
        result.push({ ...ua, achievement });
      }
    }
    return result;
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    const [ua] = await db.insert(userAchievements).values({ userId, achievementId }).returning();
    return ua;
  }

  async getLab(id: string): Promise<Lab | undefined> {
    const [lab] = await db.select().from(labs).where(eq(labs.id, id));
    return lab || undefined;
  }

  async getAllLabs(): Promise<Lab[]> {
    return db.select().from(labs);
  }

  async getPublishedLabs(): Promise<Lab[]> {
    return db.select().from(labs).where(eq(labs.isPublished, true));
  }

  async createLab(insertLab: InsertLab): Promise<Lab> {
    const [lab] = await db.insert(labs).values(insertLab).returning();
    return lab;
  }

  async updateLab(id: string, data: Partial<InsertLab>): Promise<Lab | undefined> {
    const [lab] = await db.update(labs).set(data).where(eq(labs.id, id)).returning();
    return lab || undefined;
  }

  async deleteLab(id: string): Promise<boolean> {
    // Delete lab sections first
    await db.delete(labSections).where(eq(labSections.labId, id));
    const result = await db.delete(labs).where(eq(labs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getLabWithSections(id: string): Promise<LabWithSections | undefined> {
    const [lab] = await db.select().from(labs).where(eq(labs.id, id));
    if (!lab) return undefined;
    
    const sections = await db.select().from(labSections)
      .where(eq(labSections.labId, id))
      .orderBy(asc(labSections.order));
    
    return { ...lab, sections };
  }

  // Course Sections CRUD
  async getCourseSection(id: string): Promise<CourseSection | undefined> {
    const [section] = await db.select().from(courseSections).where(eq(courseSections.id, id));
    return section || undefined;
  }

  async getCourseSections(courseId: string): Promise<CourseSection[]> {
    return db.select().from(courseSections)
      .where(eq(courseSections.courseId, courseId))
      .orderBy(asc(courseSections.order));
  }

  async getCourseWithContent(courseId: string): Promise<CourseWithContent | undefined> {
    const course = await this.getCourseWithInstructor(courseId);
    if (!course) return undefined;

    const sections = await this.getCourseSections(courseId);
    const courseLessons = await this.getLessonsByCourse(courseId);

    const sectionsWithLessons = sections.map(section => ({
      ...section,
      lessons: courseLessons.filter(l => l.sectionId === section.id).sort((a, b) => a.order - b.order)
    }));

    // Add lessons without sections as "uncategorized"
    const uncategorizedLessons = courseLessons.filter(l => !l.sectionId);

    return {
      ...course,
      sections: sectionsWithLessons
    };
  }

  async createCourseSection(section: InsertCourseSection): Promise<CourseSection> {
    const [created] = await db.insert(courseSections).values(section).returning();
    return created;
  }

  async updateCourseSection(id: string, data: Partial<InsertCourseSection>): Promise<CourseSection | undefined> {
    const [updated] = await db.update(courseSections).set(data).where(eq(courseSections.id, id)).returning();
    return updated || undefined;
  }

  async deleteCourseSection(id: string): Promise<boolean> {
    // Clear section reference from lessons (don't delete lessons)
    await db.update(lessons).set({ sectionId: null }).where(eq(lessons.sectionId, id));
    const result = await db.delete(courseSections).where(eq(courseSections.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Lab Sections CRUD
  async getLabSection(id: string): Promise<LabSection | undefined> {
    const [section] = await db.select().from(labSections).where(eq(labSections.id, id));
    return section || undefined;
  }

  async getLabSections(labId: string): Promise<LabSection[]> {
    return db.select().from(labSections)
      .where(eq(labSections.labId, labId))
      .orderBy(asc(labSections.order));
  }

  async createLabSection(section: InsertLabSection): Promise<LabSection> {
    const [created] = await db.insert(labSections).values(section).returning();
    return created;
  }

  async updateLabSection(id: string, data: Partial<InsertLabSection>): Promise<LabSection | undefined> {
    const [updated] = await db.update(labSections).set(data).where(eq(labSections.id, id)).returning();
    return updated || undefined;
  }

  async deleteLabSection(id: string): Promise<boolean> {
    const result = await db.delete(labSections).where(eq(labSections.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getLabProgress(userId: string, labId: string): Promise<LabProgress | undefined> {
    const [progress] = await db.select().from(labProgress)
      .where(and(eq(labProgress.userId, userId), eq(labProgress.labId, labId)));
    return progress || undefined;
  }

  async getUserLabProgress(userId: string): Promise<LabProgress[]> {
    return db.select().from(labProgress).where(eq(labProgress.userId, userId));
  }

  async createLabProgress(insertProgress: InsertLabProgress): Promise<LabProgress> {
    const [progress] = await db.insert(labProgress).values(insertProgress).returning();
    return progress;
  }

  async updateLabProgress(id: string, data: Partial<InsertLabProgress>): Promise<LabProgress | undefined> {
    const [progress] = await db.update(labProgress).set(data).where(eq(labProgress.id, id)).returning();
    return progress || undefined;
  }

  async startLab(userId: string, labId: string): Promise<LabProgress> {
    const existing = await this.getLabProgress(userId, labId);
    if (existing) {
      return existing;
    }
    const [progress] = await db.insert(labProgress).values({
      userId,
      labId,
      progress: 0,
      isCompleted: false,
    }).returning();
    return progress;
  }

  // Lab Submissions CRUD
  async getLabSubmission(id: string): Promise<LabSubmission | undefined> {
    const [submission] = await db.select().from(labSubmissions).where(eq(labSubmissions.id, id));
    return submission || undefined;
  }

  async getLabSubmissionsByUser(userId: string): Promise<LabSubmission[]> {
    return db.select().from(labSubmissions).where(eq(labSubmissions.userId, userId)).orderBy(desc(labSubmissions.submittedAt));
  }

  async getLabSubmissionsByUserAndLab(userId: string, labId: string): Promise<LabSubmission[]> {
    return db.select().from(labSubmissions)
      .where(and(eq(labSubmissions.userId, userId), eq(labSubmissions.labId, labId)))
      .orderBy(desc(labSubmissions.submittedAt));
  }

  async getLabSubmissionsByLab(labId: string): Promise<LabSubmission[]> {
    return db.select().from(labSubmissions).where(eq(labSubmissions.labId, labId)).orderBy(desc(labSubmissions.submittedAt));
  }

  async getLabSubmissionsForInstructor(instructorId: string): Promise<LabSubmissionWithDetails[]> {
    // Get all courses for this instructor
    const instructorCourses = await db.select().from(courses).where(eq(courses.instructorId, instructorId));
    if (instructorCourses.length === 0) return [];

    // Get all sections for those courses
    const courseIds = instructorCourses.map(c => c.id);
    const courseSectionsList = await db.select().from(courseSections).where(inArray(courseSections.courseId, courseIds));
    if (courseSectionsList.length === 0) return [];

    // Get all lessons with labId for those sections
    const sectionIds = courseSectionsList.map(s => s.id);
    const courseLessons = await db.select().from(lessons).where(
      and(
        inArray(lessons.sectionId, sectionIds),
        isNotNull(lessons.labId)
      )
    );
    if (courseLessons.length === 0) return [];

    // Get all lab IDs from those lessons
    const labIds = courseLessons.map(l => l.labId).filter((id): id is string => id !== null);
    if (labIds.length === 0) return [];

    // Get all submissions for those labs
    const submissions = await db.select().from(labSubmissions)
      .where(inArray(labSubmissions.labId, labIds))
      .orderBy(desc(labSubmissions.submittedAt));

    const result: LabSubmissionWithDetails[] = [];
    for (const submission of submissions) {
      const [user] = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        email: users.email,
        username: users.username,
      }).from(users).where(eq(users.id, submission.userId));
      const [lab] = await db.select({
        id: labs.id,
        title: labs.title,
        icon: labs.icon,
        color: labs.color,
      }).from(labs).where(eq(labs.id, submission.labId));
      if (user && lab) {
        result.push({ ...submission, user, lab });
      }
    }
    return result;
  }

  async getAllLabSubmissions(): Promise<LabSubmissionWithDetails[]> {
    const submissions = await db.select().from(labSubmissions).orderBy(desc(labSubmissions.submittedAt));
    const result: LabSubmissionWithDetails[] = [];
    for (const submission of submissions) {
      const [user] = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        email: users.email,
        username: users.username,
      }).from(users).where(eq(users.id, submission.userId));
      const [lab] = await db.select({
        id: labs.id,
        title: labs.title,
        icon: labs.icon,
        color: labs.color,
      }).from(labs).where(eq(labs.id, submission.labId));
      if (user && lab) {
        result.push({ ...submission, user, lab });
      }
    }
    return result;
  }

  async getPendingLabSubmissions(): Promise<LabSubmissionWithDetails[]> {
    const submissions = await db.select().from(labSubmissions).where(eq(labSubmissions.status, "pending")).orderBy(desc(labSubmissions.submittedAt));
    const result: LabSubmissionWithDetails[] = [];
    for (const submission of submissions) {
      const [user] = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        email: users.email,
        username: users.username,
      }).from(users).where(eq(users.id, submission.userId));
      const [lab] = await db.select({
        id: labs.id,
        title: labs.title,
        icon: labs.icon,
        color: labs.color,
      }).from(labs).where(eq(labs.id, submission.labId));
      if (user && lab) {
        result.push({ ...submission, user, lab });
      }
    }
    return result;
  }

  async createLabSubmission(submission: InsertLabSubmission): Promise<LabSubmission> {
    const [newSubmission] = await db.insert(labSubmissions).values(submission).returning();
    // Update lab progress to completed
    const existingProgress = await this.getLabProgress(submission.userId, submission.labId);
    if (existingProgress) {
      await db.update(labProgress).set({
        isCompleted: true,
        progress: 100,
        completedAt: new Date(),
      }).where(eq(labProgress.id, existingProgress.id));
    }
    return newSubmission;
  }

  async reviewLabSubmission(id: string, reviewerId: string, status: string, notes?: string): Promise<LabSubmission | undefined> {
    const [submission] = await db.update(labSubmissions).set({
      status,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      reviewNotes: notes || null,
    }).where(eq(labSubmissions.id, id)).returning();
    return submission || undefined;
  }

  async getUserCompletedLabsCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(labSubmissions).where(
      and(eq(labSubmissions.userId, userId), eq(labSubmissions.status, "approved"))
    );
    return result?.count || 0;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return notification || undefined;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate || undefined;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return db.select().from(certificates).where(eq(certificates.userId, userId));
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const [certificate] = await db.insert(certificates).values(insertCertificate).returning();
    return certificate;
  }

  async getAdminStats(): Promise<UserStats> {
    const allUsers = await this.getAllUsers();
    const allCourses = await this.getAllCourses();
    const allLabs = await this.getAllLabs();
    const allEnrollments = await db.select().from(enrollments).where(eq(enrollments.status, "approved"));
    
    const totalStudents = allUsers.filter(u => u.role === "student").length;
    const totalCourses = allCourses.length;
    const totalLabs = allLabs.length;
    const totalEnrollments = allEnrollments.length;
    const totalRevenue = allEnrollments.reduce((sum, e) => {
      const course = allCourses.find(c => c.id === e.courseId);
      return sum + (course?.price || 0);
    }, 0);
    const avgRating = allCourses.length > 0 
      ? allCourses.reduce((sum, c) => sum + c.rating, 0) / allCourses.length 
      : 0;

    return { totalStudents, totalCourses, totalLabs, totalEnrollments, totalRevenue, averageRating: avgRating };
  }

  async getInstructorStats(instructorId: string): Promise<InstructorStats> {
    const instructorCourses = await this.getCoursesByInstructor(instructorId);
    const courseIds = instructorCourses.map(c => c.id);
    
    let totalStudents = 0;
    let totalReviews = 0;
    let totalRating = 0;
    let totalRevenue = 0;

    for (const course of instructorCourses) {
      const courseEnrollments = await db.select().from(enrollments)
        .where(and(eq(enrollments.courseId, course.id), eq(enrollments.status, "approved")));
      totalStudents += courseEnrollments.length;
      totalRevenue += courseEnrollments.length * course.price;
      
      const courseReviews = await db.select().from(reviews).where(eq(reviews.courseId, course.id));
      totalReviews += courseReviews.length;
      totalRating += course.rating;
    }

    return {
      totalStudents,
      totalCourses: instructorCourses.length,
      totalReviews,
      averageRating: instructorCourses.length > 0 ? totalRating / instructorCourses.length : 0,
      totalRevenue
    };
  }

  async getLeaderboard(limit: number = 10): Promise<User[]> {
    return db.select().from(users)
      .where(eq(users.role, "student"))
      .orderBy(desc(users.points))
      .limit(limit);
  }

  async seedInitialData(): Promise<void> {
    const existingAdmin = await this.getUserByUsername("admin");
    if (existingAdmin) return;

    const admin = await this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@jordancloud.com",
      name: "مدير النظام",
      avatar: "https://placehold.co/100x100/4A88FF/FFFFFF?text=A",
      role: "admin",
      title: "مدير المنصة",
      bio: "مدير منصة سحابة الأردن",
      level: 10,
      xp: 5000,
      points: 10000,
      streak: 30,
      isActive: true,
    });

    const instructor1 = await this.createUser({
      username: "ahmad_instructor",
      password: "instructor123",
      email: "ahmad@jordancloud.com",
      name: "أحمد الخطيب",
      avatar: "https://placehold.co/100x100/10B981/FFFFFF?text=أ",
      role: "instructor",
      title: "مهندس AWS معتمد",
      bio: "خبرة 10 سنوات في الحوسبة السحابية",
      level: 8,
      xp: 4000,
      points: 8000,
      streak: 20,
      isActive: true,
    });

    const instructor2 = await this.createUser({
      username: "fatima_instructor",
      password: "instructor123",
      email: "fatima@jordancloud.com",
      name: "فاطمة أحمد",
      avatar: "https://placehold.co/100x100/EC4899/FFFFFF?text=ف",
      role: "instructor",
      title: "خبيرة Azure و Kubernetes",
      bio: "متخصصة في DevOps والحاويات",
      level: 7,
      xp: 3500,
      points: 7000,
      streak: 15,
      isActive: true,
    });

    const student1 = await this.createUser({
      username: "mohammad",
      password: "student123",
      email: "mohammad@student.com",
      name: "محمد علي",
      avatar: "https://placehold.co/100x100/3B82F6/FFFFFF?text=م",
      role: "student",
      title: "طالب متميز",
      bio: "أتعلم الحوسبة السحابية",
      level: 5,
      xp: 2500,
      points: 3245,
      streak: 7,
      isActive: true,
    });

    await this.createUser({
      username: "sarah",
      password: "student123",
      email: "sarah@student.com",
      name: "سارة محمود",
      avatar: "https://placehold.co/100x100/F59E0B/FFFFFF?text=س",
      role: "student",
      title: "مبتدئة",
      bio: null,
      level: 2,
      xp: 800,
      points: 1500,
      streak: 3,
      isActive: true,
    });

    const course1 = await this.createCourse({
      title: "AWS Solutions Architect - Associate",
      description: "مسار شامل لإتقان خدمات AWS والحصول على شهادة Solutions Architect Associate المعتمدة",
      image: "https://placehold.co/800x400/4A88FF/FFFFFF?text=AWS+Solutions+Architect",
      category: "AWS",
      level: "متوسط",
      duration: "40 ساعة",
      price: 199,
      originalPrice: 299,
      instructorId: instructor1.id,
      lessonsCount: 45,
      projectsCount: 8,
      skills: ["EC2", "S3", "VPC", "IAM", "Lambda", "RDS", "CloudFormation"],
      difficulty: 3,
      isPublished: true,
    });

    const course2 = await this.createCourse({
      title: "Kubernetes للمحترفين",
      description: "تعلم إدارة الحاويات باستخدام Kubernetes من الصفر حتى الاحتراف",
      image: "https://placehold.co/800x400/326CE5/FFFFFF?text=Kubernetes",
      category: "Kubernetes",
      level: "متقدم",
      duration: "35 ساعة",
      price: 249,
      originalPrice: 349,
      instructorId: instructor2.id,
      lessonsCount: 38,
      projectsCount: 6,
      skills: ["Pods", "Services", "Deployments", "Helm", "Ingress", "RBAC"],
      difficulty: 4,
      isPublished: true,
    });

    await this.createCourse({
      title: "Azure Fundamentals AZ-900",
      description: "أساسيات Microsoft Azure للمبتدئين والتحضير لامتحان AZ-900",
      image: "https://placehold.co/800x400/0078D4/FFFFFF?text=Azure+Fundamentals",
      category: "Azure",
      level: "مبتدئ",
      duration: "20 ساعة",
      price: 99,
      originalPrice: 149,
      instructorId: instructor2.id,
      lessonsCount: 25,
      projectsCount: 4,
      skills: ["Azure Portal", "Virtual Machines", "Storage", "Networking", "Identity"],
      difficulty: 2,
      isPublished: true,
    });

    await this.createCourse({
      title: "Terraform Infrastructure as Code",
      description: "إدارة البنية التحتية السحابية باستخدام Terraform",
      image: "https://placehold.co/800x400/7B42BC/FFFFFF?text=Terraform",
      category: "DevOps",
      level: "متوسط",
      duration: "25 ساعة",
      price: 179,
      originalPrice: 249,
      instructorId: instructor1.id,
      lessonsCount: 30,
      projectsCount: 5,
      skills: ["HCL", "Providers", "Modules", "State Management", "Workspaces"],
      difficulty: 3,
      isPublished: true,
    });

    const lessonTitles = ["مقدمة في AWS", "إنشاء حساب AWS", "IAM - إدارة الهويات والوصول", "EC2 - الخوادم الافتراضية", "S3 - التخزين السحابي"];
    for (let i = 0; i < lessonTitles.length; i++) {
      await this.createLesson({
        courseId: course1.id,
        title: lessonTitles[i],
        description: `شرح مفصل عن ${lessonTitles[i]}`,
        content: `محتوى الدرس: ${lessonTitles[i]}`,
        videoUrl: null,
        duration: 45,
        order: i + 1,
        xpReward: 50,
        isPublished: true,
      });
    }

    await db.insert(enrollments).values({
      userId: student1.id,
      courseId: course1.id,
      status: "approved",
      progress: 60,
      completedLessons: 3,
      isCompleted: false,
    });

    await db.insert(enrollments).values({
      userId: student1.id,
      courseId: course2.id,
      status: "approved",
      progress: 25,
      completedLessons: 1,
      isCompleted: false,
    });

    const achievementData = [
      { title: "المستكشف", description: "أكمل أول درس", icon: "compass", xpReward: 50 },
      { title: "المتعلم النشط", description: "أكمل 5 دروس", icon: "book", xpReward: 100 },
      { title: "بطل AWS", description: "أكمل مسار AWS", icon: "cloud", xpReward: 500 },
      { title: "خبير Kubernetes", description: "أكمل مسار Kubernetes", icon: "box", xpReward: 500 },
      { title: "سلسلة 7 أيام", description: "تعلم 7 أيام متتالية", icon: "flame", xpReward: 200 },
      { title: "المثابر", description: "أكمل 10 مختبرات", icon: "flask-conical", xpReward: 300 },
    ];

    for (const data of achievementData) {
      await this.createAchievement(data);
    }

    const labsData = [
      { title: "إعداد VPC على AWS", description: "تعلم إنشاء شبكة VPC كاملة مع Subnets و Security Groups", icon: "cloud", color: "from-orange-500 to-yellow-500", duration: 45, level: "متوسط", technologies: ["AWS", "VPC", "Networking"], xpReward: 100, isPublished: true },
      { title: "نشر تطبيق على Kubernetes", description: "نشر تطبيق ويب كامل باستخدام Kubernetes Deployments و Services", icon: "box", color: "from-blue-500 to-indigo-500", duration: 60, level: "متقدم", technologies: ["Kubernetes", "Docker", "YAML"], xpReward: 150, isPublished: true },
      { title: "Terraform أساسيات", description: "إنشاء بنية تحتية سحابية باستخدام Terraform", icon: "boxes", color: "from-purple-500 to-pink-500", duration: 30, level: "مبتدئ", technologies: ["Terraform", "HCL", "AWS"], xpReward: 80, isPublished: true },
      { title: "CI/CD مع GitHub Actions", description: "بناء خط أنابيب CI/CD كامل", icon: "git-branch", color: "from-gray-600 to-gray-800", duration: 50, level: "متوسط", technologies: ["GitHub Actions", "Docker", "YAML"], xpReward: 120, isPublished: true },
    ];

    for (const data of labsData) {
      await this.createLab(data);
    }

    await this.createNotification({
      userId: student1.id,
      title: "مبروك! أكملت درساً جديداً",
      message: "لقد أكملت درس EC2 بنجاح وحصلت على 50 نقطة خبرة",
      type: "success",
      isRead: false,
    });

    await this.createNotification({
      userId: student1.id,
      title: "دورة جديدة متاحة",
      message: "تم إضافة دورة جديدة: Docker للمبتدئين",
      type: "info",
      isRead: false,
    });
    
    // Seed homepage content
    await this.seedHomepageContent();
  }

  // Homepage Content Methods
  async getAllHomepageContent(): Promise<HomepageContent[]> {
    return await db.select().from(homepageContent).orderBy(asc(homepageContent.order));
  }

  async getHomepageContentByKey(key: string): Promise<HomepageContent | undefined> {
    const [content] = await db.select().from(homepageContent).where(eq(homepageContent.key, key));
    return content || undefined;
  }

  async createHomepageContent(content: InsertHomepageContent): Promise<HomepageContent> {
    const [newContent] = await db.insert(homepageContent).values(content).returning();
    return newContent;
  }

  async updateHomepageContent(id: string, data: Partial<InsertHomepageContent>): Promise<HomepageContent | undefined> {
    const [updated] = await db.update(homepageContent)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(homepageContent.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteHomepageContent(id: string): Promise<boolean> {
    const result = await db.delete(homepageContent).where(eq(homepageContent.id, id));
    return true;
  }

  async seedHomepageContent(): Promise<void> {
    // Check if content already exists
    const existing = await this.getAllHomepageContent();
    if (existing.length > 0) return;

    const contentData = [
      { key: "site_logo", value: "", type: "image", order: 0, isVisible: true },
      { key: "hero_title", value: "ابدأ رحلتك في عالم الحوسبة السحابية", type: "text", order: 1, isVisible: true },
      { key: "hero_subtitle", value: "تعلم AWS، Azure، GCP وKubernetes مع أفضل المدربين العرب", type: "text", order: 2, isVisible: true },
      { key: "hero_cta", value: "ابدأ التعلم مجاناً", type: "text", order: 3, isVisible: true },
      { key: "stats_students", value: "5000", type: "number", order: 10, isVisible: true },
      { key: "stats_students_label", value: "طالب مسجل", type: "text", order: 11, isVisible: true },
      { key: "stats_courses", value: "50", type: "number", order: 12, isVisible: true },
      { key: "stats_courses_label", value: "دورة تدريبية", type: "text", order: 13, isVisible: true },
      { key: "stats_labs", value: "100", type: "number", order: 14, isVisible: true },
      { key: "stats_labs_label", value: "مختبر عملي", type: "text", order: 15, isVisible: true },
      { key: "stats_certificates", value: "1000", type: "number", order: 16, isVisible: true },
      { key: "stats_certificates_label", value: "شهادة صادرة", type: "text", order: 17, isVisible: true },
      { key: "features_title", value: "لماذا سحابة الأردن؟", type: "text", order: 20, isVisible: true },
      { key: "paths_title", value: "مسارات التعلم", type: "text", order: 30, isVisible: true },
      { key: "labs_title", value: "المختبرات العملية", type: "text", order: 40, isVisible: true },
    ];

    for (const data of contentData) {
      await this.createHomepageContent(data);
    }
  }

  // Learning Paths CRUD
  async getLearningPath(id: string): Promise<LearningPath | undefined> {
    const [path] = await db.select().from(learningPaths).where(eq(learningPaths.id, id));
    return path || undefined;
  }

  async getLearningPathWithCourses(id: string): Promise<LearningPathWithCourses | undefined> {
    const path = await this.getLearningPath(id);
    if (!path) return undefined;
    const pathCoursesData = await this.getPathCourses(id);
    return { ...path, courses: pathCoursesData };
  }

  async getAllLearningPaths(): Promise<LearningPath[]> {
    return db.select().from(learningPaths).orderBy(asc(learningPaths.order));
  }

  async getPublishedLearningPaths(): Promise<LearningPathWithCourses[]> {
    const paths = await db.select().from(learningPaths)
      .where(eq(learningPaths.isPublished, true))
      .orderBy(asc(learningPaths.order));
    const result: LearningPathWithCourses[] = [];
    for (const path of paths) {
      const pathCoursesData = await this.getPathCourses(path.id);
      result.push({ ...path, courses: pathCoursesData });
    }
    return result;
  }

  async createLearningPath(insertPath: InsertLearningPath): Promise<LearningPath> {
    const [path] = await db.insert(learningPaths).values(insertPath).returning();
    return path;
  }

  async updateLearningPath(id: string, data: Partial<InsertLearningPath>): Promise<LearningPath | undefined> {
    const [path] = await db.update(learningPaths).set(data).where(eq(learningPaths.id, id)).returning();
    return path || undefined;
  }

  async deleteLearningPath(id: string): Promise<boolean> {
    // Remove all course associations first
    await db.delete(pathCourses).where(eq(pathCourses.pathId, id));
    const result = await db.delete(learningPaths).where(eq(learningPaths.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Path Courses
  async getPathCourses(pathId: string): Promise<Course[]> {
    const assignments = await db.select().from(pathCourses)
      .where(eq(pathCourses.pathId, pathId))
      .orderBy(asc(pathCourses.order));
    const result: Course[] = [];
    for (const assignment of assignments) {
      const course = await this.getCourse(assignment.courseId);
      if (course) {
        result.push(course);
      }
    }
    return result;
  }

  async addCourseToPath(pathId: string, courseId: string, order: number = 0): Promise<PathCourse> {
    const [assignment] = await db.insert(pathCourses).values({ pathId, courseId, order }).returning();
    // Update path courses count
    const pathCoursesData = await this.getPathCourses(pathId);
    await db.update(learningPaths).set({ coursesCount: pathCoursesData.length }).where(eq(learningPaths.id, pathId));
    return assignment;
  }

  async removeCourseFromPath(pathId: string, courseId: string): Promise<boolean> {
    const result = await db.delete(pathCourses)
      .where(and(eq(pathCourses.pathId, pathId), eq(pathCourses.courseId, courseId)));
    // Update path courses count
    const pathCoursesData = await this.getPathCourses(pathId);
    await db.update(learningPaths).set({ coursesCount: pathCoursesData.length }).where(eq(learningPaths.id, pathId));
    return (result.rowCount ?? 0) > 0;
  }

  async updatePathCourseOrder(pathId: string, courseId: string, order: number): Promise<PathCourse | undefined> {
    const [updated] = await db.update(pathCourses)
      .set({ order })
      .where(and(eq(pathCourses.pathId, pathId), eq(pathCourses.courseId, courseId)))
      .returning();
    return updated || undefined;
  }

  // Lesson Reviews CRUD
  async getLessonReview(id: string): Promise<LessonReview | undefined> {
    const [review] = await db.select().from(lessonReviews).where(eq(lessonReviews.id, id));
    return review || undefined;
  }

  async getLessonReviewsByLesson(lessonId: string): Promise<LessonReviewWithUser[]> {
    const reviewsList = await db.select().from(lessonReviews)
      .where(eq(lessonReviews.lessonId, lessonId))
      .orderBy(desc(lessonReviews.createdAt));
    const result: LessonReviewWithUser[] = [];
    for (const review of reviewsList) {
      const user = await this.getUser(review.userId);
      if (user) {
        result.push({ ...review, user: { id: user.id, name: user.name, avatar: user.avatar } });
      }
    }
    return result;
  }

  async getLessonReviewsByUser(userId: string): Promise<LessonReview[]> {
    return db.select().from(lessonReviews).where(eq(lessonReviews.userId, userId));
  }

  async getUserLessonReview(userId: string, lessonId: string): Promise<LessonReview | undefined> {
    const [review] = await db.select().from(lessonReviews)
      .where(and(eq(lessonReviews.userId, userId), eq(lessonReviews.lessonId, lessonId)));
    return review || undefined;
  }

  async createLessonReview(insertReview: InsertLessonReview): Promise<LessonReview> {
    const [review] = await db.insert(lessonReviews).values(insertReview).returning();
    return review;
  }

  async updateLessonReview(id: string, data: Partial<InsertLessonReview>): Promise<LessonReview | undefined> {
    const [review] = await db.update(lessonReviews).set(data).where(eq(lessonReviews.id, id)).returning();
    return review || undefined;
  }

  async deleteLessonReview(id: string): Promise<boolean> {
    const result = await db.delete(lessonReviews).where(eq(lessonReviews.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Cart methods
  async getCartItems(userId: string): Promise<CartItemWithDetails[]> {
    const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId)).orderBy(desc(cartItems.createdAt));
    const result: CartItemWithDetails[] = [];
    for (const item of items) {
      const itemWithDetails: CartItemWithDetails = { ...item };
      if (item.itemType === 'course') {
        const course = await this.getCourse(item.itemId);
        if (course) itemWithDetails.course = course;
      } else if (item.itemType === 'path') {
        const path = await this.getLearningPath(item.itemId);
        if (path) itemWithDetails.path = path;
      }
      result.push(itemWithDetails);
    }
    return result;
  }

  async getCartItem(userId: string, itemId: string, itemType: string): Promise<CartItem | undefined> {
    const [item] = await db.select().from(cartItems).where(
      and(eq(cartItems.userId, userId), eq(cartItems.itemId, itemId), eq(cartItems.itemType, itemType))
    );
    return item || undefined;
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const [cartItem] = await db.insert(cartItems).values(item).returning();
    return cartItem;
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return true;
  }

  async getAllCartItems(): Promise<CartItemWithDetails[]> {
    const items = await db.select().from(cartItems).orderBy(desc(cartItems.createdAt));
    const result: CartItemWithDetails[] = [];
    for (const item of items) {
      const itemWithDetails: CartItemWithDetails = { ...item };
      if (item.itemType === 'course') {
        const course = await this.getCourse(item.itemId);
        if (course) itemWithDetails.course = course;
      } else if (item.itemType === 'path') {
        const path = await this.getLearningPath(item.itemId);
        if (path) itemWithDetails.path = path;
      }
      result.push(itemWithDetails);
    }
    return result;
  }

  // Favorites methods
  async getFavorites(userId: string): Promise<FavoriteWithDetails[]> {
    const favs = await db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
    const result: FavoriteWithDetails[] = [];
    for (const fav of favs) {
      const favWithDetails: FavoriteWithDetails = { ...fav };
      if (fav.itemType === 'course') {
        const course = await this.getCourse(fav.itemId);
        if (course) favWithDetails.course = course;
      } else if (fav.itemType === 'path') {
        const path = await this.getLearningPath(fav.itemId);
        if (path) favWithDetails.path = path;
      }
      result.push(favWithDetails);
    }
    return result;
  }

  async getFavorite(userId: string, itemId: string, itemType: string): Promise<Favorite | undefined> {
    const [fav] = await db.select().from(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.itemId, itemId), eq(favorites.itemType, itemType))
    );
    return fav || undefined;
  }

  async addToFavorites(favorite: InsertFavorite): Promise<Favorite> {
    const [fav] = await db.insert(favorites).values(favorite).returning();
    return fav;
  }

  async removeFromFavorites(id: string): Promise<boolean> {
    const result = await db.delete(favorites).where(eq(favorites.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllFavorites(): Promise<FavoriteWithDetails[]> {
    const favs = await db.select().from(favorites).orderBy(desc(favorites.createdAt));
    const result: FavoriteWithDetails[] = [];
    for (const fav of favs) {
      const favWithDetails: FavoriteWithDetails = { ...fav };
      const user = await this.getUser(fav.userId);
      if (user) {
        favWithDetails.user = { id: user.id, name: user.name, email: user.email, avatar: user.avatar };
      }
      if (fav.itemType === 'course') {
        const course = await this.getCourse(fav.itemId);
        if (course) favWithDetails.course = course;
      } else if (fav.itemType === 'path') {
        const path = await this.getLearningPath(fav.itemId);
        if (path) favWithDetails.path = path;
      }
      result.push(favWithDetails);
    }
    return result;
  }

  // Quiz methods
  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async getQuizByLesson(lessonId: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
    return quiz || undefined;
  }

  async getQuizWithQuestions(id: string): Promise<QuizWithQuestions | undefined> {
    const quiz = await this.getQuiz(id);
    if (!quiz) return undefined;
    const questions = await this.getQuizQuestions(id);
    return { ...quiz, questions };
  }

  async getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
    const courseLessons = await db.select().from(lessons).where(eq(lessons.courseId, courseId));
    const lessonIds = courseLessons.map(l => l.id);
    if (lessonIds.length === 0) return [];
    return await db.select().from(quizzes).where(inArray(quizzes.lessonId, lessonIds));
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [updated] = await db.update(quizzes).set(data).where(eq(quizzes.id, id)).returning();
    return updated || undefined;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    // Delete questions first
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));
    // Delete attempts
    await db.delete(quizAttempts).where(eq(quizAttempts.quizId, id));
    // Delete quiz
    const result = await db.delete(quizzes).where(eq(quizzes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Quiz Question methods
  async getQuizQuestion(id: string): Promise<QuizQuestion | undefined> {
    const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, id));
    return question || undefined;
  }

  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId)).orderBy(asc(quizQuestions.order));
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(quizQuestions).values(question).returning();
    return newQuestion;
  }

  async updateQuizQuestion(id: string, data: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const [updated] = await db.update(quizQuestions).set(data).where(eq(quizQuestions.id, id)).returning();
    return updated || undefined;
  }

  async deleteQuizQuestion(id: string): Promise<boolean> {
    const result = await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Quiz Attempt methods
  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return attempt || undefined;
  }

  async getUserQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getUserBestAttempt(userId: string, quizId: string): Promise<QuizAttempt | undefined> {
    const [best] = await db.select().from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(desc(quizAttempts.score));
    return best || undefined;
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }
}

export const storage = new DatabaseStorage();
