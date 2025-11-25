<script>
	export let currentPage = 1;
	export let totalPages = 1;
	export let onPageChange = () => {};

	function goToPage(page) {
		if (page >= 1 && page <= totalPages) {
			onPageChange(page);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			goToPage(currentPage + 1);
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			goToPage(currentPage - 1);
		}
	}
</script>

{#if totalPages > 1}
	<div class="mt-12 flex items-center justify-center gap-2">
		<button
			on:click={prevPage}
			disabled={currentPage === 1}
			class="border border-gray-300 px-4 py-2 text-xs tracking-widest uppercase transition-colors hover:border-retro-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			aria-label="Previous page"
		>
			← Previous
		</button>

		{#each Array(Math.min(5, totalPages)) as _, i}
			{@const pageNum =
				currentPage <= 3
					? i + 1
					: currentPage >= totalPages - 2
						? totalPages - 4 + i
						: currentPage - 2 + i}
			{#if pageNum >= 1 && pageNum <= totalPages}
				<button
					on:click={() => goToPage(pageNum)}
					class="border px-4 py-2 text-xs tracking-widest uppercase transition-colors {currentPage ===
					pageNum
						? 'border-retro-black bg-retro-black text-retro-bone'
						: 'border-gray-300 hover:border-retro-black hover:bg-gray-50'}"
					aria-label="Page {pageNum}"
				>
					{pageNum}
				</button>
			{/if}
		{/each}

		<button
			on:click={nextPage}
			disabled={currentPage === totalPages}
			class="border border-gray-300 px-4 py-2 text-xs tracking-widest uppercase transition-colors hover:border-retro-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			aria-label="Next page"
		>
			Next →
		</button>
	</div>
{/if}

