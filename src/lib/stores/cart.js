import { writable, derived, get } from 'svelte/store';
import { API_URL } from '$lib/config.js';

// State
export const cartId = writable(null);
export const cartItems = writable([]);
export const cartSummary = writable({ subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 });
export const isCartOpen = writable(false);
export const isLoading = writable(false);

// --- COMPUTED VALUES ---

export const cartCount = derived(cartItems, ($cartItems) =>
	$cartItems.reduce((total, item) => total + (item.qty || 0), 0)
);

export const cartTotal = derived([cartItems, cartSummary], ([$cartItems, $cartSummary]) => {
	// cartTotal should return value in DOLLARS (same format as cartSummary)
	// This is used as a fallback if cartSummary is not available
	if ($cartSummary && $cartSummary.subtotal > 0) {
		return $cartSummary.subtotal; // Already in dollars
	}
	// Calculate from items (unitPrice is in dollars)
	return $cartItems.reduce((total, item) => {
		const price = Number(item.unitPrice) || 0; // in dollars
		const qty = Number(item.qty) || 0;
		return total + price * qty;
	}, 0);
});

// --- ACTIONS ---

export const initCart = async () => {
	const storedId = localStorage.getItem('retro_cart_id');
	if (storedId) {
		// Just set the cart ID, don't fetch cart data yet
		cartId.set(storedId);
		console.log('[CART] Restored cart ID from storage:', storedId);
	} else {
		try {
			// Include auth token if available (for logged in users)
			const token = localStorage.getItem('auth_token');
			const headers = { 'Content-Type': 'application/json' };
			if (token) {
				headers['Authorization'] = `Bearer ${token.trim()}`;
			}

			const res = await fetch(`${API_URL}/api/cart/init`, {
				method: 'POST',
				headers: headers
			});

			if (!res.ok) throw new Error('Init failed');

			const data = await res.json();
			// API returns { cartId: "...", userId: "..." } for logged in users
			// or { cartId: "..." } for guests
			const newId = data.cartId;

			if (!newId) {
				throw new Error('No cartId in response');
			}

			console.log(
				'[CART] Initialized with ID:',
				newId,
				data.userId ? `(user: ${data.userId})` : '(guest)',
				'- Cart will be fetched when opened'
			);

			cartId.set(newId);
			localStorage.setItem('retro_cart_id', newId);
		} catch (err) {
			console.error('[CART] System Error: Cart Init Failed', err);
		}
	}
};

// Function to load cart when cart button is clicked
export const loadCartOnOpen = async () => {
	const cid = get(cartId);
	if (cid) {
		await fetchCart(cid);
	} else {
		// If no cart ID, initialize first
		await initCart();
		const newCid = get(cartId);
		if (newCid) {
			await fetchCart(newCid);
		}
	}
};

