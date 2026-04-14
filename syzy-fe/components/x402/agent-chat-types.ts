export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  result?: any
  dry_run?: boolean
  loading?: boolean
}

/** USDC cost per tool call. 0 = free, null = dynamic (depends on args). */
export const TOOL_COSTS_USDC: Record<string, number | null> = {
  place_prediction: null,  // dynamic: $0.01 + SOL amount in USD
  sell_position: 0.01,
  claim_winnings: 0.01,
  resolve_market: 0.05,
  list_markets: 0,
  get_market: 0,
  get_price_history: 0,
  get_market_news: 0,
  get_market_comments: 0,
  get_positions: 0,
  get_trade_history: 0,
  get_health: 0,
  get_endpoint_info: 0,
}

export interface FundingPromptData {
  estimatedCost: number
  currentBalance: number
  toolCallId: string
  x402Endpoint: string
  method: string
  args: Record<string, any>
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "funding_prompt"
  content: string
  toolCalls?: ToolCall[]
  error?: string
  isStreaming?: boolean
  fundingPrompt?: FundingPromptData
}

export interface ChatSSEEvent {
  type:
    | "text_delta"
    | "thinking"
    | "tool_call_start"
    | "tool_call_result"
    | "tool_call_payment_required"
    | "waiting_for_payment"
    | "done"
    | "error"
  data: any
}
