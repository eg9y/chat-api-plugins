import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export type ParsedEndpoint = {
  method: string;
  path: string;
  params?: { [key: string]: any };
  data?: { [key: string]: any };
};


export async function makeApiCall(url: string, parsedResponse: ParsedEndpoint): Promise<AxiosResponse | null> {
  if (!parsedResponse) {
    return null;
  }

  const { method, path, params, data } = parsedResponse;

  // Replace the base URL with the actual API base URL
  const apiUrl = `${url}${path}`;

  const axiosConfig: AxiosRequestConfig = {
    method: method,
    url: apiUrl,
  }
  if (params) {
    axiosConfig.params = params;
  }
  if (data) {
    axiosConfig.data = data;
  }
  try {
    const response = await axios(axiosConfig);

    return response;
  } catch (error) {
    console.error('Error making API call:', error);
    return null;
  }
}
