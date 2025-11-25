<script>
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/config.js';

	// Your stores (make sure these exist at $lib/stores/cart.js)
	import {
		cartItems,
		cartTotal,
		cartId,
		clearCart,
		cartSummary,
		fetchCart
	} from '$lib/stores/cart.js';

	// UI state
	let step = 1;
	let loading = false;
	let isLoggedIn = false;
	let checkingAuth = true;
	let shippingOptions = [];
	let availableAddresses = [];
	let errorMessage = '';
	let shippingMethodSetViaSelect = false; // Track if shipping was set via handleShippingSelect
	let lastShippingMethod = null; // Track last shipping method to prevent duplicate calls

	// Form + coupon
	let formData = {
		email: '',
		phone: '',
		firstName: '',
		lastName: '',
		address: '',
		addressLine2: '',
		city: '',
		state: '',
		zip: '',
		country: 'US',
		shippingMethod: 'standard',
		useExistingAddress: false,
		selectedAddressId: null
	};

	let couponCode = '';
	let appliedCoupon = null;

	// Use cart summary values directly from API (prices already in dollars)
	// The API calculates everything correctly, so we trust it completely
	// No conversion needed - values are already in dollars
	$: subtotal = Number($cartSummary?.subtotal) || 0;
	$: tax = Number($cartSummary?.tax) || 0;
	$: discount = Number($cartSummary?.discount) || 0;
	$: shippingCost = Number($cartSummary?.shipping) || 0;
	$: total = Number($cartSummary?.total) || 0;

	// Sync appliedCoupon with cart summary coupon code
	$: if ($cartSummary?.coupon && !appliedCoupon) {
		appliedCoupon = {
			code: $cartSummary.coupon,
			value: $cartSummary.discount || 0
		};
	} else if (!$cartSummary?.coupon && appliedCoupon) {
		// Clear applied coupon if cart summary doesn't have one
		appliedCoupon = null;
	}

	// Initial mount - OPTIMIZED: Single cart fetch
	onMount(async () => {
		// Ensure cart is initialized
		const cid = $cartId;
		if (!cid) {
			// Import initCart from store
			const { initCart } = await import('$lib/stores/cart.js');
			await initCart();
		}

		// OPTIMIZATION: Only fetch cart once on mount if we have items in store
		// If store is empty, fetch to ensure we have latest data
		const updatedCid = $cartId;
		if (updatedCid && (!$cartItems || $cartItems.length === 0)) {
			await fetchCart(updatedCid);
		}

		// If cart empty — redirect to /products
		if (!$cartItems || $cartItems.length === 0) {
			goto('/products');
			return;
		}

		// Check auth - if already logged in, stay on page
		await checkAuth();
		checkingAuth = false;

		// If not logged in, show login prompt but don't redirect
		// User can continue as guest or click login button
	});

	// Auth check
	async function checkAuth() {
		const token = localStorage.getItem('auth_token');
		if (!token) {
			isLoggedIn = false;
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
				const user = await res.json();
				isLoggedIn = true;
				console.log('[CHECKOUT] User authenticated:', user);

				// Prefill form data with user info
				if (user.email) {
					formData.email = user.email;
				}
				// Extract name from profile structure
				const userName = user.profile?.name || user.name;
				if (userName) {
					const parts = userName.split(' ');
					formData.firstName = parts[0] || '';
					formData.lastName = parts.slice(1).join(' ') || '';
				}

				// OPTIMIZATION: Use addresses from /me response - no separate API call needed
				if (user.addresses && Array.isArray(user.addresses)) {
					availableAddresses = user.addresses;
					console.log('[CHECKOUT] Loaded addresses from /me response:', availableAddresses.length);
				} else {
					// If addresses not in response, set empty array (shouldn't happen if API is correct)
					availableAddresses = [];
					console.warn('[CHECKOUT] No addresses in /me response');
				}

				// Cart data should already be in store from initCart or previous operations
				// No need to fetch again here
			} else {
				const errorData = await res.json().catch(() => ({}));
				console.log('[CHECKOUT] Token invalid, clearing. Error:', errorData);
				localStorage.removeItem('auth_token');
				isLoggedIn = false;
			}
		} catch (err) {
			console.error('[CHECKOUT] Auth check failed:', err);
			isLoggedIn = false;
		}
	}

	// REMOVED: loadAddresses() function - addresses are now loaded from /api/auth/me response
	// This eliminates an unnecessary API call since /me already includes addresses

	// Load shipping options from cart
	async function loadShippingOptions() {
		const cid = $cartId;
		if (!cid) {
			console.warn('[CHECKOUT] No cart ID, cannot load shipping options');
			return;
		}

		const token = localStorage.getItem('auth_token');
		if (!token) {
			console.warn('[CHECKOUT] No auth token, cannot load shipping options');
			return;
		}

		const headers = { 'Content-Type': 'application/json' };
		headers['Authorization'] = `Bearer ${token.trim()}`;

		try {
			console.log('[CHECKOUT] Loading shipping options for cart:', cid);

			// OPTIMIZATION: Directly call shipping-options endpoint
			// We already have cart data from previous operations (address selection, etc.)
			// No need to fetch full cart again
			const res = await fetch(
				`${API_URL}/api/cart/${encodeURIComponent(cid)}/shipping-options`,
				{
					method: 'GET',
					headers: headers
				}
			);

			if (res.ok) {
				const data = await res.json();
				// API returns { shippingOptions: [...] }
				shippingOptions = data.shippingOptions || (Array.isArray(data) ? data : data.options || []);
				console.log('[CHECKOUT] Shipping options loaded from endpoint:', shippingOptions);

				if (shippingOptions.length > 0) {
					// Set default shipping method if none selected
					if (!formData.shippingMethod) {
						formData.shippingMethod = shippingOptions[0].methodId;
					}
					errorMessage = ''; // Clear any previous errors
				} else {
					console.warn('[CHECKOUT] Shipping options endpoint returned empty array');
					errorMessage = 'No shipping options available for this address';
				}
			} else {
				const errorData = await res.json().catch(() => ({}));
				console.error('[CHECKOUT] Failed to load shipping options:', res.status, errorData);
				// Set appropriate error message
				if (errorData.error === 'address_required') {
					errorMessage = 'Please set a shipping address first';
				} else if (
					errorData.error === 'user_required' ||
					errorData.error === 'authorization_required'
				) {
					errorMessage = 'Please login to view shipping options';
				} else if (errorData.error === 'fulfillment_error') {
					errorMessage =
						errorData.details?.details || 'Unable to calculate shipping. Please try again.';
				} else {
					errorMessage = errorData.message || errorData.error || 'Failed to load shipping options';
				}
			}
		} catch (err) {
			console.error('[CHECKOUT] Failed to load shipping options:', err);
			errorMessage = 'Failed to load shipping options. Please try again.';
		}
	}

	// Handle shipping method selection
	async function handleShippingSelect(methodId) {
		// OPTIMIZATION: Prevent duplicate calls if same method is selected
		if (lastShippingMethod === methodId) {
			console.log('[CHECKOUT] Shipping method already set, skipping duplicate call');
			return;
		}

		formData.shippingMethod = methodId;
		lastShippingMethod = methodId; // Track the method we're setting
		shippingMethodSetViaSelect = true; // Mark that shipping was set via user selection

		// Update shipping on cart
		const cid = $cartId;
		if (!cid) {
			errorMessage = 'Cart not found';
			return;
		}

		const token = localStorage.getItem('auth_token');
		const headers = { 'Content-Type': 'application/json' };
		if (token) {
			headers['Authorization'] = `Bearer ${token.trim()}`;
		}

		try {
			const res = await fetch(`${API_URL}/api/cart/${encodeURIComponent(cid)}/shipping`, {
				method: 'POST',
				headers: headers,
				body: JSON.stringify({ methodId: methodId })
			});

			if (res.ok) {
				// OPTIMIZATION: Use response data if available instead of fetching
				const data = await res.json();
				if (data.cart) {
					// Update from response
					cartItems.set(data.cart.items || []);
					if (data.cart.summary) {
						cartSummary.set({
							subtotal: Number(data.cart.summary.subtotal) || 0,
							discount: Number(data.cart.summary.discount) || 0,
							shipping: Number(data.cart.summary.shipping) || 0,
							tax: Number(data.cart.summary.tax) || 0,
							total: Number(data.cart.summary.total) || 0,
							...(data.cart.coupon && { coupon: data.cart.coupon })
						});
					}
				} else {
					// Use response data if available
					const data = await res.json().catch(() => ({}));
					if (data.cart) {
						cartItems.set(data.cart.items || []);
						if (data.cart.summary) {
							cartSummary.set({
								subtotal: Number(data.cart.summary.subtotal) || 0,
								discount: Number(data.cart.summary.discount) || 0,
								shipping: Number(data.cart.summary.shipping) || 0,
								tax: Number(data.cart.summary.tax) || 0,
								total: Number(data.cart.summary.total) || 0,
								...(data.cart.coupon && { coupon: data.cart.coupon })
							});
						}
					}
				}
				errorMessage = ''; // Clear any previous errors
			} else {
				const err = await res.json().catch(() => ({}));
				console.error('[CHECKOUT] Failed to set shipping method:', err);
				errorMessage =
					err.message || err.error || err.details || 'Failed to update shipping method';
			}
		} catch (err) {
			console.error('[CHECKOUT] Failed to set shipping method:', err);
			errorMessage = 'Failed to update shipping method. Please try again.';
		}
	}

	// Save new address to backend
	async function saveAddress() {
		if (!isLoggedIn) {
			errorMessage = 'Please login to save addresses';
			return;
		}

		// Validate required fields
		if (!formData.firstName || !formData.lastName || !formData.address || !formData.city || !formData.state || !formData.zip) {
			errorMessage = 'Please fill in all required address fields';
			return;
		}

		const token = localStorage.getItem('auth_token');
		if (!token) {
			errorMessage = 'Please login to save addresses';
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
				body: JSON.stringify({
					line1: formData.address,
					line2: formData.addressLine2 || '',
					city: formData.city,
					state: formData.state,
					postal: formData.zip,
					country: formData.country || 'US'
				})
			});

			if (res.ok) {
				const addrData = await res.json();
				console.log('[CHECKOUT] Address save response:', addrData);
				
				// API returns { address: { addressId: "...", ... } }
				const addressId = addrData.address?.addressId || addrData.addressId || addrData.id;
				
				if (addressId && typeof addressId === 'string') {
					const addressIdStr = String(addressId);
					// Update formData to use the new address
					formData.selectedAddressId = addressIdStr;
					formData.useExistingAddress = true;
					
					// Reload addresses from /me endpoint
					await checkAuth();
					
					// Set address on cart
					const cid = $cartId;
					if (cid) {
						const addressPayload = { addressId: addressIdStr };
						console.log('[CHECKOUT] Setting address on cart:', addressPayload, 'for cart:', cid);
						
						const addressRes = await fetch(`${API_URL}/api/cart/${encodeURIComponent(cid)}/address`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${token.trim()}`
							},
							body: JSON.stringify(addressPayload)
						});

						if (addressRes.ok) {
							const cartData = await addressRes.json();
							console.log('[CHECKOUT] Address set on cart, response:', cartData);
							if (cartData.cart) {
								cartItems.set(cartData.cart.items || []);
								if (cartData.cart.summary) {
									cartSummary.set({
										subtotal: Number(cartData.cart.summary.subtotal) || 0,
										discount: Number(cartData.cart.summary.discount) || 0,
										shipping: Number(cartData.cart.summary.shipping) || 0,
										tax: Number(cartData.cart.summary.tax) || 0,
										total: Number(cartData.cart.summary.total) || 0,
										...(cartData.cart.coupon && { coupon: cartData.cart.coupon })
									});
								}
								// Load shipping options if available
								if (cartData.cart.shippingOptions && Array.isArray(cartData.cart.shippingOptions) && cartData.cart.shippingOptions.length > 0) {
									shippingOptions = cartData.cart.shippingOptions;
									if (!formData.shippingMethod && shippingOptions.length > 0) {
										formData.shippingMethod = shippingOptions[0].methodId;
									}
								} else {
									await loadShippingOptions();
								}
							}
						} else {
							const errData = await addressRes.json().catch(() => ({}));
							console.error('[CHECKOUT] Failed to set address on cart:', errData);
							throw new Error(errData.message || errData.error || 'Failed to set address on cart');
						}
					}
					
					errorMessage = ''; // Clear any errors
				} else {
					console.error('[CHECKOUT] Invalid addressId:', addressId, 'from response:', addrData);
					throw new Error('Address saved but no valid addressId returned');
				}
			} else {
				const errData = await res.json().catch(() => ({}));
				errorMessage = errData.message || errData.error || 'Failed to save address';
			}
		} catch (err) {
			console.error('[CHECKOUT] Failed to save address:', err);
			errorMessage = 'Failed to save address. Please try again.';
		} finally {
			loading = false;
		}
	}

	// Select existing address to prefill
	async function selectAddress(address) {
		formData.address = address.line1 || formData.address;
		formData.addressLine2 = address.line2 || '';
		formData.city = address.city || formData.city;
		formData.state = address.state || formData.state;
		formData.zip = address.postal || formData.zip;
		formData.country = address.country || formData.country;
		formData.selectedAddressId = address.addressId || address.id;
		formData.useExistingAddress = true;

		// Set address on cart immediately when selecting existing address
		const cid = $cartId;
		if (cid && formData.selectedAddressId) {
			const token = localStorage.getItem('auth_token');
			if (token) {
				try {
					const res = await fetch(`${API_URL}/api/cart/${encodeURIComponent(cid)}/address`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token.trim()}`
						},
						body: JSON.stringify({ addressId: formData.selectedAddressId })
					});

					if (res.ok) {
						// OPTIMIZATION: Use response data if available - address response includes cart
						const addrData = await res.json();
						if (addrData.cart) {
							cartItems.set(addrData.cart.items || []);
							if (addrData.cart.summary) {
								cartSummary.set({
									subtotal: Number(addrData.cart.summary.subtotal) || 0,
									discount: Number(addrData.cart.summary.discount) || 0,
									shipping: Number(addrData.cart.summary.shipping) || 0,
									tax: Number(addrData.cart.summary.tax) || 0,
									total: Number(addrData.cart.summary.total) || 0,
									...(addrData.cart.coupon && { coupon: addrData.cart.coupon })
								});
							}
							// OPTIMIZATION: Check if cart response includes shipping options
							if (addrData.cart.shippingOptions && Array.isArray(addrData.cart.shippingOptions) && addrData.cart.shippingOptions.length > 0) {
								shippingOptions = addrData.cart.shippingOptions;
								if (!formData.shippingMethod && shippingOptions.length > 0) {
									formData.shippingMethod = shippingOptions[0].methodId;
								}
								console.log('[CHECKOUT] Shipping options loaded from address response');
							} else {
								// Only call loadShippingOptions if not in response
								await loadShippingOptions();
							}
				} else {
					// Use response data if available
					const addrData = await res.json().catch(() => ({}));
					if (addrData.cart) {
						cartItems.set(addrData.cart.items || []);
						if (addrData.cart.summary) {
							cartSummary.set({
								subtotal: Number(addrData.cart.summary.subtotal) || 0,
								discount: Number(addrData.cart.summary.discount) || 0,
								shipping: Number(addrData.cart.summary.shipping) || 0,
								tax: Number(addrData.cart.summary.tax) || 0,
								total: Number(addrData.cart.summary.total) || 0,
								...(addrData.cart.coupon && { coupon: addrData.cart.coupon })
							});
						}
						if (addrData.cart.shippingOptions && Array.isArray(addrData.cart.shippingOptions) && addrData.cart.shippingOptions.length > 0) {
							shippingOptions = addrData.cart.shippingOptions;
							if (!formData.shippingMethod && shippingOptions.length > 0) {
								formData.shippingMethod = shippingOptions[0].methodId;
							}
						} else {
							await loadShippingOptions();
						}
					} else {
						await loadShippingOptions();
					}
				}
					} else {
						const err = await res.json().catch(() => ({}));
						console.error('[CHECKOUT] Failed to set address:', err);
						errorMessage = err.message || err.error || 'Failed to set address';
					}
				} catch (err) {
					console.error('[CHECKOUT] Failed to set address:', err);
				}
			}
		}
	}

	// Apply coupon
	async function applyCoupon() {
		if (!couponCode.trim()) return;
		const cid = $cartId;
		if (!cid) {
			errorMessage = 'Cart not found';
			return;
		}

		loading = true;
		errorMessage = '';

		try {
			const res = await fetch(`${API_URL}/api/cart/${encodeURIComponent(cid)}/coupon/apply`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: couponCode.trim() })
			});

			if (res.ok) {
				const data = await res.json();
				console.log('[CHECKOUT] Coupon applied:', data);

				// Use response data directly - API returns full cart object
				const cart = data.cart || data;
				
				// Update cart from response
				cartItems.set(cart.items || []);
				if (cart.summary) {
					cartSummary.set({
						subtotal: Number(cart.summary.subtotal) || 0,
						discount: Number(cart.summary.discount) || 0,
						shipping: Number(cart.summary.shipping) || 0,
						tax: Number(cart.summary.tax) || 0,
						total: Number(cart.summary.total) || 0,
						...(cart.coupon && { coupon: cart.coupon })
					});
				}
				
				const updatedCart = cart;

				if (updatedCart.coupon) {
					appliedCoupon = {
						code: updatedCart.coupon,
						value: updatedCart.discount || 0,
						type: updatedCart.discountType
					};
				} else if (data.discount) {
					appliedCoupon = data.discount;
				} else {
					appliedCoupon = { code: couponCode.trim(), value: data.value || 0 };
				}
				couponCode = '';
			} else {
				const err = await res.json().catch(() => ({}));
				errorMessage = err.message || 'Invalid or expired coupon code';
			}
		} catch (err) {
			console.error('[CHECKOUT] applyCoupon error:', err);
			errorMessage = 'Failed to apply coupon. Try again later.';
		} finally {
			loading = false;
		}
	}

	// Remove coupon
	async function removeCoupon() {
		const cid = $cartId;
		if (!cid) return;
		loading = true;
		try {
			const res = await fetch(`${API_URL}/api/cart/${encodeURIComponent(cid)}/coupon/remove`, {
				method: 'POST'
			});

			if (res.ok) {
				appliedCoupon = null;
				couponCode = '';
				// OPTIMIZATION: Use response data if available
				const data = await res.json();
				if (data.cart) {
					cartItems.set(data.cart.items || []);
					if (data.cart.summary) {
						cartSummary.set({
							subtotal: Number(data.cart.summary.subtotal) || 0,
							discount: Number(data.cart.summary.discount) || 0,
							shipping: Number(data.cart.summary.shipping) || 0,
							tax: Number(data.cart.summary.tax) || 0,
							total: Number(data.cart.summary.total) || 0,
							...(data.cart.coupon && { coupon: data.cart.coupon })
						});
					}
				} else {
					// Use response data if available
					const data = await res.json().catch(() => ({}));
					if (data.cart) {
						cartItems.set(data.cart.items || []);
						if (data.cart.summary) {
							cartSummary.set({
								subtotal: Number(data.cart.summary.subtotal) || 0,
								discount: Number(data.cart.summary.discount) || 0,
								shipping: Number(data.cart.summary.shipping) || 0,
								tax: Number(data.cart.summary.tax) || 0,
								total: Number(data.cart.summary.total) || 0,
								...(data.cart.coupon && { coupon: data.cart.coupon })
							});
						}
					}
				}
			} else {
				const err = await res.json().catch(() => ({}));
				errorMessage = err.message || 'Failed to remove coupon';
			}
		} catch (err) {
			console.error('[CHECKOUT] removeCoupon error:', err);
			errorMessage = 'Failed to remove coupon. Try again later.';
		} finally {
			loading = false;
		}
	}

	// Validate address and set on cart, advance to review
	async function goToReview() {
		if (!$cartItems || $cartItems.length === 0) {
			errorMessage = 'Cart is empty';
			return;
		}

		loading = true;
		errorMessage = '';
		const cid = $cartId;

		// Get token once at function level (BEFORE using it)
		const token = localStorage.getItem('auth_token');

		// Basic validation
		if (!formData.email || !formData.email.includes('@')) {
			errorMessage = 'Please enter a valid email address';
			window.scrollTo({ top: 0, behavior: 'smooth' });
			loading = false;
			return;
		}

		if (!formData.firstName || !formData.lastName) {
			errorMessage = 'Please enter your first and last name';
			window.scrollTo({ top: 0, behavior: 'smooth' });
			loading = false;
			return;
		}

		if (!formData.address || !formData.city || !formData.state || !formData.zip) {
			errorMessage = 'Please complete all required address fields';
			window.scrollTo({ top: 0, behavior: 'smooth' });
			loading = false;
			return;
		}

		// Ensure user is logged in (required for checkout)
		if (!token) {
			errorMessage = 'Please login to complete checkout';
			window.scrollTo({ top: 0, behavior: 'smooth' });
			loading = false;
			setTimeout(() => goto('/account?redirect=/checkout'), 1000);
			return;
		}

		try {
			// Always ensure address is set on cart - create if needed, then set
			let addressPayload;
			let addressResData = null;

			// Determine if we need to create a new address or use existing one
			if (formData.useExistingAddress && formData.selectedAddressId) {
				// Use existing address ID
				addressPayload = { addressId: formData.selectedAddressId };
				console.log('[CHECKOUT] Using existing address:', formData.selectedAddressId);
			} else {
				// Need to create new address first
				if (!token) {
					throw new Error('Please login to complete checkout with address');
				}

				console.log('[CHECKOUT] Creating new address...');
				try {
					const createAddrRes = await fetch(`${API_URL}/api/addresses`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${token.trim()}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							line1: formData.address,
							line2: formData.addressLine2 || '',
							city: formData.city,
							state: formData.state,
							postal: formData.zip,
							country: formData.country || 'US'
						})
					});

					if (!createAddrRes.ok) {
						const errData = await createAddrRes.json().catch(() => ({}));
						console.error('[CHECKOUT] Failed to create address:', errData);
						throw new Error(errData.message || errData.error || 'Failed to create address');
					}

					const addrData = await createAddrRes.json();
					console.log('[CHECKOUT] Address creation response:', addrData);
					
					// API returns { address: { addressId: "...", ... } }
					const addressId = addrData.address?.addressId || addrData.addressId || addrData.id;
					if (!addressId || typeof addressId !== 'string') {
						console.error('[CHECKOUT] Invalid addressId:', addressId, 'from response:', addrData);
						throw new Error('Address created but no valid addressId returned');
					}
					
					addressPayload = { addressId: String(addressId) };
					// Update formData to use the new address
					formData.selectedAddressId = String(addressId);
					formData.useExistingAddress = true;
					console.log('[CHECKOUT] Address created successfully, addressId:', addressId);
				} catch (err) {
					console.error('[CHECKOUT] Failed to create address:', err);
					throw new Error(err.message || 'Failed to create address. Please try again.');
				}
			}

			// Always set address on cart (even if it was previously set, ensure it's current)
			const headers = { 'Content-Type': 'application/json' };
			if (token) {
				headers['Authorization'] = `Bearer ${token.trim()}`;
			}

			// Validate addressPayload before sending
			if (!addressPayload || !addressPayload.addressId || typeof addressPayload.addressId !== 'string') {
				console.error('[CHECKOUT] Invalid addressPayload:', addressPayload);
				throw new Error('Invalid address data. Please try again.');
			}

			console.log('[CHECKOUT] Setting address on cart:', addressPayload, 'for cart:', cid);
			const addressRes = await fetch(`${API_URL}/api/cart/${encodeURIComponent(cid)}/address`, {
				method: 'POST',
				headers: headers,
				body: JSON.stringify(addressPayload)
			});

			if (!addressRes.ok) {
				const err = await addressRes.json().catch(() => ({}));
				console.error('[CHECKOUT] Address error response:', err);
				const errorMsg = err.message || err.error || err.details || 'Failed to set address on cart';
				throw new Error(errorMsg);
			}

			// Get response data - this should include cart with shipping options
			addressResData = await addressRes.json().catch(() => ({}));
			if (addressResData.cart) {
				console.log('[CHECKOUT] Address set successfully on cart:', addressResData.cart.addressId);
				// Update cart from response
				cartItems.set(addressResData.cart.items || []);
				if (addressResData.cart.summary) {
					cartSummary.set({
						subtotal: Number(addressResData.cart.summary.subtotal) || 0,
						discount: Number(addressResData.cart.summary.discount) || 0,
						shipping: Number(addressResData.cart.summary.shipping) || 0,
						tax: Number(addressResData.cart.summary.tax) || 0,
						total: Number(addressResData.cart.summary.total) || 0,
						...(addressResData.cart.coupon && { coupon: addressResData.cart.coupon })
					});
				}
			} else {
				console.warn('[CHECKOUT] Address set but no cart data in response');
			}

			// Get shipping options from address response or load separately
			if (addressResData?.cart?.shippingOptions && Array.isArray(addressResData.cart.shippingOptions) && addressResData.cart.shippingOptions.length > 0) {
				shippingOptions = addressResData.cart.shippingOptions;
				if (!formData.shippingMethod && shippingOptions.length > 0) {
					formData.shippingMethod = shippingOptions[0].methodId;
				}
				console.log('[CHECKOUT] Shipping options loaded from address response:', shippingOptions.length);
			} else {
				// If not in response, try loading from endpoint
				console.log('[CHECKOUT] Shipping options not in response, loading from endpoint...');
				await loadShippingOptions();
			}

			// Validate shipping options were loaded
			if (shippingOptions.length === 0) {
				throw new Error(
					'No shipping options available. Please check your address and try again.'
				);
			}

			console.log('[CHECKOUT] Shipping options loaded:', shippingOptions.length, 'options');

			// Validate shipping method against available options
			const validMethod = shippingOptions.find((opt) => opt.methodId === formData.shippingMethod);
			if (!validMethod) {
				// Use first available option if current selection is invalid
				formData.shippingMethod = shippingOptions[0].methodId;
				console.log('[CHECKOUT] Auto-selected shipping method:', formData.shippingMethod);
			}

			// OPTIMIZATION: Only set shipping method if it hasn't been set via handleShippingSelect
			// If user already selected shipping method via UI, skip this call to avoid duplicate API call
			if (!shippingMethodSetViaSelect && formData.shippingMethod) {
			// Set shipping method - API expects methodId
			// Reuse token from above
			const shippingHeaders = { 'Content-Type': 'application/json' };
			if (token) {
				shippingHeaders['Authorization'] = `Bearer ${token.trim()}`;
			}

			console.log('[CHECKOUT] Setting shipping method:', formData.shippingMethod);
			const shippingRes = await fetch(
				`${API_URL}/api/cart/${encodeURIComponent(cid)}/shipping`,
				{
					method: 'POST',
					headers: shippingHeaders,
					body: JSON.stringify({ methodId: formData.shippingMethod })
				}
			);

			if (!shippingRes.ok) {
				const err = await shippingRes.json().catch(() => ({}));
				console.error('[CHECKOUT] Shipping error response:', err);
				throw new Error(err.message || err.error || err.details || 'Failed to set shipping method');
			}

			console.log('[CHECKOUT] Shipping method set successfully');

				// OPTIMIZATION: Use response data if available
				const shippingData = await shippingRes.json().catch(() => ({}));
				if (shippingData.cart) {
					cartItems.set(shippingData.cart.items || []);
					if (shippingData.cart.summary) {
						cartSummary.set({
							subtotal: Number(shippingData.cart.summary.subtotal) || 0,
							discount: Number(shippingData.cart.summary.discount) || 0,
							shipping: Number(shippingData.cart.summary.shipping) || 0,
							tax: Number(shippingData.cart.summary.tax) || 0,
							total: Number(shippingData.cart.summary.total) || 0,
							...(shippingData.cart.coupon && { coupon: shippingData.cart.coupon })
						});
					}
				} else {
					// Use response data if available
					const shippingData = await shippingRes.json().catch(() => ({}));
					if (shippingData.cart) {
						cartItems.set(shippingData.cart.items || []);
						if (shippingData.cart.summary) {
							cartSummary.set({
								subtotal: Number(shippingData.cart.summary.subtotal) || 0,
								discount: Number(shippingData.cart.summary.discount) || 0,
								shipping: Number(shippingData.cart.summary.shipping) || 0,
								tax: Number(shippingData.cart.summary.tax) || 0,
								total: Number(shippingData.cart.summary.total) || 0,
								...(shippingData.cart.coupon && { coupon: shippingData.cart.coupon })
							});
						}
					}
				}
			} else {
				console.log('[CHECKOUT] Shipping method already set, skipping API call');
			}

			window.scrollTo({ top: 0, behavior: 'smooth' });
			step = 2;
			console.log('[CHECKOUT] Moved to review step');
		} catch (err) {
			console.error('[CHECKOUT] goToReview error:', err);
			errorMessage = err.message || 'Failed to prepare order for review';
		} finally {
			loading = false;
		}
	}

	// Cancel checkout
	function cancelCheckout() {
		if (confirm('Are you sure you want to cancel checkout? Your cart will be preserved.')) {
			goto('/products');
		}
	}

	// Handle payment start (calls backend)
	async function handlePayment() {
		if (!isLoggedIn) {
			errorMessage = 'Please login to complete checkout';
			// Don't block UI — redirect after brief moment
			setTimeout(() => goto('/account?redirect=/checkout'), 700);
			return;
		}

		loading = true;
		errorMessage = '';
		const token = localStorage.getItem('auth_token');
		const cid = $cartId;

		try {
			// OPTIMIZATION: Validate cart state from store instead of making API call
			// We already have cart data in the store from previous operations
			const currentItems = $cartItems;
			const currentSummary = $cartSummary;

			// Validate cart state from store
			if (!currentItems || currentItems.length === 0) {
					throw new Error('Cart is empty. Please add items before checkout.');
				}
			
			// Check if address and shipping are set (we can infer from formData)
			if (!formData.selectedAddressId && !formData.address) {
					throw new Error('Shipping address is required. Please go back and select an address.');
				}
			if (!formData.shippingMethod) {
					throw new Error(
						'Shipping method is required. Please go back and select a shipping option.'
					);
				}

			console.log('[CHECKOUT] Cart validation passed (from store):', {
				items: currentItems.length,
				addressId: formData.selectedAddressId,
				shippingMethod: formData.shippingMethod,
				total: currentSummary?.total || 0
				});

			// API expects { cartId: "...", returnUrl: "..." } (returnUrl optional)
			// Construct returnUrl from current origin
			const returnUrl = `${window.location.origin}/checkout/success`;
			console.log('[CHECKOUT] Starting checkout process...');
			const res = await fetch(`${API_URL}/api/checkout/start`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token.trim()}`
				},
				body: JSON.stringify({
					cartId: cid,
					returnUrl: returnUrl
				})
			});

			if (!res.ok) {
				const errBody = await res.json().catch(() => ({}));
				const errorMsg = errBody.message || errBody.error || 'Checkout failed';
				console.error('[CHECKOUT] Start error:', {
					status: res.status,
					error: errBody.error,
					message: errBody.message,
					details: errBody.details
				});
				throw new Error(errorMsg);
			}

			const checkoutData = await res.json();

			// API returns: { reservationId, paypalOrderId, paymentId, summary, approveUrl }
			// Summary amounts are in cents, convert to dollars for display
			if (checkoutData.approveUrl) {
				// Store reservationId and paypalOrderId for capture
				sessionStorage.setItem('reservationId', checkoutData.reservationId);
				sessionStorage.setItem(
					'paypalOrderId',
					checkoutData.paypalOrderId || checkoutData.paymentId
				);

				// Store summary if available (for success page)
				if (checkoutData.summary) {
					const summaryTotal = Number(checkoutData.summary.total || 0);
					// Convert cents to dollars if needed
					const totalDollars = summaryTotal > 100000 ? summaryTotal / 100 : summaryTotal;
					sessionStorage.setItem('checkoutTotal', totalDollars.toFixed(2));
				}

				// redirect user to PayPal
				window.location.href = checkoutData.approveUrl;
				return;
			} else if (checkoutData.orderId) {
				// Direct order creation (no PayPal)
				clearCart();
				const summaryTotal = checkoutData.summary?.total || total;
				const totalDollars =
					Number(summaryTotal) > 100000 ? Number(summaryTotal) / 100 : Number(summaryTotal);
				goto(
					`/checkout/success?orderId=${checkoutData.orderId}&total=${totalDollars.toFixed(2)}&email=${encodeURIComponent(formData.email)}`
				);
				return;
			} else {
				throw new Error('Invalid checkout response');
			}
		} catch (err) {
			console.error('[CHECKOUT] payment error:', err);
			errorMessage = err.message || 'Payment processing failed. Please try again.';
			// optional: redirect to failure page after brief pause
			setTimeout(() => goto(`/checkout/failure?reason=${encodeURIComponent(errorMessage)}`), 1500);
		} finally {
			loading = false;
		}
	}

	// Re-check auth when page becomes visible (e.g., after returning from login)
	function handleVisibilityChange() {
		if (!document.hidden) {
			// Re-check auth if we're not logged in or if we just returned from login
			const token = localStorage.getItem('auth_token');
			if (token && !isLoggedIn) {
				checkAuth();
			}
		}
	}

	// Also check on focus (when user returns to tab/window)
	function handleFocus() {
		const token = localStorage.getItem('auth_token');
		if (token && !isLoggedIn && !checkingAuth) {
			checkAuth();
		}
	}

	onMount(() => {
		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('focus', handleFocus);
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('focus', handleFocus);
		};
	});
</script>

<svelte:head>
	<title>Checkout - CyberVintage</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-6 pt-10 pb-24 md:px-10">
	{#if checkingAuth}
		<div class="py-20 text-center">
			<div
				class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-retro-black"
			></div>
			<p class="mt-4 font-mono text-xs tracking-widest text-gray-500 uppercase">
				Loading checkout...
			</p>
		</div>
	{:else}
		<h1 class="mb-4 font-serif text-5xl text-retro-black">
			{step === 1 ? 'Checkout' : 'Review & Confirm'}
		</h1>

		{#if errorMessage}
			<div
				class="mb-6 rounded border border-red-200 bg-red-50 p-4 font-mono text-xs text-red-800"
				transition:fade
			>
				⚠ {errorMessage}
			</div>
		{/if}

		{#if isLoggedIn && !checkingAuth}
			<div
				class="mb-6 flex items-center gap-3 rounded border border-green-200 bg-green-50 p-4"
				transition:fade
			>
				<span class="text-lg">✓</span>
				<div>
					<p class="font-mono text-xs font-bold text-green-900">Logged In</p>
					<p class="font-mono text-xs text-green-800">Checkout as {formData.email || 'user'}</p>
				</div>
			</div>
		{/if}

		<!-- Layout: left (2/3) | right (1/3) -->
		<div class="grid grid-cols-1 gap-12 lg:grid-cols-3">
			<!-- LEFT: main content spanning 2 cols -->
			<div class="space-y-10 lg:col-span-2">
				{#if step === 1}
					<div transition:fade={{ duration: 200 }} class="space-y-10">
						<!-- ORDER ITEMS -->
						<section class="border border-retro-black/10 bg-white p-6 shadow-sm md:p-8">
							<h2 class="mb-6 font-serif text-2xl">Order Items ({$cartItems.length})</h2>

							<div class="max-h-96 space-y-6 overflow-y-auto pr-2">
								{#if !$cartItems.length}
									<p class="font-mono text-sm text-gray-500">Cart is empty.</p>
								{:else}
									{#each $cartItems as item}
										<div
											class="flex items-center gap-4 border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
										>
											<img
												src={item.image || item.images?.[0] || 'https://placehold.co/80x80'}
												alt={item.title || item.name}
												class="h-20 w-20 border border-gray-200 bg-gray-100 object-cover"
											/>
											<div class="flex-1">
												<h3 class="mb-1 font-serif text-lg">{item.title || item.name}</h3>
												<p class="font-mono text-xs text-gray-500">Qty: {item.qty}</p>
											</div>
											<span class="font-mono text-sm font-bold">
												${((item.unitPrice || 0) * (item.qty || 0)).toFixed(2)}
											</span>
										</div>
									{/each}
								{/if}
							</div>
						</section>

						<!-- CONTACT INFO -->
						<section class="border border-retro-black/10 bg-white p-6 shadow-sm md:p-8">
							<h2 class="mb-6 font-serif text-2xl">Contact Information</h2>

							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div class="flex flex-col gap-2">
									<label
										for="checkout-email"
										class="font-mono text-[10px] tracking-widest text-gray-500 uppercase"
									>
										Email Address <span class="text-red-500">*</span>
									</label>
									<input
										id="checkout-email"
										type="email"
										bind:value={formData.email}
										required
										disabled={isLoggedIn}
										class="border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-100"
										placeholder="user@example.com"
									/>
								</div>

								<div class="flex flex-col gap-2">
									<label
										for="checkout-phone"
										class="font-mono text-[10px] tracking-widest text-gray-500 uppercase"
									>
										Phone Number
									</label>
									<input
										id="checkout-phone"
										type="tel"
										bind:value={formData.phone}
										class="border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
										placeholder="+1 (555) 000-0000"
									/>
								</div>
							</div>

							{#if !isLoggedIn && !checkingAuth}
								<div class="mt-6 rounded border border-blue-200 bg-blue-50 p-4">
									<p class="mb-2 font-mono text-xs text-blue-900">
										<strong>Have an account?</strong>
									</p>
									<p class="mb-3 font-mono text-xs text-blue-800">
										Login for faster checkout and to access saved addresses
									</p>
									<a
										href="/account?redirect=/checkout"
										class="inline-block bg-blue-600 px-4 py-2 text-xs tracking-widest text-white uppercase transition-colors hover:bg-blue-700"
									>
										Login to Continue
									</a>
								</div>
							{/if}
						</section>

						<!-- SHIPPING ADDRESS -->
						<section class="border border-retro-black/10 bg-white p-6 shadow-sm md:p-8">
							<h2 class="mb-6 font-serif text-2xl">Shipping Address</h2>

							{#if isLoggedIn && availableAddresses.length > 0}
								<div class="mb-6">
									<p class="mb-3 font-mono text-xs tracking-widest text-gray-500 uppercase">
										Saved Addresses
									</p>
									<div class="space-y-2">
										{#each availableAddresses as address}
											<button
												on:click={() => selectAddress(address)}
												class="w-full border p-4 text-left transition-colors"
												class:border-retro-black={formData.selectedAddressId ===
													(address.addressId || address.id)}
												class:bg-retro-bone={formData.selectedAddressId ===
													(address.addressId || address.id)}
												class:border-gray-200={formData.selectedAddressId !==
													(address.addressId || address.id)}
											>
												<p class="font-mono text-sm font-bold">{address.name || 'Address'}</p>
												<p class="mt-1 font-mono text-xs text-gray-600">
													{address.line1}{#if address.line2}, {address.line2}{/if}, {address.city}, {address.state}
													{address.postal}
												</p>
											</button>
										{/each}
									</div>

									<div class="my-6 text-center">
										<span class="font-mono text-xs text-gray-400 uppercase"
											>— Or Enter New Address —</span
										>
									</div>
								</div>
							{/if}

							<div class="space-y-6">
								<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
									<div class="flex flex-col gap-2">
										<label for="firstName" class="font-mono text-[10px] text-gray-500 uppercase">
											First Name <span class="text-red-500">*</span>
										</label>
										<input
											id="firstName"
											type="text"
											bind:value={formData.firstName}
											required
											class="border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
										/>
									</div>

									<div class="flex flex-col gap-2">
										<label for="lastName" class="font-mono text-[10px] text-gray-500 uppercase">
											Last Name <span class="text-red-500">*</span>
										</label>
										<input
											id="lastName"
											type="text"
											bind:value={formData.lastName}
											required
											class="border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
										/>
									</div>
								</div>

								<div class="flex flex-col gap-2">
									<label for="address" class="font-mono text-[10px] text-gray-500 uppercase">
										Address Line 1 <span class="text-red-500">*</span>
									</label>
									<input
										id="address"
										type="text"
										bind:value={formData.address}
										required
										class="border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
										placeholder="123 Main Street"
									/>
								</div>

								<div class="flex flex-col gap-2">
									<label for="addressLine2" class="font-mono text-[10px] text-gray-500 uppercase">
										Address Line 2
									</label>
									<input
										id="addressLine2"
										type="text"
										bind:value={formData.addressLine2}
										class="border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
										placeholder="Apt 4B (Optional)"
									/>
								</div>

								<div class="grid grid-cols-2 gap-6 md:grid-cols-4">
									<div class="col-span-2 flex flex-col gap-2">
										<label for="city" class="font-mono text-[10px] text-gray-500 uppercase">
											City <span class="text-red-500">*</span>
										</label>
										<input
											id="city"
											type="text"
											bind:value={formData.city}
											required
											class="border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
										/>
									</div>

									<div class="flex flex-col gap-2">
										<label for="state" class="font-mono text-[10px] text-gray-500 uppercase">
											State <span class="text-red-500">*</span>
										</label>
										<input
											id="state"
											type="text"
											bind:value={formData.state}
											required
											class="border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
											placeholder="CA"
										/>
									</div>

									<div class="flex flex-col gap-2">
										<label for="zip" class="font-mono text-[10px] text-gray-500 uppercase">
											Postal Code <span class="text-red-500">*</span>
										</label>
										<input
											id="zip"
											type="text"
											bind:value={formData.zip}
											required
											class="border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
											placeholder="90210"
										/>
									</div>
								</div>

								<div class="flex flex-col gap-2">
									<label for="country" class="font-mono text-[10px] text-gray-500 uppercase"
										>Country</label
									>
									<input
										id="country"
										type="text"
										bind:value={formData.country}
										class="border border-gray-300 p-3 font-mono text-sm transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black"
									/>
								</div>

								{#if isLoggedIn}
									<div class="mt-4">
										<button
											on:click={saveAddress}
											disabled={loading || formData.useExistingAddress || !formData.firstName || !formData.lastName || !formData.address || !formData.city || !formData.state || !formData.zip}
											class="w-full bg-retro-black px-6 py-3 font-mono text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
										>
											{#if loading}
												Saving...
											{:else if formData.useExistingAddress}
												Using Saved Address
											{:else}
												Save Address
											{/if}
										</button>
									</div>
								{/if}
							</div>
						</section>

						<!-- SHIPPING METHOD -->
						<section class="border border-retro-black/10 bg-white p-6 shadow-sm md:p-8">
							<h2 class="mb-6 font-serif text-2xl">Shipping Method</h2>

							{#if errorMessage && errorMessage.includes('shipping')}
								<div
									class="mb-4 rounded border border-yellow-200 bg-yellow-50 p-3 font-mono text-xs text-yellow-800"
								>
									⚠ {errorMessage}
								</div>
							{/if}

							{#if shippingOptions.length > 0}
								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									{#each shippingOptions as option}
										<label
											class="flex cursor-pointer items-center justify-between border p-4 transition-all"
											class:border-black={formData.shippingMethod === option.methodId}
											class:bg-retro-bone={formData.shippingMethod === option.methodId}
											class:border-gray-200={formData.shippingMethod !== option.methodId}
											role="button"
											tabindex="0"
										>
											<div class="flex items-center gap-3">
												<input
													type="radio"
													bind:group={formData.shippingMethod}
													value={option.methodId}
													on:change={() => handleShippingSelect(option.methodId)}
													class="h-4 w-4"
												/>
												<div>
													<span class="block font-serif text-lg"
														>{option.title || option.methodId}</span
													>
													<span class="block font-mono text-xs text-gray-500">
														{#if option.transitDays}
															{option.transitDays} {option.transitDays === 1 ? 'day' : 'days'}
														{/if}
														{#if option.eta}
															- ETA: {option.eta}{/if}
													</span>
												</div>
											</div>
											<span class="font-mono text-sm font-bold">
												{#if option.cost === 0 || option.cost === null || option.cost === undefined}
													Free
												{:else if Number(option.cost) > 1000}
													${(Number(option.cost) / 100).toFixed(2)}
												{:else}
													${Number(option.cost).toFixed(2)}
												{/if}
											</span>
										</label>
									{/each}
								</div>
							{:else if loading}
								<div class="py-8 text-center">
									<div
										class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-retro-black"
									></div>
									<p class="mt-4 font-mono text-xs text-gray-500">Loading shipping options...</p>
								</div>
							{:else}
								<div class="rounded border border-gray-200 bg-gray-50 p-4">
									<p class="mb-2 font-mono text-xs text-gray-600">
										{#if !isLoggedIn}
											Please login and set a shipping address to view shipping options.
										{:else if !formData.selectedAddressId && !formData.address}
											Please set a shipping address first to view shipping options.
										{:else}
											Shipping options will be available after you set your address and click
											"Continue to Review".
										{/if}
									</p>
									{#if !isLoggedIn}
										<a
											href="/account?redirect=/checkout"
											class="mt-2 inline-block bg-blue-600 px-4 py-2 text-xs tracking-widest text-white uppercase transition-colors hover:bg-blue-700"
										>
											Login to Continue
										</a>
									{/if}
								</div>
							{/if}
						</section>
					</div>
				{:else}
					<!-- REVIEW + PAYMENT -->
					<div
						transition:slide
						class="space-y-8 border border-retro-black bg-white p-6 shadow md:p-8"
					>
						<div class="border-b pb-6">
							<h2 class="mb-2 font-serif text-3xl">Review Your Order</h2>
							<p class="font-mono text-xs text-gray-500 uppercase">
								Verify all details before confirming
							</p>
						</div>

						<div class="grid grid-cols-1 gap-8 font-mono text-sm md:grid-cols-2">
							<div>
								<span class="mb-2 block text-[10px] tracking-widest text-gray-400 uppercase"
									>Shipping To</span
								>
								<p class="font-bold">{formData.firstName} {formData.lastName}</p>
								<p class="mt-2">{formData.address}</p>
								<p>{formData.city}, {formData.state} {formData.zip}</p>
								<p>{formData.country}</p>

								<button class="mt-3 text-xs underline hover:opacity-70" on:click={() => (step = 1)}
									>← Edit Address</button
								>
							</div>

							<div>
								<span class="mb-2 block text-[10px] tracking-widest text-gray-400 uppercase"
									>Contact & Shipping</span
								>
								<p class="font-bold capitalize">{formData.shippingMethod} Delivery</p>
								<p class="mt-2">{formData.email}</p>
								{#if formData.phone}
									<p>{formData.phone}</p>
								{/if}
							</div>
						</div>

						<!-- Products List -->
						<div class="border-t pt-6">
							<h3 class="mb-4 font-serif text-lg">Order Items</h3>
							<div class="space-y-4">
								{#each $cartItems as item}
									<div class="flex gap-4 border-b border-gray-200 pb-4">
										<div class="h-20 w-16 flex-shrink-0 overflow-hidden bg-[#f0eee6]">
											<img
												src={item.image || 'https://placehold.co/100x120/EAE8E0/1A1A1A?text=NO+IMG'}
												alt={item.title}
												class="h-full w-full object-cover mix-blend-multiply"
											/>
										</div>
										<div class="flex flex-1 flex-col justify-between">
											<div>
												<h4 class="font-serif text-sm font-bold">{item.title}</h4>
												{#if item.attributes && Object.keys(item.attributes).length > 0}
													<p class="mt-1 font-mono text-[10px] text-gray-500">
														{#each Object.entries(item.attributes) as [key, value], i}
															{key}: {value}{#if i < Object.entries(item.attributes).length - 1}, {/if}
														{/each}
													</p>
												{/if}
											</div>
											<div class="flex items-baseline justify-between">
												<p class="font-mono text-xs text-gray-600">Qty: {item.qty}</p>
												<p class="font-mono text-sm font-bold">
													${((item.unitPrice || 0) * (item.qty || 1)).toFixed(2)}
												</p>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<div class="border-t pt-8">
							<div class="mb-4 flex gap-3">
								<button
									on:click={() => {
										step = 1;
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}}
									class="flex-1 border border-gray-300 bg-white px-6 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-gray-50"
								>
									← Back
								</button>
								<button
									on:click={cancelCheckout}
									class="flex-1 border border-red-300 bg-white px-6 py-3 font-mono text-xs tracking-widest text-red-600 uppercase transition-colors hover:bg-red-50"
								>
									Cancel
								</button>
							</div>
							<button
								on:click={handlePayment}
								disabled={loading}
								class="w-full bg-retro-black py-4 font-mono text-sm font-bold tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if loading}
									Processing...
								{:else}
									Complete Order — ${total.toFixed(2)}
								{/if}
							</button>

							<p class="mt-4 text-center font-mono text-[10px] text-gray-500">
								By completing this order, you agree to our terms and conditions
							</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- RIGHT: summary sidebar -->
			<div class="lg:col-span-1">
				<div class="space-y-6 lg:sticky lg:top-24">
					<!-- ORDER SUMMARY -->
					<div class="border border-retro-black bg-white p-6 shadow md:p-8">
						<h3 class="mb-6 border-b pb-4 font-serif text-xl">Order Summary</h3>

						<div class="mb-6 space-y-4 font-mono text-xs">
							<div class="flex justify-between text-gray-600">
								<span
									>Subtotal ({$cartItems.length} {$cartItems.length === 1 ? 'item' : 'items'})</span
								>
								<span>${subtotal.toFixed(2)}</span>
							</div>

							<div class="flex justify-between text-gray-600">
								<span>Shipping ({formData.shippingMethod})</span>
								<span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
							</div>

							{#if discount > 0}
								<div class="flex justify-between text-green-600">
									<span
										>Discount {#if $cartSummary?.coupon || appliedCoupon}({$cartSummary?.coupon ||
												appliedCoupon?.code ||
												'Discount'}){/if}</span
									>
									<span>- ${discount.toFixed(2)}</span>
								</div>
							{/if}

							{#if tax > 0}
								<div class="flex justify-between text-gray-600">
									<span>Tax</span>
									<span>${tax.toFixed(2)}</span>
								</div>
							{/if}

							<div class="flex justify-between border-t pt-4 text-base font-bold text-retro-black">
								<span>Total</span>
								<span>${total.toFixed(2)}</span>
							</div>
						</div>

						{#if step === 1}
							<button
								on:click={() => goToReview()}
								disabled={loading || !$cartItems.length}
								class="w-full bg-black py-3 text-xs tracking-widest text-white uppercase transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if loading}
									Processing...
								{:else}
									Continue to Review
								{/if}
							</button>
						{/if}
					</div>

					<!-- DISCOUNT / COUPON -->
					{#if step === 1}
						<div class="border border-retro-black/10 bg-white p-6 shadow-sm">
							<h4 class="mb-4 font-serif text-lg">Discount Code</h4>

							{#if appliedCoupon}
								<div
									class="mb-3 flex items-center justify-between rounded border border-green-200 bg-green-50 p-3"
								>
									<span class="font-mono text-xs font-bold uppercase">{appliedCoupon.code}</span>
									<button on:click={removeCoupon} class="text-xs underline hover:opacity-70"
										>Remove</button
									>
								</div>
							{:else}
								<div class="flex gap-2">
									<input
										type="text"
										bind:value={couponCode}
										placeholder="Enter Code"
										class="flex-1 border p-2 font-mono text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
									/>
									<button
										on:click={applyCoupon}
										disabled={loading || !couponCode.trim()}
										class="bg-black px-4 text-xs tracking-widest text-white uppercase transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
									>
										Apply
									</button>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
