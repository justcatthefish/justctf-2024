<script>
	import { pb } from '$lib';

	const formData = new FormData();
	let isLoading = false;
	let title = '';
	let img = null;

	const createPlant = async () => {
		try {
			isLoading = true;
			formData.append('title', title);
			formData.append('img', img[0]);
			formData.append('creator', pb.authStore?.model?.id);
			await pb.collection('plants').create(formData);
			title = '';
			img = null;
			window.location.reload();
		} catch (error) {
			alert(error?.message ?? 'unknown error');
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="box">
	<div class="field">
		<div class="control">
			<input
				class="input"
				type="text"
				placeholder="plant title"
				bind:value={title}
				disabled={isLoading}
			/>
		</div>
	</div>

	<div class={`file ${img?.length > 0 ? 'has-name' : ''}`}>
		<label class="file-label">
			<input class="file-input" type="file" name="img" bind:files={img} disabled={isLoading} />
			<span class="file-cta">
				<span class="file-icon">
					<i class="fas fa-upload"></i>
				</span>
				<span class="file-label">Choose a file…</span>
			</span>
			{#if img?.length > 0}
				<span class="file-name">{img[0].name}</span>
			{/if}
		</label>
	</div>

	<button class={`button is-primary ${isLoading ? 'is-loading' : ''}`} on:click={createPlant}>
		create plant
	</button>
</div>
