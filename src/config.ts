/**
 * Configuration Module
 *
 * Handles application configuration from environment variables and optional config file
 */

export interface Config {
  giteaUrl: string;
  giteaToken: string;
  hasRemote: boolean;
  isValid: boolean;
}

/**
 * Get configuration from environment variables
 */
export function getConfig(): Config {
  const giteaUrl = process.env.GITEA_URL || '';
  const giteaToken = process.env.GITEA_TOKEN || '';

  const hasRemote = giteaUrl.length > 0 && giteaToken.length > 0;

  // Basic URL validation
  const isValid = hasRemote && giteaUrl.endsWith('.git');

  return {
    giteaUrl,
    giteaToken,
    hasRemote,
    isValid,
  };
}

/**
 * Get Gitea authentication URL for git push
 * Format: https://token@host/path.git
 */
export function getGiteaAuth(): string | null {
  const config = getConfig();

  if (!config.giteaUrl || !config.giteaToken) {
    return null;
  }

  try {
    const url = new URL(config.giteaUrl);
    // Build URL with token as username (common pattern for git authentication)
    return `${url.protocol}//${config.giteaToken}@${url.host}${url.pathname}`;
  } catch {
    return null;
  }
}
