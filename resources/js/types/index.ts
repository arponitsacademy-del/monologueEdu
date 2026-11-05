export type UserRole = 'admin' | 'teacher' | 'student';
export type UserStatus = 'active' | 'inactive';

export interface User {
    id: number;
    name: string;
    phone: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    enrolled_courses_count?: number;
    unread_notifications_count?: number;
    enrolled_courses?: Course[];
    instructed_courses?: Course[];
    created_at?: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    courses_count?: number;
}

export interface Course {
    id: number;
    title: string;
    slug: string;
    short_description?: string;
    description?: string;
    price: number;
    sale_price?: number | null;
    effective_price?: number;
    discount_percent?: number;
    thumbnail?: string | null;
    is_featured: boolean;
    status: 'draft' | 'published' | 'archived';
    instructors?: User[];
    instructor?: User;
    categories?: Category[];
    sections?: CourseSection[];
    lessons?: Lesson[];
    lessons_count?: number;
    enrollments_count?: number;
    nexpilot?: any;
    created_at?: string;
}

export interface CourseSection {
    id: number;
    course_id: number;
    title: string;
    description?: string | null;
    sort_order: number;
    lessons: Lesson[];
}

export interface LessonAttachment {
    id: number;
    lesson_id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    formatted_size?: string;
    is_private: boolean;
    created_at?: string;
}

export interface Lesson {
    id: number;
    course_id: number;
    section_id: number;
    title: string;
    slug?: string;
    content?: string | null;
    video_url?: string | null;
    duration_minutes: number;
    is_preview: boolean;
    status: 'draft' | 'published';
    sort_order: number;
    attachments?: LessonAttachment[];
    section?: CourseSection;
    is_completed?: boolean;
}

export interface LessonComment {
    id: number;
    lesson_id: number;
    user_id: number;
    parent_id?: number | null;
    content: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        role: UserRole;
    };
    replies?: LessonComment[];
}

export interface Order {
    id: number;
    order_number: string;
    user_id: number;
    course_id: number;
    original_price: number;
    discount_amount: number;
    final_amount: number;
    payment_status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
    order_status: 'processing' | 'completed' | 'cancelled';
    payment_method: string;
    notes?: string | null;
    created_at: string;
    user?: User;
    course?: Course;
    latest_payment?: Payment;
}

export interface Payment {
    id: number;
    order_id: number;
    transaction_ref?: string;
    sender_phone?: string;
    amount: number;
    payment_method: string;
    status: 'pending' | 'approved' | 'rejected';
    verified_at?: string;
    notes?: string | null;
}

export interface HeaderMenuItem {
    id: string;
    label: string;
    label_en?: string;
    url: string;
    is_external?: boolean;
    highlight?: boolean;
}

export interface HeaderSettings {
    sticky?: boolean;
    show_theme_toggle?: boolean;
    show_auth_buttons?: boolean;
    logo_url?: string | null;
    logo_height?: number;
    brand_title?: string;
    brand_title_en?: string;
    brand_subtitle?: string;
    brand_subtitle_en?: string;
    announcement_enabled?: boolean;
    announcement_text?: string;
    announcement_text_en?: string;
    announcement_link?: string;
    announcement_bg?: string;
    cta_button_enabled?: boolean;
    cta_button_text?: string;
    cta_button_text_en?: string;
    cta_button_link?: string;
    menu_items?: HeaderMenuItem[];
}

export interface FooterLink {
    id: string;
    label: string;
    label_en?: string;
    url: string;
}

export interface FooterSocialLink {
    id: string;
    platform: string;
    url: string;
}

export interface FooterSettings {
    bg_color?: string;
    brand_title?: string;
    brand_title_en?: string;
    brand_subtitle?: string;
    brand_subtitle_en?: string;
    description?: string;
    description_en?: string;
    badge_text?: string;
    badge_text_en?: string;
    show_badge?: boolean;
    column_2_title?: string;
    column_2_title_en?: string;
    column_2_links?: FooterLink[];
    column_3_title?: string;
    column_3_title_en?: string;
    column_3_links?: FooterLink[];
    column_4_title?: string;
    column_4_title_en?: string;
    phone?: string;
    phone_hours?: string;
    phone_hours_en?: string;
    email?: string;
    address?: string;
    address_en?: string;
    social_links?: FooterSocialLink[];
    copyright_text?: string;
    copyright_text_en?: string;
    bottom_credit?: string;
    bottom_credit_en?: string;
}

export type ManualPaymentType = 'send_money' | 'payment' | 'cash_out';

export interface ManualPaymentGatewayConfig {
    enabled: boolean;
    name: string;
    account_number: string;
    type: ManualPaymentType;
    instructions?: string;
    instructions_en?: string;
}

export interface ManualPaymentSettings {
    bkash: ManualPaymentGatewayConfig;
    nagad: ManualPaymentGatewayConfig;
    rocket: ManualPaymentGatewayConfig;
}

export interface WebsiteSetting {
    id?: number;
    site_name: string;
    site_name_en?: string;
    site_tagline?: string;
    site_tagline_en?: string;
    default_language?: 'en' | 'bn';
    logo_url?: string | null;
    favicon_url?: string | null;
    contact_email?: string;
    contact_phone?: string;
    primary_color: string;
    secondary_color: string;
    copyright_text?: string;
    copyright_text_en?: string;
    header_settings?: HeaderSettings;
    footer_settings?: FooterSettings;
    manual_payment_settings?: ManualPaymentSettings;
}

export interface SmsSetting {
    provider: string;
    api_token_masked?: string;
    has_token: boolean;
    sender_id?: string;
    sms_enabled: boolean;
    otp_enabled: boolean;
    otp_expiration_minutes: number;
    otp_resend_cooldown_seconds: number;
    recent_logs?: Array<{
        id: number;
        phone: string;
        message: string;
        status: string;
        created_at: string;
    }>;
}

export interface AppNotification {
    id: string;
    data: {
        type?: string;
        title: string;
        message: string;
        link?: string;
        [key: string]: any;
    };
    read_at?: string | null;
    created_at: string;
}

export interface MediaItem {
    id: number;
    user_id?: number | null;
    file_name: string;
    file_path: string;
    file_type: 'image' | 'document' | 'video' | 'audio' | 'other' | string;
    mime_type?: string | null;
    file_size: number;
    formatted_size?: string;
    url: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email?: string;
    };
}

export interface SmsCampaign {
    id: number;
    user_id?: number | null;
    title: string;
    target_type: 'all' | 'students' | 'teachers' | 'course' | 'custom' | string;
    course_id?: number | null;
    message: string;
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    status: 'completed' | 'processing' | 'failed' | string;
    created_at: string;
    course?: {
        id: number;
        title: string;
    };
    user?: {
        id: number;
        name: string;
    };
}

export * from './page';
