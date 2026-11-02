export type BlockType = 
    | 'hero' 
    | 'course_tabs' 
    | 'html_widget' 
    | 'features' 
    | 'cta_banner' 
    | 'rich_text' 
    | 'video_embed' 
    | 'stats_counter';

export interface CourseTabItem {
    id: string;
    label: string;
    type: 'category' | 'html'; // 'category' queries courses, 'html' displays custom HTML widget
    categorySlug?: string;     // e.g. 'all', 'hsc-physics'
    htmlContent?: string;      // custom HTML/widget for this specific tab
    cssContent?: string;       // custom CSS for this tab content
}

export interface CourseTabsSettings {
    headingTag?: string;
    headingTitle?: string;
    viewAllText?: string;
    viewAllLink?: string;
    limit?: number;
    showAllTab?: boolean;
    allTabLabel?: string;
    selectedCategorySlugs?: string[];
    tabs?: CourseTabItem[];
    dynamicCategories?: boolean;
}

export interface PageBlock {
    id: string;
    type: BlockType;
    title: string;
    settings: Record<string, any>;
    customCss?: string;
}

export interface CustomPage {
    id: number;
    title: string;
    slug: string;
    status: 'published' | 'draft';
    layout_type: string;
    blocks: PageBlock[];
    custom_css?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    is_system?: boolean;
    created_at?: string;
    updated_at?: string;
}
