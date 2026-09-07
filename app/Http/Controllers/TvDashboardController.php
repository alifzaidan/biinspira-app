<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TvDashboardController extends Controller
{
    private const PLATFORM_STATS_CACHE_KEY = 'tv_dashboard.platform_stats';
    private const BIINSPIRA_RATE_LIMIT_UNTIL_KEY = 'tv_dashboard.biinspira_rate_limit_until';

    private array $platformLabels = [
        'biinspira' => 'Biinspira',
        'smartcounting' => 'Smartcounting',
        'smartcountingacademy' => 'Smartcounting Academy',
        'kompeten' => 'Kompeten',
        'sekolahpajak' => 'Sekolah Pajak',
        'talenta' => 'Talenta',
        'skillgrow' => 'Skillgrow',
        'aksademy' => 'Aksademy',
    ];

    private array $customAuthHeaderPlatforms = [
        'biinspira',
        'smartcounting',
        'smartcountingacademy',
    ];

    public function index(): Response
    {
        $platforms = config('services.platforms', []);

        return Inertia::render('tv/dashboard', [
            'platformStats' => Inertia::defer(fn() => $this->buildPlatformStats($platforms)),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    public function detail(Request $request): JsonResponse
    {
        $platforms = config('services.platforms', []);

        $availablePlatformKeys = [];
        foreach ($this->platformLabels as $key => $_label) {
            if ($this->hasPlatformCredentials($platforms[$key] ?? null)) {
                $availablePlatformKeys[] = $key;
            }
        }

        $validated = $request->validate([
            'platform' => ['required', 'string', Rule::in(array_merge($availablePlatformKeys, ['group']))],
            'metric' => ['required', 'string', Rule::in(['month', 'day'])],
        ]);

        $platformKey = $validated['platform'];
        $metric = $validated['metric'];

        if ($platformKey === 'group') {
            return response()->json($this->buildGroupDetailPoints($availablePlatformKeys, $platforms, $metric));
        }

        $platform = $platforms[$platformKey] ?? null;

        if (!is_array($platform) || empty($platform['base_url']) || empty($platform['token'])) {
            return response()->json([
                'message' => 'Platform tidak valid atau credential tidak tersedia.',
            ], 422);
        }

        $data = $this->buildDetailPoints(
            $platformKey,
            (string) $platform['base_url'],
            (string) $platform['token'],
            $metric
        );

        return response()->json($data);
    }

    private function buildGroupDetailPoints(array $availablePlatformKeys, array $platforms, string $metric): array
    {
        $now = now();
        $year = (int) $now->year;
        $month = (int) $now->month;
        $cacheKey = "tv_dashboard.detail.group.{$metric}.{$year}.{$month}";

        return Cache::remember($cacheKey, now()->addMinutes(3), function () use ($availablePlatformKeys, $platforms, $metric, $now, $year): array {
            $platformDetails = [];
            foreach ($availablePlatformKeys as $key) {
                $platform = $platforms[$key] ?? null;
                if (!is_array($platform) || empty($platform['base_url']) || empty($platform['token'])) {
                    continue;
                }

                $platformDetails[$key] = $this->buildDetailPoints(
                    $key,
                    (string) $platform['base_url'],
                    (string) $platform['token'],
                    $metric
                );
            }

            $points = [];
            $startOfMonth = $now->copy()->startOfMonth();

            if ($metric === 'month') {
                for ($m = 1; $m <= 12; $m++) {
                    $points[] = [
                        'key' => sprintf('%04d-%02d', $year, $m),
                        'label' => Carbon::create($year, $m, 1)->locale('id')->translatedFormat('F'),
                        'value' => 0.0,
                        'platforms' => [],
                    ];
                }
            } else {
                $daysInMonth = (int) $startOfMonth->daysInMonth;
                for ($d = 1; $d <= $daysInMonth; $d++) {
                    $date = $startOfMonth->copy()->day($d);
                    $points[] = [
                        'key' => $date->format('Y-m-d'),
                        'label' => $date->locale('id')->translatedFormat('d M'),
                        'value' => 0.0,
                        'platforms' => [],
                    ];
                }
            }

            $platformList = [];
            foreach ($availablePlatformKeys as $key) {
                $platformList[] = [
                    'key' => $key,
                    'label' => $this->platformLabels[$key] ?? $key,
                ];

                if (!isset($platformDetails[$key]['points'])) {
                    continue;
                }

                foreach ($platformDetails[$key]['points'] as $idx => $p) {
                    if (isset($points[$idx])) {
                        $val = (float) ($p['value'] ?? 0);
                        $points[$idx]['value'] += $val;
                        $points[$idx]['platforms'][$key] = $val;
                    }
                }
            }

            for ($i = 1; $i < count($points); $i++) {
                $change = $this->buildChange($points[$i]['value'], $points[$i - 1]['value']);
                $points[$i]['change_percentage'] = $change['percentage'];
                $points[$i]['change_direction'] = $change['direction'];
            }

            // avg_change per titik bulanan: rata-rata dari Jan s.d bulan sebelumnya (non-zero)
            if ($metric === 'month') {
                for ($i = 0; $i < count($points); $i++) {
                    if ($i === 0) {
                        $points[$i]['avg_change_percentage'] = 0.0;
                        $points[$i]['avg_change_direction'] = 'flat';
                        $points[$i]['avg_value'] = 0.0;
                        continue;
                    }
                    $slice = array_slice($points, 0, $i);
                    $nonZeroSlice = array_filter($slice, fn($p) => ($p['value'] ?? 0.0) > 0.0);
                    if (empty($nonZeroSlice)) {
                        $points[$i]['avg_change_percentage'] = 0.0;
                        $points[$i]['avg_change_direction'] = 'flat';
                        $points[$i]['avg_value'] = 0.0;
                        continue;
                    }
                    $avg = array_sum(array_column(array_values($nonZeroSlice), 'value')) / count($nonZeroSlice);
                    $avgChange = $this->buildChange($points[$i]['value'], $avg);
                    $points[$i]['avg_change_percentage'] = $avgChange['percentage'];
                    $points[$i]['avg_change_direction'] = $avgChange['direction'];
                    $points[$i]['avg_value'] = round($avg);
                }
            }

            $totalGroup = array_reduce($points, fn($sum, $row) => $sum + ($row['value'] ?? 0), 0.0);


            return [
                'platform' => 'group',
                'platform_label' => 'Group Biinspira',
                'metric' => $metric,
                'title' => $metric === 'month' ? 'Rincian Omset Group (Bulanan)' : 'Rincian Omset Group (Harian)',
                'subtitle' => $metric === 'month'
                    ? "Periode Januari - Desember {$year}"
                    : $startOfMonth->locale('id')->translatedFormat('F Y'),
                'points' => $points,
                'platforms' => $platformList,
                'total' => $totalGroup,
                'generated_at' => now()->toIso8601String(),
            ];
        });
    }

    private function buildPlatformStats(array $platforms): array
    {
        $stats = [];
        $logoMap = $this->buildPlatformLogoMap();
        $cachedStats = Cache::get(self::PLATFORM_STATS_CACHE_KEY, []);

        $availablePlatformKeys = [];
        foreach ($this->platformLabels as $key => $label) {
            $platform = $platforms[$key] ?? null;
            if (! $this->hasPlatformCredentials($platform)) {
                continue;
            }
            $availablePlatformKeys[] = $key;
        }

        $cachedStats = $this->refreshPlatformStats($platforms, $availablePlatformKeys, $cachedStats, $logoMap);

        foreach ($availablePlatformKeys as $key) {
            $label = $this->platformLabels[$key] ?? $key;
            $cached = $cachedStats[$key] ?? null;

            if (is_array($cached)) {
                $cached['label'] = $label;
                $cached['logo'] = $logoMap[$key] ?? ($cached['logo'] ?? null);
                $stats[] = $cached;
                continue;
            }

            $stats[] = $this->emptyPlatformStat($key, $label, $logoMap[$key] ?? null);
        }

        return $stats;
    }

    private function refreshPlatformStats(array $platforms, array $platformKeys, array $cachedStats, array $logoMap): array
    {
        if (empty($platformKeys)) {
            return $cachedStats;
        }

        foreach ($platformKeys as $platformKey) {
            $platform = $platforms[$platformKey] ?? null;
            if (! is_array($platform)) {
                continue;
            }

            if ($platformKey === 'biinspira') {
                $rateLimitUntil = Cache::get(self::BIINSPIRA_RATE_LIMIT_UNTIL_KEY);
                if (is_string($rateLimitUntil) && now()->lt(Carbon::parse($rateLimitUntil))) {
                    Log::warning('TV dashboard Biinspira skipped due to rate-limit cooldown', [
                        'cooldown_until' => $rateLimitUntil,
                    ]);
                    continue;
                }
            }

            $result = $this->fetchStatisticsForPlatform(
                $platformKey,
                (string) ($platform['base_url'] ?? ''),
                (string) ($platform['token'] ?? '')
            );

            if ($result['rate_limited'] && $platformKey === 'biinspira') {
                Cache::put(self::BIINSPIRA_RATE_LIMIT_UNTIL_KEY, now()->addMinutes(5)->toIso8601String(), now()->addMinutes(10));
            }

            if ($result['failed']) {
                continue;
            }

            $stat = $this->buildPlatformStatFromStatistics(
                $platformKey,
                $this->platformLabels[$platformKey] ?? $platformKey,
                $result['statistics'],
                $logoMap[$platformKey] ?? null
            );

            $cachedStats[$platformKey] = $stat;
        }

        Cache::put(self::PLATFORM_STATS_CACHE_KEY, $cachedStats, now()->addHours(12));

        return $cachedStats;
    }

    private function buildPlatformStatFromStatistics(string $key, string $label, array $statistics, ?string $logo): array
    {
        $totalRevenue = $this->resolveStatisticNumber($this->pickStatisticValue($statistics, [
            'total_nominal_this_year',
            'this_year_revenue',
            'revenue_this_year',
            'total_revenue_this_year',
            'year_to_date_revenue',
            'total_revenue',
            'revenue_total',
            'total_nominal',
            'gross_revenue',
        ]));

        $thisMonthRevenue = $this->resolveStatisticNumber($this->pickStatisticValue($statistics, [
            'this_month_revenue',
            'total_nominal_this_month',
            'monthly_revenue',
            'revenue_this_month',
        ]));

        $lastMonthRevenue = $this->resolveStatisticNumber($this->pickStatisticValue($statistics, [
            'total_nominal_last_month',
            'last_month_revenue',
            'total_nominal_previous_month',
            'previous_month_revenue',
            'revenue_last_month',
        ]));

        $todayRevenue = $this->resolveStatisticNumber($this->pickStatisticValue($statistics, [
            'total_nominal_today',
            'today_revenue',
            'revenue_today',
            'total_today',
            'nominal_today',
        ]));

        $yesterdayRevenue = $this->resolveStatisticNumber($this->pickStatisticValue($statistics, [
            'total_nominal_yesterday',
            'yesterday_revenue',
            'revenue_yesterday',
            'total_yesterday',
            'nominal_yesterday',
        ]));

        $monthChange = $this->buildChange($thisMonthRevenue, $lastMonthRevenue);
        $dayChange = $this->buildChange($todayRevenue, $yesterdayRevenue);

        // avg_change: bandingkan bulan ini terhadap rata-rata bulanan tahun ini
        // rata-rata = total_this_year / jumlah bulan yang sudah berjalan
        $currentMonth = (int) now()->month; // 1-12
        $monthlyAvg = $currentMonth > 0 ? $totalRevenue / $currentMonth : 0.0;
        $avgChange = $this->buildChange($thisMonthRevenue, $monthlyAvg);

        return [
            'key' => $key,
            'label' => $label,
            'logo' => $logo,
            'total' => $totalRevenue,
            'this_month' => $thisMonthRevenue,
            'today' => $todayRevenue,
            'month_change_percentage' => $monthChange['percentage'],
            'month_change_direction' => $monthChange['direction'],
            'day_change_percentage' => $dayChange['percentage'],
            'day_change_direction' => $dayChange['direction'],
            'avg_change_percentage' => $avgChange['percentage'],
            'avg_change_direction' => $avgChange['direction'],
            'monthly_avg' => round($monthlyAvg),
        ];
    }

    private function fetchStatisticsForPlatform(string $platformKey, string $baseUrl, string $token): array
    {
        $hasRequestFailure = false;
        $rateLimited = false;

        try {
            $endpoint = $this->resolveInvoicesEndpoint($platformKey);
            $response = $this->buildPlatformRequest($platformKey, $token)
                ->get("{$baseUrl}/{$endpoint}/statistics", [
                    'status' => 'paid',
                ]);

            if (! $response->successful()) {
                $hasRequestFailure = true;
                if ($response->status() === 429) {
                    $rateLimited = true;
                }

                Log::warning('TV dashboard failed to fetch statistics', [
                    'platform' => $platformKey,
                    'url' => "{$baseUrl}/{$endpoint}/statistics",
                    'status' => $response->status(),
                    'response_body' => substr($response->body(), 0, 300),
                ]);

                return [
                    'statistics' => [],
                    'failed' => $hasRequestFailure,
                    'rate_limited' => $rateLimited,
                ];
            }

            $statistics = $response->json('data', []);
            if (! is_array($statistics)) {
                $hasRequestFailure = true;
                Log::warning('TV dashboard statistics payload invalid', [
                    'platform' => $platformKey,
                    'url' => "{$baseUrl}/{$endpoint}/statistics",
                    'payload_preview' => substr($response->body(), 0, 300),
                ]);

                return [
                    'statistics' => [],
                    'failed' => $hasRequestFailure,
                    'rate_limited' => $rateLimited,
                ];
            }

            if ($platformKey === 'biinspira') {
                Log::info('TV dashboard Biinspira statistics payload sample', [
                    'keys' => array_keys($statistics),
                    'this_year_revenue' => $statistics['total_nominal_this_year'] ?? null,
                    'total_revenue' => $statistics['total_revenue'] ?? null,
                    'this_month_revenue' => $statistics['this_month_revenue'] ?? null,
                    'today' => $statistics['total_nominal_today'] ?? null,
                    'yesterday' => $statistics['total_nominal_yesterday'] ?? null,
                    'last_month' => $statistics['total_nominal_last_month'] ?? null,
                ]);
            }
        } catch (\Throwable $e) {
            $hasRequestFailure = true;
            Log::warning('TV dashboard statistics fetch exception', [
                'platform' => $platformKey,
                'message' => $e->getMessage(),
            ]);

            return [
                'statistics' => [],
                'failed' => $hasRequestFailure,
                'rate_limited' => $rateLimited,
            ];
        }

        return [
            'statistics' => $statistics,
            'failed' => $hasRequestFailure,
            'rate_limited' => $rateLimited,
        ];
    }

    private function buildDetailPoints(string $platformKey, string $baseUrl, string $token, string $metric): array
    {
        $now = now();
        $year = (int) $now->year;
        $month = (int) $now->month;
        $cacheKey = "tv_dashboard.detail.{$platformKey}.{$metric}.{$year}.{$month}";

        return Cache::remember($cacheKey, now()->addMinutes(3), function () use ($platformKey, $baseUrl, $token, $metric, $now): array {
            $range = $metric === 'month'
                ? [
                    'start' => $now->copy()->startOfYear(),
                    'end' => $now->copy()->endOfYear(),
                ]
                : [
                    'start' => $now->copy()->startOfMonth(),
                    'end' => $now->copy()->endOfMonth(),
                ];

            $invoices = $this->fetchPaidInvoicesForRange(
                $platformKey,
                $baseUrl,
                $token,
                $range['start']->toDateString(),
                $range['end']->toDateString()
            );

            return $metric === 'month'
                ? $this->buildMonthDetailPayload($platformKey, $invoices, $now)
                : $this->buildDayDetailPayload($platformKey, $invoices, $now);
        });
    }

    private function fetchPaidInvoicesForRange(string $platformKey, string $baseUrl, string $token, string $startDate, string $endDate): array
    {
        $items = [];
        $perPage = 100;
        $startTimestamp = strtotime($startDate . ' 00:00:00');
        $endTimestamp = strtotime($endDate . ' 23:59:59');
        $requestStartDate = Carbon::parse($startDate)->subDay()->toDateString();
        $requestEndDate = Carbon::parse($endDate)->addDay()->toDateString();

        try {
            $page = 1;
            $hasMore = true;
            $lastSignature = null;

            while ($hasMore && $page <= 100) {
                $endpoint = $this->resolveInvoicesEndpoint($platformKey);

                $response = $this->buildPlatformRequest($platformKey, $token)
                    ->get("{$baseUrl}/{$endpoint}", [
                        'status' => 'paid',
                        'page' => $page,
                        'per_page' => $perPage,
                        'start_date' => $requestStartDate,
                        'end_date' => $requestEndDate,
                    ]);

                if (!$response->successful()) {
                    Log::warning('TV dashboard detail failed to fetch invoices', [
                        'platform' => $platformKey,
                        'url' => "{$baseUrl}/{$endpoint}",
                        'status' => $response->status(),
                        'response_body' => substr($response->body(), 0, 300),
                    ]);
                    break;
                }

                $data = $response->json('data.items');
                if (!is_array($data)) {
                    $data = $response->json('data.data');
                }
                if (!is_array($data)) {
                    $data = $response->json('data', []);
                }
                if (!is_array($data) || empty($data)) {
                    break;
                }

                $filtered = array_values(array_filter($data, function ($item) use ($startTimestamp, $endTimestamp) {
                    $paidAt = $item['paid_at'] ?? null;
                    if (!$paidAt) {
                        return false;
                    }

                    $timestamp = strtotime((string) $paidAt);
                    if ($timestamp === false) {
                        return false;
                    }

                    return $timestamp >= $startTimestamp && $timestamp <= $endTimestamp;
                }));

                $items = array_merge($items, $filtered);

                $currentPage = (int) ($response->json('data.pagination.current_page')
                    ?? $response->json('data.meta.current_page')
                    ?? $response->json('data.current_page')
                    ?? $response->json('meta.current_page')
                    ?? $page);
                $lastPage = (int) ($response->json('data.pagination.last_page')
                    ?? $response->json('data.meta.last_page')
                    ?? $response->json('data.last_page')
                    ?? $response->json('meta.last_page')
                    ?? 0);

                if ($lastPage > 0) {
                    $hasMore = $currentPage < $lastPage;
                } else {
                    $signature = md5(json_encode(array_column($data, 'id')));
                    if ($lastSignature !== null && $signature === $lastSignature) {
                        break;
                    }
                    $lastSignature = $signature;
                    $hasMore = count($data) === $perPage;
                }

                $page++;
            }
        } catch (\Throwable $e) {
            Log::warning('TV dashboard detail invoices fetch exception', [
                'platform' => $platformKey,
                'message' => $e->getMessage(),
            ]);
        }

        return $items;
    }

    private function buildMonthDetailPayload(string $platformKey, array $invoices, Carbon $now): array
    {
        $year = (int) $now->year;
        $points = [];

        for ($month = 1; $month <= 12; $month++) {
            $points[] = [
                'key' => sprintf('%04d-%02d', $year, $month),
                'label' => Carbon::create($year, $month, 1)->locale('id')->translatedFormat('F'),
                'value' => 0.0,
            ];
        }

        foreach ($invoices as $invoice) {
            $paidAt = $invoice['paid_at'] ?? null;
            if (!$paidAt) {
                continue;
            }

            try {
                $paidDate = Carbon::parse((string) $paidAt)->setTimezone(config('app.timezone'));
            } catch (\Throwable) {
                continue;
            }

            if ((int) $paidDate->year !== $year) {
                continue;
            }

            $idx = (int) $paidDate->month - 1;
            if (!isset($points[$idx])) {
                continue;
            }

            $points[$idx]['value'] += $this->resolveInvoiceNominal($invoice);
        }

        // Calculate percentage changes between consecutive months
        for ($i = 1; $i < count($points); $i++) {
            $change = $this->buildChange($points[$i]['value'], $points[$i - 1]['value']);
            $points[$i]['change_percentage'] = $change['percentage'];
            $points[$i]['change_direction'] = $change['direction'];
        }

        // Calculate avg_change per titik: rata-rata dari Januari s.d bulan sebelumnya (non-zero)
        for ($i = 0; $i < count($points); $i++) {
            if ($i === 0) {
                $points[$i]['avg_change_percentage'] = 0.0;
                $points[$i]['avg_change_direction'] = 'flat';
                $points[$i]['avg_value'] = 0.0;
                continue;
            }
            // Kumpulkan nilai dari Jan s.d bulan ke-(i-1) yang non-zero
            $slice = array_slice($points, 0, $i);
            $nonZeroSlice = array_filter($slice, fn($p) => ($p['value'] ?? 0.0) > 0.0);
            if (empty($nonZeroSlice)) {
                $points[$i]['avg_change_percentage'] = 0.0;
                $points[$i]['avg_change_direction'] = 'flat';
                $points[$i]['avg_value'] = 0.0;
                continue;
            }
            $avg = array_sum(array_column(array_values($nonZeroSlice), 'value')) / count($nonZeroSlice);
            $avgChange = $this->buildChange($points[$i]['value'], $avg);
            $points[$i]['avg_change_percentage'] = $avgChange['percentage'];
            $points[$i]['avg_change_direction'] = $avgChange['direction'];
            $points[$i]['avg_value'] = round($avg);
        }

        return [
            'platform' => $platformKey,
            'platform_label' => $this->platformLabels[$platformKey] ?? $platformKey,
            'metric' => 'month',
            'title' => 'Rincian Bulanan Tahun Ini',
            'subtitle' => "Periode Januari - Desember {$year}",
            'points' => $points,
            'total' => array_reduce($points, fn($sum, $row) => $sum + ($row['value'] ?? 0), 0.0),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    private function buildDayDetailPayload(string $platformKey, array $invoices, Carbon $now): array
    {
        $startOfMonth = $now->copy()->startOfMonth();
        $daysInMonth = (int) $startOfMonth->daysInMonth;
        $points = [];

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = $startOfMonth->copy()->day($day);
            $points[] = [
                'key' => $date->format('Y-m-d'),
                'label' => $date->locale('id')->translatedFormat('d M'),
                'value' => 0.0,
            ];
        }

        foreach ($invoices as $invoice) {
            $paidAt = $invoice['paid_at'] ?? null;
            if (!$paidAt) {
                continue;
            }

            try {
                $paidDate = Carbon::parse((string) $paidAt)->setTimezone(config('app.timezone'));
            } catch (\Throwable) {
                continue;
            }

            if (!$paidDate->isSameMonth($startOfMonth) || (int) $paidDate->year !== (int) $startOfMonth->year) {
                continue;
            }

            $idx = (int) $paidDate->day - 1;
            if (!isset($points[$idx])) {
                continue;
            }

            $points[$idx]['value'] += $this->resolveInvoiceNominal($invoice);
        }

        // Calculate percentage changes between consecutive days
        for ($i = 1; $i < count($points); $i++) {
            $change = $this->buildChange($points[$i]['value'], $points[$i - 1]['value']);
            $points[$i]['change_percentage'] = $change['percentage'];
            $points[$i]['change_direction'] = $change['direction'];
        }

        return [
            'platform' => $platformKey,
            'platform_label' => $this->platformLabels[$platformKey] ?? $platformKey,
            'metric' => 'day',
            'title' => 'Rincian Harian Bulan Ini',
            'subtitle' => $startOfMonth->locale('id')->translatedFormat('F Y'),
            'points' => $points,
            'total' => array_reduce($points, fn($sum, $row) => $sum + ($row['value'] ?? 0), 0.0),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    private function resolveInvoiceNominal(array $invoice): float
    {
        return $this->resolveStatisticNumber($this->pickStatisticValue($invoice, [
            'nett_amount',
            'total_nominal',
            'amount',
            'total',
            'paid_amount',
            'nominal',
            'price',
        ]));
    }

    private function emptyPlatformStat(string $key, string $label, ?string $logo): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'logo' => $logo,
            'total' => 0.0,
            'this_month' => 0.0,
            'today' => 0.0,
            'month_change_percentage' => 0.0,
            'month_change_direction' => 'flat',
            'day_change_percentage' => 0.0,
            'day_change_direction' => 'flat',
            'avg_change_percentage' => 0.0,
            'avg_change_direction' => 'flat',
            'monthly_avg' => 0.0,
        ];
    }

    private function buildChange(float $current, float $previous): array
    {
        if ($previous <= 0.0) {
            if ($current <= 0.0) {
                return ['percentage' => 0.0, 'direction' => 'flat'];
            }

            return ['percentage' => 100.0, 'direction' => 'up'];
        }

        $delta = (($current - $previous) / $previous) * 100;
        $direction = $delta > 0 ? 'up' : ($delta < 0 ? 'down' : 'flat');

        return [
            'percentage' => round(abs($delta), 2),
            'direction' => $direction,
        ];
    }

    private function buildPlatformRequest(string $platformKey, string $token)
    {
        if (in_array($platformKey, $this->customAuthHeaderPlatforms, true)) {
            return Http::timeout(12)->withHeaders([
                'api-auth-key' => $token,
            ]);
        }

        return Http::timeout(12)->withToken($token);
    }

    private function resolveInvoicesEndpoint(string $platformKey): string
    {
        return in_array($platformKey, ['smartcounting', 'smartcountingacademy', 'biinspira'], true) ? 'purchases' : 'invoices';
    }

    private function hasPlatformCredentials(mixed $platform): bool
    {
        return is_array($platform) && ! empty($platform['base_url']) && ! empty($platform['token']);
    }

    private function buildPlatformLogoMap(): array
    {
        $logos = [];
        $users = User::query()
            ->select(['name', 'email', 'avatar'])
            ->whereNotNull('avatar')
            ->get();

        $platformAliases = [
            'biinspira' => ['biinspira'],
            'smartcounting' => ['smartcounting'],
            'smartcountingacademy' => ['smartcountingacademy', 'smartcounting'],
            'kompeten' => ['kompeten', 'kompetenidn'],
            'sekolahpajak' => ['sekolahpajak'],
            'talenta' => ['talenta'],
            'skillgrow' => ['skillgrow'],
            'aksademy' => ['aksademy'],
        ];

        foreach ($this->platformLabels as $platformKey => $_label) {
            $aliases = $platformAliases[$platformKey] ?? [$platformKey];

            $matchedUser = $users->first(function (User $user) use ($platformKey): bool {
                $nameKey = $this->normalizePlatformKey((string) $user->name);
                $emailKey = $this->normalizePlatformKey(Str::before((string) $user->email, '@'));

                return $nameKey === $platformKey || $emailKey === $platformKey;
            });

            if (! $matchedUser) {
                $matchedUser = $users->first(function (User $user) use ($aliases): bool {
                    $nameKey = $this->normalizePlatformKey((string) $user->name);
                    $emailKey = $this->normalizePlatformKey(Str::before((string) $user->email, '@'));

                    foreach ($aliases as $alias) {
                        if (str_contains($nameKey, $alias) || str_contains($emailKey, $alias)) {
                            return true;
                        }
                    }

                    return false;
                });
            }

            if (! $matchedUser || ! $matchedUser->avatar) {
                continue;
            }

            $logos[$platformKey] = Str::startsWith($matchedUser->avatar, ['http://', 'https://'])
                ? $matchedUser->avatar
                : url('/storage/' . ltrim($matchedUser->avatar, '/'));
        }

        return $logos;
    }

    private function normalizePlatformKey(string $value): string
    {
        return Str::of($value)
            ->lower()
            ->replaceMatches('/[^a-z0-9]/', '')
            ->toString();
    }

    private function resolveStatisticNumber(mixed $value): float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '') {
                return 0.0;
            }

            if (is_numeric($trimmed)) {
                return (float) $trimmed;
            }

            $normalized = preg_replace('/[^0-9,.-]/', '', $trimmed);
            if ($normalized === null || $normalized === '') {
                return 0.0;
            }

            $lastComma = strrpos($normalized, ',');
            $lastDot = strrpos($normalized, '.');

            if ($lastComma !== false && $lastDot !== false) {
                if ($lastComma > $lastDot) {
                    $normalized = str_replace('.', '', $normalized);
                    $normalized = str_replace(',', '.', $normalized);
                } else {
                    $normalized = str_replace(',', '', $normalized);
                }
            } elseif ($lastComma !== false) {
                $normalized = str_replace(',', '.', $normalized);
            }

            return is_numeric($normalized) ? (float) $normalized : 0.0;
        }

        return 0.0;
    }

    private function pickStatisticValue(array $statistics, array $keys): mixed
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $statistics)) {
                return $statistics[$key];
            }
        }

        return 0.0;
    }
}