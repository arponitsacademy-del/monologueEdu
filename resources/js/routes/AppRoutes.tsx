import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Public pages
import { HomePage } from '../pages/public/HomePage';
import { CoursesPage } from '../pages/public/CoursesPage';
import { CourseDetailsPage } from '../pages/public/CourseDetailsPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { CheckoutPage } from '../pages/public/CheckoutPage';
import { OrderStatusPage } from '../pages/public/OrderStatusPage';
import { TeacherProfilePage } from '../pages/public/TeacherProfilePage';

// Admin pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminCoursesPage } from '../pages/admin/AdminCoursesPage';
import { AdminCourseEditPage } from '../pages/admin/AdminCourseEditPage';
import { AdminCourseBuilderPage } from '../pages/admin/AdminCourseBuilderPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage';
import { AdminSmsPage } from '../pages/admin/AdminSmsPage';
import { AdminAutoSmsPushPage } from '../pages/admin/AdminAutoSmsPushPage';
import { AdminSmsMarketingPage } from '../pages/admin/AdminSmsMarketingPage';
import { AdminBundlesPage } from '../pages/admin/AdminBundlesPage';
import { AdminBundleFormPage } from '../pages/admin/AdminBundleFormPage';
import { AdminBundleBuilderPage } from '../pages/admin/AdminBundleBuilderPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminMediaPage } from '../pages/admin/AdminMediaPage';
import { AdminCourseCategoriesPage } from '../pages/admin/AdminCourseCategoriesPage';
import { AdminPagesPage } from '../pages/admin/AdminPagesPage';
import { AdminPageBuilderPage } from '../pages/admin/AdminPageBuilderPage';
import { AdminHeaderBuilderPage } from '../pages/admin/AdminHeaderBuilderPage';
import { AdminFooterBuilderPage } from '../pages/admin/AdminFooterBuilderPage';
import { AdminAppearanceGeneralPage } from '../pages/admin/AdminAppearanceGeneralPage';
import { AdminManualPaymentPage } from '../pages/admin/AdminManualPaymentPage';
import { AdminNexPilotsPage } from '../pages/admin/AdminNexPilotsPage';
import { AdminNexPilotEditPage } from '../pages/admin/AdminNexPilotEditPage';
import { AdminNexPilotBuilderPage } from '../pages/admin/AdminNexPilotBuilderPage';
import { AdminNexPilotAiConfigPage } from '../pages/admin/AdminNexPilotAiConfigPage';
import { AdminCouponsPage } from '../pages/admin/AdminCouponsPage';
import { CustomPageView } from '../pages/public/CustomPageView';

// Teacher pages
import { TeacherDashboardPage } from '../pages/teacher/TeacherDashboardPage';
import { TeacherCoursesPage } from '../pages/teacher/TeacherCoursesPage';
import { TeacherQuestionsPage } from '../pages/teacher/TeacherQuestionsPage';

// Student pages
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage';
import { StudentCoursesPage } from '../pages/student/StudentCoursesPage';
import { StudentOrdersPage } from '../pages/student/StudentOrdersPage';
import { StudentNexPilotPage } from '../pages/student/StudentNexPilotPage';
import { StudentAffiliatePage } from '../pages/student/StudentAffiliatePage';
import { StudentExamsPage } from '../pages/student/StudentExamsPage';

// Affiliate Admin pages
import { AdminAffiliateGeneralSettingsPage } from '../pages/admin/affiliate/AdminAffiliateGeneralSettingsPage';
import { AdminAffiliateCourseSettingsPage } from '../pages/admin/affiliate/AdminAffiliateCourseSettingsPage';
import { AdminAffiliateMembersPage } from '../pages/admin/affiliate/AdminAffiliateMembersPage';

// Learning page
import { LessonPlayerPage } from '../pages/learning/LessonPlayerPage';

