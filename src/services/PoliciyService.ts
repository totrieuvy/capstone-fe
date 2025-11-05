import api from "../config/axios";

interface Policy {
  id: string;
  policyName: string;
  description: string;
  applicableServices: string;
  status: string;
}

export const fetchPolicies = async (): Promise<Policy[]> => {
  try {
    const res = await api.get<{ code: number; data: Policy[] }>("/api/policy");
    if (res.data.code === 200) {
      return res.data.data;
    } else {
      throw new Error("Không thể tải danh sách chính sách!");
    }
  } catch (error) {
    throw new Error("Lỗi khi tải chính sách!");
  }
};

export const fetchMedicalPolicies = async (): Promise<Policy[]> => {
  try {
    const res = await api.get<{ code: number; data: Policy[] }>("/api/policy");
    if (res.data.code === 200) {
      const medicalPolicies = res.data.data.filter(
        (p) => p.applicableServices === "MEDICAL" && p.status === "ACTIVE"
      );
      return medicalPolicies;
    } else {
      throw new Error("Không thể tải danh sách chính sách!");
    }
  } catch (error) {
    throw new Error("Lỗi khi tải chính sách!");
  }
};

export const fetchBookingPolicies = async (): Promise<Policy[]> => {
  try {
    const res = await api.get<{ code: number; data: Policy[] }>("/api/policy");
    if (res.data.code === 200) {
      const bookingPolicies = res.data.data.filter(
        (p) => p.applicableServices === "BOOKING" && p.status === "ACTIVE"
      );
      return bookingPolicies;
    } else {
      throw new Error("Không thể tải danh sách chính sách!");
    }
  } catch (error) {
    throw new Error("Lỗi khi tải chính sách!");
  }
};

export type { Policy };
