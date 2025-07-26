/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx) {
		if (request.method !== 'POST') {
			return new Response('Method Not Allowed', { status: 405 });
		}

		let data;
		try {
			data = await request.json();
		} catch (e) {
			return new Response('Invalid JSON', { status: 400 });
		}

		const { firstName, lastName, email, phone, issue } = data;

		if (!firstName || !lastName || !email || !phone || !issue) {
			return new Response('Missing required fields', { status: 400 });
		}

		const ticket = {
			title: `Contact: ${firstName} ${lastName}`,
			group: 'Users',
			customer: email,
			article: {
				subject: 'Contact Form Submission',
				body: `
Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone}

Issue:
${issue}
        `.trim(),
				type: 'email',
				content_type: 'text/plain',
			},
		};

		const zammadRes = await fetch(`${env.ZAMMAD_URL}/api/v1/tickets`, {
			method: 'POST',
			headers: {
				Authorization: `Token token=${env.ZAMMAD_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(ticket),
		});

		if (!zammadRes.ok) {
			const errorText = await zammadRes.text();
			return new Response('Zammad error: ' + errorText, { status: 500 });
		}

		return new Response('Ticket created successfully.', { status: 200 });
	},
};
