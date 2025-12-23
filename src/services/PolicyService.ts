import api from "../config/axios";

interface SpeciesRefundDetail {
  speciesId: string;
  speciesName: string | null;
  priceRefund: number;
}

interface Policy {
  id: string;
  policyName: string;
  description: string;
  applicableServices: string;
  status: string;
  speciesRefundDetail: SpeciesRefundDetail[];
  refundPercentage: number;
  timesBeforeCheckin: number;
  category: string;
  cancelTime: number | null;
  blockedDay: number | null;
}

interface PolicyResponse {
  code: number;
  message: string;
  data: Policy[];
}

export const getPoliciesByServiceType = async (
  serviceType: string = "BOOKING"
): Promise<PolicyResponse> => {
  const response = await api.get(`/api/policy/${serviceType}`);
  return response.data;
};
