// src/config.ts — Roland V-80HD v0.3.1
import { type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host:         string
	port:         number
	password:     string
	polling:      boolean
	debug:        boolean
	showAdvanced: boolean
}

// Poll interval fixed at 500ms — confirmed stable on hardware.
// 250ms caused panel lockup during testing.
export const POLL_INTERVAL_MS = 500

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{ type: 'textinput', id: 'host',        label: 'Device IP address',                              width: 8,  default: '192.168.0.1' },
		{ type: 'number',    id: 'port',         label: 'Port',                                           width: 4,  default: 8023, min: 1, max: 65535 },
		{ type: 'textinput', id: 'password',     label: 'Network password (must be set on device)',       width: 8,  default: '' },
		{ type: 'checkbox',  id: 'polling',      label: 'Enable polling (keeps feedbacks in sync)',       width: 12, default: true },
		{ type: 'checkbox',  id: 'debug',        label: 'Enable debug logging (verbose TX/RX)',           width: 6,  default: false },
		{ type: 'checkbox',  id: 'showAdvanced', label: 'Show advanced actions (raw LAN command)',        width: 12, default: false },
	]
}
