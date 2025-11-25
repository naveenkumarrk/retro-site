<script>
	import {
		isCartOpen,
		cartItems,
		cartTotal,
		updateItem,
		removeItem,
		clearCart,
		isLoading,
		loadCartOnOpen
	} from '$lib/stores/cart.js';
	import { fly, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';

	// Track previous cart open state to detect when cart opens
	let previousCartOpenState = false;

	// Load cart when drawer opens (only once per open)
	$: {
		if ($isCartOpen && !previousCartOpenState) {
			// Cart just opened, load cart data
			loadCartOnOpen();
		}
		previousCartOpenState = $isCartOpen;
	}

	const close = () => isCartOpen.set(false);

	// Helper to handle quantity changes
	const handleQty = (item, change) => {
		const id = item.productId;
		const variantId = item.variantId || null;
		const newQty = (item.qty || 0) + change;
		if (newQty <= 0) {
			// Use remove endpoint if quantity would be 0 or less
			removeItem(item.productId, item.variantId);
		} else {
			updateItem(id, newQty, variantId);
		}
	};

	const handleRemove = (item) => {
		removeItem(item.productId, item.variantId);
	};

	// Navigate to checkout
	const proceedToCheckout = () => {
		close();
		goto('/checkout');
	};
</script>

{#if $isCartOpen}
	<div
		transition:fade={{ duration: 200 }}
		on:click={close}
		on:keydown={(e) => e.key === 'Escape' && close()}
		class="fixed inset-0 z-[60] bg-retro-black/20 backdrop-blur-sm"
		role="button"
		tabindex="0"
		aria-label="Close cart overlay"
	></div>

	<div
		transition:fly={{ x: 400, duration: 400, opacity: 1 }}
		class="fixed top-0 right-0 z-[70] flex h-full w-full flex-col border-l border-retro-black/10 bg-retro-bone shadow-2xl md:w-[450px]"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-retro-black/10 px-8 py-6">
			<div class="flex items-baseline gap-3">
				<h2 class="font-serif text-2xl text-retro-black">Cart</h2>
				{#if $isLoading}
					<span class="animate-pulse font-mono text-[10px] text-gray-400">SYNCING...</span>
				{/if}
			</div>
			<button
				on:click={close}
				class="font-mono text-xs tracking-widest uppercase transition-colors hover:text-gray-500"
				aria-label="Close cart"
			>
				[Close]
			</button>
		</div>

		<!-- Cart Items -->
		<div class="relative flex-1 space-y-8 overflow-y-auto px-8 py-6">
			{#if $cartItems.length === 0}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<span class="mb-4 block text-5xl">📦</span>
					<p class="font-serif text-xl text-gray-800">Cart is Empty</p>
					<p class="mt-2 font-mono text-xs text-gray-500">Add items to get started</p>
					<a
						href="/products"
						on:click={close}
						class="mt-6 inline-block bg-retro-black px-6 py-2 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
					>
						Browse Products
					</a>
				</div>
			{:else}
				{#each $cartItems as item (item.productId)}
					<div class="group flex gap-4">
						<div class="relative h-24 w-20 flex-shrink-0 overflow-hidden bg-[#f0eee6]">
							<img
								src={item.image || 'https://placehold.co/100x120/EAE8E0/1A1A1A?text=NO+IMG'}
								alt={item.title}
								class="h-full w-full object-cover mix-blend-multiply"
							/>
						</div>

						<div class="flex flex-1 flex-col justify-between py-1">
							<div>
								<h3 class="mb-1 font-serif text-lg leading-none">{item.title}</h3>

								<p class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">
									Unit: ${item.unitPrice ? item.unitPrice.toLocaleString() : '0.00'}
								</p>
							</div>

							<div class="flex items-end justify-between font-mono text-xs">
								<div
									class="flex items-center gap-3 border border-retro-black/20 px-2 py-1 select-none"
								>
									<button
										on:click={() => handleQty(item, -1)}
										disabled={item.qty <= 1}
										class="px-1 transition-opacity hover:text-gray-500 disabled:cursor-not-allowed disabled:opacity-30"
										aria-label="Decrease quantity"
									>
										-
									</button>
									<span>{item.qty}</span>
									<button
										on:click={() => handleQty(item, 1)}
										class="px-1 transition-colors hover:text-gray-500"
										aria-label="Increase quantity"
									>
										+
									</button>
								</div>

								<button
									on:click={() => handleRemove(item)}
									class="text-[10px] underline decoration-1 underline-offset-2 transition-colors hover:text-red-600"
									aria-label="Remove item"
								>
									Remove
								</button>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Footer -->
		<div class="border-t border-retro-black/10 bg-retro-bone/80 p-8 backdrop-blur-md">
			{#if $cartItems.length > 0}
				<div class="mb-4 flex justify-end">
					<button
						on:click={clearCart}
						class="border-b border-transparent font-mono text-[10px] tracking-widest text-gray-400 uppercase transition-all hover:border-red-600 hover:text-red-600"
						aria-label="Clear cart"
					>
						Purge System
					</button>
				</div>
			{/if}

			<div class="mb-6 flex items-baseline justify-between font-mono">
				<span class="text-xs tracking-widest text-gray-500 uppercase">Subtotal</span>
				<span class="text-xl font-bold">${$cartTotal.toLocaleString()}</span>
			</div>

			<button
				on:click={proceedToCheckout}
				disabled={$cartItems.length === 0 || $isLoading}
				class="group flex w-full items-center justify-between bg-retro-black px-6 py-4 font-mono text-xs tracking-[0.2em] text-retro-bone uppercase transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
				aria-label="Proceed to checkout"
			>
				<span>Proceed to Checkout</span>
				<span class="transition-transform group-hover:translate-x-1">→</span>
			</button>

			{#if $cartItems.length === 0}
				<p class="mt-4 text-center font-mono text-[10px] tracking-widest text-gray-400 uppercase">
					Add items to proceed
				</p>
			{/if}
		</div>
	</div>
{/if}
