<script>
	let formData = {
		name: '',
		email: '',
		subject: 'general',
		message: ''
	};

	let submitted = false;
	let loading = false;

	async function handleSubmit() {
		loading = true;

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		submitted = true;
		loading = false;

		// Reset form after 3 seconds
		setTimeout(() => {
			submitted = false;
			formData = { name: '', email: '', subject: 'general', message: '' };
		}, 3000);
	}

	const faqs = [
		{
			question: 'What is your return policy?',
			answer:
				'We offer a 30-day return protocol for all hardware. Items must be in original condition with all documentation. Neural interfaces are non-returnable once activated.'
		},
		{
			question: 'Do you ship internationally?',
			answer:
				'Yes, we ship to most parallel timelines and physical dimensions. Shipping costs vary by destination and are calculated at checkout.'
		},
		{
			question: 'Are your products authenticated?',
			answer:
				'Every item is verified through our multi-timeline authentication process. Each product includes a certificate of authenticity and full restoration documentation.'
		},
		{
			question: 'How long does restoration take?',
			answer:
				'Most items are restored and ready to ship within 3-5 business days. Complex neural interfaces may require additional calibration time.'
		},
		{
			question: 'Do you offer warranties?',
			answer:
				'All products include a 1-year warranty covering manufacturing defects and restoration work. Extended warranties are available for cybernetic components.'
		},
		{
			question: 'Can I trade in my old hardware?',
			answer:
				'Yes! We accept trade-ins for vintage tech and cyberware. Contact our team for an evaluation and quote.'
		}
	];
</script>

<!-- Hero -->
<section class="border-b border-retro-black/10 py-16 md:py-24">
	<div class="max-w-4xl">
		<p class="mb-6 font-mono text-[10px] tracking-[0.3em] text-gray-400 uppercase">CONTACT</p>
		<h1 class="mb-12 font-serif text-6xl leading-[0.9] md:text-8xl">
			Get In<br />
			<span class="text-gray-400 italic">Touch</span>
		</h1>
		<p class="max-w-2xl font-mono text-base leading-relaxed text-gray-700">
			Questions about products, orders, or timeline authentication? Our support team is standing by
			across all dimensions.
		</p>
	</div>
</section>

<!-- Contact Methods -->
<section class="border-b border-retro-black/10 py-16">
	<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
		<div class="text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-retro-black"
			>
				<span class="font-serif text-2xl">@</span>
			</div>
			<h3 class="mb-2 font-serif text-xl">Email</h3>
			<p class="mb-2 font-mono text-xs text-gray-600">support@cybervintage.systems</p>
			<p class="font-mono text-[10px] text-gray-400">Response within 24 hours</p>
		</div>

		<div class="text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-retro-black"
			>
				<span class="font-serif text-2xl">☎</span>
			</div>
			<h3 class="mb-2 font-serif text-xl">Phone</h3>
			<p class="mb-2 font-mono text-xs text-gray-600">+1 (555) RETRO-01</p>
			<p class="font-mono text-[10px] text-gray-400">Mon-Fri 9AM-6PM PST</p>
		</div>

		<div class="text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-retro-black"
			>
				<span class="font-serif text-2xl">◆</span>
			</div>
			<h3 class="mb-2 font-serif text-xl">Visit</h3>
			<p class="mb-2 font-mono text-xs text-gray-600">By appointment only</p>
			<p class="font-mono text-[10px] text-gray-400">Request via email</p>
		</div>
	</div>
</section>

