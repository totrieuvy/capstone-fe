import api from "../config/axios";

// Type definitions for staff accounts
export interface StaffAccount {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  staffType?: "STAFF" | "VET";
  specialization?: string;
  experienceYears?: number;
  licenseNumber?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface StaffAccountsData {
  content: StaffAccount[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface StaffAccountsResponse {
  code: number;
  message: string;
  data: StaffAccountsData;
}

export interface StaffAccountsFilters {
  page?: number;
  size?: number;
}

// Type definitions for creating staff accounts
export interface CreateStaffAccountRequest {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  staffType: "STAFF" | "VET";
  specialization?: string;
  experienceYears?: number;
}

export interface CreateStaffAccountResponse {
  code: number;
  message: string;
}

// Type definitions for getting staff detail
export interface StaffDetailResponse {
  code: number;
  message: string;
  data: StaffAccount;
}

// Type definitions for updating staff accounts
export interface UpdateStaffAccountRequest {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  specialization?: string;
  experienceYears?: number;
  licenseNumber?: string;
}

export interface UpdateStaffAccountResponse {
  code: number;
  message: string;
}

// Type definitions for toggling staff status
export interface ToggleStaffStatusResponse {
  code: number;
  message: string;
}

/**
 * Get all staff accounts with pagination
 * @param filters - Pagination and filtering options
 * @returns Promise<StaffAccountsResponse>
 */
export const getStaffAccounts = async (
  filters: StaffAccountsFilters = {}
): Promise<StaffAccountsResponse> => {
  const {
    page = 0,
    size = 10,
    ...otherFilters
  } = filters;

  const params = {
    page,
    size,
    ...otherFilters
  };

  try {
    const response = await api.get("/api/admin-account", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching staff accounts:", error);
    throw error;
  }
};

/**
 * Create a new staff or veterinarian account
 * @param accountData - Account creation data
 * @returns Promise<CreateStaffAccountResponse>
 */
export const createStaffAccount = async (
  accountData: CreateStaffAccountRequest
): Promise<CreateStaffAccountResponse> => {
  try {
    const response = await api.post("/api/admin-account", accountData);
    return response.data;
  } catch (error) {
    console.error("Error creating staff account:", error);
    throw error;
  }
};

/**
 * Get staff account detail by ID
 * @param staffId - The ID of the staff account to retrieve
 * @returns Promise<StaffDetailResponse>
 */
export const getStaffDetail = async (
  staffId: string
): Promise<StaffDetailResponse> => {
  try {
    const response = await api.get(`/api/admin-account/${staffId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching staff detail:", error);
    throw error;
  }
};

/**
 * Update staff account by ID
 * @param staffId - The ID of the staff account to update
 * @param accountData - Updated account data
 * @returns Promise<UpdateStaffAccountResponse>
 */
export const updateStaffAccount = async (
  staffId: string,
  accountData: UpdateStaffAccountRequest
): Promise<UpdateStaffAccountResponse> => {
  try {
    const response = await api.patch(`/api/admin-account/${staffId}`, accountData);
    return response.data;
  } catch (error) {
    console.error("Error updating staff account:", error);
    throw error;
  }
};

/**
 * Toggle staff account status (ACTIVE/INACTIVE)
 * @param staffId - The ID of the staff account to toggle status
 * @returns Promise<ToggleStaffStatusResponse>
 */
export const toggleStaffStatus = async (
  staffId: string
): Promise<ToggleStaffStatusResponse> => {
  try {
    const response = await api.patch(`/api/admin-account/${staffId}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error("Error toggling staff status:", error);
    throw error;
  }
};

export default {
  getStaffAccounts,
  createStaffAccount,
  getStaffDetail,
  updateStaffAccount,
  toggleStaffStatus,
};
