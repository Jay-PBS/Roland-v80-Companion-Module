// src/feedbacks.ts — Roland V-80HD
import { combineRgb } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { AUDIO_CH, TEST_PATTERNS, INPUT_FREEZE_IDX } from './api.js'

// Corporate colour palette — bright = active, deep = inactive default
const RED_BRIGHT = combineRgb(0xef, 0x44, 0x44) // #EF4444
const GREEN_BRIGHT = combineRgb(0x22, 0xc5, 0x5e) // #22C55E
const BLUE_BRIGHT = combineRgb(0x3b, 0x82, 0xf6) // #3B82F6
const ORANGE_BRIGHT = combineRgb(0xf9, 0x73, 0x16) // #F97316
const AMBER_BRIGHT = combineRgb(0xfa, 0xcc, 0x15) // #FACC15
const PURPLE_BRIGHT = combineRgb(0xa8, 0x55, 0xf7) // #A855F7
const CYAN_BRIGHT = combineRgb(0x06, 0xb6, 0xd4) // #06B6D4
const WHITE = combineRgb(0xff, 0xff, 0xff)
const BLACK = combineRgb(0x00, 0x00, 0x00)

const AUDIO_CHANNELS = Object.keys(AUDIO_CH).map((id) => ({ id, label: id.replace(/_/g, ' ') }))
const FREEZE_INPUTS = [
	{ id: 'hdmi_1', label: 'HDMI In 1' },
	{ id: 'hdmi_2', label: 'HDMI In 2' },
	{ id: 'hdmi_3', label: 'HDMI In 3' },
	{ id: 'hdmi_4', label: 'HDMI In 4' },
	{ id: 'sdi_1', label: 'SDI In 1' },
	{ id: 'sdi_2', label: 'SDI In 2' },
	{ id: 'sdi_3', label: 'SDI In 3' },
	{ id: 'sdi_4', label: 'SDI In 4' },
]
const AUX_LAYER_DD = [
	{ id: '1', label: 'PinP & Key 1' },
	{ id: '2', label: 'PinP & Key 2' },
]
const WIPE_TYPES = [
	{ id: '0', label: 'Horizontal' },
	{ id: '1', label: 'Vertical' },
	{ id: '2', label: 'Upper Left' },
	{ id: '3', label: 'Upper Right' },
	{ id: '4', label: 'Lower Left' },
	{ id: '5', label: 'Lower Right' },
	{ id: '6', label: 'H-Center' },
	{ id: '7', label: 'V-Center' },
]
const WIPE_DIRS = [
	{ id: '0', label: 'Normal' },
	{ id: '1', label: 'Reverse' },
	{ id: '2', label: 'Round Trip' },
]
const AUX_LINK_MODES = [
	{ id: '0', label: 'Off' },
	{ id: '1', label: 'Auto Link' },
	{ id: '2', label: 'Manual Link' },
]
const AUX_DD = [
	{ id: '1', label: 'AUX 1' },
	{ id: '2', label: 'AUX 2' },
]

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		// ── Routing ─────────────────────────────────────────────────────────────
		program_input_active: {
			name: 'Program – Input on PGM',
			type: 'boolean',
			defaultStyle: { bgcolor: RED_BRIGHT, color: WHITE },
			options: [{ id: 'input', type: 'number', label: 'Input (1–8)', default: 1, min: 1, max: 8 }],
			callback: (fb) => self.programInput === Number(fb.options.input),
		},
		preview_input_active: {
			name: 'Preview – Input on PST',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN_BRIGHT, color: BLACK },
			options: [{ id: 'input', type: 'number', label: 'Input (1–8)', default: 1, min: 1, max: 8 }],
			callback: (fb) => self.previewInput === Number(fb.options.input),
		},
		program_source_active: {
			name: 'Program – Raw source byte on PGM',
			type: 'boolean',
			defaultStyle: { bgcolor: RED_BRIGHT, color: WHITE },
			options: [
				{
					id: 'source',
					type: 'textinput',
					label: 'Source byte hex (e.g. 00=HDMI1, 04=SDI1, 29=Input1)',
					default: '29',
				},
			],
			callback: (fb) => self.programSource === parseInt(String(fb.options.source), 16),
		},
		preview_source_active: {
			name: 'Preview – Raw source byte on PST',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN_BRIGHT, color: BLACK },
			options: [{ id: 'source', type: 'textinput', label: 'Source byte hex', default: '29' }],
			callback: (fb) => self.previewSource === parseInt(String(fb.options.source), 16),
		},
		aux_input_active: {
			name: 'AUX – Input on AUX bus',
			type: 'boolean',
			defaultStyle: { bgcolor: BLUE_BRIGHT, color: WHITE },
			options: [
				{ id: 'aux', type: 'number', label: 'AUX (1 or 2)', default: 1, min: 1, max: 2 },
				{ id: 'input', type: 'number', label: 'Input (1–8)', default: 1, min: 1, max: 8 },
			],
			callback: (fb) =>
				Number(fb.options.aux) === 2
					? self.aux2Input === Number(fb.options.input)
					: self.aux1Input === Number(fb.options.input),
		},

		// ── Transitions ──────────────────────────────────────────────────────────
		transition_type_active: {
			name: 'Transition type active',
			type: 'boolean',
			defaultStyle: { bgcolor: PURPLE_BRIGHT, color: WHITE },
			options: [
				{
					id: 'type',
					type: 'dropdown',
					label: 'Type',
					default: 'mix',
					choices: [
						{ id: 'mix', label: 'Mix' },
						{ id: 'wipe', label: 'Wipe' },
					],
				},
			],
			callback: (fb) => self.transitionType === fb.options.type,
		},
		ftb_active: {
			name: 'Fade To Black – active',
			type: 'boolean',
			defaultStyle: { bgcolor: RED_BRIGHT, color: WHITE },
			options: [],
			callback: () => self.ftbActive,
		},
		wipe_type_active: {
			name: 'Wipe pattern active',
			type: 'boolean',
			defaultStyle: { bgcolor: PURPLE_BRIGHT, color: WHITE },
			options: [{ id: 'type', type: 'dropdown', label: 'Pattern', default: '0', choices: WIPE_TYPES }],
			callback: (fb) => self.wipeType === Number(fb.options.type),
		},
		wipe_direction_active: {
			name: 'Wipe direction active',
			type: 'boolean',
			defaultStyle: { bgcolor: PURPLE_BRIGHT, color: WHITE },
			options: [{ id: 'dir', type: 'dropdown', label: 'Direction', default: '0', choices: WIPE_DIRS }],
			callback: (fb) => self.wipeDirection === Number(fb.options.dir),
		},
		aux_linked_pgm_active: {
			name: 'AUX Linked PGM mode active',
			type: 'boolean',
			defaultStyle: { bgcolor: BLUE_BRIGHT, color: WHITE },
			options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: '1', choices: AUX_LINK_MODES }],
			callback: (fb) => self.auxLinkedPgm === Number(fb.options.mode),
		},

		// ── PinP & Key ───────────────────────────────────────────────────────────
		pinp_pgm_active: {
			name: 'PinP & Key – active on PGM',
			type: 'boolean',
			defaultStyle: { bgcolor: ORANGE_BRIGHT, color: WHITE },
			options: [{ id: 'layer', type: 'number', label: 'Layer (1 or 2)', default: 1, min: 1, max: 2 }],
			callback: (fb) => (Number(fb.options.layer) === 2 ? self.pinp2Pgm : self.pinp1Pgm),
		},
		pinp_pvw_active: {
			name: 'PinP & Key – active on PVW',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN_BRIGHT, color: BLACK },
			options: [{ id: 'layer', type: 'number', label: 'Layer (1 or 2)', default: 1, min: 1, max: 2 }],
			callback: (fb) => (Number(fb.options.layer) === 2 ? self.pinp2Pvw : self.pinp1Pvw),
		},

		// ── AUX Layer PinP feedbacks ─────────────────────────────────────────────
		aux_layer_pinp_enabled: {
			name: 'AUX Layer – PinP Enabled',
			type: 'boolean',
			defaultStyle: { bgcolor: ORANGE_BRIGHT, color: WHITE },
			options: [
				{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_DD },
				{ id: 'layer', type: 'dropdown', label: 'PinP Layer', default: '1', choices: AUX_LAYER_DD },
			],
			callback: (fb) => {
				const aux = Number(fb.options.aux)
				const layer = Number(fb.options.layer)
				const val =
					aux === 1
						? layer === 1
							? self.aux1Pinp1Layer
							: self.aux1Pinp2Layer
						: layer === 1
							? self.aux2Pinp1Layer
							: self.aux2Pinp2Layer
				return val === 1
			},
		},
		aux_layer_pinp_always_on: {
			name: 'AUX Layer – PinP Always On',
			type: 'boolean',
			defaultStyle: { bgcolor: CYAN_BRIGHT, color: BLACK },
			options: [
				{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_DD },
				{ id: 'layer', type: 'dropdown', label: 'PinP Layer', default: '1', choices: AUX_LAYER_DD },
			],
			callback: (fb) => {
				const aux = Number(fb.options.aux)
				const layer = Number(fb.options.layer)
				const val =
					aux === 1
						? layer === 1
							? self.aux1Pinp1Layer
							: self.aux1Pinp2Layer
						: layer === 1
							? self.aux2Pinp1Layer
							: self.aux2Pinp2Layer
				return val === 2
			},
		},

		// ── DSK ──────────────────────────────────────────────────────────────────
		dsk_pgm_active: {
			name: 'DSK – active on PGM',
			type: 'boolean',
			defaultStyle: { bgcolor: ORANGE_BRIGHT, color: WHITE },
			options: [],
			callback: () => self.dskPgm,
		},
		dsk_pvw_active: {
			name: 'DSK – active on PVW',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN_BRIGHT, color: BLACK },
			options: [],
			callback: () => self.dskPvw,
		},

		// ── Split ─────────────────────────────────────────────────────────────────
		split1_active: {
			name: 'Split 1 – active',
			type: 'boolean',
			defaultStyle: { bgcolor: PURPLE_BRIGHT, color: WHITE },
			options: [],
			callback: () => self.split1Active,
		},
		split2_active: {
			name: 'Split 2 – active',
			type: 'boolean',
			defaultStyle: { bgcolor: PURPLE_BRIGHT, color: WHITE },
			options: [],
			callback: () => self.split2Active,
		},

		// ── Audio ─────────────────────────────────────────────────────────────────
		audio_input_muted: {
			name: 'Audio Input – Muted',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER_BRIGHT, color: BLACK },
			options: [{ id: 'ch', type: 'dropdown', label: 'Channel', default: 'audio_in_1', choices: AUDIO_CHANNELS }],
			callback: (fb) => {
				const ch = AUDIO_CH[String(fb.options.ch)]
				return ch !== undefined ? (self.audioInputMute[ch] ?? false) : false
			},
		},
		main_bus_muted: {
			name: 'Main Bus – Muted',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER_BRIGHT, color: BLACK },
			options: [],
			callback: () => self.mainBusMute,
		},
		aux_bus_muted: {
			name: 'AUX Bus – Muted',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER_BRIGHT, color: BLACK },
			options: [{ id: 'aux', type: 'number', label: 'AUX (1 or 2)', default: 1, min: 1, max: 2 }],
			callback: (fb) => (Number(fb.options.aux) === 2 ? self.aux2BusMute : self.aux1BusMute),
		},

		// ── System ────────────────────────────────────────────────────────────────
		freeze_active: {
			name: 'Freeze (all) – active',
			type: 'boolean',
			defaultStyle: { bgcolor: BLUE_BRIGHT, color: WHITE },
			options: [],
			callback: () => self.freezeActive,
		},
		input_freeze_active: {
			name: 'Input Freeze – active',
			type: 'boolean',
			defaultStyle: { bgcolor: CYAN_BRIGHT, color: BLACK },
			options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'hdmi_1', choices: FREEZE_INPUTS }],
			callback: (fb) => {
				const idx = INPUT_FREEZE_IDX[String(fb.options.input)]
				return idx !== undefined ? (self.inputFreezeEnabled[idx] ?? false) : false
			},
		},
		test_pattern_active: {
			name: 'Test Pattern – active',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER_BRIGHT, color: BLACK },
			options: [
				{
					id: 'pattern',
					type: 'dropdown',
					label: 'Pattern',
					default: 'bars75',
					choices: TEST_PATTERNS.map((p) => ({ id: p.id, label: p.label })),
				},
			],
			callback: (fb) => {
				const p = TEST_PATTERNS.find((x) => x.id === String(fb.options.pattern))
				return p ? self.testPattern === p.value : false
			},
		},
	})
}
