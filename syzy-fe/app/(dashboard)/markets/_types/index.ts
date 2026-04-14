export interface Outcome {
    id: string;
    label: string;
    price: number; // 0 to 1 (probability)
    color?: string;
}

export interface Condition {
    id: string;
    slug: string;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
    isMainCategory: boolean;
}

export interface Market {
    id: string; // Internal ID
    condition_id: string;
    question_id: string;
    event_id: string;
    title: string;
    slug: string;
    short_title?: string;
    question?: string;
    market_rules?: string;
    resolution_source?: string | null;
    resolution_source_url?: string;
    winning_outcome?: number | null;
    resolver?: string;
    neg_risk?: boolean;
    neg_risk_other?: boolean;
    neg_risk_market_id?: string;
    neg_risk_request_id?: string;
    metadata_version?: string;
    metadata_schema?: string;
    icon_url: string;
    is_active: boolean;
    is_resolved: boolean;
    block_number: number;
    block_timestamp: string;
    metadata?: Record<string, unknown>;
    volume_24h: number;
    volume: number;
    end_time?: string | null;
    created_at: string;
    updated_at: string;
    price: number; // Current price of the primary outcome (usually YES)
    probability: number; // 0 to 100
    outcomes: Outcome[];
    outcome_label?: string;  // "<56k" when part of a group
    condition: Condition;
}

export interface Event {
    id: string;
    slug: string;
    title: string;
    creator: string;
    icon_url: string;
    show_market_icons: boolean;
    source?: string;
    resolution_source?: string | null;
    enable_neg_risk?: boolean;
    neg_risk_augmented?: boolean;
    neg_risk?: boolean;
    neg_risk_market_id?: string;
    status: 'draft' | 'active' | 'resolved' | 'archived';
    rules?: string;
    active_markets_count: number;
    total_markets_count: number;
    volume: number;
    start_date: string | null;
    end_date: string | null;
    resolved_at?: string | null;
    created_at: string;
    updated_at: string;
    markets: Market[];
    tags: Tag[];
    main_tag: string;
    is_bookmarked: boolean;
    is_trending: boolean;
    group_type?: 'mutually_exclusive' | 'independent';
    group_slug?: string;
}

export interface ChartDataPoint {
    time: string;
    value: number;
    value2?: number; 
}