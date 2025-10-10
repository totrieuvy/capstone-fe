import api from "../config/axios";

// Type definitions for availability check
export interface CheckAvailabilityRequest {
  cageTypeId: string;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string;   // Format: YYYY-MM-DD
}

export interface DailyAvailability {
  date: string;
  bookedCages: number;
  availableCages: number;
  isAvailable: boolean;
}

export interface CheckAvailabilityResponse {
  dailyAvailability: DailyAvailability[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Boarding service for handling boarding-related API calls
export const boardingService = {
  // Check cage availability for a specific cage type and date range
  checkAvailability: async (request: CheckAvailabilityRequest): Promise<CheckAvailabilityResponse> => {
    try {
      const response = await api.post<ApiResponse<CheckAvailabilityResponse>>(
        "/api/check-availability",
        request
      );
      return response.data.data;
    } catch (error) {
      console.error("Error checking cage availability:", error);
      throw error;
    }
  },
};

export default boardingService;
