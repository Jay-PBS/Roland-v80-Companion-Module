// src/feedbacks.ts — Roland V-80HD
import { combineRgb } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import {
	AUDIO_CH,
	TEST_PATTERNS,
	INPUT_FREEZE_IDX,
	TALLY_IDX,
	AUDIO_CHANNEL_CHOICES,
	PHYSICAL_INPUT_CHOICES,
	WIPE_TYPE_CHOICES,
	WIPE_DIRECTION_CHOICES,
	AUX_LINK_MODE_CHOICES,
	AUX_CHOICES,
	AUX_LAYER_CHOICES,
} from './api.js'

// Corporate colour palette — bright = active, deep = inactive default. Same seven brights the
// presets use, so a feedback added by hand lands on the palette rather than beside it. The one
// exception is the two bus mute feedbacks, below.
const RED_BRIGHT = combineRgb(0xef, 0x44, 0x44) // #EF4444
const GREEN_BRIGHT = combineRgb(0x22, 0xc5, 0x5e) // #22C55E
const BLUE_BRIGHT = combineRgb(0x3b, 0x82, 0xf6) // #3B82F6
const ORANGE_BRIGHT = combineRgb(0xf9, 0x73, 0x16) // #F97316
const AMBER_BRIGHT = combineRgb(0xfa, 0xcc, 0x15) // #FACC15
const PURPLE_BRIGHT = combineRgb(0xa8, 0x55, 0xf7) // #A855F7
const CYAN_BRIGHT = combineRgb(0x06, 0xb6, 0xd4) // #06B6D4
const BLACK = combineRgb(0x00, 0x00, 0x00)
// Bus mutes sit off the palette on purpose (0.9.1) - lavender, so a muted bus reads differently
// from every other lit state on the surface. Black text still applies.
const MUTE_LAVENDER = combineRgb(0xc0, 0xc0, 0xff) // #C0C0FF

