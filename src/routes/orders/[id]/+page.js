import { browser } from '$app/environment';

export const load = async ({ params }) => {
	const { id } = params;

	// Skip server-side fetch - we need the token from localStorage which is only available client-side
	// The client-side component will handle fetching with the auth token
	return {
		order: null,
		orderId: id,
		requiresAuth: true, // Always require auth check on client
		error: null
	};
};
