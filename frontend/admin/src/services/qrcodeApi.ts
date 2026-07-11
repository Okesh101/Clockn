import api from "../utils/axiosConfig";
import type { ApiResponse } from "../types";

export interface QrLocation {
  id: string;
  qr_string: string;
  location: string;
  latitude: number;
  longitude: number;
  created_at: string | null;
  updated_at: string | null;
}

export async function fetchQrLocations() {
  const { data } = await api.get<ApiResponse<QrLocation[]>>("/qrcode");
  return data.data ?? [];
}

export async function createQrLocation(payload: {
  location: string;
  latitude: number;
  longitude: number;
}) {
  const { data } = await api.post<ApiResponse<QrLocation>>("/qrcode", payload);
  return data.data;
}