// Every defaultStyle below carries BLACK, and none carries white. 0.8.5 measured white against all
// seven brights at 1.53-3.96:1, under the 4.5 threshold, and moved the presets to black text on an
// active button; black passes on all seven. The feedback defaults did not follow at the time, so
// until 0.9.0 a feedback added by hand still arrived with the combination 0.8.5 had rejected.
// Existing buttons keep the styling they were built with - Companion copies a style, it does not
// reference one - so this only affects feedbacks added from here on.

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		// ── Routing ─────────────────────────────────────────────────────────────
		program_input_active: {
			name: 'Program – Input on PGM',
			type: 'boolean',
			defaultStyle: { bgcolor: RED_BRIGHT, color: BLACK },
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
			defaultStyle: { bgcolor: RED_BRIGHT, color: BLACK },
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
			defaultStyle: { bgcolor: BLUE_BRIGHT, color: BLACK },
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
			defaultStyle: { bgcolor: PURPLE_BRIGHT, color: BLACK },
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
		// Two feedbacks, because they answer different questions and an operator may want both on
		// one button: "a fade is happening" and "the output is black". ftb_active keeps its id and
		// its meaning, so buttons built before the engaged state was findable still work.
		ftb_active: {
			name: 'Fade To Black – fade in progress',
			description:
				'Lights only while a fade is running. For whether the output is actually black, use Fade To Black – engaged.',
			type: 'boolean',
			// Orange rather than red, so it reads as distinct from ftb_engaged at a glance when
			// both are on one button. Red is reserved for "the output is actually black".
			defaultStyle: { bgcolor: ORANGE_BRIGHT, color: BLACK },
			options: [],
			callback: () => self.ftbFading,
		},
		ftb_engaged: {
			name: 'Fade To Black – engaged',
			description:
				'Lights while the output is faded to black, however it was engaged - Companion, the panel or the Roland RCS software. Stays dark until the state is known, which is from the first poll after connecting.',
			type: 'boolean',
			defaultStyle: { bgcolor: RED_BRIGHT, color: BLACK },
			options: [],
			callback: () => self.ftbEngaged === true,
		},
		wipe_type_active: {
			name: 'Wipe pattern active',
			type: 'boolean',
			defaultStyle: { bgcolor: PURPLE_BRIGHT, color: BLACK },
			options: [{ id: 'type', type: 'dropdown', label: 'Pattern', default: '0', choices: WIPE_TYPE_CHOICES }],
			callback: (fb) => self.wipeType === Number(fb.options.type),
		},
		wipe_direction_active: {
			name: 'Wipe direction active',
			type: 'boolean',
			defaultStyle: { bgcolor: PURPLE_BRIGHT, color: BLACK },
			options: [{ id: 'dir', type: 'dropdown', label: 'Direction', default: '0', choices: WIPE_DIRECTION_CHOICES }],
			callback: (fb) => self.wipeDirection === Number(fb.options.dir),
		},
		aux_linked_pgm_active: {
			name: 'AUX Linked PGM mode active',
			type: 'boolean',
			defaultStyle: { bgcolor: BLUE_BRIGHT, color: BLACK },
			options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: '1', choices: AUX_LINK_MODE_CHOICES }],
			callback: (fb) => self.auxLinkedPgm === Number(fb.options.mode),
		},
		aux_linked_pgm_bus_active: {
			name: 'AUX Linked PGM – bus follows PGM',
			description: 'Whether this AUX bus is selected to follow PGM. Independent of the link mode.',
			type: 'boolean',
			defaultStyle: { bgcolor: BLUE_BRIGHT, color: BLACK },
			options: [{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES }],
			callback: (fb) => (Number(fb.options.aux) === 2 ? self.aux2LinkedPgm : self.aux1LinkedPgm),
		},

		// ── PinP & Key ───────────────────────────────────────────────────────────
		pinp_pgm_active: {
			name: 'PinP & Key – active on PGM',
			type: 'boolean',
			defaultStyle: { bgcolor: ORANGE_BRIGHT, color: BLACK },
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
			defaultStyle: { bgcolor: ORANGE_BRIGHT, color: BLACK },
			options: [
				{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES },
				{ id: 'layer', type: 'dropdown', label: 'PinP Layer', default: '1', choices: AUX_LAYER_CHOICES },
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
				{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES },
				{ id: 'layer', type: 'dropdown', label: 'PinP Layer', default: '1', choices: AUX_LAYER_CHOICES },
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
			defaultStyle: { bgcolor: ORANGE_BRIGHT, color: BLACK },
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
			name: 'Split 1 (Vertical) – active',
			type: 'boolean',
			defaultStyle: { bgcolor: PURPLE_BRIGHT, color: BLACK },
			options: [],
			callback: () => self.split1Active,
		},
		split2_active: {
			name: 'Split 2 (Horizontal) – active',
			type: 'boolean',
			defaultStyle: { bgcolor: PURPLE_BRIGHT, color: BLACK },
			options: [],
			callback: () => self.split2Active,
		},

		// ── Audio ─────────────────────────────────────────────────────────────────
		audio_input_muted: {
			name: 'Audio Input – Muted',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER_BRIGHT, color: BLACK },
			options: [
				{ id: 'ch', type: 'dropdown', label: 'Channel', default: 'audio_in_1', choices: AUDIO_CHANNEL_CHOICES },
			],
			callback: (fb) => {
				const ch = AUDIO_CH[String(fb.options.ch)]
				return ch !== undefined ? (self.audioInputMute[ch] ?? false) : false
			},
		},
		main_bus_muted: {
			name: 'Main Bus – Muted',
			type: 'boolean',
			defaultStyle: { bgcolor: MUTE_LAVENDER, color: BLACK },
			options: [],
			callback: () => self.mainBusMute,
		},
		aux_bus_muted: {
			name: 'AUX Bus – Muted',
			type: 'boolean',
			defaultStyle: { bgcolor: MUTE_LAVENDER, color: BLACK },
			options: [{ id: 'aux', type: 'number', label: 'AUX (1 or 2)', default: 1, min: 1, max: 2 }],
			callback: (fb) => (Number(fb.options.aux) === 2 ? self.aux2BusMute : self.aux1BusMute),
		},

		// ── System ────────────────────────────────────────────────────────────────
		freeze_active: {
			name: 'Freeze (all) – active',
			type: 'boolean',
			defaultStyle: { bgcolor: BLUE_BRIGHT, color: BLACK },
			options: [],
			callback: () => self.freezeActive,
		},
		input_freeze_active: {
			name: 'Input Freeze – active',
			type: 'boolean',
			defaultStyle: { bgcolor: CYAN_BRIGHT, color: BLACK },
			options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'hdmi_1', choices: PHYSICAL_INPUT_CHOICES }],
			callback: (fb) => {
				const idx = INPUT_FREEZE_IDX[String(fb.options.input)]
				return idx !== undefined ? (self.inputFreezeEnabled[idx] ?? false) : false
			},
		},

		// ── Tally ───────────────────────────────────────────────────────────────
		// Read from the switcher's own tally register, not inferred from the PGM/PST
		// bus. Needs no tally cable — see HELP.md.
		tally_pgm: {
			name: 'Tally – Input on air (PGM)',
			description: 'Reported by the switcher itself, not inferred from the PGM bus.',
			type: 'boolean',
			defaultStyle: { bgcolor: RED_BRIGHT, color: BLACK },
			options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'hdmi_1', choices: PHYSICAL_INPUT_CHOICES }],
			callback: (fb) => {
				const idx = TALLY_IDX[String(fb.options.input)]
				return idx !== undefined && self.tallyState[idx] === 1
			},
		},
		tally_pvw: {
			name: 'Tally – Input on preview (PST)',
			description: 'Reported by the switcher itself, not inferred from the PST bus.',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN_BRIGHT, color: BLACK },
			options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'hdmi_1', choices: PHYSICAL_INPUT_CHOICES }],
			callback: (fb) => {
				const idx = TALLY_IDX[String(fb.options.input)]
				return idx !== undefined && self.tallyState[idx] === 2
			},
		},

		stream_record_active: {
			name: 'Stream & Record – active',
			description:
				'Reported by the device, not inferred from what this module sent, so it also tracks the panel and the Roland RCS software. Covers livestreaming and recording together.',
			type: 'boolean',
			defaultStyle: { bgcolor: RED_BRIGHT, color: BLACK },
			options: [],
			callback: () => self.streamRecordActive,
		},
		stream_record_state: {
			name: 'Stream & Record – specific state',
			description: 'Starting and Stopping are brief transitional states the device reports before it settles.',
			type: 'boolean',
			defaultStyle: { bgcolor: RED_BRIGHT, color: BLACK },
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					default: '5',
					choices: [
						{ id: '2', label: 'Stopped' },
						{ id: '3', label: 'Stopping' },
						{ id: '4', label: 'Starting' },
						{ id: '5', label: 'Running' },
					],
				},
			],
			callback: (fb) => self.streamRecordState === Number(fb.options.state),
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
