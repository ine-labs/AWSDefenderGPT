import axios from "axios";
// config
import { HOST_API } from "../config";

// ----------------------------------------------------------------------
const axiosLoginInstance = axios.create({
  baseURL: HOST_API,
});

axiosLoginInstance.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject(
      (error.response && error.response.data) || "Something went wrong"
    )
);

const axiosInstance = axios.create({
  baseURL: HOST_API,
});

axiosInstance.defaults.headers.common.Authorization = localStorage.accessToken;

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject(
      (error.response && error.response.data) || "Something went wrong"
    )
);
export default axiosInstance;
export { axiosLoginInstance };
