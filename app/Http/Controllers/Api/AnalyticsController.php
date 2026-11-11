<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function getStats(Request $request): JsonResponse
    {
        try {
            $tz = 'Asia/Dhaka';
            $now = Carbon::now($tz);

            // Date Range handling
            $filter = $request->input('period', '30days');
            $startDate = null;
            $endDate = $now->copy()->endOfDay();

            switch ($filter) {
                case 'today':
                    $startDate = $now->copy()->startOfDay();
                    break;
                case 'yesterday':
                    $startDate = $now->copy()->subDay()->startOfDay();
                    $endDate = $now->copy()->subDay()->endOfDay();
                    break;
                case '7days':
                    $startDate = $now->copy()->subDays(6)->startOfDay();
                    break;
                case '30days':
                    $startDate = $now->copy()->subDays(29)->startOfDay();
                    break;
                case 'this_month':
                    $startDate = $now->copy()->startOfMonth();
                    break;
                case 'last_month':
                    $startDate = $now->copy()->subMonth()->startOfMonth();
                    $endDate = $now->copy()->subMonth()->endOfMonth();
                    break;
                case 'custom':
                    if ($request->filled('from_date')) {
                        $startDate = Carbon::parse($request->from_date, $tz)->startOfDay();
                    } else {
                        $startDate = $now->copy()->subDays(29)->startOfDay();
                    }
                    if ($request->filled('to_date')) {
                        $endDate = Carbon::parse($request->to_date, $tz)->endOfDay();
                    }
                    break;
                default:
                    $startDate = $now->copy()->subDays(29)->startOfDay();
            }

            // 1. Core Summary Metrics
            $totalRevenue = (float) Order::paid()->sum('final_amount');
            $totalPaidOrders = Order::paid()->count();
            $totalPendingOrders = Order::pending()->count();

            $todayRevenue = (float) Order::paid()
                ->whereBetween('created_at', [$now->copy()->startOfDay(), $now->copy()->endOfDay()])
                ->sum('final_amount');

            $yesterdayRevenue = (float) Order::paid()
                ->whereBetween('created_at', [$now->copy()->subDay()->startOfDay(), $now->copy()->subDay()->endOfDay()])
                ->sum('final_amount');

            $thisMonthRevenue = (float) Order::paid()
                ->whereBetween('created_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
                ->sum('final_amount');

            $lastMonthRevenue = (float) Order::paid()
                ->whereBetween('created_at', [$now->copy()->subMonth()->startOfMonth(), $now->copy()->subMonth()->endOfMonth()])
                ->sum('final_amount');

            // Period-specific revenue & orders
            $periodRevenue = (float) Order::paid()
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('final_amount');

            $periodPaidOrders = Order::paid()
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

            // 2. User & Course Metrics
            $totalStudents = User::where('role', User::ROLE_STUDENT)->count();
            $totalTeachers = User::where('role', User::ROLE_TEACHER)->count();
            $totalCourses = Course::count();
            $publishedCourses = Course::published()->count();
            $draftCourses = Course::where('status', Course::STATUS_DRAFT)->count();

            // 3. Daily Revenue Trend for selected range
            $dailyTrends = [];
            $currentCursor = $startDate->copy();
            while ($currentCursor->lte($endDate)) {
                $dayStart = $currentCursor->copy()->startOfDay();
                $dayEnd = $currentCursor->copy()->endOfDay();
                $dateKey = $currentCursor->format('Y-m-d');
                $displayDate = $currentCursor->format('M d');

                $daySum = (float) Order::paid()
                    ->whereBetween('created_at', [$dayStart, $dayEnd])
                    ->sum('final_amount');

                $dayOrdersCount = Order::paid()
                    ->whereBetween('created_at', [$dayStart, $dayEnd])
                    ->count();

                $dailyTrends[] = [
                    'date' => $dateKey,
                    'label' => $displayDate,
                    'revenue' => $daySum,
                    'orders' => $dayOrdersCount,
                ];

                $currentCursor->addDay();
            }

            // 4. Monthly Revenue Trend (Last 6 months)
            $monthlyTrends = [];
            for ($i = 5; $i >= 0; $i--) {
                $mStart = $now->copy()->subMonths($i)->startOfMonth();
                $mEnd = $now->copy()->subMonths($i)->endOfMonth();

                $mSum = (float) Order::paid()
                    ->whereBetween('created_at', [$mStart, $mEnd])
                    ->sum('final_amount');

                $monthlyTrends[] = [
                    'month' => $mStart->format('M Y'),
                    'revenue' => $mSum,
                ];
            }

            // 5. Course Sales Breakdown Table (Safely handled)
            $coursesSales = [];
            try {
                $coursesSales = Course::select('courses.id', 'courses.title', 'courses.price')
                    ->leftJoin('orders', function ($join) {
                        $join->on('courses.id', '=', 'orders.course_id')
                             ->where('orders.payment_status', '=', Order::PAYMENT_PAID);
                    })
                    ->selectRaw('COUNT(orders.id) as units_sold')
                    ->selectRaw('COALESCE(SUM(orders.original_price), 0) as gross_sales')
                    ->selectRaw('COALESCE(SUM(orders.final_amount), 0) as net_revenue')
                    ->groupBy('courses.id', 'courses.title', 'courses.price')
                    ->orderByDesc('net_revenue')
                    ->get();
            } catch (\Throwable $ce) {
                \Log::warning('Analytics course sales query notice: ' . $ce->getMessage());
            }

            // 6. Recent Paid Orders
            $recentOrders = [];
            try {
                $recentOrders = Order::paid()
                    ->with(['user:id,name,phone', 'course:id,title'])
                    ->latest()
                    ->limit(5)
                    ->get();
            } catch (\Throwable $oe) {
                \Log::warning('Analytics recent orders notice: ' . $oe->getMessage());
            }

            // 7. Recent Students
            $recentStudents = [];
            try {
                $recentStudents = User::where('role', User::ROLE_STUDENT)
                    ->latest()
                    ->limit(5)
                    ->get(['id', 'name', 'phone', 'email', 'created_at']);
            } catch (\Throwable $se) {
                \Log::warning('Analytics recent students notice: ' . $se->getMessage());
            }

            return response()->json([
                'summary' => [
                    'total_revenue' => $totalRevenue,
                    'today_revenue' => $todayRevenue,
                    'yesterday_revenue' => $yesterdayRevenue,
                    'this_month_revenue' => $thisMonthRevenue,
                    'last_month_revenue' => $lastMonthRevenue,
                    'period_revenue' => $periodRevenue,
                    'period_paid_orders' => $periodPaidOrders,
                    'total_paid_orders' => $totalPaidOrders,
                    'total_pending_orders' => $totalPendingOrders,
                    'total_students' => $totalStudents,
                    'total_teachers' => $totalTeachers,
                    'total_courses' => $totalCourses,
                    'published_courses' => $publishedCourses,
                    'draft_courses' => $draftCourses,
                ],
                'daily_trends' => $dailyTrends,
                'monthly_trends' => $monthlyTrends,
                'course_sales' => $coursesSales,
                'recent_orders' => $recentOrders,
                'recent_students' => $recentStudents,
                'date_range' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d'),
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::error('AnalyticsController Error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return response()->json([
                'summary' => [
                    'total_revenue' => 0,
                    'today_revenue' => 0,
                    'yesterday_revenue' => 0,
                    'this_month_revenue' => 0,
                    'last_month_revenue' => 0,
                    'period_revenue' => 0,
                    'period_paid_orders' => 0,
                    'total_paid_orders' => 0,
                    'total_pending_orders' => 0,
                    'total_students' => 0,
                    'total_teachers' => 0,
                    'total_courses' => 0,
                    'published_courses' => 0,
                    'draft_courses' => 0,
                ],
                'daily_trends' => [],
                'monthly_trends' => [],
                'course_sales' => [],
                'recent_orders' => [],
                'recent_students' => [],
                'date_range' => [
                    'start' => date('Y-m-d'),
                    'end' => date('Y-m-d'),
                ],
                'error' => $e->getMessage(),
            ]);
        }
    }
}
