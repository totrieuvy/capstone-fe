import api from '../config/axios';

interface TemperatureData {
  humidity: number;
  temperature: number;
}

export const getTemperature = async (): Promise<TemperatureData> => {
  const response = await api.get<TemperatureData>('/api/temperature');
  return response.data;
};