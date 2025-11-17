import api from '../config/axios';

export interface TemperatureData {
  iotId: string;
  humidity: number;
  temperature: number;
}

interface TemperatureApiResponse {
  code: number;
  message: string;
  data: {
    iotId: string;
    temperature: number;
    humidity: number;
  };
}

interface AllTemperatureApiResponse {
  code: number;
  message: string;
  data: {
    iotId: string;
    temperature: number;
    humidity: number;
  }[];
}

export const getTemperature = async (iotId: string): Promise<TemperatureData> => {
  const response = await api.get<TemperatureApiResponse>(`/api/temperature?iotId=${iotId}`);
  return {
    iotId: response.data.data.iotId,
    temperature: response.data.data.temperature,
    humidity: response.data.data.humidity
  };
};

export const getAllTemperatures = async (): Promise<TemperatureData[]> => {
  const response = await api.get<AllTemperatureApiResponse>('/api/temperature/all');
  return response.data.data.map(item => ({
    iotId: item.iotId,
    temperature: item.temperature,
    humidity: item.humidity
  }));
};