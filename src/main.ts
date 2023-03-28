import { Configuration, OpenAIApi } from 'openai';
import * as dotenv from 'dotenv';
import { fetchPluginData } from './fetchPluginData.js';
import { makeApiCall } from './makeApiCall.js';

dotenv.config();

const pluginUrl = '; // Replace with the actual plugin URL

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
    { role: 'system', content:
    `You can only respond in 2 ways:
    1. If user's message starts with 'Response=', modify this response as instructed in the API Description.
    2. Else, Refer to the OpenAPI Spec and API Description to output the most appropriate API call for the user's query, and format it as a JSON object with http_method, path, params (optional), data (optional). E.g. {http_method: 'get',path:'/api/v1/search',params:{'q':'shirt'}}` },
    { role: 'system', content:`.\n API Description:\n${pluginData.description_for_model}\n
OpenAPI Spec: ${JSON.stringify(openApiData)}\n
If user message starts with 'Response=', provide the response as instructed in the API Description.
Else, do the following:
1. Decide on the most appropriate API request for the user query by referring to the OpenAPI Spec and API Description.
2. Output the request as a JSON object with http_method, path, params (optional), data (optional). E.g. {http_method: 'get',path:'/api/v1/search',params:{'q':'shirt'}}\n` },
  ];

  messages.push(
    { role: 'user', content: message },
  )

  console.log(messages);


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
    params?: { [key: string]: any }
    data?: { [key: string]: any}
  } = JSON.parse(assistantReply)


  console.info('apiCall', apiCall);

  // if assistant reply starts with a capitalized HTTP method:
  if (apiCall) {
    // make the API call
    const response = await makeApiCall(openApiData.servers[0].url || pluginUrl, apiCall);
    // if error, get axios error and print the reason:
    if (response === null) {
      console.error('Error making API call.');
      return;
    }
    const data = response.data;

    messages.push({
      role: 'user',
      content: `Response=${JSON.stringify(data, null, 2)}`,
    })

    const actualResponse = await openai.createChatCompletion({
      model: 'gpt-4',
      messages,
      max_tokens: 1000,
      temperature: 0.4
    });
    console.info(messages);
    console.info(actualResponse.data.choices[0].message.content);
  }
}

// Example usage
const message = ''; // Replace with your actual message
chatWithPlugin(pluginUrl, message);
