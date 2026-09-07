import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Deferred, Head, router } from '@inertiajs/react';
import { CalendarIcon, Sparkles, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import GroupDrilldownDialog from './components/group-drilldown-dialog';
import PlatformDrilldownDialog from './components/platform-drilldown-dialog';
import { PlatformStatCardCarousel, PlatformStatCardGrid } from './components/platform-stat-cards';
import StatsSkeletonGrid from './components/stats-skeleton-grid';
import type { DashboardViewMode, DrilldownData, DrilldownMetric, PlatformStat, TvDashboardProps } from './types';
import { formatCurrency, getTimeBasedMessage } from './utils';

export default function TvDashboard({ platformStats, generatedAt }: TvDashboardProps) {
    const [viewMode, setViewMode] = useState<DashboardViewMode>('grid');
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [drilldownOpen, setDrilldownOpen] = useState(false);
    const [drilldownLoading, setDrilldownLoading] = useState(false);
    const [drilldownError, setDrilldownError] = useState<string | null>(null);
    const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);

    const [groupDrilldownOpen, setGroupDrilldownOpen] = useState(false);
    const [groupDrilldownMetric, setGroupDrilldownMetric] = useState<DrilldownMetric>('month');
    const [groupDrilldownLoading, setGroupDrilldownLoading] = useState(false);
    const [groupDrilldownError, setGroupDrilldownError] = useState<string | null>(null);
    const [groupDrilldownData, setGroupDrilldownData] = useState<DrilldownData | null>(null);

    useEffect(() => {
        const timer = window.setInterval(() => {
            router.reload({
                only: ['platformStats', 'generatedAt'],
            });
        }, 300000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (viewMode !== 'carousel' || !carouselApi) {
            return;
        }

        const timer = window.setInterval(() => {
            if (carouselApi.canScrollNext()) {
                carouselApi.scrollNext();
                return;
            }

            carouselApi.scrollTo(0);
        }, 4500);

        return () => window.clearInterval(timer);
    }, [viewMode, carouselApi]);

    const stats = useMemo(() => {
        const monthDirectionPriority: Record<PlatformStat['month_change_direction'], number> = {
            up: 3,
            flat: 2,
            down: 1,
        };

        return [...(platformStats ?? [])].sort((a, b) => {
            if (b.today !== a.today) {
                return b.today - a.today;
            }

            if (b.this_month !== a.this_month) {
                return b.this_month - a.this_month;
            }

            const monthDirectionDiff = monthDirectionPriority[b.month_change_direction] - monthDirectionPriority[a.month_change_direction];
            if (monthDirectionDiff !== 0) {
                return monthDirectionDiff;
            }

            if (b.month_change_percentage !== a.month_change_percentage) {
                return b.month_change_percentage - a.month_change_percentage;
            }

            return a.label.localeCompare(b.label, 'id-ID');
        });
    }, [platformStats]);

    const groupStats = useMemo(() => {
        if (!stats || stats.length === 0) {
            return { total: 0, thisMonth: 0, today: 0 };
        }

        const total = stats.reduce((sum, item) => sum + (item.total ?? 0), 0);
        const thisMonth = stats.reduce((sum, item) => sum + (item.this_month ?? 0), 0);
        const today = stats.reduce((sum, item) => sum + (item.today ?? 0), 0);

        return { total, thisMonth, today };
    }, [stats]);

    const cornerMessage = getTimeBasedMessage(currentTime);

    const formattedFullDate = useMemo(() => {
        return currentTime.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, [currentTime]);

    const selectedPlatformLogo = useMemo(() => {
        if (!drilldownData) {
            return null;
        }

        return stats.find((item) => item.key === drilldownData.platform)?.logo ?? null;
    }, [drilldownData, stats]);

    const handleOpenDrilldown = async (platformKey: string, metric: DrilldownMetric) => {
        setDrilldownOpen(true);
        setDrilldownLoading(true);
        setDrilldownError(null);

        try {
            const params = new URLSearchParams({
                platform: platformKey,
                metric,
            });

            const response = await fetch(`/statistics/detail?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Gagal memuat rincian statistik.');
            }

            const data = (await response.json()) as DrilldownData;
            setDrilldownData(data);
        } catch (error) {
            setDrilldownData(null);
            setDrilldownError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data.');
        } finally {
            setDrilldownLoading(false);
        }
    };

    const handleOpenGroupDrilldown = async (metric: DrilldownMetric) => {
        setGroupDrilldownOpen(true);
        setGroupDrilldownMetric(metric);
        setGroupDrilldownLoading(true);
        setGroupDrilldownError(null);

        try {
            const params = new URLSearchParams({
                platform: 'group',
                metric,
            });

            const response = await fetch(`/statistics/detail?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Gagal memuat rincian statistik group.');
            }

            const data = (await response.json()) as DrilldownData;
            setGroupDrilldownData(data);
        } catch (error) {
            setGroupDrilldownData(null);
            setGroupDrilldownError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data group.');
        } finally {
            setGroupDrilldownLoading(false);
        }
    };

    const handleViewModeChange = (value: string) => {
        if (value === 'grid' || value === 'carousel') {
            setViewMode(value);
        }
    };

    return (
        <>
            <Head title="Statistik TV" />
            <div className="flex h-screen w-screen flex-col overflow-hidden bg-[url('/assets/images/auth-bg.webp')] bg-cover bg-center">
                <div className="flex flex-1 flex-col overflow-hidden bg-slate-900/18 px-4 py-0 pt-3 backdrop-blur-[1px] sm:px-6 sm:py-4 lg:px-8 lg:py-4">
                    <Tabs value={viewMode} onValueChange={handleViewModeChange} className="flex flex-1 flex-col overflow-hidden">
                        <div className="mb-3 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs tracking-[0.28em] text-slate-100/90 uppercase">LIVE MONITORING BIINSPIRA GROUP</p>
                                <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
                                    Pendapatan Tiap Platform
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <TabsList className="h-auto rounded-full border border-white/45 bg-white/20 p-1 text-white">
                                    <TabsTrigger
                                        value="grid"
                                        className="h-7 rounded-full px-3 text-xs font-medium text-white data-[state=active]:bg-white/30 data-[state=active]:text-white"
                                    >
                                        Grid
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="carousel"
                                        className="h-7 rounded-full px-3 text-xs font-medium text-white data-[state=active]:bg-white/30 data-[state=active]:text-white"
                                    >
                                        Carousel
                                    </TabsTrigger>
                                </TabsList>

                                <p className="rounded-full border border-white/45 bg-white/20 px-3 py-1.5 text-xs font-medium text-white sm:text-sm">
                                    Update: {new Date(generatedAt).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>

                        <Deferred data="platformStats" fallback={<StatsSkeletonGrid />}>
                            <>
                                <TabsContent
                                    value="grid"
                                    className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto lg:justify-between lg:overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 gap-2 pr-0.5 md:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:overflow-y-auto">
                                        {stats.map((item) => (
                                            <PlatformStatCardGrid
                                                key={item.key}
                                                item={item}
                                                className="min-h-30 md:h-full"
                                                onOpenDetail={handleOpenDrilldown}
                                            />
                                        ))}
                                    </div>

                                    {/* Bottom Group Summary Bar */}
                                    <div className="mt-3 grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenGroupDrilldown('month')}
                                            className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur transition hover:cursor-pointer hover:border-indigo-400/80 hover:bg-white hover:shadow-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none xl:p-3"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-primary text-white shadow-xs xl:h-11 xl:w-11">
                                                <TrendingUp className="h-5 w-5 xl:h-6 xl:w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-xs">
                                                    Total Omset Group (YTD)
                                                </p>
                                                <p
                                                    className="mt-0.5 truncate text-base leading-tight font-black text-slate-900 xl:text-lg 2xl:text-xl"
                                                    title={formatCurrency(groupStats.total)}
                                                >
                                                    {formatCurrency(groupStats.total)}
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenGroupDrilldown('month')}
                                            className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur transition hover:cursor-pointer hover:border-sky-400/80 hover:bg-white hover:shadow-lg focus:ring-2 focus:ring-sky-400 focus:outline-none xl:p-3"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-cyan-600 text-white shadow-xs xl:h-11 xl:w-11">
                                                <CalendarIcon className="h-5 w-5 xl:h-6 xl:w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-xs">
                                                    Omset Group Bulan Ini
                                                </p>
                                                <p
                                                    className="mt-0.5 truncate text-base leading-tight font-black text-slate-900 xl:text-lg 2xl:text-xl"
                                                    title={formatCurrency(groupStats.thisMonth)}
                                                >
                                                    {formatCurrency(groupStats.thisMonth)}
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenGroupDrilldown('day')}
                                            className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur transition hover:cursor-pointer hover:border-emerald-400/80 hover:bg-white hover:shadow-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none xl:p-3"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-xs xl:h-11 xl:w-11">
                                                <Sparkles className="h-5 w-5 xl:h-6 xl:w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-xs">
                                                    Omset Group Hari Ini
                                                </p>
                                                <p
                                                    className="mt-0.5 truncate text-base leading-tight font-black text-slate-900 xl:text-lg 2xl:text-xl"
                                                    title={formatCurrency(groupStats.today)}
                                                >
                                                    {formatCurrency(groupStats.today)}
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </TabsContent>

                                <TabsContent
                                    value="carousel"
                                    className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto lg:justify-between lg:overflow-hidden"
                                >
                                    <div className="pb-3">
                                        <div className="rounded-3xl border border-white/40 bg-white/16 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                                            <Carousel setApi={setCarouselApi} opts={{ loop: true, align: 'start' }} className="h-full">
                                                <CarouselContent className="ml-0 h-full">
                                                    {stats.map((item) => (
                                                        <CarouselItem key={item.key} className="h-full basis-full px-2">
                                                            <PlatformStatCardCarousel
                                                                item={item}
                                                                className="h-full"
                                                                onOpenDetail={handleOpenDrilldown}
                                                            />
                                                        </CarouselItem>
                                                    ))}
                                                </CarouselContent>
                                            </Carousel>
                                        </div>
                                    </div>

                                    {/* Bottom Group Summary Bar */}
                                    <div className="mt-3 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenGroupDrilldown('month')}
                                            className="flex items-center gap-3.5 rounded-2xl border border-white/55 bg-white/88 p-3.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur transition hover:cursor-pointer hover:border-indigo-400/80 hover:bg-white hover:shadow-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none xl:p-4.5"
                                        >
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-primary text-white shadow-xs xl:h-12 xl:w-12">
                                                <TrendingUp className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[11px] font-bold tracking-wider text-slate-500 uppercase xl:text-xs">
                                                    Total Omset Group (YTD)
                                                </p>
                                                <p
                                                    className="mt-0.5 truncate text-base leading-tight font-black text-slate-900 xl:text-lg 2xl:text-2xl"
                                                    title={formatCurrency(groupStats.total)}
                                                >
                                                    {formatCurrency(groupStats.total)}
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenGroupDrilldown('month')}
                                            className="flex items-center gap-3.5 rounded-2xl border border-white/55 bg-white/88 p-3.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur transition hover:cursor-pointer hover:border-sky-400/80 hover:bg-white hover:shadow-lg focus:ring-2 focus:ring-sky-400 focus:outline-none xl:p-4.5"
                                        >
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-cyan-600 text-white shadow-xs xl:h-12 xl:w-12">
                                                <CalendarIcon className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[11px] font-bold tracking-wider text-slate-500 uppercase xl:text-xs">
                                                    Omset Group Bulan Ini
                                                </p>
                                                <p
                                                    className="mt-0.5 truncate text-base leading-tight font-black text-slate-900 xl:text-lg 2xl:text-2xl"
                                                    title={formatCurrency(groupStats.thisMonth)}
                                                >
                                                    {formatCurrency(groupStats.thisMonth)}
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenGroupDrilldown('day')}
                                            className="flex items-center gap-3.5 rounded-2xl border border-white/55 bg-white/88 p-3.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur transition hover:cursor-pointer hover:border-emerald-400/80 hover:bg-white hover:shadow-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none xl:p-4.5"
                                        >
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-xs xl:h-12 xl:w-12">
                                                <Sparkles className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[11px] font-bold tracking-wider text-slate-500 uppercase xl:text-xs">
                                                    Omset Group Hari Ini
                                                </p>
                                                <p
                                                    className="mt-0.5 truncate text-base leading-tight font-black text-slate-900 xl:text-lg 2xl:text-2xl"
                                                    title={formatCurrency(groupStats.today)}
                                                >
                                                    {formatCurrency(groupStats.today)}
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </TabsContent>
                            </>
                        </Deferred>
                    </Tabs>
                </div>

                {/* Running Text Marquee Footer */}
                <div className="relative z-20 flex h-10 w-full shrink-0 items-center overflow-hidden border-t border-white/20 bg-slate-950/90 text-white shadow-2xl backdrop-blur">
                    <style>{`
                        @keyframes tvMarquee {
                            0% { transform: translateX(0%); }
                            100% { transform: translateX(-50%); }
                        }
                        .animate-tv-marquee {
                            display: flex;
                            width: max-content;
                            animation: tvMarquee 35s linear infinite;
                        }
                    `}</style>
                    <div className="animate-tv-marquee items-center gap-10 text-sm font-bold tracking-wide whitespace-nowrap text-slate-100 sm:text-base">
                        <span>📅 {formattedFullDate}</span>
                        <span className="text-sky-400">•</span>
                        <span>
                            {cornerMessage.emoji} {cornerMessage.title.toUpperCase()}: {cornerMessage.message}
                        </span>
                        <span className="text-sky-400">•</span>
                        <span>✨ LIVE MONITORING BIINSPIRA GROUP</span>
                        <span className="text-sky-400">•</span>
                        <span>📊 Data Omset Diperbarui Secara Real-Time</span>
                        <span className="text-sky-400">•</span>
                        <span>📅 {formattedFullDate}</span>
                        <span className="text-sky-400">•</span>
                        <span>
                            {cornerMessage.emoji} {cornerMessage.title.toUpperCase()}: {cornerMessage.message}
                        </span>
                        <span className="text-sky-400">•</span>
                        <span>✨ LIVE MONITORING BIINSPIRA GROUP</span>
                        <span className="text-sky-400">•</span>
                        <span>📊 Data Omset Diperbarui Secara Real-Time</span>
                        <span className="text-sky-400">•</span>
                    </div>
                </div>
            </div>

            <PlatformDrilldownDialog
                open={drilldownOpen}
                onOpenChange={setDrilldownOpen}
                loading={drilldownLoading}
                error={drilldownError}
                data={drilldownData}
                platformLogo={selectedPlatformLogo}
            />

            <GroupDrilldownDialog
                open={groupDrilldownOpen}
                onOpenChange={setGroupDrilldownOpen}
                loading={groupDrilldownLoading}
                error={groupDrilldownError}
                data={groupDrilldownData}
                activeMetric={groupDrilldownMetric}
                onMetricChange={handleOpenGroupDrilldown}
            />
        </>
    );
}
