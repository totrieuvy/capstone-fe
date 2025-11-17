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