<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonAttachment;
use App\Models\LessonComment;
use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\SmsSetting;
use App\Models\User;
use App\Models\WebsiteSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Admin User
        $admin = User::firstOrCreate(
            ['phone' => '+8801700000001'],
            [
                'name' => 'অ্যাডমিন ইউজার (Admin)',
                'email' => 'admin@example.com',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_ADMIN,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        // 2. Create 3 Teachers
        $teacher1 = User::firstOrCreate(
            ['phone' => '+8801700000002'],
            [
                'name' => 'ড. রফিকুল ইসলাম (Physics Mentor)',
                'email' => 'teacher1@example.com',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_TEACHER,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        $teacher2 = User::firstOrCreate(
            ['phone' => '+8801700000003'],
            [
                'name' => 'তানভীর আহমেদ (Chemistry Expert)',
                'email' => 'teacher2@example.com',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_TEACHER,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        $teacher3 = User::firstOrCreate(
            ['phone' => '+8801700000004'],
            [
                'name' => 'নুসরাত জাহান (Math Specialist)',
                'email' => 'teacher3@example.com',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_TEACHER,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        // 3. Create 10 Students
        $students = [];
        $studentNames = [
            'রাহিম উল্লাহ', 'করিম হোসেন', 'আয়েশা সিদ্দিকা', 'সাকিব আল হাসান',
            'ফাহিম চৌধুরী', 'সুমাইয়া আক্তার', 'মাহমুদুর রহমান', 'তাসনিম জেরিন',
            'আসিফ মাহমুদ', 'রিফাত ইসলাম'
        ];

        foreach ($studentNames as $idx => $name) {
            $num = str_pad((string) ($idx + 11), 2, '0', STR_PAD_LEFT);
            $students[] = User::firstOrCreate(
                ['phone' => "+88017000000{$num}"],
                [
                    'name' => $name,
                    'email' => "student{$num}@example.com",
                    'password' => Hash::make('password123'),
                    'role' => User::ROLE_STUDENT,
                    'status' => User::STATUS_ACTIVE,
                ]
            );
        }

        // 4. Categories
        $catFree = Category::firstOrCreate(['slug' => 'free-courses'], ['name' => 'ফ্রি কোর্স', 'description' => 'সকল উন্মুক্ত ফ্রি কোর্স']);
        $catPaid = Category::firstOrCreate(['slug' => 'paid-courses'], ['name' => 'পেইড কোর্স', 'description' => 'প্রিমিয়াম পেইড মাস্টারক্লাস কোর্সসমূহ']);
        $catPhysics = Category::firstOrCreate(['slug' => 'hsc-physics'], ['name' => 'এইচএসসি পদার্থবিজ্ঞান', 'description' => 'পদার্থবিজ্ঞান ১ম ও ২য় পত্র']);
        $catChem = Category::firstOrCreate(['slug' => 'hsc-chemistry'], ['name' => 'এইচএসসি রসায়ন', 'description' => 'রসায়ন ১ম ও ২য় পত্র']);
        $catMath = Category::firstOrCreate(['slug' => 'higher-math'], ['name' => 'উচ্চতর গণিত', 'description' => 'ক্যালকুলাস ও বীজগণিত']);
        $catAdmission = Category::firstOrCreate(['slug' => 'admission'], ['name' => 'বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি', 'description' => 'বুয়েট ও মেডিকেল']);
        $catWeb = Category::firstOrCreate(['slug' => 'web-dev'], ['name' => 'প্রোগ্রামিং ও আইসিটি', 'description' => 'ওয়েব ডেভেলপমেন্ট ও কোডিং']);

        // 5. Course 1: HSC Physics Masterclass (Paid, Multi-Teacher: Teacher 1 & Teacher 2)
        $course1 = Course::firstOrCreate(
            ['slug' => 'hsc-physics-complete-masterclass'],
            [
                'instructor_id' => $teacher1->id,
                'title' => 'এইচএসসি পদার্থবিজ্ঞান সম্পূর্ণ মাস্টারক্লাস (HSC Physics)',
                'short_description' => 'ভেক্টর থেকে আধুনিক পদার্থবিজ্ঞান—কনসেপ্ট ক্লিয়ারিং, ম্যাথমেটিক্যাল প্রবলেম ও পূর্ণাঙ্গ লেকচার শিট।',
                'description' => '<p>এই কোর্সটি এইচএসসি পরীক্ষার্থী এবং বিশ্ববিদ্যালয় ভর্তিচ্ছু শিক্ষার্থীদের জন্য সম্পূর্ণ সিলেবাস কভার করে তৈরি করা হয়েছে। প্রতিটি অধ্যায়ের মৌলিক থিওরি, বিগত বছরের বোর্ড প্রশ্ন এবং ভর্তি পরীক্ষার গাণিতিক সমস্যা বিস্তারিতভাবে সমাধান করা হবে।</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80',
                'price' => 4500,
                'sale_price' => 3200,
                'is_featured' => true,
                'status' => Course::STATUS_PUBLISHED,
            ]
        );
        $course1->categories()->sync([$catPaid->id, $catPhysics->id, $catAdmission->id]);
        $course1->instructors()->sync([$teacher1->id, $teacher2->id]);

        // Course 1 Sections & Lessons
        $sec1 = CourseSection::firstOrCreate(
            ['course_id' => $course1->id, 'title' => 'টপিক ০১: ভেক্টর ও গতিবিদ্যা'],
            ['description' => 'ভেক্টর রাশির দিক, লব্ধি ও ক্যালকুলাস প্রয়োগ', 'sort_order' => 1]
        );

        $lesson1 = Lesson::firstOrCreate(
            ['course_id' => $course1->id, 'section_id' => $sec1->id, 'title' => 'ক্লাস ০১: ভেক্টরের মৌলিক ধারণা ও সামান্তরিক সূত্র'],
            [
                'slug' => 'vector-basics',
                'content' => "এই ক্লাসে ভেক্টর রাশির প্রকারভেদ এবং সামান্তরিকের সূত্রের সাহায্যে লব্ধির মান ও দিক নির্ণয় শেখানো হবে।\n\nগুরুত্বপূর্ণ সূত্র:\nR = sqrt(P^2 + Q^2 + 2PQ cos a)\ntan theta = (Q sin a) / (P + Q cos a)",
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'duration_minutes' => 35,
                'is_preview' => true,
                'status' => 'published',
                'sort_order' => 1,
            ]
        );

        $lesson2 = Lesson::firstOrCreate(
            ['course_id' => $course1->id, 'section_id' => $sec1->id, 'title' => 'ক্লাস ০২: নদী ও নৌকার গতি এবং বৃষ্টি ও ছাতার অংক'],
            [
                'slug' => 'river-boat-physics',
                'content' => "ভেক্টরের আপেক্ষিক বেগ ব্যবহার করে নদী পারাপার ও বৃষ্টির অংক সমাধানের সহজ কৌশল।",
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'duration_minutes' => 42,
                'is_preview' => false,
                'status' => 'published',
                'sort_order' => 2,
            ]
        );

        $sec2 = CourseSection::firstOrCreate(
            ['course_id' => $course1->id, 'title' => 'টপিক ০২: নিউটনিয়ান বলবিদ্যা ও মহাকর্ষ'],
            ['description' => 'নিউটনের গতিসূত্র, জড়তার ভ্রামক ও কৌণিক ভরবেগ', 'sort_order' => 2]
        );

        $lesson3 = Lesson::firstOrCreate(
            ['course_id' => $course1->id, 'section_id' => $sec2->id, 'title' => 'ক্লাস ০১: নিউটনের দ্বিতীয় সূত্র ও ভরবেগের নিত্যতা'],
            [
                'slug' => 'newtons-laws-momentum',
                'content' => "ভরবেগের সংরক্ষণ সূত্র ও রকেটের গতি আলোচনা।",
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'duration_minutes' => 38,
                'is_preview' => false,
                'status' => 'published',
                'sort_order' => 1,
            ]
        );

        // 6. Course 2: HSC Chemistry Fundamentals (Free Course, Multi-Teacher: Teacher 2 & Teacher 3)
        $course2 = Course::firstOrCreate(
            ['slug' => 'hsc-chemistry-fundamentals'],
            [
                'instructor_id' => $teacher2->id,
                'title' => 'এইচএসসি রসায়ন বেসিক টু প্রো (ফ্রি ক্র্যাশ কোর্স)',
                'short_description' => 'পর্যায় সারণী, সংকরায়ন এবং রাসায়নিক পরিবর্তনের সম্পূর্ণ ফ্রি ফাউন্ডেশন ক্লাস।',
                'description' => '<p>রসায়নে ভালো নম্বর তোলার জন্য বেসিক পরিষ্কার থাকা জরুরি। এই ফ্রি কোর্সের মাধ্যমে পর্যায় সারণির মৌলসমূহের ধর্ম এবং জটিল বন্ধনসমূহের হাইব্রিডাইজেশন সহজে ব্যাখ্যা করা হয়েছে।</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
                'price' => 0,
                'sale_price' => 0,
                'is_featured' => true,
                'status' => Course::STATUS_PUBLISHED,
            ]
        );
        $course2->categories()->sync([$catChem->id]);
        $course2->instructors()->sync([$teacher2->id, $teacher3->id]);

        $c2Sec = CourseSection::firstOrCreate(
            ['course_id' => $course2->id, 'title' => 'অধ্যায় ০১: মৌলের পর্যায়বৃত্ত ধর্ম ও বন্ধন'],
            ['description' => 'ইলেকট্রন বিন্যাস ও বন্ধন প্রকৃতি', 'sort_order' => 1]
        );

        Lesson::firstOrCreate(
            ['course_id' => $course2->id, 'section_id' => $c2Sec->id, 'title' => 'ক্লাস ০১: অরবিটাল সংকরণ (sp, sp2, sp3 Hybridization)'],
            [
                'slug' => 'orbital-hybridization',
                'content' => 'মিথেন, অ্যামোনিয়া ও পানির বন্ধন কোণের পরিবর্তন ও সংকরণ থিওরি।',
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'duration_minutes' => 28,
                'is_preview' => true,
                'status' => 'published',
                'sort_order' => 1,
            ]
        );

        // 7. Course 3: Higher Math Calculus Mastery (Paid Course, Teacher 1 & Teacher 3)
        $course3 = Course::firstOrCreate(
            ['slug' => 'higher-math-calculus-mastery'],
            [
                'instructor_id' => $teacher3->id,
                'title' => 'উচ্চতর গণিত ক্যালকুলাস ও ইন্টিগ্রেশন স্পেশাল ব্যাচ',
                'short_description' => 'লিমিট, অন্তরীকরণ ও যোগজীকরণ—শর্টকাট ট্রিকস ও বোর্ড প্রশ্নের সমাধান।',
                'description' => '<p>ক্যালকুলাস নিয়ে ভয় দূর করতে আমাদের এই বিশেষ ব্যাচ। ফাংশনের লিমিট থেকে শুরু করে দ্বিমাত্রিক যোগজীকরণ পর্যন্ত সম্পূর্ণ সিলেবাসের পূর্ণাঙ্গ প্রস্তুতি।</p>',
                'thumbnail' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
                'price' => 3500,
                'sale_price' => 2800,
                'is_featured' => true,
                'status' => Course::STATUS_PUBLISHED,
            ]
        );
        $course3->categories()->sync([$catMath->id, $catAdmission->id]);
        $course3->instructors()->sync([$teacher1->id, $teacher3->id]);

        // 8. Course 4: Draft Course (for testing admin draft state)
        $course4 = Course::firstOrCreate(
            ['slug' => 'ai-and-web-development-bootcamp'],
            [
                'instructor_id' => $teacher1->id,
                'title' => 'ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট ও এআই টুলস (Upcoming)',
                'short_description' => 'ড্রাফট কোর্স—অ্যাডমিন পাবলিশিং ওয়ার্কফ্লো টেস্ট করার জন্য।',
                'description' => '<p>ভবিষ্যতের ওয়েব ডেভেলপমেন্ট কোর্স।</p>',
                'price' => 5000,
                'sale_price' => 4000,
                'is_featured' => false,
                'status' => Course::STATUS_DRAFT,
            ]
        );
        $course4->categories()->sync([$catWeb->id]);

        // 9. Enrollments & Sample Orders
        // Student 1 enrolled in Course 1 via a Paid Order
        $order1 = Order::firstOrCreate(
            ['order_number' => 'ORD-261026-PAID1'],
            [
                'user_id' => $students[0]->id,
                'course_id' => $course1->id,
                'original_price' => 4500,
                'discount_amount' => 1300,
                'final_amount' => 3200,
                'payment_status' => Order::PAYMENT_PAID,
                'order_status' => Order::ORDER_COMPLETED,
                'payment_method' => 'manual_bkash',
                'notes' => 'বিকাশে পেমেন্ট সম্পন্ন হয়েছে।',
            ]
        );
        Payment::firstOrCreate(
            ['order_id' => $order1->id],
            [
                'transaction_ref' => '9J2K8LQZ01',
                'sender_phone' => '+8801700000011',
                'amount' => 3200,
                'payment_method' => 'manual_bkash',
                'status' => Payment::STATUS_APPROVED,
                'verified_by' => $admin->id,
                'verified_at' => now(),
            ]
        );
        Enrollment::firstOrCreate(
            ['user_id' => $students[0]->id, 'course_id' => $course1->id],
            ['order_id' => $order1->id, 'status' => 'active', 'enrolled_at' => now()]
        );
        LessonProgress::firstOrCreate(
            ['user_id' => $students[0]->id, 'lesson_id' => $lesson1->id],
            ['course_id' => $course1->id, 'is_completed' => true, 'completed_at' => now(), 'last_accessed_at' => now()]
        );

        // Student 2 has a Pending Order for Course 1 (not enrolled yet!)
        $order2 = Order::firstOrCreate(
            ['order_number' => 'ORD-261026-PEND1'],
            [
                'user_id' => $students[1]->id,
                'course_id' => $course1->id,
                'original_price' => 4500,
                'discount_amount' => 1300,
                'final_amount' => 3200,
                'payment_status' => Order::PAYMENT_PENDING,
                'order_status' => Order::ORDER_PROCESSING,
                'payment_method' => 'manual_nagad',
                'notes' => 'নগদে পেমেন্ট পাঠানো হয়েছে।',
            ]
        );
        Payment::firstOrCreate(
            ['order_id' => $order2->id],
            [
                'transaction_ref' => 'NG88992211',
                'sender_phone' => '+8801700000012',
                'amount' => 3200,
                'payment_method' => 'manual_nagad',
                'status' => Payment::STATUS_PENDING,
            ]
        );

        // Student 1 & 2 enrolled in Free Course 2
        Enrollment::firstOrCreate(
            ['user_id' => $students[0]->id, 'course_id' => $course2->id],
            ['status' => 'active', 'enrolled_at' => now()]
        );
        Enrollment::firstOrCreate(
            ['user_id' => $students[1]->id, 'course_id' => $course2->id],
            ['status' => 'active', 'enrolled_at' => now()]
        );

        // 10. Sample Student Question & Teacher Reply
        $comment = LessonComment::firstOrCreate(
            ['lesson_id' => $lesson1->id, 'user_id' => $students[0]->id, 'parent_id' => null],
            ['content' => 'স্যার, নদী পারাপারের ক্ষেত্রে সর্বনিম্ন সময়ে ওড়া বা সাঁতার কাটার শর্তটা কি আরেকবার বুঝিয়ে বলবেন?']
        );
        LessonComment::firstOrCreate(
            ['lesson_id' => $lesson1->id, 'user_id' => $teacher1->id, 'parent_id' => $comment->id],
            ['content' => 'নিশ্চয়ই রাহিম। সর্বনিম্ন সময়ে নদী পার হতে হলে নৌকার বেগ নদীর পাড়ের সাথে সর্বদা লম্ব বরাবর (৯০ ডিগ্রিতে) পরিচালিত করতে হবে। লেকচারের ১৮তম মিনিটে এটি বিস্তারিত দেখানো হয়েছে।']
        );

        // 11. Website & SMS Settings
        WebsiteSetting::current();
        SmsSetting::current();
    }
}