export const fetchCart = async (id) => {
	isLoading.set(true);
	try {
		const res = await fetch(`${API_URL}/api/cart/${encodeURIComponent(id)}`);
		if (res.ok) {
			const data = await res.json();

			console.log('[CART] Raw API response:', JSON.stringify(data, null, 2));

			// API returns { cart: {...} } or direct cart object
			const cart = data.cart || data;

			console.log('[CART] Extracted cart object:', {
				hasItems: !!cart.items,
				itemsCount: cart.items?.length || 0,
				hasSummary: !!cart.summary,
				summary: cart.summary,
				hasCoupon: !!cart.coupon,
				coupon: cart.coupon,
				discount: cart.discount
			});

			// Update Items
			cartItems.set(cart.items || []);

			// CRITICAL: Extract summary from cart.summary (API provides this)
			// The summary contains all calculated values in CENTS
			let summary = null;

			// Priority 1: cart.summary (most reliable)
			if (cart.summary && typeof cart.summary === 'object') {
				// API returns values in DOLLARS - store them as-is (no conversion needed)
				const rawSubtotal = Number(cart.summary.subtotal) || 0;
				const rawDiscount = Number(cart.summary.discount) || 0;
				const rawShipping = Number(cart.summary.shipping) || 0;
				const rawTax = Number(cart.summary.tax) || 0;
				const rawTotal = Number(cart.summary.total) || 0;

				console.log('[CART] Raw summary values from API (in dollars):', {
					subtotal: rawSubtotal,
					discount: rawDiscount,
					shipping: rawShipping,
					tax: rawTax,
					total: rawTotal
				});

				summary = {
					subtotal: rawSubtotal,
					discount: rawDiscount,
					shipping: rawShipping,
					tax: rawTax,
					total: rawTotal
				};

				// Include coupon code if available
				if (cart.coupon) {
					summary.coupon = cart.coupon;
				}

				// Include userId from cart if available
				if (cart.userId) {
					summary.userId = cart.userId;
				}

				console.log('[CART] Using cart.summary (stored in dollars):', summary);
			}
			// Priority 2: data.summary (if cart.summary not available)
			else if (data.summary && typeof data.summary === 'object') {
				summary = {
					subtotal: Number(data.summary.subtotal) || 0,
					discount: Number(data.summary.discount) || 0,
					shipping: Number(data.summary.shipping) || 0,
					tax: Number(data.summary.tax) || 0,
					total: Number(data.summary.total) || 0
				};

				if (data.coupon || cart.coupon) {
					summary.coupon = data.coupon || cart.coupon;
				}

				// Include userId from cart or data if available
				if (cart.userId) {
					summary.userId = cart.userId;
				} else if (data.summary.userId) {
					summary.userId = data.summary.userId;
				}

				console.log('[CART] Using data.summary:', summary);
			}
			// Priority 3: Calculate from cart items (fallback - not ideal)
			else if (cart.items && cart.items.length > 0) {
				// unitPrice is in dollars, so no conversion needed
				const calculatedSubtotal = cart.items.reduce((sum, item) => {
					const price = Number(item.unitPrice) || 0; // in dollars
					const qty = Number(item.qty) || 0;
					return sum + price * qty;
				}, 0);

				summary = {
					subtotal: calculatedSubtotal,
					discount: Number(cart.discount) || 0, // in dollars
					shipping: Number(cart.shippingMethod?.cost) || 0, // in dollars
					tax: 0,
					total: 0 // Can't calculate without backend
				};

				if (cart.coupon) {
					summary.coupon = cart.coupon;
				}

				console.warn('[CART] Calculated summary from items (fallback, in dollars):', summary);
			}

			// Always set summary (even if empty) to ensure reactive updates
			if (summary) {
				// Ensure userId is included from cart if available
				if (!summary.userId && cart.userId) {
					summary.userId = cart.userId;
				}
				// If still no userId, try to get from data root level
				if (!summary.userId && data.userId) {
					summary.userId = data.userId;
				}
				console.log('[CART] Final summary being set (in dollars):', summary);
				cartSummary.set(summary);
			} else {
				console.warn('[CART] No summary found - setting empty summary');
				const emptySummary = { subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 };
				// Include userId if available from cart or data
				if (cart.userId) {
					emptySummary.userId = cart.userId;
				} else if (data.userId) {
					emptySummary.userId = data.userId;
				}
				cartSummary.set(emptySummary);
			}
		} else {
			console.error('[CART] Failed to fetch cart:', res.status, await res.text().catch(() => ''));
		}
	} catch (err) {
		console.error('[CART] Sync Error', err);
	} finally {
		isLoading.set(false);
	}
};