// Exam pages
import { ExamListPage } from '../pages/exam/ExamListPage';
import { ExamFormPage } from '../pages/exam/ExamFormPage';
import { ExamBuilderPage } from '../pages/exam/ExamBuilderPage';
import { ExamSubmissionsPage } from '../pages/exam/ExamSubmissionsPage';
import { StudentExamRoomPage } from '../pages/exam/StudentExamRoomPage';

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public Pages */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:slug" element={<CourseDetailsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/checkout/:slug" element={<CheckoutPage />} />
                <Route path="/order-status/:orderNumber" element={<OrderStatusPage />} />
                <Route path="/teachers/:id" element={<TeacherProfilePage />} />
                <Route path="/p/:slug" element={<CustomPageView />} />
                <Route path="/privacy-policy" element={<CustomPageView slugOverride="privacy-policy" />} />
                <Route path="/terms" element={<CustomPageView slugOverride="terms" />} />
            </Route>

            {/* Visual Page Builder (Full-Screen) */}
            <Route path="/admin/pages/:id/builder" element={<AdminPageBuilderPage />} />

            {/* Admin Dashboard */}
            <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="courses" element={<AdminCoursesPage />} />
                <Route path="courses/create" element={<AdminCourseEditPage />} />
                <Route path="courses/categories" element={<AdminCourseCategoriesPage />} />
                <Route path="courses/:id/edit" element={<AdminCourseEditPage />} />
                <Route path="courses/:id/builder" element={<AdminCourseBuilderPage />} />
                {/* Course Bundles & Bundle Builder */}
                <Route path="bundles" element={<AdminBundlesPage />} />
                <Route path="bundles/create" element={<AdminBundleFormPage />} />
                <Route path="bundles/:id/edit" element={<AdminBundleFormPage />} />
                <Route path="bundles/:id/builder" element={<AdminBundleBuilderPage />} />
                <Route path="nexpilot" element={<AdminNexPilotsPage />} />
                <Route path="nexpilot/new" element={<AdminNexPilotEditPage />} />
                <Route path="nexpilot/ai-configuration" element={<AdminNexPilotAiConfigPage />} />
                <Route path="nexpilot/:id/edit" element={<AdminNexPilotEditPage />} />
                <Route path="nexpilot/:id/builder" element={<AdminNexPilotBuilderPage />} />
                {/* AI Configuration */}
                <Route path="ai" element={<Navigate to="/admin/ai/configuration" replace />} />
                <Route path="ai/configuration" element={<AdminNexPilotAiConfigPage />} />
                {/* Exam Management */}
                <Route path="exams" element={<ExamListPage />} />
                <Route path="exams/create" element={<ExamFormPage />} />
                <Route path="exams/:id/edit" element={<ExamFormPage />} />
                <Route path="exams/:id/builder" element={<ExamBuilderPage />} />
                <Route path="exams/:id/submissions" element={<ExamSubmissionsPage />} />
                <Route path="pages" element={<AdminPagesPage />} />
                <Route path="appearance" element={<Navigate to="/admin/appearance/general" replace />} />
                <Route path="appearance/general" element={<AdminAppearanceGeneralPage />} />
                <Route path="appearance/header" element={<AdminHeaderBuilderPage />} />
                <Route path="appearance/footer" element={<AdminFooterBuilderPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                {/* Marketing & Coupons */}
                <Route path="marketing" element={<Navigate to="/admin/marketing/coupons" replace />} />
                <Route path="marketing/coupons" element={<AdminCouponsPage />} />
                <Route path="payments" element={<Navigate to="/admin/payments/manual" replace />} />
                <Route path="payments/manual" element={<AdminManualPaymentPage />} />
                {/* Affiliate Management */}
                <Route path="affiliate" element={<Navigate to="/admin/affiliate/settings" replace />} />
                <Route path="affiliate/settings" element={<AdminAffiliateGeneralSettingsPage />} />
                <Route path="affiliate/courses" element={<AdminAffiliateCourseSettingsPage />} />
                <Route path="affiliate/members" element={<AdminAffiliateMembersPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="sms" element={<AdminSmsPage />} />
                <Route path="sms/auto-push" element={<AdminAutoSmsPushPage />} />
                <Route path="sms-marketing" element={<AdminSmsMarketingPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="media" element={<AdminMediaPage />} />
            </Route>

            {/* Teacher Dashboard */}
            <Route path="/teacher" element={<DashboardLayout />}>
                <Route index element={<TeacherDashboardPage />} />
                <Route path="courses" element={<TeacherCoursesPage />} />
                <Route path="questions" element={<TeacherQuestionsPage />} />
                {/* Exam Management */}
                <Route path="exams" element={<ExamListPage />} />
                <Route path="exams/create" element={<ExamFormPage />} />
                <Route path="exams/:id/edit" element={<ExamFormPage />} />
                <Route path="exams/:id/builder" element={<ExamBuilderPage />} />
                <Route path="exams/:id/submissions" element={<ExamSubmissionsPage />} />
            </Route>

            {/* Student Dashboard */}
            <Route path="/student" element={<DashboardLayout />}>
                <Route index element={<StudentDashboardPage />} />
                <Route path="my-courses" element={<StudentCoursesPage />} />
                <Route path="courses/:courseId/nexpilot" element={<StudentNexPilotPage />} />
                <Route path="exams" element={<StudentExamsPage />} />
                <Route path="orders" element={<StudentOrdersPage />} />
                <Route path="affiliate" element={<StudentAffiliatePage />} />
            </Route>

            {/* Student Exam Room */}
            <Route path="/exams/:examId/take" element={<StudentExamRoomPage />} />

            {/* Learning Room / Video Player */}
            <Route path="/learning/:courseId/lessons/:lessonId" element={<LessonPlayerPage />} />

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
