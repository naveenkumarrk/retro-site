<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { clearCart } from '$lib/stores/cart.js';
	import { API_URL } from '$lib/config.js';

	let loading = true;
	let errorMessage = '';
	let order = null;

	// Get params from URL
	$: orderId = $page.url.searchParams.get('orderId') || 'ERR-NO-ID';
	$: total = $page.url.searchParams.get('total') || '0.00';
	$: email = $page.url.searchParams.get('email') || 'customer@example.com';

	// Extract order data for easier access
	$: orderItems = order?.items_json || order?.items || [];
	$: orderAddress = order?.address_json || order?.address;
	$: orderShipping = order?.shipping_json || order?.shipping;
	$: orderPayment = order?.payment_json || order?.payment;

	// Format date from order or use current date
	// Handle both created_at (timestamp) and createdAt formats
	$: orderDate = (() => {
		if (order?.created_at) {
			// created_at is in milliseconds
			return new Date(order.created_at).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} else if (order?.createdAt) {
			// createdAt might be in seconds, multiply by 1000
			const timestamp =
				typeof order.createdAt === 'number' && order.createdAt < 10000000000
					? order.createdAt * 1000
					: order.createdAt;
			return new Date(timestamp).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		}
		return new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	})();

	// Fetch order details
	async function fetchOrderDetails(orderId) {
		const token = localStorage.getItem('auth_token');
		if (!token) {
			errorMessage = 'Authentication required';
			return;
		}

		try {
			const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
				headers: {
					Authorization: `Bearer ${token.trim()}`
				}
			});

			if (!res.ok) {
				throw new Error('Failed to fetch order details');
			}

			const orderData = await res.json();
			order = orderData;

			// Handle order structure: order_id, items_json, address_json, shipping_json, payment_json
			// Update email and total from order if available
			if (order.email) {
				email = order.email;
			}
			// Amount handling: API returns amounts in cents, convert to dollars
			if (order.amount) {
				// If amount > 100000, it's likely in cents, otherwise already in dollars
				const amountNum = Number(order.amount);
				total = (amountNum > 100000 ? amountNum / 100 : amountNum).toFixed(2);
			} else if (order.summary?.total) {
				const summaryTotal = Number(order.summary.total);
				total = (summaryTotal > 100000 ? summaryTotal / 100 : summaryTotal).toFixed(2);
			} else if (order.total) {
				const totalNum = Number(order.total);
				total = (totalNum > 100000 ? totalNum / 100 : totalNum).toFixed(2);
			}

			console.log('[CHECKOUT SUCCESS] Order details loaded:', order);
		} catch (err) {
			console.error('[CHECKOUT SUCCESS] Error fetching order:', err);
			// Don't show error, just use URL params
		}
	}

	// Handle PayPal callback - capture payment if needed
	onMount(async () => {
		const token = localStorage.getItem('auth_token');

		// Get reservationId and paypalOrderId from sessionStorage (set in checkout)
		const reservationId = sessionStorage.getItem('reservationId');
		const paypalOrderId = sessionStorage.getItem('paypalOrderId');
		const storedTotal = sessionStorage.getItem('checkoutTotal');

		// If we have PayPal order ID and reservation, we need to capture the payment
		if (paypalOrderId && reservationId && token) {
			try {
				loading = true;
				const res = await fetch(`${API_URL}/api/checkout/capture`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token.trim()}`
					},
					body: JSON.stringify({
						paypalOrderId: paypalOrderId,
						reservationId: reservationId
					})
				});

				if (!res.ok) {
					const error = await res.json().catch(() => ({}));
					console.error('[CHECKOUT SUCCESS] Capture error:', {
						status: res.status,
						error: error.error,
						message: error.message,
						details: error.details
					});
					
					// Extract user-friendly error message from PayPal error response
					let userMessage = error.message || error.error || 'Payment capture failed';
					
					// Handle specific error types
					if (error.error === 'payment_declined') {
						userMessage = error.message || 'Your payment method was declined. Please try a different payment method or contact your bank.';
					} else if (error.details?.name === 'UNPROCESSABLE_ENTITY') {
						const issue = error.details?.details?.[0]?.issue;
						const description = error.details?.details?.[0]?.description;
						
						if (issue === 'INSTRUMENT_DECLINED') {
							userMessage = 'Your payment method was declined. Please try a different payment method or contact your bank.';
						} else if (description) {
							userMessage = description;
						} else {
							userMessage = 'Payment could not be processed. Please try again or use a different payment method.';
						}
					}
					
					// Store detailed error for failure page
					const errorDetails = {
						message: userMessage,
						error: error.error,
						details: error.details,
						paypalDebugId: error.details?.debug_id
					};
					
					sessionStorage.setItem('paymentError', JSON.stringify(errorDetails));
					throw new Error(userMessage);
				}

				const data = await res.json();
				console.log('[CHECKOUT SUCCESS] Capture response:', data);

				// If we got an orderId from capture, use it
				if (data.orderId) {
					// Clear session storage
					sessionStorage.removeItem('reservationId');
					sessionStorage.removeItem('paypalOrderId');

					// Clear cart after successful order
					try {
						await clearCart();
						console.log('[CHECKOUT SUCCESS] Cart cleared after order');
					} catch (err) {
						console.error('[CHECKOUT SUCCESS] Error clearing cart:', err);
						// Don't block the success page if cart clear fails
					}

					// Update URL params to include orderId
					const url = new URL(window.location.href);
					url.searchParams.set('orderId', data.orderId);

					// Extract total from capture response if available
					// PayPal amounts are in cents, convert to dollars
					if (data.raw?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value) {
						const captureTotalCents = parseFloat(
							data.raw.purchase_units[0].payments.captures[0].amount.value
						);
						const captureTotalDollars = captureTotalCents / 100; // Convert cents to dollars
						url.searchParams.set('total', captureTotalDollars.toFixed(2));
					} else if (storedTotal) {
						// Use stored total from checkout start
						url.searchParams.set('total', storedTotal);
						sessionStorage.removeItem('checkoutTotal');
					} else if (data.summary && data.summary.total) {
						// Summary total might already be in dollars, but check if it's in cents
						const summaryTotal = Number(data.summary.total);
						const totalDollars = summaryTotal > 100000 ? summaryTotal / 100 : summaryTotal; // If > 100000, likely cents
						url.searchParams.set('total', totalDollars.toFixed(2));
					}

					window.history.replaceState({}, '', url);

					// Fetch order details using orderId from capture response
					await fetchOrderDetails(data.orderId);
				}

				loading = false;
			} catch (err) {
				console.error('[CHECKOUT SUCCESS] Capture error:', err);
				errorMessage = err.message || 'Failed to capture payment';
				loading = false;

				// Redirect to failure page after a moment
				setTimeout(() => {
					goto(`/checkout/failure?reason=${encodeURIComponent(errorMessage)}`);
				}, 2000);
			}
		} else if (orderId && orderId !== 'ERR-NO-ID') {
			// If we already have an orderId in URL, fetch order details
			await fetchOrderDetails(orderId);
			loading = false;
		} else {
			// No PayPal params, just show success
			loading = false;
		}
	});
</script>

<div class="flex min-h-[60vh] items-center justify-center px-4 py-20">
	{#if loading}
		<div class="text-center">
			<div
				class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-retro-black"
			></div>
			<p class="mt-4 font-mono text-xs tracking-widest text-gray-500 uppercase">
				Processing Payment...
			</p>
		</div>
	{:else if errorMessage}
		<div class="w-full max-w-md border border-red-500 bg-white p-8 shadow-2xl">
			<div class="mb-6 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600"
				>
					<span class="text-3xl">✗</span>
				</div>
				<h1 class="mb-2 font-serif text-2xl text-red-900">Payment Processing Failed</h1>
				<p class="mb-4 font-mono text-xs text-red-700">{errorMessage}</p>
				<a
					href="/checkout"
					class="inline-block bg-retro-black px-6 py-3 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
				>
					Return to Checkout
				</a>
			</div>
		</div>
	{:else}
		<div
			class="relative w-full max-w-4xl overflow-hidden border border-retro-black bg-white p-8 shadow-2xl"
		>
			<div
				class="pointer-events-none absolute top-4 right-4 flex h-24 w-24 -rotate-12 items-center justify-center rounded-full border-2 border-green-600 text-green-600 opacity-20"
			>
				<span class="font-mono text-xs font-bold uppercase">Paid</span>
			</div>

			<div class="mb-10 text-center">
				<div
					class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-retro-black text-retro-bone"
				>
					<span class="text-3xl">✓</span>
				</div>
				<h1 class="mb-2 font-serif text-4xl">Order Confirmed</h1>
				<p class="font-mono text-xs tracking-widest text-gray-500 uppercase">
					Your retro-tech acquisition is processing
				</p>
			</div>

			<!-- Order Summary -->
			<div
				class="mb-8 space-y-4 border-t border-b border-dashed border-gray-300 py-6 font-mono text-sm"
			>
				<div class="flex justify-between">
					<span class="text-gray-500">Order ID:</span>
					<span class="font-bold">{order?.order_id || orderId}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Timestamp:</span>
					<span class="text-xs">{orderDate}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Sent To:</span>
					<span class="max-w-[200px] truncate">{email}</span>
				</div>
				{#if order?.status}
					<div class="flex justify-between">
						<span class="text-gray-500">Status:</span>
						<span class="font-bold uppercase">{order.status}</span>
					</div>
				{/if}
				{#if order?.reservation_id}
					<div class="flex justify-between">
						<span class="text-gray-500">Reservation ID:</span>
						<span class="font-mono text-xs">{order.reservation_id}</span>
					</div>
				{/if}
			</div>

			<!-- Order Items -->
			{#if orderItems.length > 0}
				<div class="mb-8">
					<h2 class="mb-4 font-serif text-2xl">Order Items</h2>
					<div class="space-y-4">
						{#each orderItems as item}
							<div class="flex items-center gap-4 border-b border-gray-200 pb-4 last:border-b-0">
								<img
									src={item.image || item.images?.[0] || 'https://placehold.co/80x80'}
									alt={item.title || item.name}
									class="h-20 w-20 border border-gray-200 bg-gray-100 object-cover"
								/>
								<div class="flex-1">
									<h3 class="mb-1 font-serif text-lg">{item.title || item.name}</h3>
									{#if item.attributes}
										<div class="mb-1 font-mono text-xs text-gray-500">
											{#each Object.entries(item.attributes) as [key, value], i}
												<span class="capitalize"
													>{key}: {value}{i < Object.entries(item.attributes).length - 1
														? ', '
														: ''}</span
												>
											{/each}
										</div>
									{/if}
									<p class="font-mono text-xs text-gray-500">
										Qty: {item.qty || item.quantity || 1}
									</p>
								</div>
								<span class="font-mono text-sm font-bold">
									${(
										(item.unitPrice || item.price || 0) * (item.qty || item.quantity || 1)
									).toFixed(2)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Order Summary Details -->
			{#if orderAddress || orderShipping || order?.amount}
				<div
					class="mb-8 space-y-4 border-t border-b border-dashed border-gray-300 py-6 font-mono text-sm"
				>
					{#if orderAddress}
						<div>
							<span class="mb-2 block text-gray-500">Shipping Address:</span>
							<div class="text-xs">
								{#if orderAddress.name}
									<p class="font-bold">{orderAddress.name}</p>
								{/if}
								<p>{orderAddress.line1}</p>
								{#if orderAddress.line2}
									<p>{orderAddress.line2}</p>
								{/if}
								<p>
									{orderAddress.city}, {orderAddress.state}
									{orderAddress.postal || orderAddress.zip}
								</p>
								<p>{orderAddress.country}</p>
							</div>
						</div>
					{/if}

					{#if orderShipping}
						<div class="border-t border-dashed border-gray-300 pt-4">
							<span class="mb-2 block text-gray-500">Shipping Method:</span>
							<div class="text-xs">
								<p class="font-bold">{orderShipping.title || orderShipping.methodId}</p>
								{#if orderShipping.eta}
									<p class="text-gray-500">ETA: {orderShipping.eta}</p>
								{/if}
								{#if orderShipping.transitDays}
									<p class="text-gray-500">
										Transit: {orderShipping.transitDays}
										{orderShipping.transitDays === 1 ? 'day' : 'days'}
									</p>
								{/if}
							</div>
						</div>
					{/if}

					<div class="space-y-2 border-t border-dashed border-gray-300 pt-4">
						{#if order?.amount}
							<div
								class="flex justify-between border-t border-dashed border-gray-300 pt-2 text-base font-bold"
							>
								<span>Total Paid:</span>
								<span>${(order.amount || 0).toFixed(2)}</span>
							</div>
						{:else}
							<div
								class="flex justify-between border-t border-dashed border-gray-300 pt-2 text-base font-bold"
							>
								<span>Total Paid:</span>
								<span>${total}</span>
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<div class="mb-8 border-t border-b border-dashed border-gray-300 py-6 font-mono text-sm">
					<div class="flex justify-between text-base font-bold">
						<span>Total Paid:</span>
						<span>${total}</span>
					</div>
				</div>
			{/if}

			<p class="mb-8 text-center font-mono text-xs text-gray-500">
				A confirmation email has been sent to {email}. Your order is being prepared for shipment.
			</p>

			<div class="flex gap-4">
				<a
					href="/products"
					class="flex-1 bg-retro-black py-4 text-center text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
				>
					Return to Shop
				</a>
				{#if (order?.order_id || orderId) && orderId !== 'ERR-NO-ID'}
					<a
						href="/orders/{order?.order_id || orderId}"
						class="flex-1 bg-gray-200 py-4 text-center text-xs tracking-widest text-retro-black uppercase transition-colors hover:bg-gray-300"
					>
						View Order Details
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>
