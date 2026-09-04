// src/config.ts — Roland V-80HD
import { type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	// Legacy. Before 0.7.0 the device password was stored here, in the plaintext config store.
	// The 0.7.0 upgrade script moves it to the secrets store and blanks this, but it stays
	// declared so a connection whose upgrade has not run can still authenticate - see the
	// password getter in api.ts.
	password?: string
	polling: boolean
	debug: boolean
	showAdvanced: boolean
}

// Kept out of ModuleConfig on purpose. Companion routes any field whose type starts with
// "secret" into this separate store, which is not round-tripped to the web UI with the rest
// of the config.
export interface ModuleSecrets {
	password: string
}

// Poll interval fixed at 500ms — confirmed stable on hardware.
// 250ms caused panel lockup during testing.
export const POLL_INTERVAL_MS = 500

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{ type: 'textinput', id: 'host', label: 'Device IP address', width: 8, default: '192.168.0.1' },
		{ type: 'number', id: 'port', label: 'Port', width: 4, default: 8023, min: 1, max: 65535 },
		{ type: 'secret-text', id: 'password', label: 'Network password (must be set on device)', width: 8, default: '' },
		{
			type: 'checkbox',
			id: 'polling',
			label: 'Enable polling (required — turning it off leaves about half the feedbacks stale, see Help)',
			width: 12,
			default: true,
		},
		{ type: 'checkbox', id: 'debug', label: 'Enable debug logging (verbose TX/RX)', width: 6, default: false },
		{
			type: 'checkbox',
			id: 'showAdvanced',
			label: 'Allow advanced actions (raw LAN command)',
			width: 12,
			default: false,
		},
	]
}
