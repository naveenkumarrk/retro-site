<script>
	export let product;
</script>

{#if product?.metadata}
	<div class="mb-6 flex flex-wrap gap-2">
		{#if product.metadata.era}
			<span
				class="bg-gray-100 px-3 py-1.5 font-mono text-xs tracking-widest text-gray-700 uppercase"
			>
				Era: {product.metadata.era}
			</span>
		{/if}
		{#if product.metadata.condition}
			<span
				class="bg-gray-100 px-3 py-1.5 font-mono text-xs tracking-widest text-gray-700 uppercase"
			>
				{product.metadata.condition}
			</span>
		{/if}
		{#if product.metadata.rarity}
			<span
				class="px-3 py-1.5 font-mono text-xs tracking-widest uppercase {product.metadata.rarity ===
				'ultra-rare'
					? 'bg-purple-100 text-purple-700'
					: product.metadata.rarity === 'rare'
						? 'bg-blue-100 text-blue-700'
						: 'bg-gray-100 text-gray-700'}"
			>
				{product.metadata.rarity}
			</span>
		{/if}
		{#if product.metadata.isFeatured}
			<span
				class="bg-yellow-100 px-3 py-1.5 font-mono text-xs tracking-widest text-yellow-700 uppercase"
			>
				Featured
			</span>
		{/if}
	</div>
{/if}

