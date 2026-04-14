
import { ChartDataPoint, Event } from '@/app/(dashboard)/markets/_types';
import { loadRealData } from '@/app/(dashboard)/markets/_utils/market-adapter';

// Helper to generate chart data
export const generateChartData = (baseValue: number): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    let value = baseValue;
    const now = new Date();
    
    // Create more realistic volatility based on the probability
    const volatility = baseValue > 90 || baseValue < 10 ? 1 : 4;

    for (let i = 0; i <= 50; i++) {
        // Random walk
        if (Math.random() > 0.5) {
             value = value + (Math.random() * volatility);
        } else {
             value = value - (Math.random() * volatility);
        }
        
        // Clamp
        value = Math.min(99, Math.max(1, value));
        
        const date = new Date(now);
        date.setDate(date.getDate() - (50 - i));
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        data.push({
            time: `${months[date.getMonth()]} ${date.getDate()}`,
            value: Math.round(value),
        });
    }
    
    // Force the last point to match the actual probability to look correct on UI
    data[data.length - 1].value = baseValue;
    
    return data;
};

// Load the data from the adapter
export const EVENTS: Event[] = loadRealData();
