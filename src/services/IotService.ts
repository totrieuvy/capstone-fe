import api from '../config/axios';

interface TemperatureData {
  iotId?: string;
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

export const getTemperature = async (iotId: string = 'esp32_dht22_01'): Promise<TemperatureData> => {
  const response = await api.get<TemperatureApiResponse>(`/api/temperature?iotId=${iotId}`);
  return {
    iotId: response.data.data.iotId,
    temperature: response.data.data.temperature,
    humidity: response.data.data.humidity
  };
};