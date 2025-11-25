<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { API_URL } from '$lib/config.js';

	let isLoggedIn = false;
	let user = null;
	let orders = [];
	let addresses = [];
	let activeTab = 'orders';
	let showLoginForm = true;
	let loading = false;
	let loadingOrders = false;
	let errorMessage = '';
	let successMessage = '';
	let checkingAuth = true;

	// Form states
	let loginData = { email: '', password: '' };
	let signupData = { email: '', password: '', name: '' };
	let newAddress = {
		line1: '',
		line2: '',
		city: '',
		state: '',
		postal: '',
		country: 'US'
	};
	let editingAddress = null;
	let editAddressForm = {
		line1: '',
		line2: '',
		city: '',
		state: '',
		postal: '',
		country: 'US'
	};

	let redirectPath = '';

	onMount(async () => {
		redirectPath = $page.url.searchParams.get('redirect') || '';

		// Always check auth first
		await checkAuth();
		checkingAuth = false;
	});

	async function checkAuth() {
		const token = localStorage.getItem('auth_token');
		if (!token) {
			isLoggedIn = false;
			user = null;
			return;
		}

		// Trim token in case there's whitespace
		const cleanToken = token.trim();

		try {
			const res = await fetch(`${API_URL}/api/auth/me`, {
				headers: {
					Authorization: `Bearer ${cleanToken}`,
					'Content-Type': 'application/json'
				}
			});

			if (res.ok) {
				user = await res.json();
				isLoggedIn = true;
				console.log('[ACCOUNT] User loaded:', user);

				// Extract name from profile structure
				if (user.profile && user.profile.name) {
					user.name = user.profile.name;
				}

				// Load user data
				await loadUserData();

				// Handle redirect after successful auth check (only if redirect param exists and not already on account)
				if (redirectPath && redirectPath !== '/account' && redirectPath !== $page.url.pathname) {
					successMessage = 'Login successful! Redirecting...';
					setTimeout(() => {
						goto(redirectPath);
					}, 1000);
				}
			} else {
				const errorData = await res.json().catch(() => ({}));
				console.log('[ACCOUNT] Token invalid, clearing. Error:', errorData);
				localStorage.removeItem('auth_token');
				isLoggedIn = false;
				user = null;
				orders = [];
				addresses = [];
			}
		} catch (err) {
			console.error('[ACCOUNT] Auth check failed:', err);
			localStorage.removeItem('auth_token');
			isLoggedIn = false;
			user = null;
			orders = [];
			addresses = [];
		}
	}

	async function loadUserData() {
		await Promise.all([loadOrders(), loadAddresses()]);
	}

	async function loadOrders() {
		const token = localStorage.getItem('auth_token');
		if (!token) {
			console.log('[ACCOUNT] No token, skipping orders load');
			orders = [];
			return;
		}

		loadingOrders = true;
		try {
			console.log('[ACCOUNT] Loading orders from:', `${API_URL}/api/orders`);
			const res = await fetch(`${API_URL}/api/orders`, {
				headers: {
					Authorization: `Bearer ${token.trim()}`,
					'Content-Type': 'application/json'
				}
			});

			console.log('[ACCOUNT] Orders response status:', res.status, res.statusText);

			if (res.ok) {
				const data = await res.json();
				console.log('[ACCOUNT] Orders API response (raw):', data);
				console.log('[ACCOUNT] Orders API response type:', typeof data, Array.isArray(data));

				// API might return array or { orders: [...] } or { results: [...] }
				if (Array.isArray(data)) {
					orders = data;
				} else if (data.orders && Array.isArray(data.orders)) {
					orders = data.orders;
				} else if (data.results && Array.isArray(data.results)) {
					orders = data.results;
				} else if (data.data && Array.isArray(data.data)) {
					orders = data.data;
				} else {
					console.warn('[ACCOUNT] Unexpected orders response format:', data);
					orders = [];
				}

				console.log('[ACCOUNT] Orders loaded successfully:', orders.length, 'orders');
				if (orders.length > 0) {
					console.log('[ACCOUNT] First order sample:', orders[0]);
				} else {
					console.log('[ACCOUNT] No orders found for user');
				}
			} else {
				const errorText = await res.text();
				let errorData;
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { message: errorText };
				}
				console.error('[ACCOUNT] Failed to load orders:', res.status, errorData);
				orders = [];

				if (res.status === 401 || res.status === 403) {
					// Token might be invalid, clear it
					localStorage.removeItem('auth_token');
					isLoggedIn = false;
					user = null;
				} else {
					// Show error message for other errors
					errorMessage = `Failed to load orders: ${errorData.message || errorData.error || 'Unknown error'}`;
					setTimeout(() => {
						errorMessage = '';
					}, 5000);
				}
			}
		} catch (err) {
			console.error('[ACCOUNT] Failed to load orders (network error):', err);
			orders = [];
			errorMessage = 'Failed to load orders. Please try again.';
			setTimeout(() => {
				errorMessage = '';
			}, 5000);
		} finally {
			loadingOrders = false;
		}
	}

	async function loadAddresses() {
		const token = localStorage.getItem('auth_token');
		if (!token) return;

		try {
			const res = await fetch(`${API_URL}/api/addresses`, {
				headers: { Authorization: `Bearer ${token.trim()}` }
			});
			if (res.ok) {
				const data = await res.json();
				// API returns { addresses: [...] } not just array
				addresses = data.addresses || data || [];
				console.log('[ACCOUNT] Addresses loaded:', addresses.length);
			}
		} catch (err) {
			console.error('[ACCOUNT] Failed to load addresses:', err);
		}
	}

	async function handleLogin() {
		loading = true;
		errorMessage = '';
		successMessage = '';

		if (!loginData.email || !loginData.password) {
			errorMessage = 'Please fill in all fields';
			loading = false;
			return;
		}

		try {
			const res = await fetch(`${API_URL}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(loginData)
			});

			if (res.ok) {
				const data = await res.json();

				// Store token - API returns 'accessToken' not 'token'
				const token = data.token || data.accessToken;
				if (token) {
					localStorage.setItem('auth_token', token.trim());
				} else {
					console.error('[ACCOUNT] No token in login response:', data);
					errorMessage = 'Login failed: No token received';
					loading = false;
					return;
				}

				successMessage = 'Login successful!';

				// Reset form
				loginData = { email: '', password: '' };

				// Check auth and load user data - this will set isLoggedIn = true
				await checkAuth();

				// Handle redirect after successful login (only if redirect param exists)
				if (redirectPath && redirectPath !== '/account') {
					setTimeout(() => {
						goto(redirectPath);
					}, 500);
				}
			} else {
				const error = await res.json();
				errorMessage = error.message || 'Invalid email or password';
			}
		} catch (err) {
			console.error('[ACCOUNT] Login error:', err);
			errorMessage = 'Connection error. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleSignup() {
		loading = true;
		errorMessage = '';
		successMessage = '';

		if (!signupData.email || !signupData.password || !signupData.name) {
			errorMessage = 'Please fill in all fields';
			loading = false;
			return;
		}

		if (signupData.password.length < 6) {
			errorMessage = 'Password must be at least 6 characters';
			loading = false;
			return;
		}

		try {
			// Step 1: Signup
			const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(signupData)
			});

			if (!signupRes.ok) {
				const error = await signupRes.json();
				errorMessage = error.message || 'Signup failed. Email may already be in use.';
				loading = false;
				return;
			}

			// Step 2: After successful signup, call login to get access token
			const loginRes = await fetch(`${API_URL}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: signupData.email,
					password: signupData.password
				})
			});

			if (loginRes.ok) {
				const loginData = await loginRes.json();
				const token = loginData.accessToken || loginData.token;
				
				if (token) {
					localStorage.setItem('auth_token', token.trim());
					successMessage = 'Account created successfully!';
					
					// Reset form
					signupData = { email: '', password: '', name: '' };

					// Check auth and load user data - this will set isLoggedIn = true
					await checkAuth();

					// Handle redirect after successful signup (only if redirect param exists)
					if (redirectPath && redirectPath !== '/account') {
						setTimeout(() => {
							goto(redirectPath);
						}, 500);
					}
				} else {
					console.error('[ACCOUNT] No token in login response:', loginData);
					errorMessage = 'Signup successful but login failed. Please try logging in manually.';
				}
			} else {
				const error = await loginRes.json();
				errorMessage = 'Signup successful but automatic login failed. Please try logging in manually.';
			}
		} catch (err) {
			console.error('[ACCOUNT] Signup error:', err);
			errorMessage = 'Connection error. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleLogout() {
		const token = localStorage.getItem('auth_token');
		try {
			await fetch(`${API_URL}/api/auth/logout`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			});
		} catch (err) {
			console.error('[ACCOUNT] Logout error:', err);
		}

		localStorage.removeItem('auth_token');
		isLoggedIn = false;
		user = null;
		orders = [];
		addresses = [];
		successMessage = 'Logged out successfully';

		setTimeout(() => {
			successMessage = '';
		}, 2000);
	}

	async function addAddress() {
		const token = localStorage.getItem('auth_token');

		if (!newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.postal) {
			errorMessage = 'Please fill in all required address fields';
			return;
		}

		loading = true;
		errorMessage = '';

		try {
			const res = await fetch(`${API_URL}/api/addresses`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token.trim()}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(newAddress)
			});

			if (res.ok) {
				await loadAddresses();
				newAddress = { line1: '', line2: '', city: '', state: '', postal: '', country: 'US' };
				successMessage = 'Address added successfully';
				setTimeout(() => {
					successMessage = '';
				}, 2000);
			} else {
				const error = await res.json().catch(() => ({}));
				errorMessage = error.message || 'Failed to add address';
			}
		} catch (err) {
			console.error('[ACCOUNT] Failed to add address:', err);
			errorMessage = 'Connection error. Please try again.';
		} finally {
			loading = false;
		}
	}

	function startEditAddress(address) {
		editingAddress = address.addressId || address.id;
		editAddressForm = {
			line1: address.line1 || '',
			line2: address.line2 || '',
			city: address.city || '',
			state: address.state || '',
			postal: address.postal || '',
			country: address.country || 'US'
		};
	}

	function cancelEditAddress() {
		editingAddress = null;
		editAddressForm = { line1: '', line2: '', city: '', state: '', postal: '', country: 'US' };
	}

	async function updateAddress() {
		if (!editingAddress) return;

		const token = localStorage.getItem('auth_token');

		if (
			!editAddressForm.line1 ||
			!editAddressForm.city ||
			!editAddressForm.state ||
			!editAddressForm.postal
		) {
			errorMessage = 'Please fill in all required address fields';
			return;
		}

		loading = true;
		errorMessage = '';

		try {
			const res = await fetch(`${API_URL}/api/addresses/${editingAddress}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token.trim()}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(editAddressForm)
			});

			if (res.ok) {
				await loadAddresses();
				editingAddress = null;
				editAddressForm = { line1: '', line2: '', city: '', state: '', postal: '', country: 'US' };
				successMessage = 'Address updated successfully';
				setTimeout(() => {
					successMessage = '';
				}, 2000);
			} else {
				const error = await res.json().catch(() => ({}));
				errorMessage = error.message || 'Failed to update address';
			}
		} catch (err) {
			console.error('[ACCOUNT] Failed to update address:', err);
			errorMessage = 'Connection error. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function deleteAddress(addressId) {
		if (!confirm('Delete this address?')) return;

		const token = localStorage.getItem('auth_token');
		try {
			const res = await fetch(`${API_URL}/api/addresses/${addressId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token.trim()}` }
			});

			if (res.ok) {
				await loadAddresses();
				successMessage = 'Address deleted';
				setTimeout(() => {
					successMessage = '';
				}, 2000);
			}
		} catch (err) {
			console.error('[ACCOUNT] Failed to delete address:', err);
		}
	}
</script>

<svelte:head>
	<title>{isLoggedIn ? 'My Account' : 'Login'} - CyberVintage</title>
</svelte:head>

<div class="mx-auto max-w-6xl py-12">
	<!-- Loading State -->
	{#if checkingAuth}
		<div class="py-20 text-center">
			<div
				class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-retro-black"
			></div>
			<p class="mt-4 font-mono text-xs tracking-widest text-gray-500 uppercase">
				Authenticating...
			</p>
		</div>
	{:else}
		<!-- Messages -->
		{#if errorMessage}
			<div
				class="mb-6 rounded border border-red-200 bg-red-50 p-4 font-mono text-xs text-red-800"
				transition:fade
			>
				⚠ {errorMessage}
			</div>
		{/if}

		{#if successMessage}
			<div
				class="mb-6 rounded border border-green-200 bg-green-50 p-4 font-mono text-xs text-green-800"
				transition:fade
			>
				✓ {successMessage}
			</div>
		{/if}

		{#if !isLoggedIn}
			<!-- Login/Signup Forms -->
			<div class="mx-auto max-w-md" transition:fade>
				<h1 class="mb-4 text-center font-serif text-5xl">Account Access</h1>

				{#if redirectPath}
					<p
						class="mb-8 rounded border border-blue-200 bg-blue-50 p-4 text-center font-mono text-xs text-gray-500"
					>
						Please login to continue to checkout
					</p>
				{/if}

				<div class="mb-8 flex gap-2 border-b border-gray-200">
					<button
						on:click={() => {
							showLoginForm = true;
							errorMessage = '';
						}}
						class="flex-1 py-3 font-mono text-xs tracking-widest uppercase transition-colors {showLoginForm
							? 'border-b-2 border-retro-black'
							: 'text-gray-400 hover:text-gray-600'}"
					>
						Login
					</button>
					<button
						on:click={() => {
							showLoginForm = false;
							errorMessage = '';
						}}
						class="flex-1 py-3 font-mono text-xs tracking-widest uppercase transition-colors {!showLoginForm
							? 'border-b-2 border-retro-black'
							: 'text-gray-400 hover:text-gray-600'}"
					>
						Sign Up
					</button>
				</div>

				{#if showLoginForm}
					<!-- Login Form -->
					<form on:submit|preventDefault={handleLogin} class="space-y-6">
						<div>
							<label
								for="login-email"
								class="mb-2 block font-mono text-xs tracking-widest text-gray-500 uppercase"
							>
								Email <span class="text-red-500">*</span>
							</label>
							<input
								id="login-email"
								type="email"
								bind:value={loginData.email}
								required
								class="w-full border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
								placeholder="user@example.com"
							/>
						</div>

						<div>
							<label
								for="login-password"
								class="mb-2 block font-mono text-xs tracking-widest text-gray-500 uppercase"
							>
								Password <span class="text-red-500">*</span>
							</label>
							<input
								id="login-password"
								type="password"
								bind:value={loginData.password}
								required
								class="w-full border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							class="w-full bg-retro-black py-4 font-mono text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? 'Authenticating...' : 'Login'}
						</button>
					</form>
				{:else}
					<!-- Signup Form -->
					<form on:submit|preventDefault={handleSignup} class="space-y-6">
						<div>
							<label
								for="signup-name"
								class="mb-2 block font-mono text-xs tracking-widest text-gray-500 uppercase"
							>
								Full Name <span class="text-red-500">*</span>
							</label>
							<input
								id="signup-name"
								type="text"
								bind:value={signupData.name}
								required
								class="w-full border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
								placeholder="John Doe"
							/>
						</div>

						<div>
							<label
								for="signup-email"
								class="mb-2 block font-mono text-xs tracking-widest text-gray-500 uppercase"
							>
								Email <span class="text-red-500">*</span>
							</label>
							<input
								id="signup-email"
								type="email"
								bind:value={signupData.email}
								required
								class="w-full border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
								placeholder="user@example.com"
							/>
						</div>

						<div>
							<label
								for="signup-password"
								class="mb-2 block font-mono text-xs tracking-widest text-gray-500 uppercase"
							>
								Password <span class="text-red-500">*</span>
							</label>
							<input
								id="signup-password"
								type="password"
								bind:value={signupData.password}
								required
								minlength="6"
								class="w-full border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
								placeholder="Min. 6 characters"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							class="w-full bg-retro-black py-4 font-mono text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? 'Creating Account...' : 'Create Account'}
						</button>
					</form>
				{/if}
			</div>
		{:else}
			<!-- Logged In View -->
			<div transition:fade>
				<div class="mb-12 flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between">
					<div>
						<h1 class="mb-2 font-serif text-5xl">Account Dashboard</h1>
						<p class="font-mono text-xs tracking-widest text-gray-500 uppercase">
							Welcome back, {user?.name || user?.email}
						</p>
					</div>
					<button
						on:click={handleLogout}
						class="font-mono text-xs tracking-widest uppercase underline transition-opacity hover:opacity-60"
					>
						Logout →
					</button>
				</div>

				<!-- Tabs -->
				<div class="mb-12 flex gap-6 overflow-x-auto border-b border-gray-200">
					<button
						on:click={() => {
							activeTab = 'orders';
							if (isLoggedIn && orders.length === 0 && !loadingOrders) {
								loadOrders();
							}
						}}
						class="pb-4 font-mono text-xs tracking-widest whitespace-nowrap uppercase transition-colors {activeTab ===
						'orders'
							? 'border-b-2 border-retro-black'
							: 'text-gray-400 hover:text-gray-600'}"
					>
						Orders {#if orders.length > 0}({orders.length}){/if}
					</button>
					<button
						on:click={() => (activeTab = 'addresses')}
						class="pb-4 font-mono text-xs tracking-widest whitespace-nowrap uppercase transition-colors {activeTab ===
						'addresses'
							? 'border-b-2 border-retro-black'
							: 'text-gray-400 hover:text-gray-600'}"
					>
						Addresses {#if addresses.length > 0}({addresses.length}){/if}
					</button>
					<button
						on:click={() => (activeTab = 'profile')}
						class="pb-4 font-mono text-xs tracking-widest whitespace-nowrap uppercase transition-colors {activeTab ===
						'profile'
							? 'border-b-2 border-retro-black'
							: 'text-gray-400 hover:text-gray-600'}"
					>
						Profile
					</button>
				</div>

				<!-- Tab Content -->
				{#if activeTab === 'orders'}
					<div class="space-y-6" transition:fade>
						{#if loadingOrders}
							<div class="py-20 text-center">
								<div
									class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-retro-black"
								></div>
								<p class="mt-4 font-mono text-xs tracking-widest text-gray-500 uppercase">
									Loading orders...
								</p>
							</div>
						{:else if orders.length === 0}
							<div class="border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
								<span class="mb-4 block text-4xl">📦</span>
								<p class="mb-6 font-mono text-sm text-gray-500">No orders yet</p>
								<a
									href="/products"
									class="inline-block bg-retro-black px-8 py-3 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
								>
									Start Shopping
								</a>
							</div>
						{:else}
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{#each orders as order}
									<button
										class="group cursor-pointer border border-gray-200 bg-white p-6 text-left transition-all hover:border-retro-black hover:shadow-md"
										on:click={() => goto(`/orders/${order.order_id || order.id || order.orderId}`)}
									>
										<div class="mb-4 flex items-start justify-between">
											<div class="flex-1">
												<p class="mb-2 font-mono text-[10px] tracking-widest text-gray-500 uppercase">
													Order #{order.order_id || order.id || order.orderId}
												</p>
												<p class="mb-3 font-serif text-3xl font-semibold text-retro-black">
													${(order.amount || order.total || 0).toFixed(2)}
												</p>
											</div>
											<span
												class="ml-4 shrink-0 border border-gray-300 bg-gray-50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider"
											>
												{order.status || 'processing'}
											</span>
										</div>
										<div class="flex items-center justify-between border-t border-gray-100 pt-4">
											<p class="font-mono text-xs text-gray-600">
												{(() => {
													if (order.created_at) {
														return new Date(order.created_at).toLocaleDateString('en-US', {
															year: 'numeric',
															month: 'short',
															day: 'numeric'
														});
													} else if (order.createdAt) {
														const timestamp =
															typeof order.createdAt === 'number' && order.createdAt < 10000000000
																? order.createdAt * 1000
																: order.createdAt;
														return new Date(timestamp).toLocaleDateString('en-US', {
															year: 'numeric',
															month: 'short',
															day: 'numeric'
														});
													}
													return 'N/A';
												})()}
											</p>
											<span
												class="font-mono text-xs text-gray-400 transition-transform group-hover:translate-x-1"
											>
												View Details →
											</span>
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{:else if activeTab === 'addresses'}
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2" transition:fade>
						{#each addresses as address}
							{#if editingAddress === (address.addressId || address.id)}
								<!-- Edit Address Form -->
								<div class="border border-retro-black bg-retro-bone p-6">
									<h3 class="mb-4 font-serif text-lg">Edit Address</h3>
									<form on:submit|preventDefault={updateAddress} class="space-y-3">
										<input
											type="text"
											bind:value={editAddressForm.line1}
											placeholder="Address Line 1"
											class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
											required
										/>
										<input
											type="text"
											bind:value={editAddressForm.line2}
											placeholder="Address Line 2 (Optional)"
											class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
										/>
										<div class="grid grid-cols-2 gap-2">
											<input
												type="text"
												bind:value={editAddressForm.city}
												placeholder="City"
												class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
												required
											/>
											<input
												type="text"
												bind:value={editAddressForm.state}
												placeholder="State"
												class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
												required
											/>
										</div>
										<div class="grid grid-cols-2 gap-2">
											<input
												type="text"
												bind:value={editAddressForm.postal}
												placeholder="Postal Code"
												class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
												required
											/>
											<input
												type="text"
												bind:value={editAddressForm.country}
												placeholder="Country"
												class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
												required
											/>
										</div>
										<div class="flex gap-2">
											<button
												type="submit"
												disabled={loading}
												class="flex-1 bg-retro-black py-2 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800 disabled:opacity-50"
											>
												{loading ? 'Saving...' : 'Save'}
											</button>
											<button
												type="button"
												on:click={cancelEditAddress}
												class="flex-1 border border-gray-300 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-gray-100"
											>
												Cancel
											</button>
										</div>
									</form>
								</div>
							{:else}
								<!-- Display Address -->
								<div
									class="relative border border-gray-200 p-6 transition-colors hover:border-retro-black"
								>
									<p class="mb-2 pr-20 font-serif text-lg">{address.name || 'Address'}</p>
									<p class="font-mono text-xs text-gray-600">
										{address.line1}<br />
										{#if address.line2}{address.line2}<br />{/if}
										{address.city}, {address.state}
										{address.postal}<br />
										{address.country || 'US'}
									</p>
									<div class="absolute top-6 right-6 flex gap-2">
										<button
											on:click={() => startEditAddress(address)}
											class="text-xs text-blue-600 hover:underline"
										>
											Edit
										</button>
										<button
											on:click={() => deleteAddress(address.addressId || address.id)}
											class="text-xs text-red-600 hover:underline"
										>
											Delete
										</button>
									</div>
								</div>
							{/if}
						{/each}

						<!-- Add New Address Form -->
						<div class="border border-dashed border-gray-300 bg-gray-50 p-6">
							<h3 class="mb-4 font-serif text-lg">Add New Address</h3>
							<form on:submit|preventDefault={addAddress} class="space-y-3">
								<input
									type="text"
									bind:value={newAddress.name}
									placeholder="Name (e.g., Home, Office)"
									class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
									required
								/>
								<input
									type="text"
									bind:value={newAddress.street}
									placeholder="Street Address"
									class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
									required
								/>
								<div class="grid grid-cols-2 gap-2">
									<input
										type="text"
										bind:value={newAddress.city}
										placeholder="City"
										class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
										required
									/>
									<input
										type="text"
										bind:value={newAddress.state}
										placeholder="State"
										class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
										required
									/>
								</div>
								<div class="grid grid-cols-2 gap-2">
									<input
										type="text"
										bind:value={newAddress.zip}
										placeholder="ZIP Code"
										class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
										required
									/>
									<input
										type="text"
										bind:value={newAddress.country}
										placeholder="Country"
										class="w-full border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
										required
									/>
								</div>
								<button
									type="submit"
									disabled={loading}
									class="w-full bg-retro-black py-2 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800 disabled:opacity-50"
								>
									{loading ? 'Adding...' : 'Add Address'}
								</button>
							</form>
						</div>
					</div>
				{:else}
					<!-- Profile Tab -->
					<div class="max-w-md" transition:fade>
						<div class="border border-gray-200 bg-white p-8 shadow-sm">
							<h3 class="mb-6 font-serif text-2xl">Profile Information</h3>
							<div class="space-y-4 font-mono text-sm">
								<div>
									<span class="mb-1 block text-xs text-gray-500 uppercase">User ID</span>
									<p class="font-bold">{user?.sub || user?.id || 'N/A'}</p>
								</div>
								<div>
									<span class="mb-1 block text-xs text-gray-500 uppercase">Name</span>
									<p>{user?.name || 'Not set'}</p>
								</div>
								<div>
									<span class="mb-1 block text-xs text-gray-500 uppercase">Email</span>
									<p>{user?.email}</p>
								</div>
								<div>
									<span class="mb-1 block text-xs text-gray-500 uppercase">Role</span>
									<p class="capitalize">{user?.role || 'customer'}</p>
								</div>
								<div>
									<span class="mb-1 block text-xs text-gray-500 uppercase">Member Since</span>
									<p>
										{user?.createdAt
											? new Date(user.createdAt).toLocaleDateString('en-US', {
													year: 'numeric',
													month: 'long',
													day: 'numeric'
												})
											: 'N/A'}
									</p>
								</div>
							</div>
						</div>

						<!-- Debug Info (Remove in production) -->
						<div class="mt-6 border border-gray-200 bg-gray-50 p-4">
							<details>
								<summary
									class="cursor-pointer font-mono text-xs tracking-widest uppercase hover:text-gray-600"
								>
									Debug Info
								</summary>
								<pre class="mt-4 overflow-auto font-mono text-[10px]">{JSON.stringify(
										user,
										null,
										2
									)}</pre>
							</details>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

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
