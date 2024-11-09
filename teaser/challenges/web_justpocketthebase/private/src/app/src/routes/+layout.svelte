<script>
	import { pb } from '$lib';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	const user = writable();
	$: user.set(pb.authStore);

	setContext('user', user);
</script>

<slot></slot>
