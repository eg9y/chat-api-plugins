import axios from "axios";
import { OpenAPIV3 } from "openapi-types";
import yaml from 'js-yaml';

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




export async function fetchPluginData(pluginUrl: string): Promise<{ pluginData: PluginData; openApiData: OpenAPIV3.Document } | null> {
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
