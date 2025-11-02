import api from "../config/axios";

export type ServiceType = "FOOD" | "GROOMING" | "MEDICAL";

// Constants for easier reference
export const ServiceType = {
  FOOD: "FOOD" as ServiceType,
  GROOMING: "GROOMING" as ServiceType,
  MEDICAL: "MEDICAL" as ServiceType
};

export interface Service {
  id: string;
  serviceType: ServiceType;
  serviceName: string;
  description: string;
  durationMinutes: number;
  displayPrice: string;
  isActive: boolean;
  isDefault?: boolean | null;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const getServicesByType = async (serviceType: ServiceType): Promise<ApiResponse<Service[]>> => {
  const response = await api.get(`/api/services/type/${serviceType}`);
  return response.data;
};

export const getServicesBySpeciesAndType = async (
  speciesId: string, 
  serviceType: ServiceType = "MEDICAL"
): Promise<ApiResponse<Service[]>> => {
  const response = await api.get(`/api/services/species-service-type`, {
    params: {
      speciesId,
      serviceType
    }
  });
  return response.data;
};