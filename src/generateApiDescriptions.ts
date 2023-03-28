import { OpenAPIV3 } from "openapi-types";


// Type guard for ReferenceObject
function isReferenceObject(obj: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): obj is OpenAPIV3.ReferenceObject {
  return '$ref' in obj;
}

function isRequestObject(obj: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject): obj is OpenAPIV3.RequestBodyObject {
  return !('$ref' in obj);
}

function isResponseObject(obj: OpenAPIV3.ResponseObject | OpenAPIV3.ReferenceObject): obj is OpenAPIV3.ResponseObject {
  return !('$ref' in obj);
}

export function generateApiDescriptions(openApiSpec: OpenAPIV3.Document): string {

  let apiDescriptions = '';

  // Utility function to get a schema definition by its reference
  function getSchemaByRef(ref: string): OpenAPIV3.SchemaObject | null {
    const schemaName = ref.replace('#/components/schemas/', '');
    const schema = openApiSpec.components?.schemas?.[schemaName];

    // If the schema is a ReferenceObject, resolve the reference recursively
    if (schema && isReferenceObject(schema)) {
      return getSchemaByRef(schema.$ref);
    }

    return schema as OpenAPIV3.SchemaObject | null;
  }

  // Iterate through the paths
  for (const [path, pathItem] of Object.entries(openApiSpec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      // Skip if the property is not an HTTP method
      if (!['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(method)) {
        continue;
      }

      const operationObj = operation as OpenAPIV3.OperationObject;

      // Extract the relevant information from the operation object
      const summary = operationObj.summary || '';
      let parameters = operationObj.parameters?.map(param => (param as OpenAPIV3.ParameterObject).name).join(', ') || '';

      const request = operationObj.requestBody;
      const requestSchema = request && isRequestObject(request) ? request.content?.['application/json']?.schema : undefined;
      let requestObject: OpenAPIV3.SchemaObject | null = null;
      if (requestSchema && isReferenceObject(requestSchema)) {
        requestObject = getSchemaByRef(requestSchema.$ref);
      }
      if (!parameters) {
        if ((requestObject.properties as OpenAPIV3.SchemaObject).description) {
          parameters = (requestObject.properties as OpenAPIV3.SchemaObject).description as string;
        } else {
          Object.entries(requestObject.properties as OpenAPIV3.SchemaObject).forEach(([key, value]) => {
            parameters += `${key}: ${value.description}, `;
          }
          );
        }
      }

      // Get the response schema
      const response = operationObj.responses['200'];
      const responseSchema = response && isResponseObject(response) ? response.content?.['application/json']?.schema : undefined;
      let responseObject: OpenAPIV3.SchemaObject | null = null;
      if (responseSchema && isReferenceObject(responseSchema)) {
        responseObject = getSchemaByRef(responseSchema.$ref);
      }
      const responseDescription = (responseObject.properties.explanation as OpenAPIV3.SchemaObject).description || "";

      // Generate a formatted description for the API call
      const apiCallDescription = `${method.toUpperCase()} ${path}\n` +
                                `- Summary: ${summary}\n` +
                                `- Properties: ${parameters}\n` +
                                `- Response: ${responseDescription}\n\n`;

      // Append the generated description to the output string
      apiDescriptions += apiCallDescription;
    }
  }

  return apiDescriptions;
}