// Add Item - FIXED VERSION
export const addToCart = async (product, quantity = 1) => {
	const cid = get(cartId);
	if (!cid) {
		console.error('[CART] Cart ID missing. Make sure initCart() ran.');
		return;
	}

	// ===== CRITICAL FIX: Ensure we have the right ID field =====
	// The API needs 'productId' but products might come with 'id' or 'productId'
	const productId = product.productId || product.id;

	if (!productId) {
		console.error('[CART] ERROR: Product has no ID!', product);
		alert('Cannot add product: Missing product ID');
		return;
	}

	// Determine Variant ID - use first variant if not specified
	const variantId =
		product.selectedVariantId ||
		product.variantId ||
		product.variants?.[0]?.variantId ||
		product.variants?.[0]?.id ||
		1; // Fallback to 1 if no variants exist

	console.log('[CART] Adding to cart:', {
		productId,
		variantId,
		quantity,
		product
	});

	// Open cart drawer
	isCartOpen.set(true);

	// Optimistic UI Update
	cartItems.update((items) => {
		const existing = items.find((i) => i.productId === productId && i.variantId === variantId);

		if (existing) {
			return items.map((i) =>
				i.productId === productId && i.variantId === variantId
					? { ...i, qty: (i.qty || 0) + quantity }
					: i
			);
		}

		return [
			...items,
			{
				...product,
				productId: productId,
				variantId: variantId,
				qty: quantity,
				unitPrice: product.price || product.metadata?.price || product.variants?.[0]?.price || 0,
				title: product.title || product.name,
				image: product.image || product.images?.[0]
			}
		];
	});

	// API Call
	try {
		const payload = {
			productId: productId, // ⚠️ Server requires this exact field name
			variantId: variantId,
			quantity: quantity
		};

		console.log('[CART] Sending to API:', payload);

		// Include auth token if available to set userId in cart
		const token = localStorage.getItem('auth_token');
		const headers = { 'Content-Type': 'application/json' };
		if (token) {
			headers['Authorization'] = `Bearer ${token.trim()}`;
		}

		const res = await fetch(`${API_URL}/api/cart/${encodeURIComponent(cid)}/add`, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			const errorText = await res.text();
			console.error('[CART] API Error Response:', errorText);
			throw new Error(`Server Error (${res.status}): ${errorText}`);
		}

		const data = await res.json();
		console.log('[CART] Add successful:', data);

		// Use response data directly - API returns full cart object
		const cart = data.cart || data;
		
		// Update items from response
		cartItems.set(cart.items || []);
		
		// Update summary from response
		if (cart.summary) {
			const summary = {
				subtotal: Number(cart.summary.subtotal) || 0,
				discount: Number(cart.summary.discount) || 0,
				shipping: Number(cart.summary.shipping) || 0,
				tax: Number(cart.summary.tax) || 0,
				total: Number(cart.summary.total) || 0,
				...(cart.coupon && { coupon: cart.coupon }),
				...(cart.userId && { userId: cart.userId }),
				...(data.userId && !cart.userId && { userId: data.userId })
			};
			cartSummary.set(summary);
		} else {
			// Fallback: calculate from items if summary not provided
			const calculatedSubtotal = (cart.items || []).reduce((sum, item) => {
				const price = Number(item.unitPrice) || 0;
				const qty = Number(item.qty) || 0;
				return sum + price * qty;
			}, 0);
			cartSummary.set({
				subtotal: calculatedSubtotal,
				discount: 0,
				shipping: 0,
				tax: 0,
				total: calculatedSubtotal
			});
		}
	} catch (err) {
		console.error('[CART] Add to Cart Failed:', err);
		alert(`Failed to add to cart: ${err.message}`);

		// Revert optimistic update by fetching cart
		await fetchCart(cid);
	}
};

export const updateItem = async (productId, newQuantity, variantId = null) => {
	const cid = get(cartId);
	if (!cid) return;

	console.log('[CART] Updating item:', { productId, variantId, newQuantity });

	// Find the item to get its variantId if not provided
	const currentItems = get(cartItems);
	const item = currentItems.find((i) => i.productId === productId);
	const itemVariantId = variantId !== null ? variantId : item?.variantId || null;

	// Optimistic Update
	cartItems.update((items) => {
		if (newQuantity <= 0) {
			return items.filter((i) => {
				const iVariantId = i.variantId || null;
				return !(i.productId === productId && iVariantId === itemVariantId);
			});
		}
		return items.map((i) => {
			const iVariantId = i.variantId || null;
			if (i.productId === productId && iVariantId === itemVariantId) {
				return { ...i, qty: newQuantity };
			}
			return i;
		});
	});

	try {
		// Include auth token if available
		const token = localStorage.getItem('auth_token');
		const headers = { 'Content-Type': 'application/json' };
		if (token) {
			headers['Authorization'] = `Bearer ${token.trim()}`;
		}

		const res = await fetch(`${API_URL}/api/cart/${encodeURIComponent(cid)}/update`, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify({
				productId,
				quantity: newQuantity,
				variantId: itemVariantId
			})
		});

		if (!res.ok) {
			throw new Error('Update failed');
		}

		const data = await res.json();
		
		// Use response data directly - API returns full cart object
		const cart = data.cart || data;
		cartItems.set(cart.items || []);
		
		if (cart.summary) {
			const summary = {
				subtotal: Number(cart.summary.subtotal) || 0,
				discount: Number(cart.summary.discount) || 0,
				shipping: Number(cart.summary.shipping) || 0,
				tax: Number(cart.summary.tax) || 0,
				total: Number(cart.summary.total) || 0,
				...(cart.coupon && { coupon: cart.coupon }),
				...(cart.userId && { userId: cart.userId }),
				...(data.userId && !cart.userId && { userId: data.userId })
			};
			cartSummary.set(summary);
		} else {
			// Fallback: calculate from items if summary not provided
			const calculatedSubtotal = (cart.items || []).reduce((sum, item) => {
				const price = Number(item.unitPrice) || 0;
				const qty = Number(item.qty) || 0;
				return sum + price * qty;
			}, 0);
			const fallbackSummary = {
				subtotal: calculatedSubtotal,
				discount: 0,
				shipping: 0,
				tax: 0,
				total: calculatedSubtotal,
				...(cart.userId && { userId: cart.userId }),
				...(data.userId && !cart.userId && { userId: data.userId })
			};
			cartSummary.set(fallbackSummary);
		}
	} catch (err) {
		console.error('[CART] Update Error', err);
		await fetchCart(cid); // Revert on error
	}
};

