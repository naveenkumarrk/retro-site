<script>
	export let data;
	const { product } = data;
	import { addToCart } from '$lib/stores/cart';
	import QuantitySelector from '$lib/components/QuantitySelector.svelte';
	import ProductBadges from '$lib/components/ProductBadges.svelte';

	// Fallback if API returns null
	const fallbackProduct = {
		id: 1,
		productId: 1,
		title: 'Unknown Device',
		description: 'Authentic retro-futuristic hardware. Restored for modern neural interfaces.',
		sku: 'N/A',
		category: 'Uncategorized',
		images: [
			'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80'
		],
		variants: [{ variantId: 1, id: 1, name: 'Default', price: 0 }],
		metadata: { price: 0 }
	};

	const displayProduct = product || fallbackProduct;

	// Handle images with fallback
	const mainImage =
		displayProduct?.images?.[0] ||
		displayProduct?.image ||
		'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80';

	let selectedQty = 1;
	let selectedVariant = displayProduct?.variants?.[0] || {
		variantId: 1,
		id: 1,
		name: 'Default',
		price: 0
	};
	let addedToCart = false;

	// Get stock from product metadata (set by backend)
	$: stock = displayProduct?.metadata?.stock ?? displayProduct?.stock ?? null;
	$: isLowStock =
		displayProduct?.metadata?.isLowStock ??
		(stock !== null && stock !== undefined && stock > 0 && stock < 5);
	$: isOutOfStock = stock !== null && stock !== undefined && stock === 0;

	// Get price
	const getPrice = () => {
		if (selectedVariant?.price) return selectedVariant.price;
		if (displayProduct?.metadata?.price) return displayProduct.metadata.price;
		if (displayProduct?.variants?.[0]?.price) return displayProduct.variants[0].price;
		return 0;
	};

	$: price = getPrice();
	$: formattedPrice = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(price);

	function handleQuantityChange(newQty) {
		selectedQty = newQty;
	}

	const handleAddToCart = () => {
		if (isOutOfStock) return;

		const productToAdd = {
			...displayProduct,
			id: displayProduct.id || displayProduct.productId,
			productId: displayProduct.productId || displayProduct.id,
			selectedVariantId: selectedVariant.variantId || selectedVariant.id,
			variantId: selectedVariant.variantId || selectedVariant.id,
			price: price
		};

		console.log('[PRODUCT DETAIL] Adding to cart:', productToAdd);
		addToCart(productToAdd, selectedQty);

		// Show feedback
		addedToCart = true;
		setTimeout(() => {
			addedToCart = false;
		}, 2000);
	};

	function selectVariant(variant) {
		selectedVariant = variant;
	}
</script>