<!-- Contact Form -->
<section class="py-24">
	<div class="mx-auto max-w-3xl">
		<h2 class="mb-12 text-center font-serif text-5xl">Send Message</h2>

		{#if submitted}
			<div class="border border-green-200 bg-green-50 p-8 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white"
				>
					<span class="text-3xl">✓</span>
				</div>
				<h3 class="mb-2 font-serif text-2xl">Message Transmitted</h3>
				<p class="font-mono text-xs text-gray-600">We'll respond within 24 hours</p>
			</div>
		{:else}
			<form on:submit|preventDefault={handleSubmit} class="space-y-8">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="flex flex-col gap-2">
						<label
							for="contact-name"
							class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Name *</label
						>
						<input
							id="contact-name"
							type="text"
							bind:value={formData.name}
							required
							class="border border-gray-300 p-3 font-mono text-sm outline-none focus:border-black"
						/>
					</div>

					<div class="flex flex-col gap-2">
						<label
							for="contact-email"
							class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Email *</label
						>
						<input
							id="contact-email"
							type="email"
							bind:value={formData.email}
							required
							class="border border-gray-300 p-3 font-mono text-sm outline-none focus:border-black"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<label
						for="contact-subject"
						class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Subject *</label
					>
					<select
						id="contact-subject"
						bind:value={formData.subject}
						class="border border-gray-300 p-3 font-mono text-sm outline-none focus:border-black"
					>
						<option value="general">General Inquiry</option>
						<option value="order">Order Status</option>
						<option value="product">Product Question</option>
						<option value="technical">Technical Support</option>
						<option value="return">Returns & Refunds</option>
						<option value="wholesale">Wholesale/Partnership</option>
					</select>
				</div>

				<div class="flex flex-col gap-2">
					<label
						for="contact-message"
						class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Message *</label
					>
					<textarea
						id="contact-message"
						bind:value={formData.message}
						required
						rows="6"
						class="resize-none border border-gray-300 p-3 font-mono text-sm outline-none focus:border-black"
						placeholder="Describe your inquiry..."
					></textarea>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-retro-black py-4 font-mono text-xs tracking-widest text-retro-bone uppercase transition-colors hover:bg-gray-800 disabled:opacity-50"
				>
					{loading ? 'Transmitting...' : 'Send Message'}
				</button>
			</form>
		{/if}
	</div>
</section>

<!-- FAQ -->
<section class="border-t border-retro-black/10 py-24">
	<div class="mx-auto max-w-4xl">
		<h2 class="mb-16 text-center font-serif text-5xl">Frequently Asked</h2>

		<div class="space-y-8">
			{#each faqs as faq}
				<details class="group border-b border-gray-200 pb-6">
					<summary
						class="flex cursor-pointer list-none items-center justify-between font-serif text-2xl transition-opacity hover:opacity-70"
					>
						<span>{faq.question}</span>
						<span class="transform text-xl transition-transform group-open:rotate-45">+</span>
					</summary>
					<p class="mt-4 pl-6 font-mono text-sm leading-relaxed text-gray-700">
						{faq.answer}
					</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<!-- Hours & Location -->
<section class="border-t border-retro-black/10 bg-[#f0eee6] py-24">
	<div class="mx-auto max-w-4xl">
		<h2 class="mb-12 font-serif text-4xl">Operating Hours</h2>

		<div class="grid grid-cols-1 gap-12 font-mono text-sm md:grid-cols-2">
			<div>
				<h3 class="mb-4 text-[10px] tracking-widest text-gray-500 uppercase">Support Hours</h3>
				<div class="space-y-2">
					<div class="flex justify-between">
						<span>Monday - Friday</span>
						<span>9:00 AM - 6:00 PM PST</span>
					</div>
					<div class="flex justify-between">
						<span>Saturday</span>
						<span>10:00 AM - 4:00 PM PST</span>
					</div>
					<div class="flex justify-between">
						<span>Sunday</span>
						<span>Closed</span>
					</div>
				</div>
			</div>

			<div>
				<h3 class="mb-4 text-[10px] tracking-widest text-gray-500 uppercase">Showroom Visits</h3>
				<p class="mb-4 text-gray-700">
					By appointment only. Email us at least 48 hours in advance to schedule a private viewing
					of our collection.
				</p>
				<p class="text-xs text-gray-500">
					Location: San Francisco, CA<br />
					(Exact address provided upon confirmation)
				</p>
			</div>
		</div>
	</div>
</section>
