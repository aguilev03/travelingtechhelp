export default {
	async fetch(request, env, ctx) {
		const allowedOrigin = 'https://www.travelingtechpro.com';
		const origin = request.headers.get('Origin');

		const withCors = (response) => {
			response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
			response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
			response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
			return response;
		};

		if (request.method === 'OPTIONS') {
			return withCors(new Response(null, { status: 204 }));
		}

		if (origin !== allowedOrigin) {
			return withCors(new Response('Forbidden', { status: 403 }));
		}

		if (request.method !== 'POST') {
			return withCors(new Response('Method Not Allowed', { status: 405 }));
		}

		let data;
		try {
			data = await request.json();
		} catch (err) {
			return withCors(new Response('Invalid JSON', { status: 400 }));
		}

		// ✅ INSERT THIS BLOCK to handle Turnstile CAPTCHA
		const token = data['cf-turnstile-response']; // sent from the form input
		if (!token) {
			return withCors(new Response('Missing CAPTCHA token', { status: 400 }));
		}

		const captchaRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: `secret=${env.TURNSTILE_SECRET}&response=${token}&remoteip=${request.headers.get('CF-Connecting-IP')}`,
		});

		const captchaData = await captchaRes.json();
		if (!captchaData.success) {
			return withCors(new Response('Failed CAPTCHA verification', { status: 403 }));
		}
		// ✅ END CAPTCHA block

		const { firstName, lastName, email, phone, issue } = data;
		if (!firstName || !lastName || !email || !phone || !issue) {
			return withCors(new Response('Missing required fields', { status: 400 }));
		}

		let userId;

		// Try to create user first
		const userRes = await fetch(`${env.ZAMMAD_URL}/api/v1/users`, {
			method: 'POST',
			headers: {
				Authorization: `Token token=${env.ZAMMAD_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				firstname: firstName,
				lastname: lastName,
				email,
				phone,
				role_ids: [3], // customer role
			}),
		});

		if (userRes.ok) {
			const userData = await userRes.json();
			userId = userData.id;
		} else if (userRes.status === 422) {
			// User probably exists, so search by email instead
			const lookup = await fetch(`${env.ZAMMAD_URL}/api/v1/users/search`, {
				method: 'POST',
				headers: {
					Authorization: `Token token=${env.ZAMMAD_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ query: email }),
			});

			if (!lookup.ok) {
				const errText = await lookup.text();
				return withCors(new Response('User lookup failed: ' + errText, { status: 500 }));
			}

			const users = await lookup.json();
			const existingUser = users.find((u) => u.email === email);

			if (!existingUser) {
				return withCors(new Response('User not found after search.', { status: 404 }));
			}

			userId = existingUser.id;
		} else {
			const userErr = await userRes.text();
			return withCors(new Response('User creation error: ' + userErr, { status: 500 }));
		}

		// Create ticket
		const ticketRes = await fetch(`${env.ZAMMAD_URL}/api/v1/tickets`, {
			method: 'POST',
			headers: {
				Authorization: `Token token=${env.ZAMMAD_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				title: `New Contact Form Submission from ${firstName} ${lastName}`,
				group: 'Users', // adjust this to your Zammad group name
				customer_id: userId,
				article: {
					subject: `Support Request from ${firstName} ${lastName}`,
					body: `Phone: ${phone}\n\nIssue:\n${issue}`,
					type: 'note', // ⬅️ makes this internal
					internal: true,
				},
			}),
		});

		if (!ticketRes.ok) {
			const ticketErr = await ticketRes.text();
			return withCors(new Response('Ticket creation error: ' + ticketErr, { status: 500 }));
		}

		return withCors(new Response('Success! Ticket created.', { status: 200 }));
	},
};
