export interface Store {
  id: number
  name: string
  slug: string
  domain: string
  created_at: string
  updated_at: string
}

export interface PriceHistory {
  id: number
  offer_id: number
  price: string | number
  recorded_at: string
  created_at: string
  updated_at: string
}

export interface Offer {
  id: number
  product_id: number
  store_id: number
  price: string | number
  old_price?: string | number | null
  currency: string
  url: string
  availability: boolean
  scraped_at?: string | null
  created_at: string
  updated_at: string
  store?: Store
  price_histories?: PriceHistory[]
}

export interface Product {
  id: number
  name: string
  brand?: string | null
  model?: string | null
  sku?: string | null
  gtin?: string | null
  image_url?: string | null
  images?: string[] | null
  created_at: string
  updated_at: string
  offers?: Offer[]
}

export interface ScrapePayload {
  name: string
  brand?: string
  model?: string
  sku?: string
  gtin?: string
  price: number
  old_price?: number
  currency?: string
  image_url?: string
  images?: string[]
  url: string
  availability?: boolean
  store_name?: string
  store_slug?: string
}

export interface TrackedElementLog {
  id: number
  tracked_element_id: number
  old_value: string | null
  new_value: string | null
  has_changed: boolean
  status: 'success' | 'error'
  error_message?: string | null
  checked_at: string
  created_at?: string
  updated_at?: string
}

export interface TrackedElement {
  id: number
  name: string
  url: string
  selector: string
  attribute: string
  current_value: string | null
  status: 'active' | 'paused' | 'error'
  error_message?: string | null
  check_interval_minutes: number
  last_checked_at?: string | null
  created_at: string
  updated_at: string
  logs?: TrackedElementLog[]
}

export interface HtmlPreviewData {
  url: string
  title: string
  html: string
  base_url: string
}

export interface SelectedElementData {
  selector: string
  tagName: string
  text: string
  htmlSnippet: string
  attribute: string
}

