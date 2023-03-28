import axios, { AxiosResponse } from 'axios';
import yaml from 'js-yaml';
import { Configuration, OpenAIApi } from 'openai';
import * as dotenv from 'dotenv';
import {OpenAPIV3 } from "openapi-types";
import { generateApiDescriptions } from './generateApiDescriptions.js';

dotenv.config();

const pluginUrl = 'https://api.speak.com'; // Replace with the actual plugin URL

// Types for fetched data
interface PluginData {
    schema_version: string;
    name_for_human: string;
    name_for_model: string;
    description_for_human: string;
    description_for_model: string;
    auth: {
      type: string;
    };
    api: {
      type: string;
      url: string;
      is_user_authenticated: boolean;
    };
    logo_url: string;
    contact_email: string;
    legal_info_url: string;
}

type ParsedResponse = {
  httpMethod: string;
  route: string;
  parameters: object;
};

function parseTextResponse(text: string): ParsedResponse | null {
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

async function makeApiCall(url: string, parsedResponse: ParsedResponse): Promise<AxiosResponse | null> {
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

async function fetchPluginData(pluginUrl: string): Promise<{ pluginData: PluginData; openApiData: OpenAPIV3.Document } | null> {
  try {
    const pluginResponse = await axios.get(`${pluginUrl}/.well-known/ai-plugin.json`);
    const pluginData: PluginData = pluginResponse.data;

    const openApiResponse = await axios.get(pluginData.api.url);
    const openApiData: OpenAPIV3.Document = yaml.load(openApiResponse.data) as OpenAPIV3.Document;

    return { pluginData, openApiData };
  } catch (error) {
    console.error('Error fetching plugin data:', error);
    return null;
  }
}

async function chatWithPlugin(pluginUrl: string, message: string): Promise<void> {
  const fetchedData = await fetchPluginData(pluginUrl);

  if (fetchedData === null) {
    console.error('Failed to fetch plugin data.');
    return;
  }

  const { pluginData, openApiData } = fetchedData;

  const config = new Configuration({
    apiKey: process.env.OPEN_API_KEY,
  });
  const openai = new OpenAIApi(config);

  const details = generateApiDescriptions(openApiData)
  const messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[] = [
    { role: 'system', content: `You are now using the '${pluginData.name_for_model}' plugin.
    ${pluginData.description_for_model}\n` },
    { role: 'system', content: `When user message starts with 'Response=', it is the response from the Api call, and as such, provide the response to the user as instructed above.
    Else, choose the most appropriate API call below, and respond the corresponding API route:
    ${details}
    ` },
  ];

  messages.push(
    { role: 'user', content: message },
  )

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: messages,
    max_tokens: 150,
  });

  const assistantReply = response.data.choices[0].message.content;

  // if assistant reply starts with a capitalized HTTP method:
  if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(assistantReply.split(' ')[0])) {
    // make the API call
    const response = await makeApiCall(pluginUrl, parseTextResponse(assistantReply));
    // if error, get axios error and print the reason:
    if (response === null) {
      console.error('Error making API call.');
      return;
    }
    const data = response.data;

    messages.push({
      role: 'assistant',
      content: `Response=${JSON.stringify(data, null, 2)}`,
    })

    const actualResponse = await openai.createChatCompletion({
      model: 'gpt-4',
      messages,
      max_tokens: 150,
    });
    console.log(messages);
    console.log(actualResponse.data.choices[0].message.content);
  }
}

// Example usage
const message = 'Translate from English to bahasa indonesia: "I like turtles"'; // Replace with your actual message

chatWithPlugin(pluginUrl, message);
