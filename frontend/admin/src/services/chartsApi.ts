// src/services/chartsApi.ts
import api from "../utils/axiosConfig";

export interface WeeklyChartData {
  day: string;
  date: string;
  present: number;
  on_time: number;
  late: number;
}

export interface WeeklyChartResponse {
  status: string;
  code: number;
  message: string;
  meta: {
    week_bounds: {
      monday: string;
      friday: string;
    };
    total_teachers_limit: number;
  };
  data: WeeklyChartData[];
}

export async function fetchWeeklyCharts(): Promise<WeeklyChartResponse> {
  const { data } = await api.get<WeeklyChartResponse>("/charts/weekly");
  return data;
}