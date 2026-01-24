# Jordan Cloud Platform (سحابة الأردن)

## Overview

Jordan Cloud Platform is an Arabic-language educational platform for cloud computing courses. It provides learning paths for AWS, Azure, GCP, and Kubernetes technologies. The platform supports three user roles: students who take courses, instructors who create content, and administrators who manage the system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark/light mode support)
- **Forms**: React Hook Form with Zod validation
- **Language**: Right-to-left (RTL) Arabic interface with Tajawal font

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful JSON API with `/api` prefix
- **Build System**: Custom build script using esbuild for server bundling and Vite for client

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Validation**: Drizzle-zod for generating Zod schemas from database tables
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Project Structure
- `client/` - React frontend application
- `server/` - Express backend with routes and storage layer
- `shared/` - Shared TypeScript types and database schema
- `script/` - Build scripts

### Authentication Pattern
- Client-side auth context with localStorage persistence
- Password-based login with username/email
- Role-based access control (student, instructor, admin)
- Admin routes protected with requireAdmin middleware

### Content Management Features
- **Course Sections**: Courses contain sections which contain lessons with video URLs
- **Lab Sections**: Labs contain sections with instructions and XP rewards
- **Admin Routes**: 
  - `/admin/courses/:courseId/content` - Manage course sections and lessons
  - `/admin/labs/:labId/content` - Manage lab sections
- **API Endpoints**:
  - `GET/POST /api/admin/courses/:courseId/sections` - Course sections CRUD
  - `GET/POST /api/admin/labs/:labId/sections` - Lab sections CRUD
  - `POST /api/admin/sections/:sectionId/lessons` - Add lessons to sections

### Course Enrollment and Payment System
- **Student Flow**: Click "التسجيل في الدورة" → Enter contact info (name, email, phone) → Select payment method (CliQ or PayPal) → Submit → Show "سيتم التواصل معك" message
- **Admin Flow**: View all pending enrollments in "طلبات التسجيل" tab → See contact info and payment method → Approve/reject after receiving payment
- **Student Learning**: After approval, student clicks "بدء التعلم" → Opens /learn/:courseId with video player
- **Database Fields**: enrollments table has contactName, contactEmail, contactPhone, paymentMethod (cliq/paypal), status (pending/approved/rejected)
- **Video Player**: Supports YouTube and Vimeo embed URLs, extracts video ID and embeds iframe
- **Access Control**: Course content endpoint requires approved enrollment (server-side check)
- **Lab Linking**: Lessons can be linked to labs from admin panel (labId field in lessons table)
- **API Endpoints**:
  - `POST /api/enrollments` - Create enrollment with contact info and paymentMethod
  - `GET /api/courses/:courseId/content` - Get course sections/lessons (requires approved enrollment)
  - `GET /api/admin/enrollments/pending` - Admin: view pending enrollments with contact info
  - `POST /api/admin/enrollments/:id/approve` - Admin: approve enrollment
  - `POST /api/admin/enrollments/:id/reject` - Admin: reject enrollment
  - `POST /api/lessons/:lessonId/complete` - Mark lesson as complete

### Homepage Content Management
- **Admin Flow**: View "الصفحة الرئيسية" tab → Edit text/numbers for hero section, stats, section titles → Toggle visibility
- **Database Table**: `homepageContent` with key, value, type (text/number), order, isVisible
- **API Endpoints**:
  - `GET /api/homepage-content` - Public: get visible homepage content
  - `GET /api/admin/homepage-content` - Admin: get all homepage content
  - `PATCH /api/admin/homepage-content/:id` - Admin: update content value/visibility
  - `POST /api/admin/seed-homepage` - Admin: seed default homepage content

### Learning Paths (مسارات التعلم)
- **Purpose**: Group related courses into learning paths (e.g., DevOps path, AWS path, Kubernetes path)
- **Admin Flow**: Create path → set title, description, color, level, duration → assign courses to path with ordering
- **Student View**: Browse paths at /paths → view path details at /paths/:id → see included courses
- **Database Tables**:
  - `learningPaths`: id, title, description, color, level, duration, createdAt, updatedAt
  - `pathCourses`: pathId, courseId, order (many-to-many junction table)
- **API Endpoints**:
  - `GET /api/learning-paths` - Public: list all paths with course counts
  - `GET /api/learning-paths/:id` - Public: get path details with courses
  - `GET /api/admin/learning-paths` - Admin: list all paths
  - `POST /api/admin/learning-paths` - Admin: create new path
  - `PATCH /api/admin/learning-paths/:id` - Admin: update path
  - `DELETE /api/admin/learning-paths/:id` - Admin: delete path
  - `POST /api/admin/learning-paths/:pathId/courses` - Admin: add course to path
  - `DELETE /api/admin/learning-paths/:pathId/courses/:courseId` - Admin: remove course from path

### Lesson Reviews (تقييم الدروس)
- **Purpose**: Students can rate and review individual lessons after completing them
- **Student Flow**: View lesson → click star rating (1-5) → optionally add comment → submit review
- **UI Location**: Review section appears below lesson content in /learn/:courseId page
- **Database Table**: `lessonReviews` with userId, lessonId, courseId, rating (1-5), comment, createdAt, updatedAt
- **API Endpoints**:
  - `GET /api/lessons/:lessonId/reviews` - Public: get all reviews for a lesson
  - `GET /api/lessons/:lessonId/my-review` - Auth: get current user's review
  - `POST /api/lessons/:lessonId/reviews` - Auth: create/update review (upsert)
  - `DELETE /api/lessons/:lessonId/reviews/:reviewId` - Auth: delete own review
