import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";

const baseURL = "http://47.128.223.28:9090";

//
const config = {
  baseURL: baseURL,
  timeout: 3000000,
};
const api = axios.create(config);
api.defaults.baseURL = baseURL;
const handleBefore = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token")?.replaceAll('"', "");
  config.headers["Authorization"] = `Bearer ${token}`;
  return config;
};
const handleError = (error: AxiosError) => {
  console.log(error);
  return Promise.reject(error);
};
api.interceptors.request.use(handleBefore, handleError);
// api.interceptors.response.use(null, handleError);

export default api;
