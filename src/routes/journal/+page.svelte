<script>
	const articles = [
		{
			id: 1,
			title: 'The Art of Console Restoration',
			category: 'GUIDE',
			date: '2025.03.15',
			excerpt:
				'A deep dive into the meticulous process of bringing vintage gaming hardware back to life.',
			image:
				'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
			readTime: '8 min'
		},
		{
			id: 2,
			title: 'Parallel Timeline Theory',
			category: 'RESEARCH',
			date: '2025.03.10',
			excerpt: 'How we source authentic retro-futuristic hardware from alternate dimensions.',
			image:
				'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
			readTime: '12 min'
		},
		{
			id: 3,
			title: 'Neural Interface Evolution',
			category: 'TECHNOLOGY',
			date: '2025.03.05',
			excerpt: 'Tracing the development of direct cortex connection hardware across timelines.',
			image:
				'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
			readTime: '10 min'
		},
		{
			id: 4,
			title: "Collector's Guide: CRT Monitors",
			category: 'GUIDE',
			date: '2025.02.28',
			excerpt: 'What to look for when acquiring vintage displays. Specs, condition, and rarity.',
			image:
				'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
			readTime: '6 min'
		},
		{
			id: 5,
			title: 'The Aesthetic of Decay',
			category: 'PHILOSOPHY',
			date: '2025.02.20',
			excerpt: 'Why patina and wear marks make hardware more valuable, not less.',
			image:
				'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
			readTime: '7 min'
		},
		{
			id: 6,
			title: 'Interview: Dr. K. Tanaka',
			category: 'PROFILE',
			date: '2025.02.15',
			excerpt: 'Our chief curator discusses the future of vintage tech preservation.',
			image:
				'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
			readTime: '15 min'
		}
	];

	let selectedCategory = 'ALL';
	const categories = ['ALL', 'GUIDE', 'RESEARCH', 'TECHNOLOGY', 'PHILOSOPHY', 'PROFILE'];

	$: filteredArticles =
		selectedCategory === 'ALL' ? articles : articles.filter((a) => a.category === selectedCategory);
</script>

<!-- Hero -->
<section class="border-b border-retro-black/10 py-16 md:py-24">
	<div class="max-w-4xl">
		<p class="mb-6 font-mono text-[10px] tracking-[0.3em] text-gray-400 uppercase">JOURNAL</p>
		<h1 class="mb-12 font-serif text-6xl leading-[0.9] md:text-8xl">
			Dispatches<br />
			From The<br />
			<span class="text-gray-400 italic">Grid</span>
		</h1>
		<p class="max-w-2xl font-mono text-base leading-relaxed text-gray-700">
			Essays, guides, and research on vintage technology, retro-futurism, and the preservation of
			hardware across parallel timelines.
		</p>
	</div>
</section>

<!-- Category Filter -->
<section class="sticky top-20 z-40 border-b border-gray-200 bg-retro-bone py-8">
	<div class="flex gap-6 overflow-x-auto">
		{#each categories as cat}
			<button
				on:click={() => (selectedCategory = cat)}
				class="pb-2 font-mono text-xs tracking-widest whitespace-nowrap uppercase transition-colors
          {selectedCategory === cat
					? 'border-b-2 border-retro-black text-retro-black'
					: 'text-gray-400 hover:text-gray-700'}"
			>
				{cat}
			</button>
		{/each}
	</div>
</section>

<!-- Featured Article -->
{#if filteredArticles.length > 0}
	<section class="py-16">
		<div class="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
			<div class="aspect-[4/3] overflow-hidden bg-[#f0eee6]">
				<img
					src={filteredArticles[0].image}
					alt={filteredArticles[0].title}
					class="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
				/>
			</div>

			<div>
				<div class="mb-4 flex items-center gap-4">
					<span class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">
						{filteredArticles[0].category}
					</span>
					<span class="h-1 w-1 rounded-full bg-gray-400"></span>
					<span class="font-mono text-[10px] text-gray-500">{filteredArticles[0].date}</span>
					<span class="h-1 w-1 rounded-full bg-gray-400"></span>
					<span class="font-mono text-[10px] text-gray-500"
						>{filteredArticles[0].readTime} read</span
					>
				</div>

				<h2 class="mb-6 font-serif text-4xl leading-tight md:text-5xl">
					{filteredArticles[0].title}
				</h2>

				<p class="mb-8 font-mono text-sm leading-relaxed text-gray-700">
					{filteredArticles[0].excerpt}
				</p>

				<button
					class="font-mono text-xs tracking-widest uppercase underline decoration-1 underline-offset-4 hover:opacity-60"
				>
					Read Full Article →
				</button>
			</div>
		</div>
	</section>
{/if}

<!-- Article Grid -->
<section class="border-t border-retro-black/10 py-16">
	<div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredArticles.slice(1) as article}
			<article class="group cursor-pointer">
				<div class="mb-6 aspect-[4/3] overflow-hidden bg-[#f0eee6]">
					<img
						src={article.image}
						alt={article.title}
						class="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
					/>
				</div>

				<div class="mb-3 flex items-center gap-3">
					<span class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">
						{article.category}
					</span>
					<span class="h-1 w-1 rounded-full bg-gray-400"></span>
					<span class="font-mono text-[10px] text-gray-500">{article.date}</span>
				</div>

				<h3
					class="mb-3 font-serif text-2xl leading-tight transition-opacity group-hover:opacity-70"
				>
					{article.title}
				</h3>

				<p class="mb-4 font-mono text-xs leading-relaxed text-gray-600">
					{article.excerpt}
				</p>

				<div class="flex items-center justify-between">
					<span class="font-mono text-[10px] text-gray-500">{article.readTime} read</span>
					<button
						class="font-mono text-xs tracking-widest uppercase underline decoration-1 underline-offset-4 hover:opacity-60"
					>
						Read →
					</button>
				</div>
			</article>
		{/each}
	</div>
</section>

<!-- Newsletter CTA -->
<section class="border-t border-retro-black/10 py-24">
	<div class="mx-auto max-w-2xl text-center">
		<div
			class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-retro-black"
		>
			<span class="font-serif text-2xl">✉</span>
		</div>

		<h2 class="mb-4 font-serif text-4xl">Subscribe to Journal</h2>
		<p class="mb-8 font-mono text-xs tracking-widest text-gray-500 uppercase">
			Receive new articles, research, and guides directly to your inbox
		</p>

		<form class="mx-auto flex max-w-md gap-3">
			<input
				type="email"
				placeholder="your@email.com"
				class="flex-1 border border-retro-black/20 px-4 py-3 font-mono text-xs focus:border-retro-black focus:outline-none"
			/>
			<button
				type="submit"
				class="bg-retro-black px-6 py-3 text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800"
			>
				Subscribe
			</button>
		</form>
	</div>
</section>
