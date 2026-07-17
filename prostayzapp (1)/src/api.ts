import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosRequestConfig } from "axios";

export const BASE = 'https://server.prostayz.com';
// export const BASE = 'http://192.168.1.59:51234';

export const TOKEN_KEY = "auratravel.token";

async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export const axiosInstance = axios.create({
  baseURL: `${BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function api<T = any>(
  path: string,
  opts: {
    method?: AxiosRequestConfig["method"];
    body?: any;
    auth?: boolean;
  } = {}
): Promise<T> {
  try {
    const response = await axiosInstance.request<T>({
      url: path,
      method: opts.method || "GET",
      data: opts.body,
    });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
          : error.response?.data?.message ||
            error.message ||
            "Something went wrong";

      throw new Error(msg);
    }
    throw error;
  }
}

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function loadToken() {
  return getToken()
}
