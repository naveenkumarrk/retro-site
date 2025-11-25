<script>
	import { onMount } from 'svelte';
	export let data;
	import ProductCard from '$lib/components/ProductCard.svelte';
	import ProductFilters from '$lib/components/ProductFilters.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { extractFilterValues, filterProducts, sortProducts, paginateProducts } from '$lib/utils/productFilters.js';

	// Fallback mock data in case the API is empty or down
	const fallbackProducts = Array(8)
		.fill(null)
		.map((_, i) => ({
			productId: i + 1,
			id: i + 1,
			title: `Neural Device ${String.fromCharCode(65 + i)}`,
			description: 'Analog tactile feedback, Neural Interface',
			price: 120 + i * 30,
			image: `https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80`,
			isNew: i < 2,
			isBestSeller: i % 3 === 0,
			category: i % 2 === 0 ? 'Hardware' : 'Console',
			metadata: {}
		}));

	const allProducts = data.products && data.products.length > 0 ? data.products : fallbackProducts;

	// Filter state
	let filters = {
		category: 'all',
		era: 'all',
		tag: 'all',
		condition: 'all',
		rarity: 'all',
		showFeaturedOnly: false,
		sortBy: 'featured'
	};

	// Extract filter values
	$: filterValues = extractFilterValues(allProducts);

	// Filter and sort products
	$: filteredProducts = (() => {
		let filtered = filterProducts(allProducts, filters);
		return sortProducts(filtered, filters.sortBy);
	})();

	// Pagination
	let currentPage = 1;
	const itemsPerPage = 12;

	// Calculate pagination
	$: {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
		
		// Reset to page 1 if current page is out of bounds
		if (currentPage > totalPages && totalPages > 0) {
			currentPage = 1;
		}
		
		// Calculate paginated products
		paginatedProducts = filteredProducts.slice(startIndex, endIndex);
		pagination = { startIndex, endIndex, totalPages };
	}
	
	let paginatedProducts = [];
	let pagination = { startIndex: 0, endIndex: 0, totalPages: 1 };
	$: totalPages = pagination.totalPages;

	function handleFilterChange(newFilters) {
		filters = newFilters;
		currentPage = 1; // Reset to first page when filters change
	}

	function handlePageChange(page) {
		currentPage = page;
	}

	function clearFilters() {
		filters = {
			category: 'all',
			era: 'all',
			tag: 'all',
			condition: 'all',
			rarity: 'all',
			showFeaturedOnly: false,
			sortBy: 'featured'
		};
		currentPage = 1;
	}

	$: hasActiveFilters =
		filters.category !== 'all' ||
		filters.era !== 'all' ||
		filters.tag !== 'all' ||
		filters.showFeaturedOnly;
</script>

<div class="mt-12 mb-24">
	<h1 class="max-w-4xl font-serif text-5xl leading-[0.9] text-retro-black md:text-7xl">
		All Tech, <span class="font-normal text-gray-400 italic">Cyberware,</span> <br />
		Retro-Consoles, Components.
	</h1>
</div>

<!-- Filters -->
<ProductFilters
	{filters}
	categories={filterValues.categories}
	eras={filterValues.eras}
	tags={filterValues.tags}
	onFilterChange={handleFilterChange}
/>

<!-- Results Summary -->
<div class="mb-6 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-gray-600">
	<div>
		Showing {pagination.startIndex + 1}-{Math.min(pagination.endIndex, filteredProducts.length)} of{' '}
		{filteredProducts.length} products
		{#if hasActiveFilters}
			<button
				on:click={clearFilters}
				class="ml-4 underline transition-colors hover:text-retro-black"
			>
				Clear filters
			</button>
		{/if}
	</div>
</div>

<!-- Products Grid -->
<div class="grid grid-cols-1 gap-x-5 gap-y-16 md:grid-cols-2 lg:grid-cols-4">
	{#each paginatedProducts as product}
		<ProductCard {product} />
	{/each}
</div>

<!-- Empty State -->
{#if filteredProducts.length === 0}
	<div class="py-20 text-center">
		<span class="mb-4 block text-6xl">📦</span>
		<p class="mb-6 font-mono text-sm text-gray-500">
			{allProducts.length === 0
				? 'No products available at the moment.'
				: 'No products match your filters.'}
		</p>
		{#if allProducts.length > 0}
			<button
				on:click={clearFilters}
				class="inline-block bg-retro-black px-8 py-3 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
			>
				Clear Filters
			</button>
		{:else}
			<a
				href="/"
				class="inline-block bg-retro-black px-8 py-3 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
			>
				Return Home
			</a>
		{/if}
	</div>
{/if}

<!-- Pagination -->
<Pagination {currentPage} {totalPages} onPageChange={handlePageChange} />
