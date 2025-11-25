<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let reason = '';
	let errorDetails = '';
	let paypalDebugId = '';
	let showDetails = false;

	onMount(() => {
		reason = $page.url.searchParams.get('reason') || 'Payment processing failed';
		errorDetails = decodeURIComponent(reason);
		
		// Check for stored error details from PayPal
		const storedError = sessionStorage.getItem('paymentError');
		if (storedError) {
			try {
				const error = JSON.parse(storedError);
				if (error.message) {
					errorDetails = error.message;
				}
				if (error.paypalDebugId) {
					paypalDebugId = error.paypalDebugId;
				}
				// Clear stored error after reading
				sessionStorage.removeItem('paymentError');
			} catch (e) {
				console.error('Failed to parse stored error:', e);
			}
		}
	});
</script>

<svelte:head>
	<title>Payment Failed - CyberVintage</title>
</svelte:head>

<div class="mx-auto max-w-3xl py-12 md:py-20">
	<div class="mb-12 text-center">
		<!-- Error Icon -->
		<div class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
			<svg class="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				></path>
			</svg>
		</div>

		<h1 class="mb-4 font-serif text-5xl md:text-6xl">Payment Processing Failed</h1>
		<p class="mx-auto max-w-lg font-mono text-sm text-gray-600">
			We encountered an issue processing your payment. Please review the details below and try again.
		</p>
	</div>

	<!-- Error Details -->
	<div class="mb-8 border border-red-200 bg-red-50 p-8">
		<h2 class="mb-4 font-serif text-xl text-red-900">Error Details</h2>
		<p class="mb-4 font-mono text-sm text-red-800">
			{errorDetails}
		</p>
		{#if paypalDebugId}
			<p class="font-mono text-xs text-red-600">
				Reference ID: {paypalDebugId}
			</p>
		{/if}
		<button
			on:click={() => showDetails = !showDetails}
			class="mt-4 font-mono text-xs text-red-700 underline hover:opacity-70"
		>
			{showDetails ? 'Hide' : 'Show'} Technical Details
		</button>
		{#if showDetails}
			<pre class="mt-4 overflow-auto rounded bg-red-100 p-4 font-mono text-xs text-red-900">{JSON.stringify({ reason, errorDetails, paypalDebugId }, null, 2)}</pre>
		{/if}
	</div>

	<!-- Common Issues -->
	<div class="mb-8 border border-gray-200 bg-white p-8">
		<h2 class="mb-6 font-serif text-2xl">Possible Causes</h2>
		<div class="space-y-4 font-mono text-sm">
			<div class="flex gap-4">
				<span class="shrink-0 font-bold text-retro-black">•</span>
				<div>
					<p class="mb-1 font-bold">Insufficient Funds</p>
					<p class="text-gray-600">
						Check your account balance or try a different payment method
					</p>
				</div>
			</div>

			<div class="flex gap-4">
				<span class="shrink-0 font-bold text-retro-black">•</span>
				<div>
					<p class="mb-1 font-bold">Card Declined</p>
					<p class="text-gray-600">Contact your bank or credit card issuer for assistance</p>
				</div>
			</div>

			<div class="flex gap-4">
				<span class="shrink-0 font-bold text-retro-black">•</span>
				<div>
					<p class="mb-1 font-bold">Expired Card</p>
					<p class="text-gray-600">Verify your card expiration date and update if needed</p>
				</div>
			</div>

			<div class="flex gap-4">
				<span class="shrink-0 font-bold text-retro-black">•</span>
				<div>
					<p class="mb-1 font-bold">Incorrect Information</p>
					<p class="text-gray-600">Double-check your billing address and card details</p>
				</div>
			</div>
		</div>
	</div>

	<!-- What to Do -->
	<div class="mb-8 border border-gray-200 bg-gray-50 p-8">
		<h2 class="mb-6 font-serif text-2xl">Next Steps</h2>
		<div class="space-y-3 font-mono text-sm text-gray-600">
			<p>1. Verify your payment information is correct</p>
			<p>2. Try a different payment method if available</p>
			<p>3. Contact your bank to authorize the transaction</p>
			<p>4. Wait a few minutes and try again</p>
			<p>5. Contact support if the issue persists</p>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex flex-col justify-center gap-4 md:flex-row">
		<button
			on:click={() => goto('/checkout')}
			class="inline-block bg-retro-black px-8 py-4 text-center text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
		>
			Try Again
		</button>

		<a
			href="/products"
			class="inline-block border border-retro-black px-8 py-4 text-center text-xs tracking-widest text-retro-black uppercase transition-colors hover:bg-retro-bone"
		>
			Continue Shopping
		</a>
	</div>

	<!-- Support -->
	<div class="mt-12 border-t border-gray-200 pt-8 text-center">
		<p class="mb-4 font-mono text-xs text-gray-500">Need assistance?</p>
		<div class="flex flex-col items-center justify-center gap-4 md:flex-row">
			<a href="/contact" class="font-mono text-xs underline hover:opacity-70">Contact Support</a>
			<span class="hidden text-gray-300 md:block">•</span>
			<a href="mailto:support@cybervintage.com" class="font-mono text-xs underline hover:opacity-70"
				>support@cybervintage.com</a
			>
		</div>
	</div>

	<!-- Cart Saved Notice -->
	<div class="mt-12 border border-blue-200 bg-blue-50 p-6">
		<div class="flex items-start gap-3">
			<svg
				class="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<div>
				<p class="mb-1 font-mono text-xs font-bold text-blue-900">Your Cart is Saved</p>
				<p class="font-mono text-xs text-blue-800">
					Don't worry! Your items are still in your cart and will be there when you're ready to try
					again.
				</p>
			</div>
		</div>
	</div>
</div>
