import { API_URL } from '$lib/config.js';

export const load = async ({ fetch }) => {
	const url = `${API_URL}/api/products?limit=50&offset=0`;

	try {
		const res = await fetch(url);

		if (!res.ok) {
			throw new Error('Failed to fetch products');
		}

		const data = await res.json();

		// Normalize the products to ensure they have the correct structure
		const rawProducts = data.results || data.products || data || [];

		const normalizedProducts = rawProducts.map((product) => ({
			// Ensure both 'id' and 'productId' exist
			productId: product.productId || product.id,
			id: product.id || product.productId,

			// Basic info
			title: product.title || product.name || 'Unknown Product',
			description: product.description || 'No description available',
			category: product.category || 'Uncategorized',
			sku: product.sku || 'N/A',

			// Pricing
			price: product.price || product.metadata?.price || product.variants?.[0]?.price || 0,

			// Images
			image:
				product.image ||
				product.images?.[0] ||
				'https://placehold.co/400x500/EAE8E0/1A1A1A?text=NO+IMAGE',
			images: product.images || [product.image] || [],

			// Variants - ensure they exist
			variants:
				product.variants?.length > 0
					? product.variants.map((v) => ({
							variantId: v.variantId || v.id || 1,
							name: v.name || 'Default',
							price: v.price || product.price || 0
						}))
					: [
							{
								variantId: 1,
								name: 'Default',
								price: product.price || product.metadata?.price || 0
							}
						],

			// Metadata - preserve all metadata fields
			metadata: {
				...(product.metadata || {}),
				price: product.metadata?.price || product.price || 0,
				era: product.metadata?.era || null,
				condition: product.metadata?.condition || null,
				rarity: product.metadata?.rarity || null,
				isFeatured: product.metadata?.isFeatured || false,
				tags: product.metadata?.tags || [],
				brand: product.metadata?.brand || null
			},

			// UI flags
			isNew: product.isNew || product.metadata?.isNew || false,
			isBestSeller: product.isBestSeller || product.metadata?.isBestSeller || false
		}));

		// Filter featured products (limit to 3)
		const featuredProducts = normalizedProducts
			.filter((p) => p.metadata?.isFeatured === true)
			.slice(0, 3);

		console.log('[HOME] Loaded featured products:', featuredProducts.length);

		return {
			featuredProducts
		};
	} catch (error) {
		console.error('[HOME] Error loading featured products:', error);
		return {
			featuredProducts: [] // Return empty array on error
		};
	}
};
