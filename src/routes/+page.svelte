<script>
	export let data;
	import { goto } from '$app/navigation';
	import FeaturedProductCard from '$lib/components/FeaturedProductCard.svelte';

	// Featured products from API
	$: featuredProducts = data.featuredProducts || [];
</script>

<!-- Hero Section -->
<section class="relative -mt-12 flex min-h-[85vh] flex-col justify-center overflow-hidden">
	<div class="absolute inset-0 opacity-5">
		<div class="absolute top-20 left-10 h-96 w-96 rounded-full border border-retro-black"></div>
		<div class="absolute right-20 bottom-20 h-[500px] w-[500px] border border-retro-black"></div>
	</div>

	<div class="relative z-10 max-w-5xl">
		<p class="mb-6 font-mono text-xs tracking-[0.3em] text-gray-500 uppercase">
			EST. 2025 — RETROFUTURE SYSTEMS
		</p>

		<h1 class="mb-8 font-serif text-7xl leading-[0.85] text-retro-black md:text-9xl">
			Tech From<br />
			<span class="text-gray-400 italic">Another</span><br />
			Timeline
		</h1>

		<p class="mb-12 max-w-md font-mono text-sm leading-relaxed text-gray-700">
			Curated cybernetic hardware. Authenticated retro consoles. Neural interfaces for the
			discerning collector. Every item certified, restored, and ready for the grid.
		</p>

		<div class="flex gap-4">
			<button
				on:click={() => goto('/products')}
				class="flex items-center gap-3 bg-retro-black px-8 py-4 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
			>
				<span>Browse Inventory</span>
				<span>→</span>
			</button>

			<button
				on:click={() => goto('/about')}
				class="border border-retro-black px-8 py-4 text-xs tracking-widest uppercase transition-colors hover:bg-retro-black hover:text-retro-bone"
			>
				Our Mission
			</button>
		</div>
	</div>
</section>

<!-- Featured Collections -->
<section class="border-t border-retro-black/10 py-24">
	<div class="mb-16 flex items-baseline justify-between">
		<h2 class="font-serif text-5xl">Featured Modules</h2>
		<a
			href="/products"
			class="font-mono text-xs tracking-widest uppercase underline decoration-1 underline-offset-4 hover:opacity-60"
		>
			View All →
		</a>
	</div>

	{#if featuredProducts.length > 0}
		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			{#each featuredProducts as product}
				<FeaturedProductCard {product} />
			{/each}
		</div>
	{:else}
		<div class="py-12 text-center">
			<p class="font-mono text-sm text-gray-500">No featured products available at the moment.</p>
		</div>
	{/if}
</section>

<!-- Philosophy Section -->
<section class="border-t border-retro-black/10 py-24">
	<div class="max-w-3xl">
		<p class="mb-6 font-mono text-[10px] tracking-[0.3em] text-gray-400 uppercase">MANIFESTO</p>
		<h2 class="mb-8 font-serif text-5xl leading-tight">
			Technology shouldn't feel disposable. It should feel <span class="text-gray-400 italic"
				>timeless</span
			>.
		</h2>
		<p class="font-mono text-sm leading-relaxed text-gray-700">
			We source, authenticate, and restore vintage computing hardware and cybernetic components from
			parallel timelines. Each piece tells a story. Each circuit holds history. Welcome to the
			intersection of nostalgia and innovation.
		</p>
	</div>
</section>

<!-- Stats Grid -->
<section class="border-t border-retro-black/10 py-24">
	<div class="grid grid-cols-2 gap-12 md:grid-cols-4">
		<div class="text-center">
			<p class="mb-2 font-mono text-4xl font-bold">1,247</p>
			<p class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Items Restored</p>
		</div>
		<div class="text-center">
			<p class="mb-2 font-mono text-4xl font-bold">98%</p>
			<p class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Satisfaction Rate</p>
		</div>
		<div class="text-center">
			<p class="mb-2 font-mono text-4xl font-bold">30d</p>
			<p class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Return Protocol</p>
		</div>
		<div class="text-center">
			<p class="mb-2 font-mono text-4xl font-bold">∞</p>
			<p class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Timelines Sourced</p>
		</div>
	</div>
</section>

<!-- Newsletter -->
<section class="border-t border-retro-black/10 py-24">
	<div class="mx-auto max-w-2xl text-center">
		<h2 class="mb-4 font-serif text-4xl">Join The Network</h2>
		<p class="mb-8 font-mono text-xs tracking-widest text-gray-500 uppercase">
			Receive intel on new arrivals, rare finds, and system updates
		</p>

		<form class="mx-auto flex max-w-md gap-3">
			<input
				type="email"
				placeholder="neural.link@example.com"
				class="flex-1 border border-retro-black/20 px-4 py-3 font-mono text-xs focus:border-retro-black focus:outline-none"
			/>
			<button
				type="submit"
				class="bg-retro-black px-6 py-3 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
			>
				Subscribe
			</button>
		</form>
	</div>
</section>
