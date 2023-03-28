import axios, { AxiosResponse } from "axios";
import { ParsedResponse } from "./parseTextResponse.js";

export async function makeApiCall(url: string, parsedResponse: ParsedResponse): Promise<AxiosResponse | null> {
  if (!parsedResponse) {
    return null;
  }

  const { httpMethod, route, parameters } = parsedResponse;

  // Replace the base URL with the actual API base URL
  const apiUrl = `${url}${route}`;

  try {
    const response = await axios({
      method: httpMethod,
      url: apiUrl,
      data: parameters,
    });

    return response;
  } catch (error) {
    console.error('Error making API call:', error);
    return null;
  }
}
