import assert from 'node:assert/strict'
import net from 'node:net'
import test from 'node:test'

import { InstanceStatus } from '@companion-module/base'
// The test intentionally exercises the JavaScript produced by `yarn build`.
// eslint-disable-next-line n/no-unpublished-import
import { V80Api } from '../dist/api.js'

const waitFor = async (predicate, timeoutMs = 2000) => {
	const deadline = Date.now() + timeoutMs
	while (!predicate()) {
		if (Date.now() >= deadline) throw new Error('Timed out waiting for the TCP fixture')
		await new Promise((resolve) => setTimeout(resolve, 10))
	}
}

test('duplicate authentication markers trigger one initial state poll', async (t) => {
	const received = []
	let pending = ''
	const server = net.createServer((socket) => {
		socket.setEncoding('utf8')
		socket.write('Enter password:')
		socket.on('data', (chunk) => {
			pending += chunk
			let newline
			while ((newline = pending.indexOf('\n')) >= 0) {
				const line = pending.slice(0, newline).trim()
				pending = pending.slice(newline + 1)
				if (!line) continue
				received.push(line)
				if (line === 'secret') socket.write('Welcome to V-80HD\r\nVER:V-80HD\r\n')
			}
		})
	})

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	t.after(() => new Promise((resolve) => server.close(resolve)))

	const address = server.address()
	assert.equal(typeof address, 'object')
	const statuses = []
	const instance = {
		config: { host: '127.0.0.1', port: address.port, polling: false, debug: false },
		secrets: { password: 'secret' },
		log: () => undefined,
		updateStatus: (status) => statuses.push(status),
		changedState: () => undefined,
	}
	const api = new V80Api(instance)
	t.after(() => api.destroyTcp())

	api.initTcp()
	await waitFor(() => received.filter((line) => line.startsWith('RQH:')).length >= 60)
	await new Promise((resolve) => setTimeout(resolve, 100))

	const queries = received.filter((line) => line.startsWith('RQH:'))
	assert.ok(statuses.includes(InstanceStatus.Ok))
	assert.ok(queries.length >= 60)
	assert.equal(queries.length, new Set(queries).size, 'the initial state poll must not be replayed')
})
