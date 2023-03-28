# chat-api-plugins

This repository contains a simple example of how to call ChatGPT plugins that don't require authentication. The code is written in TypeScript, and it leverages the OpenAI API to process user messages and interact with plugin APIs based on the OpenAPI Specification provided by the plugin.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [File Structure](#file-structure)

## Installation

1. Clone this repository
2. Run `npm install` to install the required dependencies
3. Create a `.env` file in the project root and add your OpenAI API key as `OPEN_API_KEY=<your-api-key>`
4. Compile TypeScript using `tsc` or `npx tsc`

## Usage

```javascript
//main.ts

const pluginUrl = 'https://www.example.com'; // Replace with the actual plugin URL
const message = 'Recommend some sneakers with the price range of $50-$100'; // Replace with your actual message

chatWithPlugin(pluginUrl, message);
```

The `chatWithPlugin` function fetches the plugin data, interacts with the OpenAI API, makes the appropriate API call to the plugin, and logs the response.

## File Structure

- `main.ts`: The main entry point of the application, containing the `chatWithPlugin` function
- `fetchPluginData.ts`: Utility function to fetch plugin data and OpenAPI Specification from a given plugin URL
- `makeApiCall.ts`: Utility function to make API calls to the plugin based on the API request JSON object returned by the OpenAI API