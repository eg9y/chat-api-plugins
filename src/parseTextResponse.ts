export type ParsedResponse = {
  httpMethod: string;
  route: string;
  parameters: object;
};

export function parseTextResponse(text: string): ParsedResponse | null {
  // Extract the first line containing the HTTP method and route
  const firstLineMatch = text.match(/(\w+)\s+(\/[\w/]+)/);

  if (!firstLineMatch) {
    return null;
  }

  const httpMethod = firstLineMatch[1];
  const route = firstLineMatch[2];

  // Extract the JSON string containing the parameters
  const jsonStringMatch = text.match(/{[\s\S]*}/);

  if (!jsonStringMatch) {
    return null;
  }

  const jsonString = jsonStringMatch[0];
  const parameters = JSON.parse(jsonString);

  return {
    httpMethod,
    route,
    parameters,
  };
}
