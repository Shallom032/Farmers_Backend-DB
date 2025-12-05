export interface Logistics {
  logistics_id?: number;
  delivery_agent_id: number;
  pickup_location?: string;
  dropoff_location?: string;
  delivery_status?: string;
  delivery_date?: string;
  user_id: number;
}
