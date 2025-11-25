<script>
	import { goto } from '$app/navigation';
	import { addToCart } from '$lib/stores/cart.js';

	export let product;
	export let showQuickAdd = true;

	$: productId = product.productId || product.id;
	$: stock = product?.metadata?.stock ?? product?.stock ?? null;
	$: isOutOfStock = stock !== null && stock !== undefined && stock === 0;
	$: price = product.price || product.metadata?.price || product.variants?.[0]?.price || 0;
	$: image = product.image || product.images?.[0] || 'https://placehold.co/400x500/EAE8E0/1A1A1A?text=NO+IMAGE';

	function handleClick() {
		goto(`/products/${productId}`);
	}

	function handleAddToCart(e) {
		e.stopPropagation();
		if (!isOutOfStock) {
			addToCart(product, 1);
		}
	}
</script>

<div
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && handleClick()}
	role="button"
	tabindex="0"
	class="group relative flex cursor-pointer flex-col transition-transform hover:scale-[1.02] {isOutOfStock
		? 'opacity-60'
		: ''}"
>
	<div class="relative mb-4 aspect-[4/5] overflow-hidden bg-[#f0eee6]">
		<!-- Badges -->
		{#if product.isBestSeller}
			<span
				class="absolute top-4 left-4 z-10 bg-retro-bone/95 px-3 py-1.5 text-[10px] tracking-widest uppercase shadow-sm backdrop-blur-sm"
			>
				Best Seller
			</span>
		{/if}
		{#if product.isNew}
			<span
				class="absolute top-4 {product.isBestSeller ? 'left-20' : 'left-4'} z-10 bg-retro-bone/95 px-3 py-1.5 text-[10px] tracking-widest uppercase shadow-sm backdrop-blur-sm"
			>
				New Arrival
			</span>
		{/if}
		{#if isOutOfStock}
			<span
				class="absolute top-4 right-4 z-10 bg-red-600 px-3 py-1.5 text-[10px] tracking-widest uppercase text-white shadow-sm"
			>
				Out of Stock
			</span>
		{/if}

		<!-- Product Image -->
		<img
			src={image}
			alt={product.title}
			class="h-full w-full object-cover object-center grayscale transition-all duration-700 ease-out group-hover:scale-110 group-hover:grayscale-0 {isOutOfStock
				? 'blur-sm'
				: ''}"
			loading="lazy"
		/>

		<!-- Quick Add Button (on hover) -->
		{#if showQuickAdd}
			<div
				class="absolute bottom-0 left-0 w-full translate-y-full bg-retro-black p-4 text-retro-bone transition-transform duration-300 ease-in-out group-hover:translate-y-0"
			>
				<button
					on:click={handleAddToCart}
					disabled={isOutOfStock}
					class="w-full border border-white/20 py-2.5 text-xs tracking-widest uppercase transition-all hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white"
				>
					{isOutOfStock ? 'Out of Stock' : `Add to Cart — $${price.toFixed(2)}`}
				</button>
			</div>
		{/if}
	</div>

	<!-- Product Info -->
	<div class="flex flex-col gap-1.5">
		<h3 class="font-serif text-lg font-semibold tracking-tight leading-tight">
			{product.title}
		</h3>
		<p class="font-mono text-xs text-gray-500 line-clamp-2">
			{product.description || 'Specifications unavailable'}
		</p>
		<p class="mt-1 font-mono text-sm font-semibold">
			${price.toFixed(2)}
		</p>
	</div>
</div>

