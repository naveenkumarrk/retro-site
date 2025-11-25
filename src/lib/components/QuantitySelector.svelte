<script>
	export let quantity = 1;
	export let min = 1;
	export let max = 99;
	export let onQuantityChange = () => {};

	function changeQty(delta) {
		const newQty = quantity + delta;
		if (newQty >= min && newQty <= max) {
			quantity = newQty;
			onQuantityChange(newQty);
		}
	}
</script>

<div class="flex items-center justify-between border border-black/20 px-3 font-mono">
	<button
		on:click={() => changeQty(-1)}
		disabled={quantity <= min}
		class="px-2 py-1 transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
		aria-label="Decrease quantity"
	>
		−
	</button>
	<span class="min-w-[2rem] text-center font-semibold">{quantity}</span>
	<button
		on:click={() => changeQty(1)}
		disabled={quantity >= max}
		class="px-2 py-1 transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
		aria-label="Increase quantity"
	>
		+
	</button>
</div>

