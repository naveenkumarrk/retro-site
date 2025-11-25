<script>
	export let filters = {};
	export let onFilterChange = () => {};

	let showCategoryDropdown = false;
	let showEraDropdown = false;
	let showTagDropdown = false;
	let showSortDropdown = false;

	function closeDropdowns() {
		showCategoryDropdown = false;
		showEraDropdown = false;
		showTagDropdown = false;
		showSortDropdown = false;
	}

	function handleFilterClick(e, dropdownType) {
		e.stopPropagation();
		closeDropdowns();
		if (dropdownType === 'category') showCategoryDropdown = true;
		else if (dropdownType === 'era') showEraDropdown = true;
		else if (dropdownType === 'tag') showTagDropdown = true;
		else if (dropdownType === 'sort') showSortDropdown = true;
	}

	function updateFilter(key, value) {
		const newFilters = { ...filters, [key]: value };
		onFilterChange(newFilters);
	}
</script>

<svelte:window on:click={closeDropdowns} />

<div
	class="sticky top-20 z-40 mb-12 border-b border-gray-200 bg-retro-bone/95 py-4 text-xs tracking-widest uppercase backdrop-blur-sm"
>
	<div class="flex flex-wrap items-center gap-2 md:gap-3">
		<!-- Category Filter -->
		<div class="relative">
			<button
				on:click={(e) => handleFilterClick(e, 'category')}
				class="flex h-10 items-center gap-2 whitespace-nowrap border border-transparent px-4 py-2.5 transition-all hover:border-gray-300 hover:bg-gray-50 {showCategoryDropdown
					? 'border-gray-300 bg-gray-50'
					: ''}"
			>
				<span class="font-mono">Category:</span>
				<span class="font-semibold">{filters.category === 'all' ? 'All' : filters.category}</span>
				<span class="text-[10px] opacity-60">▼</span>
			</button>
			{#if showCategoryDropdown}
				<div
					class="absolute top-full left-0 z-50 mt-1 min-w-[200px] border border-gray-300 bg-retro-bone shadow-xl"
					on:click|stopPropagation
				>
					{#each filters.categories || [] as cat}
						<button
							on:click={() => {
								updateFilter('category', cat);
								showCategoryDropdown = false;
							}}
							class="w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-100 {filters.category ===
							cat
								? 'bg-gray-200 font-bold'
								: ''}"
						>
							{cat}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Era Filter -->
		<div class="relative">
			<button
				on:click={(e) => handleFilterClick(e, 'era')}
				class="flex h-10 items-center gap-2 whitespace-nowrap border border-transparent px-4 py-2.5 transition-all hover:border-gray-300 hover:bg-gray-50 {showEraDropdown
					? 'border-gray-300 bg-gray-50'
					: ''}"
			>
				<span class="font-mono">Era:</span>
				<span class="font-semibold">{filters.era === 'all' ? 'All' : filters.era}</span>
				<span class="text-[10px] opacity-60">▼</span>
			</button>
			{#if showEraDropdown}
				<div
					class="absolute top-full left-0 z-50 mt-1 min-w-[150px] border border-gray-300 bg-retro-bone shadow-xl"
					on:click|stopPropagation
				>
					{#each filters.eras || [] as era}
						<button
							on:click={() => {
								updateFilter('era', era);
								showEraDropdown = false;
							}}
							class="w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-100 {filters.era ===
							era
								? 'bg-gray-200 font-bold'
								: ''}"
						>
							{era}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Tag Filter -->
		{#if filters.tags && filters.tags.length > 1}
			<div class="relative">
				<button
					on:click={(e) => handleFilterClick(e, 'tag')}
					class="flex h-10 items-center gap-2 whitespace-nowrap border border-transparent px-4 py-2.5 transition-all hover:border-gray-300 hover:bg-gray-50 {showTagDropdown
						? 'border-gray-300 bg-gray-50'
						: ''}"
				>
					<span class="font-mono">Tag:</span>
					<span class="font-semibold">{filters.tag === 'all' ? 'All' : filters.tag}</span>
					<span class="text-[10px] opacity-60">▼</span>
				</button>
				{#if showTagDropdown}
					<div
						class="absolute top-full left-0 z-50 mt-1 max-h-[300px] min-w-[150px] overflow-y-auto border border-gray-300 bg-retro-bone shadow-xl"
						on:click|stopPropagation
					>
						{#each filters.tags as tag}
							<button
								on:click={() => {
									updateFilter('tag', tag);
									showTagDropdown = false;
								}}
								class="w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-100 {filters.tag ===
								tag
									? 'bg-gray-200 font-bold'
									: ''}"
							>
								{tag}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Featured Toggle -->
		<label
			class="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap border border-transparent px-4 py-2.5 transition-all hover:border-gray-300 hover:bg-gray-50 {filters.showFeaturedOnly
				? 'border-gray-300 bg-gray-50'
				: ''}"
		>
			<input
				type="checkbox"
				checked={filters.showFeaturedOnly}
				on:change={(e) => updateFilter('showFeaturedOnly', e.target.checked)}
				class="h-4 w-4 accent-retro-black"
			/>
			<span>Featured Only</span>
		</label>

		<!-- Sort -->
		<div class="relative ml-auto">
			<button
				on:click={(e) => handleFilterClick(e, 'sort')}
				class="flex h-10 items-center gap-2 whitespace-nowrap border border-transparent px-4 py-2.5 transition-all hover:border-gray-300 hover:bg-gray-50 {showSortDropdown
					? 'border-gray-300 bg-gray-50'
					: ''}"
			>
				<span class="font-mono">Sort:</span>
				<span class="font-semibold">
					{filters.sortBy === 'featured'
						? 'Featured'
						: filters.sortBy === 'price-low'
							? 'Price: Low'
							: filters.sortBy === 'price-high'
								? 'Price: High'
								: filters.sortBy === 'newest'
									? 'Newest'
									: 'Featured'}
				</span>
				<span class="text-[10px] opacity-60">▼</span>
			</button>
			{#if showSortDropdown}
				<div
					class="absolute top-full right-0 z-50 mt-1 min-w-[180px] border border-gray-300 bg-retro-bone shadow-xl"
					on:click|stopPropagation
				>
					<button
						on:click={() => {
							updateFilter('sortBy', 'featured');
							showSortDropdown = false;
						}}
						class="w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-100 {filters.sortBy ===
						'featured'
							? 'bg-gray-200 font-bold'
							: ''}"
					>
						Featured
					</button>
					<button
						on:click={() => {
							updateFilter('sortBy', 'price-low');
							showSortDropdown = false;
						}}
						class="w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-100 {filters.sortBy ===
						'price-low'
							? 'bg-gray-200 font-bold'
							: ''}"
					>
						Price: Low to High
					</button>
					<button
						on:click={() => {
							updateFilter('sortBy', 'price-high');
							showSortDropdown = false;
						}}
						class="w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-100 {filters.sortBy ===
						'price-high'
							? 'bg-gray-200 font-bold'
							: ''}"
					>
						Price: High to Low
					</button>
					<button
						on:click={() => {
							updateFilter('sortBy', 'newest');
							showSortDropdown = false;
						}}
						class="w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-100 {filters.sortBy ===
						'newest'
							? 'bg-gray-200 font-bold'
							: ''}"
					>
						Newest
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

