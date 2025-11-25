<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { API_URL } from '$lib/config.js';

	export let data;

	let isLoggedIn = false;
	let checkingAuth = true;
	let orderData = data.order;
	let orderError = data.error;
	let orderRequiresAuth = data.requiresAuth || true;

	// Extract order data for easier access
	$: order = orderData;
	$: orderItems = order?.items_json || order?.items || [];
	$: orderAddress = order?.address_json || order?.address || order?.shippingAddress;
	$: orderShipping = order?.shipping_json || order?.shipping;
	$: orderPayment = order?.payment_json || order?.payment;

	onMount(async () => {
		const token = localStorage.getItem('auth_token');

		// If no token, redirect to login
		if (!token) {
			goto('/account?redirect=' + encodeURIComponent($page.url.pathname));
			return;
		}

		// Fetch order data with auth token
		try {
			const orderId = $page.params.id || data.orderId;
			console.log('[ORDER DETAIL] Fetching order:', orderId);

			const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
				headers: {
					Authorization: `Bearer ${token.trim()}`,
					'Content-Type': 'application/json'
				}
			});

			if (res.ok) {
				const fetchedOrder = await res.json();
				orderData = fetchedOrder;
				orderError = null;
				orderRequiresAuth = false;
				isLoggedIn = true;
			} else if (res.status === 401 || res.status === 403) {
				// Token invalid, redirect to login
				console.error('[ORDER DETAIL] Unauthorized:', res.status);
				localStorage.removeItem('auth_token');
				goto('/account?redirect=' + encodeURIComponent($page.url.pathname));
				return;
			} else {
				const errorData = await res.json().catch(() => ({}));
				orderError = errorData.message || errorData.error || 'Failed to load order';
				orderRequiresAuth = true;
				console.error('[ORDER DETAIL] Order fetch failed:', orderError);
			}
		} catch (err) {
			console.error('[ORDER DETAIL] Client fetch error:', err);
			orderError = err.message || 'Failed to load order';
			orderRequiresAuth = true;
		}

		checkingAuth = false;
	});
</script>

<svelte:head>
	<title>Order Details - CyberVintage</title>
</svelte:head>

