<script>
	import './layout.css';
	import { onMount } from 'svelte';
	import { initCart, cartCount, isCartOpen, loadCartOnOpen } from '$lib/stores/cart.js';
	import CartDrawer from '$lib/components/CartDrawer.svelte';

	let mobileMenuOpen = false;

	onMount(() => {
		// Only initialize cart ID, don't fetch cart data
		initCart();
	});

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	async function handleCartClick() {
		// Open cart - CartDrawer will handle loading if needed
		// Don't call loadCartOnOpen here to avoid double fetch
		isCartOpen.set(true);
	}
</script>

<div
	class="relative z-10 min-h-screen font-mono text-retro-black selection:bg-retro-black selection:text-retro-bone"
>
	<CartDrawer />

	<!-- Fixed Header -->
	<header
		class="fixed top-0 left-0 z-50 w-full border-b border-black/10 bg-retro-bone/90 backdrop-blur-md"
	>
		<div class="flex items-center justify-between px-6 py-5 md:px-10">
			<!-- Logo -->
			<div class="w-1/4">
				<a href="/" class="font-serif text-2xl tracking-tight transition-opacity hover:opacity-70">
					CYBER<span class="text-gray-500 italic">VINTAGE</span>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<nav class="hidden w-2/4 justify-center gap-8 text-xs tracking-widest uppercase md:flex">
				<a href="/products" class="decoration-1 underline-offset-4 transition-all hover:underline"
					>Shop</a
				>
				<a href="/about" class="decoration-1 underline-offset-4 transition-all hover:underline"
					>Visit</a
				>
				<a href="/journal" class="decoration-1 underline-offset-4 transition-all hover:underline"
					>Discover</a
				>
			</nav>

			<!-- Desktop Actions -->
			<div class="hidden w-1/4 justify-end gap-6 text-xs tracking-widest uppercase md:flex">
				<button class="transition-opacity hover:opacity-70">Search</button>
				<a href="/account" class="transition-opacity hover:opacity-70">Account</a>
				<button
					on:click={handleCartClick}
					class="relative transition-opacity hover:opacity-70"
				>
					Cart
					{#if $cartCount > 0}
						<span class="ml-1">({$cartCount})</span>
					{/if}
				</button>
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="flex w-6 flex-col gap-1.5 md:hidden"
				on:click={toggleMobileMenu}
				aria-label="Toggle menu"
			>
				<span
					class="h-0.5 w-full bg-retro-black transition-all {mobileMenuOpen
						? 'translate-y-2 rotate-45'
						: ''}"
				></span>
				<span class="h-0.5 w-full bg-retro-black transition-all {mobileMenuOpen ? 'opacity-0' : ''}"
				></span>
				<span
					class="h-0.5 w-full bg-retro-black transition-all {mobileMenuOpen
						? '-translate-y-2 -rotate-45'
						: ''}"
				></span>
			</button>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<nav class="border-t border-black/10 bg-retro-bone/95 backdrop-blur-md md:hidden">
				<div class="flex flex-col gap-4 px-6 py-4 text-xs tracking-widest uppercase">
					<a href="/products" class="py-2 hover:opacity-70" on:click={toggleMobileMenu}>Shop</a>
					<a href="/about" class="py-2 hover:opacity-70" on:click={toggleMobileMenu}>Visit</a>
					<a href="/journal" class="py-2 hover:opacity-70" on:click={toggleMobileMenu}>Discover</a>
					<div class="mt-2 border-t border-black/10 pt-4">
						<button class="block w-full py-2 text-left hover:opacity-70">Search</button>
						<a href="/account" class="block py-2 hover:opacity-70" on:click={toggleMobileMenu}
							>Account</a
						>
						<button
							on:click={() => {
								isCartOpen.set(true);
								toggleMobileMenu();
							}}
							class="block w-full py-2 text-left hover:opacity-70"
						>
							Cart ({$cartCount})
						</button>
					</div>
				</div>
			</nav>
		{/if}
	</header>

	<!-- Main Content -->
	<main class="relative z-10 px-6 pt-24 pb-20 md:px-10">
		<slot />
	</main>

	<!-- Footer -->
	<footer class="relative z-10 border-t border-black/10 px-6 py-16 md:px-10">
		<div class="mx-auto mb-12 grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
			<!-- Brand -->
			<div>
				<h3 class="mb-4 font-serif text-2xl">
					CYBER<span class="text-gray-500 italic">VINTAGE</span>
				</h3>
				<p class="text-xs leading-relaxed text-gray-600">
					Authentic retro-futuristic hardware restored for the modern era.
				</p>
			</div>

			<!-- Shop -->
			<div>
				<h4 class="mb-4 text-[10px] tracking-widest text-gray-500 uppercase">Shop</h4>
				<ul class="space-y-2 text-xs">
					<li><a href="/products" class="hover:underline">All Products</a></li>
					<li><a href="/products?category=hardware" class="hover:underline">Hardware</a></li>
					<li><a href="/products?category=consoles" class="hover:underline">Consoles</a></li>
					<li><a href="/products?new=true" class="hover:underline">New Arrivals</a></li>
				</ul>
			</div>

			<!-- Support -->
			<div>
				<h4 class="mb-4 text-[10px] tracking-widest text-gray-500 uppercase">Support</h4>
				<ul class="space-y-2 text-xs">
					<li><a href="/account" class="hover:underline">My Account</a></li>
					<li><a href="/orders" class="hover:underline">Track Order</a></li>
					<li><a href="/returns" class="hover:underline">Returns</a></li>
					<li><a href="/contact" class="hover:underline">Contact</a></li>
				</ul>
			</div>

			<!-- Connect -->
			<div>
				<h4 class="mb-4 text-[10px] tracking-widest text-gray-500 uppercase">Connect</h4>
				<ul class="space-y-2 text-xs">
					<li><a href="/about" class="hover:underline">About</a></li>
					<li><a href="/journal" class="hover:underline">Journal</a></li>
					<li><a href="/newsletter" class="hover:underline">Newsletter</a></li>
				</ul>
			</div>
		</div>

		<div class="border-t border-black/5 pt-8 text-center">
			<p class="text-[10px] tracking-widest uppercase opacity-50">
				© 2025 CyberVintage Systems — All Rights Reserved
			</p>
		</div>
	</footer>
</div>

