import api from "../config/axios";

// Type definitions for customer data
export interface MembershipHistory {
  // Add properties based on your actual membership history structure
  // This can be expanded when you have the actual structure
}

export interface CustomerProfile {
  email: string;
  phone: string;
  fullName: string;
  address: string;
  citizenId: string;
  rank: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM"; // Assuming these are the possible ranks
  currentPoint: string;
  membershipHistoryList: MembershipHistory[];
}

export interface MembershipDetails {
  discountPercent: number;
  rankName: string;
  currentPoint: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Customer service for handling customer-related API calls
export const customerService = {
  // Get customer profile
  getCustomerProfile: async (): Promise<CustomerProfile> => {
    try {
      const response = await api.get<ApiResponse<CustomerProfile>>("/api/customer");
      
      if (response.data.code === 200) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to get customer profile");
      }
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      throw error;
    }
  },

  // Get customer membership details
  getMembershipDetails: async (): Promise<MembershipDetails> => {
    try {
      const response = await api.get<ApiResponse<MembershipDetails>>("/api/membership");
      
      if (response.data.code === 200) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to get membership details");
      }
    } catch (error) {
      console.error("Error fetching membership details:", error);
      throw error;
    }
  },
};

export default customerService;
