// src/variables.ts — Roland V-80HD
import type { ModuleInstance } from './main.js'
import { AUDIO_CH, INPUT_FREEZE_IDX, TALLY_IDX } from './api.js'

const pretty = (k: string): string => k.replace(/_/g, ' ')

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions([
		{ variableId: 'program_input', name: 'Program – active input number' },
		{ variableId: 'preview_input', name: 'Preview – active input number' },
		{ variableId: 'program_source', name: 'Program – source byte (hex)' },
		{ variableId: 'preview_source', name: 'Preview – source byte (hex)' },
		{ variableId: 'aux1_input', name: 'AUX 1 – active input number' },
		{ variableId: 'aux2_input', name: 'AUX 2 – active input number' },
		{ variableId: 'aux1_source', name: 'AUX 1 – source byte (hex)' },
		{ variableId: 'aux2_source', name: 'AUX 2 – source byte (hex)' },
		{ variableId: 'transition_type', name: 'Transition type (MIX / WIPE)' },
		{ variableId: 'mix_time', name: 'Mix/Wipe time in milliseconds' },
		{ variableId: 'wipe_type', name: 'Wipe pattern name' },
		{ variableId: 'wipe_direction', name: 'Wipe direction name' },
		{ variableId: 'pinp1_pgm', name: 'PinP 1 – active on PGM (ON/OFF)' },
		{ variableId: 'pinp1_pvw', name: 'PinP 1 – active on PVW (ON/OFF)' },
		{ variableId: 'pinp2_pgm', name: 'PinP 2 – active on PGM (ON/OFF)' },
		{ variableId: 'pinp2_pvw', name: 'PinP 2 – active on PVW (ON/OFF)' },
		{ variableId: 'dsk_pgm', name: 'DSK – active on PGM (ON/OFF)' },
		{ variableId: 'dsk_pvw', name: 'DSK – active on PVW (ON/OFF)' },
		{ variableId: 'split1', name: 'Split 1 – active (ON/OFF)' },
		{ variableId: 'split2', name: 'Split 2 – active (ON/OFF)' },
		{ variableId: 'aux_linked_pgm', name: 'AUX Linked PGM mode' },
		{ variableId: 'aux1_linked_pgm', name: 'AUX 1 – follows PGM (ON/OFF)' },
		{ variableId: 'aux2_linked_pgm', name: 'AUX 2 – follows PGM (ON/OFF)' },
		{ variableId: 'main_bus_mute', name: 'Main bus – muted (ON/OFF)' },
		{ variableId: 'aux1_bus_mute', name: 'AUX 1 bus – muted (ON/OFF)' },
		{ variableId: 'aux2_bus_mute', name: 'AUX 2 bus – muted (ON/OFF)' },
		{ variableId: 'ftb', name: 'Fade To Black – FADING or IDLE' },
		{ variableId: 'freeze', name: 'Freeze – active (ON/OFF)' },
		{ variableId: 'test_pattern', name: 'Test pattern – active pattern name' },
		{ variableId: 'stream_record', name: 'Stream & Record – active (ON/OFF)' },
		{ variableId: 'stream_record_state', name: 'Stream & Record – state name' },
		...Object.keys(AUDIO_CH).map((k) => ({ variableId: `mute_${k}`, name: `Audio mute – ${pretty(k)} (ON/OFF)` })),
		...Object.keys(INPUT_FREEZE_IDX).map((k) => ({
			variableId: `freeze_${k}`,
			name: `Input freeze – ${pretty(k)} (ON/OFF)`,
		})),
		...Object.keys(TALLY_IDX).map((k) => ({
			variableId: `tally_${k}`,
			name: `Tally – ${pretty(k)} (OFF/PGM/PST)`,
		})),
	])
}
