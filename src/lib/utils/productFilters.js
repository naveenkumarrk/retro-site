/**
 * Product filtering and sorting utilities
 */

/**
 * Extract unique filter values from products
 */
export function extractFilterValues(products) {
	const categories = ['all', ...new Set(products.map((p) => p.category).filter(Boolean))].sort();
	const eras = ['all', ...new Set(products.map((p) => p.metadata?.era).filter(Boolean))].sort();
	const allTags = products.flatMap((p) => p.metadata?.tags || []).filter(Boolean);
	const tags = ['all', ...new Set(allTags)].sort();
	const conditions = [
		'all',
		...new Set(products.map((p) => p.metadata?.condition).filter(Boolean))
	].sort();
	const rarities = [
		'all',
		...new Set(products.map((p) => p.metadata?.rarity).filter(Boolean))
	].sort();

	return { categories, eras, tags, conditions, rarities };
}

/**
 * Filter products based on filter criteria
 */
export function filterProducts(products, filters) {
	let filtered = [...products];

	// Apply filters
	if (filters.category && filters.category !== 'all') {
		filtered = filtered.filter((p) => p.category === filters.category);
	}

	if (filters.era && filters.era !== 'all') {
		filtered = filtered.filter((p) => p.metadata?.era === filters.era);
	}

	if (filters.tag && filters.tag !== 'all') {
		filtered = filtered.filter((p) => p.metadata?.tags?.includes(filters.tag));
	}

	if (filters.condition && filters.condition !== 'all') {
		filtered = filtered.filter((p) => p.metadata?.condition === filters.condition);
	}

	if (filters.rarity && filters.rarity !== 'all') {
		filtered = filtered.filter((p) => p.metadata?.rarity === filters.rarity);
	}

	if (filters.showFeaturedOnly) {
		filtered = filtered.filter((p) => p.metadata?.isFeatured === true);
	}

	return filtered;
}

/**
 * Sort products based on sort criteria
 */
export function sortProducts(products, sortBy) {
	const sorted = [...products];

	if (sortBy === 'featured') {
		sorted.sort((a, b) => {
			const aFeatured = a.metadata?.isFeatured ? 1 : 0;
			const bFeatured = b.metadata?.isFeatured ? 1 : 0;
			if (aFeatured !== bFeatured) return bFeatured - aFeatured;
			return 0;
		});
	} else if (sortBy === 'price-low') {
		sorted.sort((a, b) => {
			const aPrice = a.price || a.metadata?.price || 0;
			const bPrice = b.price || b.metadata?.price || 0;
			return aPrice - bPrice;
		});
	} else if (sortBy === 'price-high') {
		sorted.sort((a, b) => {
			const aPrice = a.price || a.metadata?.price || 0;
			const bPrice = b.price || b.metadata?.price || 0;
			return bPrice - aPrice;
		});
	} else if (sortBy === 'newest') {
		sorted.sort((a, b) => {
			if (a.isNew !== b.isNew) return b.isNew ? 1 : -1;
			return (a.title || '').localeCompare(b.title || '');
		});
	}

	return sorted;
}

/**
 * Paginate products
 */
export function paginateProducts(products, currentPage, itemsPerPage) {
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	return {
		paginated: products.slice(startIndex, endIndex),
		startIndex,
		endIndex,
		totalPages: Math.ceil(products.length / itemsPerPage)
	};
}

