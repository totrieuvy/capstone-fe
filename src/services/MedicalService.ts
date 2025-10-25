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
  displayPrice: number;
  speciesPrices: SpeciesPrice[];
}

export interface CreateServiceResponse {
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
    const response = await api.post<CreateServiceResponse>("/api/service/grooming-medical", serviceData);
    return response.data;
  } catch (error) {
    console.error("Error creating service:", error);
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

