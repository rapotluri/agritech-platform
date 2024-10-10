import axios from 'axios';

// Create the Axios instance with the correct base URL
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",  // Fallback to localhost if environment variable is missing
  headers: { 'Content-Type': 'application/json' },
});

// Export axiosInstance correctly
export default axiosInstance;

// Add the two custom functions for interacting with the backend
export const generateClimateData = async (params: any) => {
  // Use the axios instance to send a GET request to the climate-data endpoint
  const response = await axiosInstance.get('/api/climate-data', { params });
  return response.data;  // This should return { filename: "filename.xlsx" }
};

export const downloadFile = async (filename: string) => {
  // Construct the download URL from the backend
  const fileUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/download/${filename}`;
  return fileUrl;
};
