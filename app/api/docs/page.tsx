'use client';

import { useState } from 'react';

export default function APIDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  const endpoints = [
    {
      id: 'overview',
      title: 'Overview',
      method: 'GET',
      path: '/api/v1',
      description: 'Get API information and available endpoints',
      auth: 'Optional',
      params: [],
      response: {
        success: true,
        data: {
          name: 'MMI API',
          version: '1.0.0',
          endpoints: {},
        },
      },
    },
    {
      id: 'content',
      title: 'Content',
      method: 'GET',
      path: '/api/v1/content',
      description: 'Retrieve published content (series, movies, podcasts)',
      auth: 'Required (read or content scope)',
      params: [
        { name: 'type', type: 'string', optional: true, description: 'Filter by type: series, movie, or podcast' },
        { name: 'seriesId', type: 'string', optional: true, description: 'Get episodes for a specific series' },
      ],
      response: {
        success: true,
        data: [],
        count: 0,
      },
    },
    {
      id: 'notifications',
      title: 'Send Notification',
      method: 'POST',
      path: '/api/v1/notifications',
      description: 'Send a site notification to one or more users',
      auth: 'Required (notifications or write scope)',
      params: [],
      body: {
        userIds: ['string'],
        title: 'string',
        message: 'string',
        type: 'info | success | warning | error',
        link: 'string (optional)',
        openInAppBrowser: 'boolean (optional)',
      },
      response: {
        success: true,
        message: 'Notification sent successfully',
        recipients: 1,
      },
    },
    {
      id: 'users',
      title: 'Users',
      method: 'GET',
      path: '/api/v1/users',
      description: 'List all users (public data only)',
      auth: 'Required (read scope)',
      params: [],
      response: {
        success: true,
        data: [],
        count: 0,
      },
    },
  ];

  const codeExamples = {
    javascript: `// Using fetch
const response = await fetch('https://mobilemediainteractions.com/api/v1/content', {
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
console.log(data);`,
    curl: `curl -X GET "https://mobilemediainteractions.com/api/v1/content" \\
  -H "X-API-Key: your-api-key-here" \\
  -H "Content-Type: application/json"`,
    python: `import requests

headers = {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json',
}

response = requests.get(
    'https://mobilemediainteractions.com/api/v1/content',
    headers=headers
)

data = response.json()
print(data)`,
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">MMI API Documentation</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Complete API reference for integrating with MobileMediaInteractions
        </p>
      </div>

      {/* Authentication Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Authentication</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          All API requests require an API key. You can generate API keys in the admin panel.
        </p>
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Header Format</h3>
          <code className="text-sm text-gray-800 dark:text-gray-200">
            X-API-Key: your-api-key-here
          </code>
          <br />
          <code className="text-sm text-gray-800 dark:text-gray-200 mt-2 block">
            Authorization: Bearer your-api-key-here
          </code>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Security:</strong> API keys are validated on every request. Requests from unauthorized origins will be rejected unless the origin is in your allowed URLs list.
          </p>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Endpoints</h2>
        {endpoints.map((endpoint) => (
          <div
            key={endpoint.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-cyan-500"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono text-gray-900 dark:text-white">{endpoint.path}</code>
                </div>
                <p className="text-gray-600 dark:text-gray-400">{endpoint.description}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                endpoint.auth === 'Required' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {endpoint.auth}
              </span>
            </div>

            {endpoint.params && endpoint.params.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Query Parameters</h3>
                <div className="space-y-2">
                  {endpoint.params.map((param, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <code className="text-cyan-600 dark:text-cyan-400">{param.name}</code>
                      <span className="text-gray-500 dark:text-gray-400">({param.type})</span>
                      {param.optional && <span className="text-gray-400 dark:text-gray-500">optional</span>}
                      <span className="text-gray-600 dark:text-gray-400">- {param.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {endpoint.body && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Request Body</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-x-auto text-sm">
                  <code>{JSON.stringify(endpoint.body, null, 2)}</code>
                </pre>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Response</h3>
              <pre className="bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-x-auto text-sm">
                <code>{JSON.stringify(endpoint.response, null, 2)}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Code Examples */}
      <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Code Examples</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">JavaScript/TypeScript</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-x-auto text-sm">
              <code>{codeExamples.javascript}</code>
            </pre>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">cURL</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-x-auto text-sm">
              <code>{codeExamples.curl}</code>
            </pre>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Python</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-x-auto text-sm">
              <code>{codeExamples.python}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Error Handling */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Error Handling</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          All errors are returned in JSON format with the following structure:
        </p>
        <pre className="bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-x-auto text-sm mb-4">
          <code>{JSON.stringify({
            error: 'Error message',
            code: 'ERROR_CODE',
            timestamp: '2024-01-01T00:00:00.000Z',
          }, null, 2)}</code>
        </pre>
        <div className="space-y-2">
          <div><strong className="text-gray-900 dark:text-white">401 Unauthorized:</strong> <span className="text-gray-600 dark:text-gray-400">Invalid or missing API key</span></div>
          <div><strong className="text-gray-900 dark:text-white">403 Forbidden:</strong> <span className="text-gray-600 dark:text-gray-400">Origin not allowed or insufficient permissions</span></div>
          <div><strong className="text-gray-900 dark:text-white">404 Not Found:</strong> <span className="text-gray-600 dark:text-gray-400">Resource not found</span></div>
          <div><strong className="text-gray-900 dark:text-white">500 Internal Server Error:</strong> <span className="text-gray-600 dark:text-gray-400">Server error</span></div>
        </div>
      </div>
    </div>
  );
}

