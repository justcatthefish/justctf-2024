<script>
	import { pb } from '$lib';
	import { onMount } from 'svelte';
	import CreatePlant from './CreatePlant.svelte';
	import { getContext } from 'svelte';
	let plants = [];
	let login = '';
	let password = '';
	const user = getContext('user');

	const loadPlants = async () => {
		const records = await pb.collection('plants').getFullList({
			sort: '-created'
		});
		plants = records;
	};
	const mount = async () => {
		if (pb.authStore.isValid) {
			try {
				await pb.collection('users').authRefresh();
			} catch (error) {
				pb.authStore.clear();
				user.set(pb.authStore);
			}
		}
		user.subscribe(() => {
			loadPlants();
		});
	};

	const loginOrRegister = async () => {
		try {
			try {
				await pb.collection('users').create({
					username: login,
					password,
					passwordConfirm: password
				});
			} catch (err) {}
			await pb.collection('users').authWithPassword(login, password);
			document.cookie = pb.authStore.exportToCookie();
			user.set(pb.authStore);
			login = '';
			password = '';
		} catch (error) {
			alert('Wrong auth / Too simple password / Wrong username');
		}
	};

	onMount(mount);
</script>

<section class="hero">
	<div class="hero-body">
		<p class="title">Plants</p>
		<p class="subtitle">
			welcome to the world of plants! you can safely and securely store your plants here and share
			them with your friends.
		</p>
		{#if !$user.isValid}
			<div class="field">
				<div class="label">login</div>
				<div class="control">
					<input
						class="input"
						type="text"
						placeholder="john"
						bind:value={login}
					/>
				</div>
			</div>

			<div class="field">
				<div class="label">password</div>
				<div class="control">
					<input
						class="input"
						type="password"
						placeholder="Sup3r S3cr3T P4S5w0rd"
						bind:value={password}
					/>
				</div>
			</div>

			<button
				class={`button is-primary`}
				on:click={loginOrRegister}
				id="login-button">enter</button
			>
		{:else}
			<button
				class="button is-danger"
				on:click={() => {
					pb.authStore.clear();
					user.set(pb.authStore);
				}}>Logout</button
			>
		{/if}
		{#if $user.isValid}
			<p>
				Logged as {$user.model.username}
			</p>
			{#if plants.length === 0}
				You don't have any plants yet
			{:else}
				<div class="column">
					{#each plants as plant}
						<div class="card">
							<div class="card-content">
								<div class="media">
									<div class="media-left">
										<figure class="image">
											<img src={pb.files.getUrl(plant, plant.img)} alt={plant.id} />
										</figure>
									</div>
									<div class="content">
										<p class="title is-4">
											This gorgeous plant belongs to {$user.model.username}! Click the button to see
											more about it
										</p>
										<button
											class="button is-primary"
											on:click={() => {
												window.location = `/view-plant?id=${plant.id}`;
											}}>View fully</button
										>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
			<hr />
			<CreatePlant />
		{/if}
	</div>
</section>
