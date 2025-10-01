'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    openrouter_api_key: '',
    ocr_model_id: 'anthropic/claude-3-haiku',
    text_model_id: 'mistralai/mistral-large-2411',
  });
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        // Check if API key exists (it will be masked, but not empty)
        setHasApiKey(!!data.openrouter_api_key && data.openrouter_api_key !== '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare data to send - only include API key if it was changed
      const dataToSend: any = {
        ocr_model_id: settings.ocr_model_id,
        text_model_id: settings.text_model_id,
      };

      // Only include API key if it's a new one (not empty and not the masked value)
      if (settings.openrouter_api_key && !settings.openrouter_api_key.includes('*')) {
        dataToSend.openrouter_api_key = settings.openrouter_api_key;
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Update hasApiKey if we just saved a new key
      if (dataToSend.openrouter_api_key) {
        setHasApiKey(true);
      }

      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!settings.openrouter_api_key) {
      alert('Please enter an API key first');
      return;
    }

    try {
      const response = await fetch('/api/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: settings.openrouter_api_key }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Connection successful! API key is valid.');
      } else {
        alert(`Connection failed: ${data.error}`);
      }
    } catch (error) {
      alert('Error testing connection');
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              OpenRouter Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
                  OpenRouter API Key {hasApiKey && <span className="text-green-600">✓ Saved</span>}
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="password"
                    id="api_key"
                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    value={settings.openrouter_api_key}
                    onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
                    placeholder={hasApiKey ? "••••••••••••••••" : "sk-or-v1-..."}
                  />
                  <button
                    type="button"
                    onClick={testConnection}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Test
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {hasApiKey ? (
                    <>
                      <span className="text-green-600">✓ API key is already configured.</span> You can change the models below without re-entering the key.
                      <br />
                      To update the API key, enter a new one above.
                    </>
                  ) : (
                    <>
                      Get your API key from{' '}
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        openrouter.ai/keys
                      </a>
                    </>
                  )}
                </p>
              </div>

              <div>
                <label htmlFor="ocr_model" className="block text-sm font-medium text-gray-700">
                  OCR Model ID
                </label>
                <input
                  type="text"
                  id="ocr_model"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={settings.ocr_model_id}
                  onChange={(e) => setSettings({ ...settings, ocr_model_id: e.target.value })}
                  placeholder="mistralai/mistral-medium-3.1"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Model for extracting text. <strong>For PDFs use:</strong> anthropic/claude-3-haiku (~$0.25/M) or openai/gpt-4o-mini (~$0.15/M). <strong>For images only:</strong> google/gemini-flash-1.5-8b (~$0.075/M)
                </p>
              </div>

              <div>
                <label htmlFor="text_model" className="block text-sm font-medium text-gray-700">
                  Text Analysis Model ID
                </label>
                <input
                  type="text"
                  id="text_model"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={settings.text_model_id}
                  onChange={(e) => setSettings({ ...settings, text_model_id: e.target.value })}
                  placeholder="openai/gpt-4-turbo-preview"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Model for structuring and formatting text. Budget: mistralai/mistral-7b (~$0.07/M), mistralai/mistral-large-2411 (~$2/M). Premium: anthropic/claude-3-haiku (~$0.25/M)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Model Selection Tips - Budget Options</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>Cheapest OCR:</strong> google/gemini-flash-1.5-8b (~$0.075/M tokens) - Fast and cheap for most documents</li>
          <li>• <strong>Better OCR:</strong> google/gemini-flash-1.5 (~$0.15/M) or anthropic/claude-3-haiku (~$0.25/M)</li>
          <li>• <strong>Cheapest Text:</strong> mistralai/mistral-7b-instruct (~$0.07/M) - Good for basic formatting</li>
          <li>• <strong>Better Text:</strong> mistralai/mistral-large-2411 (~$2/M) - Excellent quality/price ratio</li>
          <li>• For 64-page documents, expect ~$0.50-$2.00 total cost with budget models</li>
          <li>• Check current prices at{' '}
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              openrouter.ai/models
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}