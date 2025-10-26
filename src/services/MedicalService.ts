import api from "../config/axios";

export interface Service {
  id: string;
  serviceType: "MEDICAL" | "FOOD" | "GROOMING";
  serviceName: string;
  description: string;
  durationMinutes: number;
  displayPrice: string;
  isActive: boolean;
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