export const removeItem = async (productId, variantId = null) => {
	const cid = get(cartId);
	if (!cid) return;

	console.log('[CART] Removing item:', { productId, variantId });

	// Optimistic Update
	cartItems.update((items) => {
		if (variantId) {
			return items.filter((i) => !(i.productId === productId && i.variantId === variantId));
		}
		return items.filter((i) => i.productId !== productId);
	});

	try {
		const payload = { productId };
		if (variantId) payload.variantId = variantId;

		// Include auth token if available
		const token = localStorage.getItem('auth_token');
		const headers = { 'Content-Type': 'application/json' };
		if (token) {
			headers['Authorization'] = `Bearer ${token.trim()}`;
		}

		const res = await fetch(`${API_URL}/api/cart/${encodeURIComponent(cid)}/remove`, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			throw new Error('Remove failed');
		}

		const data = await res.json();
		
		// Use response data directly - API returns full cart object
		const cart = data.cart || data;
		cartItems.set(cart.items || []);
		
		if (cart.summary) {
			const summary = {
				subtotal: Number(cart.summary.subtotal) || 0,
				discount: Number(cart.summary.discount) || 0,
				shipping: Number(cart.summary.shipping) || 0,
				tax: Number(cart.summary.tax) || 0,
				total: Number(cart.summary.total) || 0,
				...(cart.coupon && { coupon: cart.coupon }),
				...(cart.userId && { userId: cart.userId }),
				...(data.userId && !cart.userId && { userId: data.userId })
			};
			cartSummary.set(summary);
		} else {
			// Fallback: calculate from items if summary not provided
			const calculatedSubtotal = (cart.items || []).reduce((sum, item) => {
				const price = Number(item.unitPrice) || 0;
				const qty = Number(item.qty) || 0;
				return sum + price * qty;
			}, 0);
			const fallbackSummary = {
				subtotal: calculatedSubtotal,
				discount: 0,
				shipping: 0,
				tax: 0,
				total: calculatedSubtotal,
				...(cart.userId && { userId: cart.userId }),
				...(data.userId && !cart.userId && { userId: data.userId })
			};
			cartSummary.set(fallbackSummary);
		}
	} catch (err) {
		console.error('[CART] Remove Error', err);
		await fetchCart(cid); // Revert on error
	}
};

export const clearCart = async () => {
	const cid = get(cartId);
	if (!cid) return;

	console.log('[CART] Clearing cart');

	// Optimistic update - preserve userId if it exists
	const currentSummary = get(cartSummary);
	const emptySummary = { 
		subtotal: 0, 
		tax: 0, 
		shipping: 0, 
		discount: 0, 
		total: 0,
		...(currentSummary?.userId && { userId: currentSummary.userId })
	};
	cartItems.set([]);
	cartSummary.set(emptySummary);

	try {
		// Include auth token if available
		const token = localStorage.getItem('auth_token');
		const headers = { 'Content-Type': 'application/json' };
		if (token) {
			headers['Authorization'] = `Bearer ${token.trim()}`;
		}

		const res = await fetch(`${API_URL}/api/cart/${encodeURIComponent(cid)}/clear`, {
			method: 'POST',
			headers: headers
		});
		
		if (!res.ok) {
			throw new Error('Clear failed');
		}

		const data = await res.json();
		
		// Use response data if available - API returns full cart object
		const cart = data.cart || data;
		if (cart) {
			cartItems.set(cart.items || []);
			if (cart.summary) {
				const summary = {
					subtotal: Number(cart.summary.subtotal) || 0,
					discount: Number(cart.summary.discount) || 0,
					shipping: Number(cart.summary.shipping) || 0,
					tax: Number(cart.summary.tax) || 0,
					total: Number(cart.summary.total) || 0,
					...(cart.coupon && { coupon: cart.coupon }),
					...(cart.userId && { userId: cart.userId }),
					...(data.userId && !cart.userId && { userId: data.userId })
				};
				cartSummary.set(summary);
			}
		}
	} catch (err) {
		console.error('[CART] Purge Error', err);
		// Revert on error
		await fetchCart(cid);
	}
};
