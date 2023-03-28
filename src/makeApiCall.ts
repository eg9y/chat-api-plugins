import axios, { AxiosResponse } from "axios";

export type ParsedEndpoint = {
  method: string;
  path: string;
  params: { [key: string]: any };
};


export async function makeApiCall(url: string, parsedResponse: ParsedEndpoint): Promise<AxiosResponse | null> {
  if (!parsedResponse) {
    return null;
  }

  const { method, path, params } = parsedResponse;

  // Replace the base URL with the actual API base URL
  const apiUrl = `${url}${path}`;

  try {
    const response = await axios({
      method: method,
      url: apiUrl,
      data: params,
    });

    return response;
  } catch (error) {
    console.error('Error making API call:', error);
    return null;
  }
}
