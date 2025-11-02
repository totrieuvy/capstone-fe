import api from "../config/axios";

export interface Service {
  id: string;
  serviceType: "MEDICAL" | "FOOD" | "GROOMING";
  serviceName: string;
  description: string;
  durationMinutes: number;
  displayPrice: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface ServicePrice {
  priceId: string;
  speciesId: string;
  speciesName: string;
  price: number;
}

export interface ServiceDetail extends Service {
  createdAt: string;
  updatedAt: string;
  prices: ServicePrice[];
}

export interface ServiceResponse {
  code: number;
  message: string;
  data: Service[];
}

export interface ServiceDetailResponse {
  code: number;
  message: string;
  data: ServiceDetail;
}

export interface DeleteServiceResponse {
  code: number;
  message: string;
  data: {};
}

export interface SpeciesPrice {
  speciesId: string;
  price: number;
}

export interface CreateServiceRequest {
  serviceType: "MEDICAL" | "FOOD" | "GROOMING";
  serviceName: string;
  description: string;
  durationMinutes: number;
  prices: SpeciesPrice[];
}

export interface CreateServiceResponse {
  code: number;
  message: string;
}

// Interfaces for booking-related functions
export interface Species {
  id: string;
  speciesName: string;
}

export interface MedicalPriceItem {
  id: string;
  displayPrice: string;
}

export interface Staff {
  id: string;
  name: string;
  sex: string;
  isBooked: boolean;
  experienceYears: number;
  specialization: string;
  bestServices: string[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  maxSlots: number;
  availableSlot: number;
  staffs: Staff[];
}

export interface SlotData {
  slotDate: string;
  slots: TimeSlot[];
}

export interface Membership {
  discountPercent: number;
  rankName: string;
  currentPoint: number;
}

export interface AppointmentItem {
  serviceId: string;
  price: number;
}

export interface CreateAppointmentRequest {
  hamsterId: string;
  veterinarianId: string;
  appointmentDate: string;
  notes: string;
  totalAmount: number;
  totalAmountAfter: number;
  discountPercent: number;
  slotStart: string;
  slotEnd: string;
  serviceType: "MEDICAL";
  items: AppointmentItem[];
}

export interface CreateAppointmentResponse {
  code: number;
  message: string;
}

// Interfaces for fetching appointments
export interface AppointmentFilters {
  date?: string;
  serviceType?: "MEDICAL" | "GROOMING" | "FOOD";
  status?: string;
  veterinarianId?: string;
  staffId?: string;
  customerId?: string;
  hamsterName?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  hamsterId: string;
  hamsterName: string;
  appointmentTime: string;
  veterinarianName: string;
  serviceType: "MEDICAL" | "GROOMING" | "FOOD";
  status: string;
  slotStart: string;
  slotEnd: string;
}

export interface AppointmentListData {
  content: Appointment[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AppointmentListResponse {
  code: number;
  message: string;
  data: AppointmentListData;
}

export const getServicesByType = async (serviceType: "MEDICAL" | "FOOD" | "GROOMING" = "MEDICAL"): Promise<ServiceResponse> => {
  try {
    const response = await api.get<ServiceResponse>(`/api/services/type/${serviceType}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching services by type:", error);
    throw error;
  }
};

export const getMedicalServices = async (): Promise<ServiceResponse> => {
  return getServicesByType("MEDICAL");
};

export const getGroomingServices = async (): Promise<ServiceResponse> => {
  return getServicesByType("GROOMING");
};

export const getFoodServices = async (): Promise<ServiceResponse> => {
  return getServicesByType("FOOD");
};

export const getServiceById = async (serviceId: string): Promise<ServiceDetailResponse> => {
  try {
    const response = await api.get<ServiceDetailResponse>(`/api/services/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching service by ID:", error);
    throw error;
  }
};

export const createService = async (serviceData: CreateServiceRequest): Promise<CreateServiceResponse> => {
  try {
    const response = await api.post<CreateServiceResponse>("/api/services/grooming-medical", serviceData);
    return response.data;
  } catch (error) {
    console.error("Error creating service:", error);
    throw error;
  }
};

export interface UpdateServiceRequest {
  serviceName: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
  prices: ServicePrice[];
}

export interface UpdateServiceResponse {
  code: number;
  message: string;
}

export const updateService = async (serviceId: string, serviceData: UpdateServiceRequest): Promise<UpdateServiceResponse> => {
  try {
    const response = await api.put<UpdateServiceResponse>(`/api/services/grooming-medical/${serviceId}`, serviceData);
    return response.data;
  } catch (error) {
    console.error("Error updating service:", error);
    throw error;
  }
};

export const deleteService = async (serviceId: string): Promise<DeleteServiceResponse> => {
  try {
    const response = await api.delete<DeleteServiceResponse>(`/api/services/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
};

// Additional API functions for booking medical services

export const getSpecies = async (): Promise<{ code: number; data: Species[] }> => {
  try {
    const response = await api.get<{ code: number; data: Species[] }>("/api/species");
    return response.data;
  } catch (error) {
    console.error("Error fetching species:", error);
    throw error;
  }
};

export const getMembership = async (): Promise<{ code: number; data: Membership }> => {
  try {
    const response = await api.get<{ code: number; data: Membership }>("/api/membership");
    return response.data;
  } catch (error) {
    console.error("Error fetching membership:", error);
    throw error;
  }
};

export const getMedicalServicePriceBySpecies = async (speciesId: string): Promise<{ code: number; data: MedicalPriceItem[] }> => {
  try {
    const response = await api.get<{ code: number; data: MedicalPriceItem[] }>(`/api/services/species/${speciesId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching medical service prices by species:", error);
    throw error;
  }
};

export const getSlots = async (fromDate: string, toDate: string): Promise<{ code: number; data: SlotData[] }> => {
  try {
    const response = await api.get<{ code: number; data: SlotData[] }>("/api/slot", {
      params: { 
        from: fromDate, 
        to: toDate, 
        serviceType: "MEDICAL" 
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching slots:", error);
    throw error;
  }
};

export const getSlotsByPersonId = async (
  personId: string, 
  fromDate: string, 
  toDate: string, 
  serviceType: "MEDICAL" | "GROOMING" | "FOOD" = "MEDICAL"
): Promise<{ code: number; message: string; data: SlotData[] }> => {
  try {
    const response = await api.get<{ code: number; message: string; data: SlotData[] }>(`/api/slot/${personId}`, {
      params: { 
        from: fromDate, 
        to: toDate, 
        serviceType 
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching slots by person ID:", error);
    throw error;
  }
};

export const createAppointment = async (appointmentData: CreateAppointmentRequest): Promise<CreateAppointmentResponse> => {
  try {
    const response = await api.post<CreateAppointmentResponse>("/api/appointment", appointmentData);
    return response.data;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

export const getAppointments = async (filters: AppointmentFilters = {}): Promise<AppointmentListResponse> => {
  try {
    // Set default values
    const params = {
      //i want date to be today by default if not provided
      date: filters.date || new Date().toISOString().split("T")[0],
      serviceType: "MEDICAL",
      sortDir: "asc",
      page: 0,
      size: 10,
      ...filters, // Override defaults with provided filters
    };

    // Remove undefined values to avoid sending them as query parameters
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    );

    const response = await api.get<AppointmentListResponse>("/api/appointment", {
      params: cleanParams,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
};

export const getMedicalAppointmentHistory = async (filters: Omit<AppointmentFilters, 'date'> = {}): Promise<AppointmentListResponse> => {
  try {
    // Set default values but without date filter to get all history
    const params = {
      serviceType: "MEDICAL",
      sortDir: "desc", // Most recent first for history
      page: 0,
      size: 50, // Get more records for history view
      ...filters, // Override defaults with provided filters
    };

    // Remove undefined values to avoid sending them as query parameters
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    );

    const response = await api.get<AppointmentListResponse>("/api/appointment", {
      params: cleanParams,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching medical appointment history:", error);
    throw error;
  }
};

// Interfaces for appointment details
export interface Veterinarian {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE";
  experienceYears: number;
  specialization: string;
  bestServices: string[];
}

export interface MedicalRecord {
  id: string;
  appointmentItemId: string;
  diagnosis: string;
  symptom: string;
  linkResult: string;
  healthStatus: string;
}

export interface Prescription {
  id: string;
  // Add other prescription fields as needed when structure is available
}

export interface AppointmentItemDetail {
  id: string;
  appointmentId: string;
  serviceId: string;
  serviceComboId: string | null;
  medicalRecordId: string | null;
  price: number;
  serviceName: string;
  serviceComboName: string | null;
  comboServices: any[] | null;
  medicalRecord: MedicalRecord | null;
}

export interface AppointmentDetail {
  id: string;
  customerId: string;
  customerName: string;
  hamsterId: string;
  hamsterName: string;
  speciesId: string;
  appointmentTime: string;
  serviceType: "MEDICAL" | "GROOMING" | "FOOD";
  status: string;
  totalAmount: number;
  totalAmountAfter: number;
  additionalAmount: number | null;
  notes: string;
  checkInImage: string | null;
  checkoutImage: string | null;
  slotStart: string;
  slotEnd: string;
  createdAt: string;
  paymentMethod: string;
  transactionTime: string;
  staff: any | null;
  veterinarian: Veterinarian | null;
  prescription: Prescription | null;
  items: AppointmentItemDetail[];
}

export interface AppointmentDetailResponse {
  code: number;
  message: string;
  data: AppointmentDetail;
}

export const getAppointmentById = async (appointmentId: string): Promise<AppointmentDetailResponse> => {
  try {
    const response = await api.get<AppointmentDetailResponse>(`/api/appointment/${appointmentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching appointment by ID:", error);
    throw error;
  }
};

// Interfaces for check-in appointment
export interface CheckInAppointmentRequest {
  appointmentId: string;
  checkInImage: string;
  veterinarianId: string;
  staffId?: string | null;
}

export interface CheckInAppointmentResponse {
  code: number;
  message: string;
}

// Interfaces for cancel appointment
export interface CancelAppointmentResponse {
  code: number;
  message: string;
}

// Interfaces for update appointment status
export interface UpdateAppointmentStatusRequest {
  status: string;
}

export interface UpdateAppointmentStatusResponse {
  code: number;
  message: string;
}

// Type definitions for file upload
export interface FileUploadRequest {
  file: File;
}

export interface FileUploadResponse {
  url: string;
}

export const checkInAppointment = async (checkInData: CheckInAppointmentRequest): Promise<CheckInAppointmentResponse> => {
  try {
    // Set staffId to null by default if not provided
    const requestData = {
      ...checkInData,
      staffId: checkInData.staffId || null,
    };

    const response = await api.post<CheckInAppointmentResponse>("/api/appointment/check-in", requestData);
    return response.data;
  } catch (error) {
    console.error("Error checking in appointment:", error);
    throw error;
  }
};

// Cancel an appointment by ID
export const cancelAppointment = async (appointmentId: string): Promise<CancelAppointmentResponse> => {
  try {
    const response = await api.delete<CancelAppointmentResponse>(`/api/appointment/${appointmentId}`);
    return response.data;
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    throw error;
  }
};

// Update appointment status
export const updateAppointmentStatus = async (
  appointmentId: string, 
  status: string
): Promise<UpdateAppointmentStatusResponse> => {
  try {
    const requestData: UpdateAppointmentStatusRequest = { status };
    const response = await api.patch<UpdateAppointmentStatusResponse>(
      `/api/appointment/${appointmentId}`, 
      requestData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
};

// Upload a file and get the URL
export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<{ code: number; message: string; data: FileUploadResponse }>(
      "/api/file/upload",
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Interfaces for medical record
export interface CreateMedicalRecordRequest {
  appointmentItemId: string;
  hamsterId: string;
  diagnosis: string;
  symptom: string;
  linkResult: string;
  healthStatus: string;
}

export interface CreateMedicalRecordResponse {
  code: number;
  message: string;
}

// Create a medical record for a hamster
export const createMedicalRecord = async (medicalRecordData: CreateMedicalRecordRequest): Promise<CreateMedicalRecordResponse> => {
  try {
    const response = await api.post<CreateMedicalRecordResponse>("/api/medical-record", medicalRecordData);
    return response.data;
  } catch (error) {
    console.error("Error creating medical record:", error);
    throw error;
  }
};

// Interfaces for check-out appointment
export interface CheckOutAppointmentRequest {
  appointmentId: string;
  checkOutImage: string;
  paymentMethod?: string;
  additionalAmount: number;
}

export interface CheckOutAppointmentData {
  paymentUrl: string;
}

export interface CheckOutAppointmentResponse {
  code: number;
  message: string;
  data: CheckOutAppointmentData;
}

// Check out an appointment
export const checkOutAppointment = async (checkOutData: CheckOutAppointmentRequest): Promise<CheckOutAppointmentResponse> => {
  try {
    // Set paymentMethod to VNPAY by default if not provided
    const requestData = {
      ...checkOutData,
      paymentMethod: checkOutData.paymentMethod || "VNPAY",
    };

    const response = await api.post<CheckOutAppointmentResponse>("/api/appointment/check-out", requestData);
    return response.data;
  } catch (error) {
    console.error("Error checking out appointment:", error);
    throw error;
  }
};

// Interfaces for adding services to appointment
export interface AddServiceItem {
  serviceId: string;
  price: number;
}

export interface AddServiceToAppointmentRequest {
  appointmentId: string;
  additionalAmount: number;
  items: AddServiceItem[];
}

export interface AddServiceToAppointmentResponse {
  code: number;
  message: string;
}

// Add services to an existing appointment
export const addServiceToAppointment = async (serviceData: AddServiceToAppointmentRequest): Promise<AddServiceToAppointmentResponse> => {
  try {
    const response = await api.post<AddServiceToAppointmentResponse>("/api/appointment/add-service", serviceData);
    return response.data;
  } catch (error) {
    console.error("Error adding service to appointment:", error);
    throw error;
  }
};

