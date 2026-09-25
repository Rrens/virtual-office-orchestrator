import type { ToolDefinition, ToolExecutionContext, ToolInput, ToolOutput } from '../types.js';

const ALLOWED_DOMAINS = [
  'github.com',
  'npmjs.com',
  'pypi.org',
  'docs.python.org',
  'nodejs.org',
  'go.dev',
  'developer.mozilla.org',
  'stackoverflow.com',
  'raw.githubusercontent.com',
];

export const browserFetchTool: ToolDefinition = {
  name: 'browser.fetch',
  version: '1.0.0',
  description: 'Fetch content from approved external URLs',
  requiredPermission: 'browser.fetch',
  timeout: 15000,
  requiresApproval: false,
  inputSchema: {
    url: { type: 'string', required: true, description: 'URL to fetch (must be in allowlist)' },
  },
  async execute(input: ToolInput, _context: ToolExecutionContext): Promise<ToolOutput> {
    const startTime = Date.now();
    const url = String(input.url);

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'validation_error',
        errorMessage: `Invalid URL: ${url}`,
      };
    }

    if (parsed.protocol !== 'https:') {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'permission_denied',
        errorMessage: 'Only HTTPS URLs are allowed',
      };
    }

    const domainAllowed = ALLOWED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)
    );

    if (!domainAllowed) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'permission_denied',
        errorMessage: `Domain '${parsed.hostname}' is not in the allowed list`,
      };
    }

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'VirtualOffice-Agent/1.0' },
        signal: AbortSignal.timeout(15000),
      });

      const text = await res.text();

      return {
        success: res.ok,
        data: {
          url,
          status: res.status,
          contentType: res.headers.get('content-type'),
          content: text.slice(0, 50000),
        },
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'execution_error',
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
