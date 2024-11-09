const fs = require("fs");
const pocketbase = require("pocketbase/cjs");
const dbUrl = "http://app";
const adminEmail = "admin@jctf.jctf";
const adminPassword = process.env.ADMIN_PASSWORD;
const flagPassword = process.env.FLAG_PASSWORD;

const setupDB = async (email, password) => {
	const url_BmNF_1 = `${dbUrl}/api/admins`;
	const headers_WAMJ_1 = {
		Origin: dbUrl,
		Referer: `${dbUrl}/_/?installer`,
		Connection: "close",
		"Content-Type": "application/json",
	};
	const body_BBfI_1 = {
		email: email,
		password: password,
		passwordConfirm: password,
	};
	await fetch(url_BmNF_1, {
		method: "POST",
		headers: headers_WAMJ_1,
		body: JSON.stringify(body_BBfI_1),
	});
};

const createTable = async (token) => {
	const url_Aobe_1 = `${dbUrl}/api/collections`;
	const headers_WLYv_1 = {
		Origin: dbUrl,
		Authorization: token,
		"Content-Type": "application/json",
	};

	const body_ZkPq_1 = {
		id: "",
		created: "",
		updated: "",
		name: "plants",
		type: "base",
		system: false,
		listRule: "@request.auth.id = creator.id",
		viewRule: "@request.auth.id != null",
		createRule: "@request.auth.id = creator.id",
		updateRule: null,
		deleteRule: null,
		schema: [
			{
				id: "",
				name: "img",
				type: "file",
				system: false,
				required: true,
				options: {
					maxSelect: 1,
					maxSize: 5000,
					thumbs: ["32x32"],
					mimeTypes: ["image/png"],
					protected: false,
				},
				onMountSelect: false,
				originalName: "field",
				toDelete: false,
				nullable: false,
			},
			{
				id: "",
				name: "title",
				type: "text",
				system: false,
				required: false,
				options: { min: 3, max: 204, pattern: "" },
				onMountSelect: false,
				originalName: "field",
				toDelete: false,
			},
			{
				id: "",
				name: "creator",
				type: "relation",
				system: false,
				required: true,
				options: {
					maxSelect: 1,
					collectionId: "_pb_users_auth_",
					cascadeDelete: true,
				},
				onMountSelect: false,
				originalName: "field",
				toDelete: false,
				nullable: false,
			},
		],
		indexes: [],
		options: {},
		originalName: "",
	};
	const response = await fetch(url_Aobe_1, {
		method: "POST",
		headers: headers_WLYv_1,
		body: JSON.stringify(body_ZkPq_1),
	});
	await response.json();
};

const authenticate = async (pb) => {
	await pb.admins.authWithPassword(adminEmail, adminPassword);
};

const seed = async (pb) => {
	const token = pb.authStore.baseToken;
	await createTable(token);
	const user = await pb.collection("users").create({
		username: "flag",
		password: flagPassword,
		passwordConfirm: flagPassword,
	});
	const flagFile = fs.readFileSync("./plants/polant.png");
	const formData = new FormData();
	formData.append("title", "flag");
	formData.append("creator", user.id);
	formData.append("img", new Blob([flagFile]), "flag.png");
	await pb.collection("plants").create(formData);
};

const main = async () => {
	console.log("setting up db", adminEmail, adminPassword);
	await new Promise((resolve) => setTimeout(resolve, 5000));
	await setupDB(adminEmail, adminPassword);
	const pb = new pocketbase(dbUrl);
	await authenticate(pb);
	await seed(pb);
	console.log("db setup complete");
};

(() => main())();
