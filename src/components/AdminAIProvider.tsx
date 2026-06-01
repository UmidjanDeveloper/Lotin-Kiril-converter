import React, { useState, useEffect } from 'react';

const PROVIDERS = ['gemini', 'azure', 'cloudflare'];

export default function AdminAIProvider() {
  const [provider, setProvider] = useState<string>(() => {
    return localStorage.getItem('ai_provider_override') || '';
  });

  useEffect(() => {
    if (provider) localStorage.setItem('ai_provider_override', provider);
    else localStorage.removeItem('ai_provider_override');
  }, [provider]);

  return (
    <div className="flex items-center gap-2">
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        className="premium-select text-xs rounded-xl px-2 py-2 border"
        title="Override AI provider for frontend requests"
      >
        <option value="">(env default)</option>
        {PROVIDERS.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <button
        onClick={() => { setProvider(''); }}
        className="text-xs px-2 py-1 rounded border"
        title="Clear override"
      >
        Clear
      </button>
    </div>
  );
}