{#if checkingAuth}
	<div class="py-20 text-center">
		<div
			class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-retro-black"
		></div>
		<p class="mt-4 font-mono text-xs tracking-widest text-gray-500 uppercase">Loading order...</p>
	</div>
{:else if orderError || orderRequiresAuth}
	<div class="mx-auto max-w-4xl py-12">
		<div class="border border-red-200 bg-red-50 py-20 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600"
			>
				<span class="text-3xl">✗</span>
			</div>
			<h1 class="mb-2 font-serif text-3xl text-red-900">Error Loading Order</h1>
			<p class="mb-6 font-mono text-sm text-red-700">
				{orderError || 'Authentication required. Please log in to view this order.'}
			</p>
			<a
				href="/account"
				class="inline-block bg-retro-black px-8 py-3 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
			>
				Back to Account
			</a>
		</div>
	</div>
{:else if !order}
	<div class="mx-auto max-w-4xl py-12">
		<div class="border border-gray-200 bg-gray-50 py-20 text-center">
			<span class="mb-4 block text-4xl">📦</span>
			<h1 class="mb-2 font-serif text-3xl">Order Not Found</h1>
			<p class="mb-6 font-mono text-sm text-gray-600">
				The order you're looking for doesn't exist or you don't have access to it.
			</p>
			<a
				href="/account"
				class="inline-block bg-retro-black px-8 py-3 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
			>
				Back to Account
			</a>
		</div>
	</div>
{:else}
	<div class="mx-auto max-w-6xl px-4 py-12">
		<!-- Header -->
		<div class="mb-12 flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between">
			<div>
				<h1 class="mb-2 font-serif text-5xl">Order Details</h1>
				<p class="font-mono text-xs tracking-widest text-gray-500 uppercase">
					Order #{order.order_id || order.id || order.orderId}
				</p>
			</div>
			<a
				href="/account"
				class="font-mono text-xs tracking-widest uppercase underline transition-opacity hover:opacity-60"
			>
				← Back to Account
			</a>
		</div>

		<!-- Order Status -->
		<div class="mb-8 border border-retro-black/10 bg-white p-6">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<span class="mb-2 block font-mono text-[10px] tracking-widest text-gray-500 uppercase"
						>Status</span
					>
					<span class="inline-block border border-gray-300 px-4 py-2 font-mono text-sm uppercase">
						{order.status || 'processing'}
					</span>
				</div>
				<div class="text-right">
					<span class="mb-2 block font-mono text-[10px] tracking-widest text-gray-500 uppercase"
						>Order Date</span
					>
					<p class="font-mono text-sm">
						{(() => {
							if (order.created_at) {
								return new Date(order.created_at).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								});
							} else if (order.createdAt) {
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
							return 'N/A';
						})()}
					</p>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Left Column: Order Items -->
			<div class="space-y-8 lg:col-span-2">
				<!-- Order Items -->
				<div class="border border-retro-black/10 bg-white p-6">
					<h2 class="mb-6 font-serif text-2xl">Order Items</h2>

					{#if orderItems.length > 0}
						<div class="space-y-6">
							{#each orderItems as item}
								<div class="flex gap-4 border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
									<div class="relative h-24 w-20 flex-shrink-0 overflow-hidden bg-[#f0eee6]">
										<img
											src={item.image ||
												item.images?.[0] ||
												'https://placehold.co/80x96/EAE8E0/1A1A1A?text=NO+IMG'}
											alt={item.title || item.name}
											class="h-full w-full object-cover mix-blend-multiply"
										/>
									</div>

									<div class="flex-1">
										<h3 class="mb-1 font-serif text-lg">{item.title || item.name}</h3>
										{#if item.attributes}
											<div class="mb-2 font-mono text-xs text-gray-500">
												{#each Object.entries(item.attributes) as [key, value], i}
													<span class="capitalize"
														>{key}: {value}{i < Object.entries(item.attributes).length - 1
															? ', '
															: ''}</span
													>
												{/each}
											</div>
										{/if}
										{#if item.variantName}
											<p class="mb-2 font-mono text-[10px] tracking-widest text-gray-500 uppercase">
												Variant: {item.variantName}
											</p>
										{/if}
										<div class="flex items-end justify-between">
											<p class="font-mono text-xs text-gray-500">
												Qty: {item.qty || item.quantity || 1}
											</p>
											<span class="font-mono text-sm font-bold">
												${(
													(item.unitPrice || item.price || 0) * (item.qty || item.quantity || 1)
												).toFixed(2)}
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="font-mono text-sm text-gray-500">No items found in this order.</p>
					{/if}
				</div>

				<!-- Shipping Information -->
				{#if orderAddress}
					<div class="border border-retro-black/10 bg-white p-6">
						<h2 class="mb-6 font-serif text-2xl">Shipping Address</h2>
						<div class="space-y-1 font-mono text-sm text-gray-700">
							{#if orderAddress.name}
								<p class="font-bold">{orderAddress.name}</p>
							{/if}
							<p>{orderAddress.line1 || orderAddress.street}</p>
							{#if orderAddress.line2}
								<p>{orderAddress.line2}</p>
							{/if}
							<p>
								{orderAddress.city}, {orderAddress.state}
								{orderAddress.postal || orderAddress.zip}
							</p>
							{#if orderAddress.country}
								<p>{orderAddress.country}</p>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Shipping Method -->
				{#if orderShipping}
					<div class="border border-retro-black/10 bg-white p-6">
						<h2 class="mb-6 font-serif text-2xl">Shipping Method</h2>
						<div class="space-y-2 font-mono text-sm">
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
							{#if orderShipping.cost !== undefined}
								<p class="text-gray-500">
									Cost: {orderShipping.cost === 0 ? 'Free' : `$${orderShipping.cost.toFixed(2)}`}
								</p>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Payment Information -->
				{#if orderPayment}
					<div class="border border-retro-black/10 bg-white p-6">
						<h2 class="mb-6 font-serif text-2xl">Payment Information</h2>
						<div class="space-y-2 font-mono text-sm">
							<p>
								<span class="text-gray-500">Provider:</span>
								<span class="font-bold uppercase">{orderPayment.provider || 'N/A'}</span>
							</p>
							{#if orderPayment.paypalOrderId}
								<p>
									<span class="text-gray-500">PayPal Order ID:</span>
									{orderPayment.paypalOrderId}
								</p>
							{/if}
							{#if orderPayment.captureId}
								<p><span class="text-gray-500">Capture ID:</span> {orderPayment.captureId}</p>
							{/if}
							{#if orderPayment.amount}
								<p>
									<span class="text-gray-500">Amount:</span> ${orderPayment.amount.toFixed(2)}
									{orderPayment.currency || 'USD'}
								</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Right Column: Order Summary -->
			<div class="lg:col-span-1">
				<div class="sticky top-24 border border-retro-black/10 bg-white p-6">
					<h3 class="mb-6 border-b pb-4 font-serif text-xl">Order Summary</h3>

					<div class="mb-6 space-y-4 font-mono text-xs">
						{#if order.amount}
							<div class="flex justify-between border-t pt-4 text-base font-bold text-retro-black">
								<span>Total</span>
								<span>${(order.amount || 0).toFixed(2)}</span>
							</div>
						{:else}
							<div class="flex justify-between text-gray-600">
								<span>Subtotal</span>
								<span>${(order.subtotal || order.total || 0).toFixed(2)}</span>
							</div>

							{#if orderShipping?.cost !== undefined}
								<div class="flex justify-between text-gray-600">
									<span>Shipping</span>
									<span>
										{orderShipping.cost === 0 ? 'Free' : `$${orderShipping.cost.toFixed(2)}`}
									</span>
								</div>
							{/if}

							{#if order.discount}
								<div class="flex justify-between text-green-600">
									<span>Discount</span>
									<span>- ${order.discount.toFixed(2)}</span>
								</div>
							{/if}

							{#if order.tax}
								<div class="flex justify-between text-gray-600">
									<span>Tax</span>
									<span>${order.tax.toFixed(2)}</span>
								</div>
							{/if}

							<div class="flex justify-between border-t pt-4 text-base font-bold text-retro-black">
								<span>Total</span>
								<span>${(order.total || order.amount || 0).toFixed(2)}</span>
							</div>
						{/if}
					</div>

					{#if order.email}
						<div class="border-t pt-6">
							<span class="mb-2 block font-mono text-[10px] tracking-widest text-gray-500 uppercase"
								>Email</span
							>
							<p class="font-mono text-xs">{order.email}</p>
						</div>
					{/if}

					{#if order.reservation_id}
						<div class="border-t pt-4">
							<span class="mb-2 block font-mono text-[10px] tracking-widest text-gray-500 uppercase"
								>Reservation ID</span
							>
							<p class="font-mono text-xs">{order.reservation_id}</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
