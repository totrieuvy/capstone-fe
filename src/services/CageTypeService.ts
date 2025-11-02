import api from "../config/axios";

// Type definitions based on the schema
export interface CreateCageTypeReq {
  typeName: string;
  description: string;
  sizeDimensions: string;
  price: number;
  material: string;
  isActive?: boolean;
  imageUrl: string;
  iotDeviceId: string;
  section: string;
}

export interface CageTypeResponse {
  id: string;
  typeName: string;
  description: string;
  sizeDimensions: string;
  price: number;
  material: string;
  isActive: boolean;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

// API service for cage types
export const cageTypeService = {
  // Create a new cage type
  createCageType: async (data: CreateCageTypeReq): Promise<CageTypeResponse> => {
    try {
      const response = await api.post("/api/cage-types/create", data);
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error creating cage type:", error);
      throw error;
    }
  },

  // Get all cage types
  getCageTypes: async (): Promise<CageTypeResponse[]> => {
    try {
      const response = await api.get("/api/cage-types");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching cage types:", error);
      throw error;
    }
  },

  // Get cage type by ID
  getCageTypeById: async (id: string): Promise<CageTypeResponse> => {
    try {
      const response = await api.get(`/api/cage-types/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error fetching cage type:", error);
      throw error;
    }
  },

  // Update cage type
  updateCageType: async (id: string, data: Partial<CreateCageTypeReq>): Promise<CageTypeResponse> => {
    try {
      const response = await api.put(`/api/cage-types/${id}`, data);
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error updating cage type:", error);
      throw error;
    }
  },

  // Delete cage type
  deleteCageType: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/cage-types/${id}`);
    } catch (error) {
      console.error("Error deleting cage type:", error);
      throw error;
    }
  },
};

export default cageTypeService;
