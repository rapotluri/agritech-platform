import axios from 'axios';
import { createClient } from '@/utils/supabase/client';

// Define a type for the parameters expected by the generateClimateData function
interface ClimateDataParams {
  province: string;
  start_date: string;
  end_date: string;
  data_type: string;
}

// Create the Axios instance with the correct base URL
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",  // Fallback to localhost if environment variable is missing
  headers: { 'Content-Type': 'application/json' },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

// Use the defined types in the function signature instead of `any`
export const generateClimateData = async (params: ClimateDataParams) => {
  // Use the axios instance to send a GET request to the climate-data endpoint
  const response = await axiosInstance.get('/api/climate-data', { params });
  return response.data;  // This should return { filename: "filename.xlsx" }
};

// Keep the downloadFile function as is
export const downloadFile = async (filename: string) => {
  // Construct the download URL correctly
  const fileUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/file?filename=${filename}`;
  return fileUrl;
};

export default axiosInstance;
