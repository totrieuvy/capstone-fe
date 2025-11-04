import api from "../config/axios";

// Medicine type definitions
export interface Medicine {
  id: string;
  medicationName: string;
}

export interface CreateMedicineRequest {
  medicationName: string;
}

export interface UpdateMedicineRequest {
  medicationName: string;
}

export interface MedicineResponse {
  code: number;
  message: string;
  data: Medicine[];
}

export interface CreateMedicineResponse {
  code: number;
  message: string;
  data: Medicine;
}

export interface GetMedicineByIdResponse {
  code: number;
  message: string;
  data: Medicine;
}

export interface UpdateMedicineResponse {
  code: number;
  message: string;
  data: Medicine;
}

class MedicineService {
  /**
   * Get all medicines
   * @returns Promise<MedicineResponse>
   */
  static async getMedicines(): Promise<MedicineResponse> {
    try {
      const response = await api.get<MedicineResponse>("/api/medicine");
      return response.data;
    } catch (error) {
      console.error("Error fetching medicines:", error);
      throw error;
    }
  }

  /**
   * Get medicine by ID
   * @param id - The medicine ID
   * @returns Promise<GetMedicineByIdResponse>
   */
  static async getMedicineById(id: string): Promise<GetMedicineByIdResponse> {
    try {
      const response = await api.get<GetMedicineByIdResponse>(`/api/medicine/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching medicine by ID:", error);
      throw error;
    }
  }

  /**
   * Create a new medicine
   * @param medicineData - The medicine data to create
   * @returns Promise<CreateMedicineResponse>
   */
  static async createMedicine(medicineData: CreateMedicineRequest): Promise<CreateMedicineResponse> {
    try {
      const response = await api.post<CreateMedicineResponse>("/api/medicine", medicineData);
      return response.data;
    } catch (error) {
      console.error("Error creating medicine:", error);
      throw error;
    }
  }

  /**
   * Update medicine by ID
   * @param id - The medicine ID to update
   * @param medicineData - The medicine data to update
   * @returns Promise<UpdateMedicineResponse>
   */
  static async updateMedicine(id: string, medicineData: UpdateMedicineRequest): Promise<UpdateMedicineResponse> {
    try {
      const response = await api.put<UpdateMedicineResponse>(`/api/medicine/${id}`, medicineData);
      return response.data;
    } catch (error) {
      console.error("Error updating medicine:", error);
      throw error;
    }
  }
}

export default MedicineService;
