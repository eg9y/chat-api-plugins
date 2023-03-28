import { Configuration, OpenAIApi } from 'openai';
import * as dotenv from 'dotenv';
import { fetchPluginData } from './fetchPluginData.js';
import { makeApiCall } from './makeApiCall.js';

dotenv.config();

const pluginUrl = ''; // Replace with the actual plugin URL

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

  const messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[] = [
    { role: 'system', content: `You are now using the '${pluginData.name_for_model}' plugin.
    ${pluginData.description_for_model}\n` },
    { role: 'system', content: `When user message starts with 'Response=', it is the response from the Api call, and as such, provide the response to the user as instructed above.
    Else, choose the most appropriate API request based on the OpenAPI specification below by replying in stringified JSON format like so { http_method: method, path: path, params: params object with correct types }\n
    OpenAPI spec: ${JSON.stringify(openApiData)}
    ` },
  ];

  messages.push(
    { role: 'user', content: message },
  )

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: messages,
    max_tokens: 250,
    temperature: 0.1
  });

  const assistantReply = response.data.choices[0].message.content;

  const apiCall: {
    http_method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    params: { [key: string]: any }
  } = JSON.parse(assistantReply)

  // if assistant reply starts with a capitalized HTTP method:
  if (apiCall) {
    // make the API call
    const response = await makeApiCall(pluginUrl, {
      method: apiCall.http_method,
      path: `${apiCall.path}`,
      params: apiCall.params,
    });
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
      max_tokens: 1000,
      temperature: 0.4
    });
    console.log(messages);
    console.log(actualResponse.data.choices[0].message.content);
  }
}

// Example usage
const message = ''; // Replace with your actual message
chatWithPlugin(pluginUrl, message);
