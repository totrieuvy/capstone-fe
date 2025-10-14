import api from "../config/axios";
import type { Service } from "./AdditionService";

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

// Type definitions for booking cost calculation
export interface CalculateBookingCostRequest {
  startDate: string; // Format: YYYY-MM-DD
  endDate: string;   // Format: YYYY-MM-DD
  cageTypeId: string;
  hamsterId: string;
  paymentMethod: string;
  serviceIds?: string[]; // IDs from Service interface in AddtionService.ts
  notes?: string;
}

export interface DailyBreakdown {
  date: string;
  cagePrice: number;
  servicesPrice: number;
  holidaySurcharge: number;
  membershipDiscount: number;
  dailyTotal: number;
  isHoliday: boolean;
  holidayName: string | null;
}

export interface HolidayDetail {
  // Add holiday detail properties as needed based on API response
  name: string;
  date: string;
  surchargePercent?: number;
}

export interface CalculateBookingCostResponse {
  totalCageAmount: number;
  totalServicesAmount: number;
  totalHolidaySurcharge: number;
  totalMembershipDiscount: number;
  membershipDiscountPercent: number;
  totalAmount: number;
  dailyBreakdowns: DailyBreakdown[];
  holidayDetails: HolidayDetail[];
}

export interface CreateBookingRequest {
  startDate: string; // Format: YYYY-MM-DD
  endDate: string;   // Format: YYYY-MM-DD
  cageTypeId: string;
  hamsterId: string;
  paymentMethod: string;
  serviceIds?: string[]; // IDs from Service interface in AddtionService.ts
  notes?: string;
}

export interface CreateBookingResponse {
  paymentUrl: string;
}

// Type definitions for booking history
export interface BookingHistoryItem {
  bookingId: string;
  hamsterId: string;
  hamsterName: string;
  cageTypeId: string;
  cageTypeName: string;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string;   // Format: YYYY-MM-DD
  totalAmount: number;
  totalAmountAfter: number;
  status: string;
  notes: string;
  createdAt: string; // ISO string format
  serviceIds?: string[]; // IDs from Service interface in AddtionService.ts
  services?: Service[]; // Full service objects for display purposes
}

export interface BookingHistoryResponse {
  bookingHistory: BookingHistoryItem[];
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
        "/api/cage/check-availability",
        request
      );
      return response.data.data;
    } catch (error) {
      console.error("Error checking cage availability:", error);
      throw error;
    }
  },

  // Calculate booking cost for a specific booking request
  calculateBookingCost: async (request: CalculateBookingCostRequest): Promise<CalculateBookingCostResponse> => {
    try {
      const response = await api.post<ApiResponse<CalculateBookingCostResponse>>(
        "/api/booking/calculate",
        request
      );
      return response.data.data;
    } catch (error) {
      console.error("Error calculating booking cost:", error);
      throw error;
    }
  },

   // Create a new booking for hamster boarding
  createBooking: async (request: CreateBookingRequest): Promise<CreateBookingResponse> => {
    try {
      const response = await api.post<ApiResponse<CreateBookingResponse>>(
        "/api/booking",
        request
      );
      return response.data.data;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  // Get booking history for the current user
  getBookingHistory: async (): Promise<BookingHistoryItem[]> => {
    try {
      const response = await api.get<ApiResponse<BookingHistoryItem[]>>(
        "/api/booking/history"
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching booking history:", error);
      throw error;
    }
  },
};

// Get booking history details by booking ID
export const getBookingHistoryDetails = async (bookingId: string): Promise<BookingHistoryItem> => {
  try {
    const response = await api.get<ApiResponse<BookingHistoryItem>>(
      `/api/booking/${bookingId}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching booking history details:", error);
    throw error;
  }
};

export default boardingService;