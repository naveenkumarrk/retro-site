<script>
	import { goto } from '$app/navigation';

	export let product;

	$: productId = product.productId || product.id;
	$: image = product.image || product.images?.[0] || 'https://placehold.co/400x500/EAE8E0/1A1A1A?text=NO+IMAGE';
	$: price = product.price || product.metadata?.price || product.variants?.[0]?.price || 0;

	function getProductTag() {
		if (product.metadata?.rarity === 'ultra-rare') return 'ULTRA RARE';
		if (product.metadata?.rarity === 'rare') return 'RARE';
		if (product.isNew || product.metadata?.isNew) return 'NEW';
		if (product.isBestSeller || product.metadata?.isBestSeller) return 'BEST';
		if (product.metadata?.isFeatured) return 'FEATURED';
		return 'FEATURED';
	}

	function handleClick() {
		goto(`/products/${productId}`);
	}
</script>

<div
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && handleClick()}
	role="button"
	tabindex="0"
	class="group cursor-pointer transition-transform hover:scale-[1.02]"
>
	<div class="relative mb-6 aspect-[3/4] overflow-hidden bg-[#f0eee6]">
		<span
			class="absolute top-4 left-4 z-10 bg-retro-bone/95 px-3 py-1.5 text-[10px] tracking-widest uppercase shadow-sm backdrop-blur-sm"
		>
			{getProductTag()}
		</span>
		<img
			src={image}
			alt={product.title}
			class="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
			loading="lazy"
		/>
	</div>

	<div class="space-y-2">
		<h3 class="font-serif text-2xl leading-tight">{product.title}</h3>
		<p class="font-mono text-xs tracking-wide text-gray-500 uppercase line-clamp-2">
			{product.description || product.metadata?.story || 'Authentic retro-futuristic hardware'}
		</p>
		<p class="pt-2 font-mono text-sm font-semibold">${price.toFixed(2)}</p>
	</div>
</div>

