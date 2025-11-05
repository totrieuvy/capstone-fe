import api from "../config/axios";
import type { Service } from "./AdditionService";

// Type definitions for availability check
export interface CheckAvailabilityRequest {
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
}

export interface DailyAvailability {
  date: string;
  bookedCages: number;
  availableCages: number;
  isAvailable: boolean;
}

export interface CageTypeAvailability {
  cageTypeId: string;
  typeName: string;
  dailyAvailability: DailyAvailability[];
}

export interface CheckAvailabilityResponse {
  data: CageTypeAvailability[];
}

// Type definitions for booking cost calculation
export interface CalculateBookingCostRequest {
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
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
  endDate: string; // Format: YYYY-MM-DD
  cageTypeId: string;
  hamsterId: string;
  paymentMethod: string;
  serviceIds?: string[]; // IDs from Service interface in AddtionService.ts
  notes?: string;
  isConfirmed: boolean;
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
  endDate: string; // Format: YYYY-MM-DD
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

// Type definitions for bookings by date range
export interface GetBookingsByDateRangeRequest {
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
}

export interface BookingByDateRange {
  bookingId: string;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  newEndDate: string | null; // Format: YYYY-MM-DD or null
  status: string;
  cageTypeId: string;
  cageTypeName: string;
  cageName: string;
  customerName: string;
  hamsterName: string;
}

export interface GetBookingsByDateRangeResponse {
  bookings: BookingByDateRange[];
}

// Type definitions for booking details
export interface BookingDetailService {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  price: number;
}

export interface BookingDetail {
  bookingId: string;
  hamsterId: string;
  hamsterName: string;
  hamsterProfilePicture: string;
  species: string;
  dob: string; // Format: YYYY-MM-DD
  hamsterWeight: number;
  customerName: string;
  phoneNumber: string;
  customerMail: string;
  cageTypeId: string;
  cageName: string;
  cageTypeName: string;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  newEndDate: string | null; // Format: YYYY-MM-DD or null
  checkInImage: string;
  totalAmount: number;
  totalAmountAfter: number;
  status: string;
  notes: string;
  createdAt: string; // ISO string format
  services: BookingDetailService[];
  cameraId: string;
}

// Type definitions for file upload
export interface FileUploadRequest {
  file: File;
}

export interface FileUploadResponse {
  url: string;
}

// Type definitions for booking check-in with cage assignment
export interface BookingCheckInRequest {
  bookingId: string;
  checkInImage: string;
  cageId: string;
}

export interface DayAssignment {
  bookingDetailId: string;
  date: string; // Format: YYYY-MM-DD
  assigned: boolean;
  assignmentMessage: string;
}

export interface BookingCheckInResponse {
  bookingId: string;
  actualCheckInDate: string; // Format: YYYY-MM-DD
  checkOutDate: string; // Format: YYYY-MM-DD
  status: string;
  checkInImageUrl: string;
  cageId: string;
  totalDaysAssigned: number;
  totalDays: number;
  dayAssignments: DayAssignment[];
  message: string;
}

// Type definitions for booking extension
export interface ExtendBookingRequest {
  bookingId: string;
  newEndDate: string; // Format: YYYY-MM-DD
  serviceIds?: string[]; // Optional service IDs for the extended period
}

export interface ExtendedDayDetail {
  bookingDetailId: string;
  date: string; // Format: YYYY-MM-DD
  cagePrice: number;
  servicesPrice: number;
  holidaySurcharge: number;
  membershipDiscount: number;
  dailyTotal: number;
}

export interface ExtendBookingResponse {
  bookingId: string;
  originalEndDate: string; // Format: YYYY-MM-DD
  newEndDate: string; // Format: YYYY-MM-DD
  extendedDays: number;
  extensionAmount: number;
  membershipDiscount: number;
  totalAmountAfter: number;
  paymentStatus: string;
  extendedDayDetails: ExtendedDayDetail[];
  message: string;
}

// Type definitions for adding services to existing booking
export interface AddServiceToBookingRequest {
  bookingId: string;
  serviceDate: string; // Format: YYYY-MM-DD
  serviceIds: string[];
}

export interface ServiceAdded {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  price: number;
}

export interface AddServiceToBookingResponse {
  bookingId: string;
  bookingDetailId: string;
  serviceDate: string;
  servicesAdded: ServiceAdded[];
  additionalAmount: number;
  membershipDiscount: number;
  totalAdditionalAmount: number;
  newTotalAmountAfter: number;
  message: string;
}

// Type definitions for care logs
export interface CreateCareLogRequest {
  bookingId: string;
  report: string;
  photoUrl: string;
}

export interface CreateCareLogResponse {
  logId: string;
  bookingId: string;
  bookingDetailId: string;
  logDate: string; // Format: YYYY-MM-DD
  logTime: string; // Format: HH:mm:ss.nnnnnnnnn
  report: string;
  photoUrl: string;
  staffName: string;
  message: string;
}

export interface CareLogItem {
  logId: string;
  bookingDetailId: string;
  logDate: string; // Format: YYYY-MM-DD
  logTime: string; // Format: HH:mm:ss.nnn
  report: string;
  photoUrl: string;
  staffName: string;
  hamsterName: string;
  cageName: string;
}

// Type definitions for booking check-out
export interface BookingCheckOutRequest {
  bookingId: string;
  checkOutImage: string;
  paymentMethod: string; // Default: "VNPAY"
}

export interface BookingCheckOutResponse {
  bookingId: string;
  actualCheckOutDate: string; // Format: YYYY-MM-DD
  status: string;
  checkOutImageUrl: string;
  totalAmount: number;
  totalAmountAfter: number;
  additionalPayment: number;
  requiresPayment: boolean;
  paymentUrl?: string;
  transactionId?: string;
  paymentMethod: string;
  message: string;
}

// Type definitions for booking cancellation
export interface CancelBookingResponse {
  message: string;
  isRefunded: boolean;
  refundAmount: number;
  refundPercentage: number;
  daysBeforeCheckIn: number;
}

// Type definitions for cage floor plan
export interface CageFloorPlanItem {
  cageId: string;
  cageName: string;
  status: string;
  iotCode: string | null;
  cageTypeId: string;
  cageTypeName: string;
  bookingId: string | null;
  customerId: string | null;
  customerName: string | null;
  hamsterId: string | null;
  hamsterName: string | null;
  startDate: string | null; // Format: YYYY-MM-DD
  endDate: string | null; // Format: YYYY-MM-DD
  newEndDate: string | null; // Format: YYYY-MM-DD
  bookingStatus: string | null;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Boarding service for handling boarding-related API calls
export const boardingService = {
  // Check cage availability for a specific date range (returns all cage types)
  checkAvailability: async (request: CheckAvailabilityRequest): Promise<CageTypeAvailability[]> => {
    try {
      const response = await api.post<ApiResponse<CageTypeAvailability[]>>("/api/cage/check-availability", request);
      return response.data.data;
    } catch (error) {
      console.error("Error checking cage availability:", error);
      throw error;
    }
  },

  // Calculate booking cost for a specific booking request
  calculateBookingCost: async (request: CalculateBookingCostRequest): Promise<CalculateBookingCostResponse> => {
    try {
      const response = await api.post<ApiResponse<CalculateBookingCostResponse>>("/api/booking/calculate", request);
      return response.data.data;
    } catch (error) {
      console.error("Error calculating booking cost:", error);
      throw error;
    }
  },

  // Create a new booking for hamster boarding
  createBooking: async (request: CreateBookingRequest): Promise<CreateBookingResponse> => {
    try {
      const response = await api.post<ApiResponse<CreateBookingResponse>>("/api/booking", request);
      return response.data.data;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  // Get booking history for the current user
  getBookingHistory: async (): Promise<BookingHistoryItem[]> => {
    try {
      const response = await api.get<ApiResponse<BookingHistoryItem[]>>("/api/booking/history");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching booking history:", error);
      throw error;
    }
  },

  // Get bookings by date range
  getBookingsByDateRange: async (request: GetBookingsByDateRangeRequest): Promise<BookingByDateRange[]> => {
    try {
      const response = await api.get<ApiResponse<BookingByDateRange[]>>("/api/booking/date-range", {
        params: {
          startDate: request.startDate,
          endDate: request.endDate,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching bookings by date range:", error);
      throw error;
    }
  },

  // Get booking details by booking ID
  getBookingDetails: async (bookingId: string): Promise<BookingDetail> => {
    try {
      const response = await api.get<ApiResponse<BookingDetail>>(`/api/booking/${bookingId}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching booking details:", error);
      throw error;
    }
  },

  // Upload a file and get the URL
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<ApiResponse<FileUploadResponse>>("/api/file/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  },

  // Check in a booking with image and assign cage
  checkInBooking: async (request: BookingCheckInRequest): Promise<BookingCheckInResponse> => {
    try {
      const response = await api.post<ApiResponse<BookingCheckInResponse>>("/api/booking/check-in", request);
      return response.data.data;
    } catch (error) {
      console.error("Error checking in booking and assigning cage:", error);
      throw error;
    }
  },

  // Extend a booking with new end date and optional services
  extendBooking: async (request: ExtendBookingRequest): Promise<ExtendBookingResponse> => {
    try {
      const response = await api.post<ApiResponse<ExtendBookingResponse>>("/api/booking/extend", request);
      return response.data.data;
    } catch (error) {
      console.error("Error extending booking:", error);
      throw error;
    }
  },

  // Add services to an existing booking for a specific date
  addServiceToBooking: async (request: AddServiceToBookingRequest): Promise<AddServiceToBookingResponse> => {
    try {
      const response = await api.post<ApiResponse<AddServiceToBookingResponse>>("/api/booking/add-service", request);
      return response.data.data;
    } catch (error) {
      console.error("Error adding services to booking:", error);
      throw error;
    }
  },

  // Create a care log for a booking
  createCareLog: async (request: CreateCareLogRequest): Promise<CreateCareLogResponse> => {
    try {
      const response = await api.post<ApiResponse<CreateCareLogResponse>>("/api/care-logs", request);
      return response.data.data;
    } catch (error) {
      console.error("Error creating care log:", error);
      throw error;
    }
  },

  // Get care logs for a specific booking
  getCareLogsByBookingId: async (bookingId: string): Promise<CareLogItem[]> => {
    try {
      const response = await api.get<ApiResponse<CareLogItem[]>>(`/api/care-logs/booking/${bookingId}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching care logs:", error);
      throw error;
    }
  },

  // Check out a booking with image and process payment if additional charges exist
  checkOutBooking: async (request: BookingCheckOutRequest): Promise<BookingCheckOutResponse> => {
    try {
      const response = await api.post<ApiResponse<BookingCheckOutResponse>>("/api/booking/check-out", request);
      return response.data.data;
    } catch (error) {
      console.error("Error checking out booking:", error);
      throw error;
    }
  },

  // Cancel a booking - refund depends on timing before check-in
  cancelBooking: async (bookingId: string): Promise<CancelBookingResponse> => {
    try {
      const response = await api.patch<ApiResponse<CancelBookingResponse>>(`/api/booking/${bookingId}/cancel`);
      return response.data.data;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  },

  // Get cage floor plan - shows all cages with their status, IoT codes, and current bookings
  getCageFloorPlan: async (): Promise<CageFloorPlanItem[]> => {
    try {
      const response = await api.get<ApiResponse<CageFloorPlanItem[]>>("/api/cage/floor-plan");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching cage floor plan:", error);
      throw error;
    }
  },
};

// Get booking details by booking ID (legacy function - consider using boardingService.getBookingDetails instead)
export const getBookingHistoryDetails = async (bookingId: string): Promise<BookingDetail> => {
  try {
    const response = await api.get<ApiResponse<BookingDetail>>(`/api/booking/${bookingId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching booking details:", error);
    throw error;
  }
};

export default boardingService;