- **Validation**: Rating must be 1-5, courseId required, comment optional

### Lab Submission System
- **Student Flow**: Start lab → timer begins → complete lab with screenshot upload and details → submit
- **Admin Flow**: View all submissions in "التسليمات" tab → approve/reject submissions
- **Instructor Flow**: View "التسليمات" tab in instructor dashboard to see submissions for labs linked to their courses
- **Database Table**: `labSubmissions` with userId, labId, screenshotUrl, details, timeSpent, status, submittedAt, reviewedAt, reviewedBy
- **Status Values**: pending, approved, rejected
- **Student Dashboard**: Shows completed (approved) labs count
- **Course Learning**: Lessons with linked labs show a lab card with link to go to the lab
- **Image Upload**: Express body size limit set to 50MB for base64 encoded images
- **API Endpoints**:
  - `POST /api/labs/:id/start` - Start a lab (track progress)
  - `POST /api/labs/:id/submit` - Submit lab with screenshot and details
  - `GET /api/user/submissions` - Get user's own submissions
  - `GET /api/user/completed-labs-count` - Get count of approved labs
  - `GET /api/admin/lab-submissions` - Admin: view all submissions
  - `POST /api/admin/lab-submissions/:id/approve` - Admin: approve submission
  - `POST /api/admin/lab-submissions/:id/reject` - Admin: reject submission
  - `GET /api/instructor/lab-submissions` - Instructor: view submissions for labs in their courses
  - `GET /api/instructor/courses` - Instructor: view their courses

### Instructor Dashboard Features
- **Course Management**: Create, edit, and manage courses with full form fields (title, description, category, level, price, etc.)
- **Content Navigation**: Navigate to course content management for sections/lessons
- **Labs Management**: View and edit labs linked to instructor's courses through "المختبرات" tab
- **API Endpoints**:
  - `GET /api/instructor/labs` - Get labs linked to instructor's courses
  - `PATCH /api/instructor/labs/:id` - Update lab (ownership verified)
  - `GET /api/instructor/courses/:courseId/content` - Get course content for management
  - `POST /api/instructor/courses/:courseId/sections` - Create section
  - `PATCH /api/instructor/sections/:sectionId` - Update section
  - `DELETE /api/instructor/sections/:sectionId` - Delete section
  - `POST /api/instructor/courses/:courseId/lessons` - Create lesson
  - `PATCH /api/instructor/lessons/:lessonId` - Update lesson
  - `DELETE /api/instructor/lessons/:lessonId` - Delete lesson

### Site Logo Management
- **Admin Flow**: View "الصفحة الرئيسية" tab → edit logo URL in "شعار الموقع" section → toggle visibility
- **Storage**: Logo URL stored in homepageContent table with key "site_logo"
- **Dynamic Display**: Header and footer dynamically fetch and display logo
- **Fallback**: Shows default cloud icon if no logo is set

### Shopping Cart (سلة التسوق)
- **Purpose**: Allow users to add courses and learning paths to a shopping cart for later purchase
- **Student Flow**: Browse courses/paths → click "أضف للسلة" → view cart at /cart → checkout
- **Database Table**: `cartItems` with userId, itemId, itemType (course/path), createdAt
- **Features**:
  - Add/remove items from cart
  - Cart count badge in header
  - Clear entire cart
  - Checkout button (initiates contact flow)
- **API Endpoints**:
  - `GET /api/cart` - Get user's cart items with details
  - `GET /api/cart/count` - Get cart item count
  - `POST /api/cart` - Add item to cart (body: itemId, itemType)
  - `DELETE /api/cart/:id` - Remove item from cart
  - `DELETE /api/cart` - Clear entire cart
  - `GET /api/admin/cart-items` - Admin: view all cart items

### Favorites / Wishlist (المفضلة)
- **Purpose**: Allow users to save courses and paths for later viewing
- **Student Flow**: Browse courses/paths → click heart icon to add to favorites → view at /favorites
- **Database Table**: `favorites` with userId, itemId, itemType (course/path), createdAt
- **Features**:
  - Toggle heart icon to add/remove favorites
  - View all favorites at /favorites
  - Add favorites to cart directly
- **API Endpoints**:
  - `GET /api/favorites` - Get user's favorites with details
  - `POST /api/favorites` - Add to favorites (body: itemId, itemType)
  - `DELETE /api/favorites/:id` - Remove from favorites
  - `GET /api/admin/favorites` - Admin: view all favorites

### Development vs Production
- Development: Vite dev server with HMR proxied through Express
- Production: Static files served from `dist/public` after Vite build

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage (available but not currently implemented)

### UI Libraries
- **Radix UI**: Full suite of accessible component primitives
- **Embla Carousel**: Carousel/slider functionality
- **cmdk**: Command palette component
- **Vaul**: Drawer component
- **react-day-picker**: Calendar component

### Third-Party Services (bundled but may not be fully implemented)
- **Stripe**: Payment processing
- **OpenAI**: AI integration
- **Google Generative AI**: AI integration
- **Nodemailer**: Email sending

### Build Tools
- **Vite**: Frontend bundler with React plugin
- **esbuild**: Server bundler for production
- **Drizzle Kit**: Database migration tooling