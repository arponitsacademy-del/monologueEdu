# Novonex Academy — Premium Full-Stack Learning Management System (LMS)

Novonex Academy is a production-grade, full-stack EdTech platform engineered for the Bangladeshi education market. Inspired by top educational platforms such as [phyhunt.com](https://www.phyhunt.com/) and powered by Tutor LMS Pro style curriculum workflows, it provides an end-to-end ecosystem for students, teachers, and administrators.

---

## 🛠 Technology Stack

### Backend
- **Framework**: PHP 8.2+ with Laravel 12
- **Database**: MySQL (production & local) / SQLite (in-memory for automated testing)
- **Authentication**: Laravel Sanctum (token-based SPA authentication)
- **Security & Authorization**: Policies & Gates (`CoursePolicy`, `LessonPolicy`, `OrderPolicy`, `UserPolicy`)
- **Notifications**: Laravel Database Notifications & Events
- **SMS Gateway**: Integrated GreenWeb Bangladesh SMS Service (`api.greenweb.com.bd`)
- **File Storage**: Private storage stream for protected educational course materials

### Frontend
- **Library**: React 19 with TypeScript
- **Bundler & Tooling**: Vite 7
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router v7
- **Server State**: TanStack Query v5
- **Analytics Visualization**: Recharts
- **Typography**: Hind Siliguri (Bengali) + Plus Jakarta Sans (English)

---

## 🌟 Key Features

1. **Phyhunt-Inspired High-Converting Public Website**:
   - Modern hero banner with stats, trust badges, and primary call-to-actions.
   - Dynamic course catalog with category tabs, free/paid price filtering, and instant search.
   - Single course details page with curriculum accordion, lesson duration, preview badges, instructor bios, and enrollment/buy cards.
   - Clean, mobile-optimized responsive navigation with slide-over drawer.

2. **3 Role-Based Dashboards**:
   - **Admin Dashboard**: Real-time revenue analytics (Asia/Dhaka timezone), course management, user management with role promotion/demotion and safety locks, order verification, SMS gateway configuration, and website branding.
   - **Teacher Dashboard**: Assigned courses overview, enrolled student counts across courses, direct access to the Visual Course Builder, and dedicated student Q&A discussion manager.
   - **Student Dashboard**: Enrolled courses with visual progress bars, continue learning shortcuts, order history, and direct course player access.

3. **Tutor LMS Pro Inspired Visual Course Builder**:
   - Course structure: Course ➔ Topics / Sections ➔ Lessons ➔ Attachments.
   - Move sections and lessons up/down with instant reordering.
   - Duplicate lesson with attachments in one click.
   - Video URL embedding (YouTube, Vimeo, external streaming).
   - Private study material attachments (PDF, DOCX, PPT, ZIP) with protected download streaming.
   - Free preview toggle for teaser lessons.

4. **Interactive Lesson Player & Q&A Discussion Forum**:
   - Distraction-free learning interface with collapsible curriculum navigation sidebar.
   - Lesson completion tracking with progress updates.
   - Downloadable study notes with authorized secure streaming.
   - Threaded Q&A discussion: students ask questions, assigned teachers receive instant notifications, and teachers' replies appear nested with notification to the student.

5. **Order & Manual Payment Management**:
   - Supports Bangladeshi payment providers (bKash, Nagad, Rocket).
   - Checkout with transaction reference (TrxID) and sender phone verification.
   - Admin payment approval workflow wrapped inside database transactions (`DB::transaction`) that automatically activates student course enrollments.
   - Instant 1-click enrollment for free courses ($0 price).

6. **GreenWeb SMS Integration & Registration OTP**:
   - Dedicated `GreenWebSmsService` following official GreenWeb Bangladesh API specifications.
   - Bengali unicode SMS support.
   - API tokens encrypted in the database and masked in the UI.
   - Toggleable 6-digit registration OTP verification with configurable expiration and cooldowns.
   - Safe SMS delivery logging without exposing sensitive tokens.

---

## 🚀 Quick Setup & Installation

### 1. Requirements
- PHP 8.2 or higher with PDO, cURL, OpenSSL, and Mbstring extensions
- Composer
- Node.js (v18+) & NPM
- MySQL Server running on port 3306

### 2. Environment Setup
```powershell
# Copy environment file
copy .env.example .env

# Generate application key
php artisan key:generate
```

Configure your MySQL credentials in `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=novonex_lms
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Database Migration & Demo Data Seeding
```powershell
# Run migrations and seed complete demo ecosystem
php artisan migrate:fresh --seed
```

### 4. Storage Linking
```powershell
php artisan storage:link
```

### 5. Frontend Build
```powershell
# Install frontend dependencies
npm install --legacy-peer-deps

# Build production assets
npm run build
```

### 6. Run the Application
```powershell
# Start Laravel development server
php artisan serve
```
Visit `http://localhost:8000` in your web browser!

---

## 👥 Demo Accounts (Pre-Seeded)

| Role | Mobile / Phone | Email | Password |
|---|---|---|---|
| **Admin** | `01700000001` | `admin@example.com` | `password123` |
| **Teacher 1** | `01700000002` | `teacher1@example.com` | `password123` |
| **Teacher 2** | `01700000003` | `teacher2@example.com` | `password123` |
| **Teacher 3** | `01700000004` | `teacher3@example.com` | `password123` |
| **Student** | `01700000011` | `student11@example.com` | `password123` |

*(Quick-fill buttons for these demo credentials are also available directly on the `/login` page).*

---

## 🧪 Automated Testing

Execute the complete feature and unit test suite covering registration, phone normalization, teacher authorization, course builder, payment confirmation, notifications, and analytics:

```powershell
php artisan test
```

All 12 feature and unit tests with 56 assertions pass out-of-the-box.
