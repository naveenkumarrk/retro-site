import { API_URL } from '$lib/config.js';

export const load = async ({ params, fetch }) => {
	const { id } = params;
	const url = `${API_URL}/api/products/${id}`;

	try {
		const res = await fetch(url);

		if (!res.ok) {
			throw new Error(`Error fetching product: ${res.statusText}`);
		}

		const data = await res.json();

		// Normalize the product data
		const product = {
			// Ensure both 'id' and 'productId' exist
			productId: data.productId || data.id || id,
			id: data.id || data.productId || id,

			// Basic info
			title: data.title || data.name || 'Unknown Product',
			description: data.description || 'No description available',
			category: data.category || 'Uncategorized',
			sku: data.sku || 'N/A',

			// Pricing
			price: data.price || data.metadata?.price || data.variants?.[0]?.price || 0,

			// Images
			image:
				data.image ||
				data.images?.[0] ||
				'https://placehold.co/600x600/EAE8E0/1A1A1A?text=NO+IMAGE',
			images:
				data.images?.length > 0
					? data.images
					: [data.image || 'https://placehold.co/600x600/EAE8E0/1A1A1A?text=NO+IMAGE'],

			// Variants - ensure they exist and are normalized
			variants:
				data.variants?.length > 0
					? data.variants.map((v) => ({
							variantId: v.variantId || v.id || 1,
							id: v.id || v.variantId || 1,
							name: v.name || 'Default',
							price: v.price || data.price || 0,
							sku: v.sku || data.sku
						}))
					: [
							{
								variantId: 1,
								id: 1,
								name: 'Default',
								price: data.price || data.metadata?.price || 0
							}
						],

			// Metadata
			metadata: data.metadata || {}
		};

		console.log('[PRODUCT DETAIL] Loaded product:', product);

		return {
			product: product
		};
	} catch (error) {
		console.error('[PRODUCT DETAIL] Error:', error);

		// Return null - component will show fallback
		return {
			product: null
		};
	}
};
