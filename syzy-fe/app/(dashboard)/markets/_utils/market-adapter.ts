
import { Market, Event } from '@/app/(dashboard)/markets/_types';
import { mockDataCrypto, mockDataPolitic } from '@/app/(dashboard)/markets/_utils/data-crypto';

// Helper function to create URL-friendly slug from title
const createSlugFromTitle = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim()
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

type ApiItem = Record<string, unknown> & {
    markets?: Array<Record<string, unknown> & { rulebook_variables?: { image_link?: string }; image_url_light_mode?: string }>;
    category?: string;
    series_ticker?: string;
};

const getEventImage = (item: ApiItem): string => {
    // Try to find image in the first market's rulebook variables (common in politics)
    const firstMarket = item.markets?.[0] as { rulebook_variables?: { image_link?: string }; image_url_light_mode?: string } | undefined;
    if (firstMarket?.rulebook_variables?.image_link) {
        return firstMarket.rulebook_variables.image_link;
    }
    if (firstMarket?.image_url_light_mode) {
        return firstMarket.image_url_light_mode;
    }
    if (item.category === "Crypto" && typeof item.series_ticker === "string") {
        if (item.series_ticker.includes("BTC")) return 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/btc.png';
        if (item.series_ticker.includes("ETH")) return 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png';
        if (item.series_ticker.includes("SOL")) return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
        if (item.series_ticker.includes("XRP")) return 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/xrp.png';
    }
    return 'https://picsum.photos/200';
};

type ApiMarket = Record<string, unknown> & {
    ticker?: string;
    last_price?: number;
    yes_bid?: number;
    yes_subtitle?: string;
    title?: string;
    open_ts?: string;
    close_ts?: string;
    image_url_light_mode?: string;
};

type ApiItemFull = ApiItem & {
    markets?: ApiMarket[];
    event_ticker?: string;
    event_title?: string;
    total_volume?: number;
    total_series_volume?: number;
    active_market_count?: number;
    total_market_count?: number;
    product_metadata?: { categories?: string[] };
};

const transformItemToEvent = (item: ApiItemFull, _index: number): Event => {
    const markets: Market[] = (item.markets ?? []).map((m: ApiMarket) => {
        const prob = m.last_price || m.yes_bid || 50; // Fallback if no price
        
        // Determine title based on structure
        let marketTitle = m.yes_subtitle || m.ticker;
        if(marketTitle === "na") marketTitle = "Yes";

        return {
            id: String(m.ticker ?? ""),
            condition_id: String(m.ticker ?? ""),
            question_id: String(m.ticker ?? ""),
            event_id: String(item.event_ticker ?? ""),
            title: String(m.title ?? marketTitle),
            short_title: String(marketTitle),
            slug: String(m.ticker ?? "").toLowerCase(),
            icon_url: (m.image_url_light_mode as string) || "",
            is_active: true,
            is_resolved: false,
            block_number: 0,
            block_timestamp: new Date().toISOString(),
            volume_24h: 0,
            volume: (item.total_volume as number) / (item.markets?.length ?? 1),
            created_at: String(m.open_ts ?? ""),
            updated_at: new Date().toISOString(),
            price: prob / 100,
            probability: prob,
            condition: { id: 'c', slug: 's' },
            outcomes: [
                { id: 'yes', label: 'Yes', price: prob / 100, color: 'hsl(var(--secondary))' },
                { id: 'no', label: 'No', price: (100 - prob) / 100, color: 'hsl(var(--destructive))' }
            ]
        };
    });

    // Sort markets by probability to make charts/lists look better
    markets.sort((a, b) => b.probability - a.probability);

    return {
        id: String(item.event_ticker ?? ""),
        slug: createSlugFromTitle(String(item.event_title ?? "")),
        title: String(item.event_title ?? ""),
        creator: "Syzy Oracle",
        icon_url: getEventImage(item),
        show_market_icons: item.category === "Politics",
        status: "active",
        active_markets_count: (item.active_market_count as number) ?? 0,
        total_markets_count: (item.total_market_count as number) ?? 0,
        volume: (item.total_series_volume as number) ?? (item.total_volume as number) ?? 0,
        start_date: item.markets?.[0]?.open_ts
            ? new Date(String(item.markets[0].open_ts)).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
            : null,
        end_date: item.markets?.[0]?.close_ts
            ? new Date(String(item.markets[0].close_ts)).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
            : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        main_tag: String(item.category ?? ""),
        tags: ((item.product_metadata?.categories) ?? []).map((c: string, i: number) => ({
            id: i,
            name: c,
            slug: c.toLowerCase(),
            isMainCategory: i === 0
        })),
        is_bookmarked: false,
        is_trending: _index < 3 || (item.total_volume as number) > 1000000,
        markets: markets
    };
};

export const loadRealData = (): Event[] => {
    const cryptoEvents = mockDataCrypto.current_page.map((item, idx) => transformItemToEvent(item, idx));
    const politicEvents = mockDataPolitic.current_page.map((item, idx) => transformItemToEvent(item, idx));
    
    // Pin the new Pump.fun tokens to the top - check by event ID prefix
    const newPumpTokens = ['PENGUIN', 'WhiteWhale', 'Fartcoin', 'Pnut'];
    const pinnedEvents = cryptoEvents.filter(event => 
        newPumpTokens.some(token => event.id.startsWith(token))
    );
    
    // Get remaining crypto events (excluding pinned ones)
    const remainingCryptoEvents = cryptoEvents.filter(event => 
        !newPumpTokens.some(token => event.id.startsWith(token))
    );
    
    // Debug logging
    console.log('Pinned Pump.fun events:', pinnedEvents.map(e => ({ id: e.id, title: e.title })));
    console.log('Total crypto events:', cryptoEvents.length);
    console.log('Remaining crypto events:', remainingCryptoEvents.length);
    
    // Interleave remaining events for diversity
    const combined = [...pinnedEvents]; // Start with pinned tokens
    const maxLength = Math.max(remainingCryptoEvents.length, politicEvents.length);
    
    for (let i = 0; i < maxLength; i++) {
        if (politicEvents[i]) combined.push(politicEvents[i]);
        if (remainingCryptoEvents[i]) combined.push(remainingCryptoEvents[i]);
    }
    
    console.log('Final combined events (first 10):', combined.slice(0, 10).map(e => ({ id: e.id, title: e.title })));
    
    return combined;
};
