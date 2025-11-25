/**
 * API Configuration
 * Uses environment variables to avoid exposing sensitive URLs in source code
 * Works on both server (SSR) and client - SvelteKit handles env vars automatically
 */
export const API_URL = 
	import.meta.env.PUBLIC_API_URL || 
	'https://gateway-worker.111naveenkumarrk.workers.dev';

