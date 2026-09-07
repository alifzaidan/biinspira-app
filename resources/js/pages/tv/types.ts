export type PlatformStat = {
    key: string;
    label: string;
    logo?: string | null;
    total: number;
    this_month: number;
    last_month?: number;
    today: number;
    yesterday?: number;
    month_change_percentage: number;
    month_change_direction: 'up' | 'down' | 'flat';
    day_change_percentage: number;
    day_change_direction: 'up' | 'down' | 'flat';
    avg_change_percentage: number;
    avg_change_direction: 'up' | 'down' | 'flat';
    monthly_avg: number;
};

export interface TvDashboardProps {
    platformStats?: PlatformStat[];
    generatedAt: string;
}

export type DashboardViewMode = 'grid' | 'carousel';
export type DrilldownMetric = 'month' | 'day';

export type GroupPlatformInfo = {
    key: string;
    label: string;
    logo?: string | null;
};

export type DrilldownPoint = {
    key: string;
    label: string;
    value: number;
    change_percentage?: number;
    change_direction?: 'up' | 'down' | 'flat';
    avg_change_percentage?: number;
    avg_change_direction?: 'up' | 'down' | 'flat';
    avg_value?: number;
    platforms?: Record<string, number>;
};

export type DrilldownData = {
    platform: string;
    platform_label: string;
    metric: DrilldownMetric;
    title: string;
    subtitle: string;
    points: DrilldownPoint[];
    platforms?: GroupPlatformInfo[];
    total: number;
    generated_at: string;
};

export type TimeBasedMessage = {
    emoji: string;
    title: string;
    message: string;
};