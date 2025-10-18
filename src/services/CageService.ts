import api from "../config/axios";

// Type definitions for cage data
export interface Cage {
  cageId: string;
  cageName: string;
  status: "Available" | "In Use";
}

export interface GetCagesByTypeAndDateRequest {
  cageTypeId: string;
  date: string; // Format: YYYY-MM-DD
}

export interface GetCagesByTypeAndDateResponse {
  cages: Cage[];
  message: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Cage service for handling cage-related API calls
export const cageService = {
  // Get cages by cage type ID and date
  getCagesByTypeAndDate: async (request: GetCagesByTypeAndDateRequest): Promise<GetCagesByTypeAndDateResponse> => {
    try {
      const response = await api.get<ApiResponse<Cage[]>>(
        `/api/cage/${request.cageTypeId}`,
        {
          params: {
            date: request.date
          }
        }
      );
      
      return {
        cages: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error("Error fetching cages by type and date:", error);
      throw error;
    }
  },
};

export default cageService;