<div class="mx-auto max-w-7xl pt-6 pb-20">
	<!-- Breadcrumb -->
	<nav
		class="mb-10 flex items-center gap-2 font-mono text-[10px] tracking-widest text-gray-500 uppercase"
		aria-label="Breadcrumb"
	>
		<a href="/" class="transition-colors hover:text-black">Index</a>
		<span>/</span>
		<a href="/products" class="transition-colors hover:text-black">Hardware</a>
		<span>/</span>
		<span class="font-bold text-retro-black">{displayProduct?.category || 'Uncategorized'}</span>
	</nav>

	<div class="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
		<!-- Left: Images -->
		<div class="flex flex-col gap-6 lg:col-span-7">
			<!-- Main Image -->
			<div class="group relative aspect-square overflow-hidden border border-black/5 bg-[#f0eee6]">
				<img
					src={mainImage}
					alt={displayProduct?.title}
					class="h-full w-full object-cover object-center mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
					loading="eager"
				/>
				<div
					class="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-50"
				></div>
			</div>
		</div>

		<!-- Right: Product Info -->
		<div class="flex h-full flex-col lg:col-span-5">
			<!-- Header -->
			<div class="mb-8 flex items-start justify-between border-b border-black/10 pb-6">
				<div>
					<h1 class="mb-2 font-serif text-4xl leading-tight text-retro-black md:text-5xl">
						{displayProduct?.title || 'Unknown Device'}
					</h1>
					<p class="font-mono text-xs tracking-widest text-gray-500 uppercase">
						SKU: {displayProduct?.sku || 'N/A'}
					</p>
				</div>
			</div>

			<!-- Price & Reviews -->
			<div class="mb-8">
				<span class="font-mono text-3xl tracking-tighter text-retro-black md:text-4xl">
					{formattedPrice}
				</span>
				<div class="mt-1 flex gap-1 text-[10px] text-gray-500 uppercase">
					<span>★★★★★</span>
					<span>(42 Verified Logs)</span>
				</div>
				<!-- Stock Display -->
				{#if stock !== null}
					<div
						class="mt-2 font-mono text-xs {isOutOfStock
							? 'text-red-600'
							: isLowStock
								? 'text-orange-600'
								: 'text-gray-600'}"
					>
						Stock: {stock} {isOutOfStock ? '(Out of Stock)' : isLowStock ? '(Low Stock)' : 'available'}
					</div>
				{/if}
			</div>

			<!-- Metadata Badges -->
			<ProductBadges product={displayProduct} />

			<!-- Description -->
			<p class="mb-6 font-serif text-lg leading-relaxed text-gray-800">
				{displayProduct?.description ||
					'Authentic retro-futuristic hardware. Restored for modern neural interfaces. Minimal wear on the chassis, full functionality guaranteed.'}
			</p>

			<!-- Story -->
			{#if displayProduct?.metadata?.story}
				<div class="mb-6 border-l-4 border-retro-black bg-gray-50 p-4">
					<p class="font-serif text-sm leading-relaxed text-gray-700 italic">
						{displayProduct.metadata.story}
					</p>
				</div>
			{/if}

			<!-- Tags -->
			{#if displayProduct?.metadata?.tags && displayProduct.metadata.tags.length > 0}
				<div class="mb-6">
					<p class="mb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">Tags</p>
					<div class="flex flex-wrap gap-2">
						{#each displayProduct.metadata.tags as tag}
							<span class="bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
								#{tag}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Variants Selection -->
			{#if displayProduct?.variants && displayProduct.variants.length > 1}
				<div class="mb-10 space-y-6 font-mono text-xs">
					<div>
						<span class="mb-3 block tracking-widest text-gray-400 uppercase">Select Variant</span>
						<div class="flex flex-wrap gap-3">
							{#each displayProduct.variants as variant}
								<button
									on:click={() => selectVariant(variant)}
									class="border px-4 py-2.5 transition-colors {(selectedVariant.variantId ||
										selectedVariant.id) === (variant.variantId || variant.id)
										? 'border-black bg-black text-white'
										: 'border-gray-300 text-gray-700 hover:border-black'} uppercase"
								>
									{variant.name}
									{#if variant.price}
										<span class="ml-2 text-[10px]">${variant.price}</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Add to Cart Section -->
			<div class="mt-auto">
				<div class="mb-6 flex h-14 gap-4">
					<!-- Quantity Selector -->
					<QuantitySelector
						quantity={selectedQty}
						min={1}
						max={99}
						onQuantityChange={handleQuantityChange}
					/>

					<!-- Add to Cart Button -->
					<button
						on:click={handleAddToCart}
						disabled={isOutOfStock}
						class="relative flex flex-1 items-center justify-center gap-2 overflow-hidden bg-retro-black font-mono tracking-widest text-retro-bone uppercase transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-retro-black"
					>
						{#if addedToCart}
							<span class="animate-pulse">✓ Added to Cart</span>
						{:else if isOutOfStock}
							<span>Out of Stock</span>
						{:else}
							<span>Add to Cart</span>
						{/if}
					</button>

					<!-- Wishlist Button -->
					<button
						class="flex w-14 items-center justify-center border border-black/20 transition-colors hover:bg-black hover:text-white"
						aria-label="Add to wishlist"
					>
						♥
					</button>
				</div>

				<!-- Info -->
				<div
					class="flex flex-col gap-2 font-mono text-[10px] tracking-widest text-gray-500 uppercase"
				>
					<div class="flex items-center gap-2">
						<span>◆</span>
						<span>Free Shipping on Orders Over $300</span>
					</div>
					<div class="flex items-center gap-2">
						<span>◆</span>
						<span>30-Day Return Protocol</span>
					</div>
					<div class="flex items-center gap-2">
						<span>◆</span>
						<span>Authenticity Verified</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Additional Details Section -->
	<div class="mt-20 border-t border-black/10 pt-12">
		<div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
			<!-- Specifications -->
			<div>
				<h3 class="mb-4 font-serif text-2xl">Specifications</h3>
				<ul class="space-y-2 font-mono text-xs text-gray-600">
					{#if displayProduct?.metadata?.brand}
						<li>• Brand: {displayProduct.metadata.brand}</li>
					{/if}
					{#if displayProduct?.metadata?.dimensions}
						<li>• Dimensions: {displayProduct.metadata.dimensions}</li>
					{/if}
					{#if displayProduct?.metadata?.weight}
						<li>• Weight: {displayProduct.metadata.weight}</li>
					{/if}
					{#if displayProduct?.metadata?.energyRating}
						<li>• Energy Rating: {displayProduct.metadata.energyRating}</li>
					{/if}
					{#if displayProduct?.metadata?.compatibility}
						<li>• Compatibility: {displayProduct.metadata.compatibility}</li>
					{/if}
					{#if displayProduct?.metadata?.attributes}
						{#each Object.entries(displayProduct.metadata.attributes) as [key, value]}
							<li>• {key}: {value}</li>
						{/each}
					{/if}
					{#if !displayProduct?.metadata?.attributes && !displayProduct?.metadata?.brand}
						<li>• Neural Interface Compatible</li>
						<li>• Analog Tactile Feedback</li>
						<li>• Restored Components</li>
						<li>• Quality Grade: A</li>
					{/if}
				</ul>
			</div>

			<!-- Product Details -->
			<div>
				<h3 class="mb-4 font-serif text-2xl">Product Details</h3>
				<ul class="space-y-2 font-mono text-xs text-gray-600">
					{#if displayProduct?.metadata?.timeline}
						<li class="mb-3">
							<span class="font-bold">Timeline:</span><br />
							<span class="text-gray-500">{displayProduct.metadata.timeline}</span>
						</li>
					{/if}
					{#if displayProduct?.metadata?.origin}
						<li>• Origin: {displayProduct.metadata.origin}</li>
					{/if}
					{#if displayProduct?.metadata?.certification}
						<li>• {displayProduct.metadata.certification}</li>
					{/if}
					{#if displayProduct?.metadata?.collectorNotes}
						<li class="mt-3 text-gray-500 italic">
							{displayProduct.metadata.collectorNotes}
						</li>
					{/if}
				</ul>
			</div>

			<!-- Warranty & Shipping -->
			<div>
				<h3 class="mb-4 font-serif text-2xl">Warranty & Shipping</h3>
				<div class="space-y-4 font-mono text-xs text-gray-600">
					{#if displayProduct?.metadata?.warranty}
						<p class="leading-relaxed">
							<span class="font-bold">Warranty:</span><br />
							{displayProduct.metadata.warranty}
						</p>
					{:else}
						<p class="leading-relaxed">
							<span class="font-bold">Warranty:</span><br />
							90-day limited warranty covering manufacturing defects. Does not cover wear from regular
							use or accidental damage.
						</p>
					{/if}
					<p class="leading-relaxed">
						<span class="font-bold">Shipping:</span><br />
						Standard ground shipping: 5-7 business days. Express available at checkout. International
						shipping rates calculated at checkout.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 1s ease-in-out infinite;
	}
</style>
