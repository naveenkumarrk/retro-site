import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
		// SSR is enabled by default in SvelteKit
		// Routes are server-rendered unless explicitly set to prerender
	},
	preprocess: vitePreprocess()
};

export default config;
