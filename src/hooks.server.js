/**
 * Server-side hooks for SvelteKit
 * This runs on the server and handles SSR
 */
import { sequence } from '@sveltejs/kit/hooks';

/** @type {import('@sveltejs/kit').Handle} */
export const handle = sequence(async ({ event, resolve }) => {
	// All server-side logic happens here
	// The HTML is rendered on the server before being sent to the client
	const response = await resolve(event);
	
	// Add security headers to prevent script leaks and XSS
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;");
	
	// Ensure proper content type
	if (!response.headers.get('Content-Type')) {
		response.headers.set('Content-Type', 'text/html; charset=utf-8');
	}
	
	return response;
});

