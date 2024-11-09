<script>
	import { onMount } from 'svelte';
	import { pb } from '$lib';

	let blacklist = [
		'window',
		'document',
		'cookie',
		'fetch',
		'navigator',
		'sendbeacon',
		'+',
		'_',
		'script',
		'!',
		'"',
		'#',
		'%',
		"'",
		'(',
		')',
		'*',
		'+',
		',',
		'-',
		'/',
		':',
		'?',
		'@',
		'[',
		']',
		';'
	];
	let id = null;
	let plant = null;
	let isLoading = true;
	let title;

	onMount(async () => {
		const params = new URLSearchParams(window.location.search);
		id = params.get('id');
		try {
			plant = await pb.collection('plants').getOne(id);
		} catch (error) {
			window.location.href = '/';
		} finally {
			isLoading = false;
		}
		setTimeout(() => {
			const sanitizedTitle = DOMPurify.sanitize(plant.title);
			const newTitleElement = document.createElement('div');
			newTitleElement.classList.add('title');
			newTitleElement.innerHTML = sanitizedTitle;
			const safe = newTitleElement.innerText;
			try {
				if (blacklist.some((word) => safe.toLowerCase().includes(word))) {
					throw new Error('not safe!!!');
				}
				title.innerHTML = safe;
			} catch (err) {
				window.location.href = '/';
			}
		}, 100);
	});
</script>

<div style="padding: 1rem; display: flex; justify-content: space-between; align-items: center">
	<a href="/">back</a>
</div>
<hr />

{#if isLoading}
	<div
		style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; "
	>
		<div class="loader"></div>
	</div>
{:else}
	<div class="hero">
		<div class="hero-body">
			<button
				class="button is-link"
				on:click={async () => {
					await navigator.share({
						url: window.location.href
					});
				}}>Share it with your friend</button
			>
			<div class="title" bind:this={title} style="display: flex; justify-content: space-around;">
				<div>Loading...</div>
				<div class="loader"></div>
			</div>
			<div
				style="background-size: contain; background-repeat: no-repeat; background-image: url('{pb.files.getUrl(
					plant,
					plant.img
				)}') ; height: 50vh; display: flex; justify-content: center; align-items: center; overflow: auto;"
			></div>
			<div
				class="footer"
				style="display: flex; justify-content: space-around; bottom: 0; left: 0; position: fixed; width: 100vw;"
			>
				<a
					href="report"
					on:click|preventDefault={async () => {
						const response = await fetch('/report', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								id: plant.id
							})
						});
						if (response.ok) {
							alert('reported');
						} else {
							alert('error');
						}
					}}>Inappropriate content? Report</a
				>
			</div>
		</div>
	</div>
{/if}
