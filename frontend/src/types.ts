export interface ReactorState {
  temperature: number | null;
  humidity: number | null;
  ph: number | null;
  light: number | null;
  turbidity: number | null;
  healthScore: number;
  trend: "improving" | "stable" | "declining";
  anomalyRisk: "low" | "medium" | "high";
  recommendation: string;
  timestamp: number;
  components?: Record<string, number>;
  history?: HistoryPoint[];
}

export interface HistoryPoint {
  temperature: number | null;
  humidity: number | null;
  ph: number | null;
  turbidity: number | null;
  healthScore: number;
  anomalyRisk: string;
  timestamp: number;
}
