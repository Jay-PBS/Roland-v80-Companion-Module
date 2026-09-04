// src/presets.ts — Roland V-80HD
import type { ModuleInstance } from './main.js'
import { CompanionPresetDefinitions, combineRgb } from '@companion-module/base'
import { TEST_PATTERNS } from './api.js'

const TALLY_PRESET_INPUTS = [
	{ id: 'hdmi_1', label: 'HDMI In 1', short: 'HDMI\n1' },
	{ id: 'hdmi_2', label: 'HDMI In 2', short: 'HDMI\n2' },
	{ id: 'hdmi_3', label: 'HDMI In 3', short: 'HDMI\n3' },
	{ id: 'hdmi_4', label: 'HDMI In 4', short: 'HDMI\n4' },
	{ id: 'sdi_1', label: 'SDI In 1', short: 'SDI\n1' },
	{ id: 'sdi_2', label: 'SDI In 2', short: 'SDI\n2' },
	{ id: 'sdi_3', label: 'SDI In 3', short: 'SDI\n3' },
	{ id: 'sdi_4', label: 'SDI In 4', short: 'SDI\n4' },
]

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}
	const sz = 16 // 16pt for review

	// Corporate colour palette — deep = inactive button bg, bright = active feedback
	const c = {
		// Reds
		pgm: combineRgb(0xb9, 0x1c, 0x1c), // Red Deep    #B91C1C — PGM / Record / Stream
		pgm_on: combineRgb(0xef, 0x44, 0x44), // Red Bright  #EF4444
		// Greens
		pvw: combineRgb(0x15, 0x80, 0x3d), // Green Deep  #15803D
		pvw_on: combineRgb(0x22, 0xc5, 0x5e), // Green Bright #22C55E
		// Blues
		aux: combineRgb(0x1d, 0x4e, 0xd8), // Blue Deep   #1D4ED8
		aux_on: combineRgb(0x3b, 0x82, 0xf6), // Blue Bright #3B82F6
		// Purples
		trans: combineRgb(0x7e, 0x22, 0xce), // Purple Deep  #7E22CE
		trans_on: combineRgb(0xa8, 0x55, 0xf7), // Purple Bright #A855F7
		// Oranges
		layer: combineRgb(0xc2, 0x41, 0x0c), // Orange Deep  #C2410C
		layer_on: combineRgb(0xf9, 0x73, 0x16), // Orange Bright #F97316
		// Ambers
		tp: combineRgb(0xca, 0x8a, 0x04), // Amber Deep   #CA8A04
		tp_on: combineRgb(0xfa, 0xcc, 0x15), // Amber Bright #FACC15
		// Cyans
		teal: combineRgb(0x0f, 0x76, 0x6e), // Teal Deep    #0F766E
		teal_on: combineRgb(0x06, 0xb6, 0xd4), // Cyan Bright  #06B6D4
		// Pinp layout
		pinp: combineRgb(0x0f, 0x76, 0x6e), // Teal Deep
		pinp_on: combineRgb(0x06, 0xb6, 0xd4), // Cyan Bright
		// Audio
		audio: combineRgb(0x1d, 0x4e, 0xd8), // Blue Deep
		audio_on: combineRgb(0xfa, 0xcc, 0x15), // Amber Bright (muted = amber)
		// Memory / Utility
		mem: combineRgb(0xca, 0x8a, 0x04),
		util: combineRgb(0x40, 0x40, 0x40),
		// Text
		white: combineRgb(0xff, 0xff, 0xff),
		black: combineRgb(0x00, 0x00, 0x00),
	}

	// ── Transitions ────────────────────────────────────────────────────────────
	presets['cut'] = {
		type: 'button',
		category: 'Transitions',
		name: 'CUT',
		style: { text: 'CUT', size: sz, color: c.white, bgcolor: c.pgm, show_topbar: false },
		steps: [{ down: [{ actionId: 'cut', options: {} }], up: [] }],
		feedbacks: [],
	}
	presets['auto'] = {
		type: 'button',
		category: 'Transitions',
		name: 'AUTO',
		style: { text: 'AUTO', size: sz, color: c.white, bgcolor: c.pgm, show_topbar: false },
		steps: [{ down: [{ actionId: 'auto', options: {} }], up: [] }],
		feedbacks: [],
	}
	presets['ftb'] = {
		type: 'button',
		category: 'Transitions',
		name: 'FTB',
		style: { text: 'FTB', size: sz, color: c.white, bgcolor: c.pgm, show_topbar: false },
		steps: [{ down: [{ actionId: 'fade_to_black', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'ftb_active', options: {}, style: { bgcolor: c.pgm_on } }],
	}
	presets['trans_mix'] = {
		type: 'button',
		category: 'Transitions',
		name: 'MIX',
		style: { text: 'MIX', size: sz, color: c.white, bgcolor: c.trans, show_topbar: false },
		steps: [{ down: [{ actionId: 'set_transition_type', options: { type: 'mix' } }], up: [] }],
		feedbacks: [{ feedbackId: 'transition_type_active', options: { type: 'mix' }, style: { bgcolor: c.trans_on } }],
	}
	presets['trans_wipe'] = {
		type: 'button',
		category: 'Transitions',
		name: 'WIPE',
		style: { text: 'WIPE', size: sz, color: c.white, bgcolor: c.trans, show_topbar: false },
		steps: [{ down: [{ actionId: 'set_transition_type', options: { type: 'wipe' } }], up: [] }],
		feedbacks: [{ feedbackId: 'transition_type_active', options: { type: 'wipe' }, style: { bgcolor: c.trans_on } }],
	}

	// ── Program 1–8 ───────────────────────────────────────────────────────────
	for (let i = 1; i <= 8; i++) {
		presets[`pgm_${i}`] = {
			type: 'button',
			category: 'Program',
			name: `PGM ${i}`,
			style: { text: `PGM\n${i}`, size: sz, color: c.white, bgcolor: c.pgm, show_topbar: false },
			steps: [{ down: [{ actionId: 'set_program_source', options: { source: `input_${i}` } }], up: [] }],
			feedbacks: [{ feedbackId: 'program_input_active', options: { input: i }, style: { bgcolor: c.pgm_on } }],
		}
	}

	// ── Preview 1–8 ───────────────────────────────────────────────────────────
	for (let i = 1; i <= 8; i++) {
		presets[`pvw_${i}`] = {
			type: 'button',
			category: 'Preview',
			name: `PVW ${i}`,
			style: { text: `PVW\n${i}`, size: sz, color: c.white, bgcolor: c.pvw, show_topbar: false },
			steps: [{ down: [{ actionId: 'set_preview_source', options: { source: `input_${i}` } }], up: [] }],
			feedbacks: [{ feedbackId: 'preview_input_active', options: { input: i }, style: { bgcolor: c.pvw_on } }],
		}
	}

	// ── AUX 1 ─────────────────────────────────────────────────────────────────
	for (let i = 1; i <= 8; i++) {
		presets[`aux1_${i}`] = {
			type: 'button',
			category: 'AUX 1',
			name: `AUX1 ${i}`,
			style: { text: `AUX1\n${i}`, size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
			steps: [{ down: [{ actionId: 'set_aux_source', options: { aux: '1', source: `input_${i}` } }], up: [] }],
			feedbacks: [{ feedbackId: 'aux_input_active', options: { aux: 1, input: i }, style: { bgcolor: c.aux_on } }],
		}
	}
	presets['aux1_pinp1_en'] = {
		type: 'button',
		category: 'AUX 1',
		name: 'AUX1 PiP1 En',
		style: { text: 'PiP 1\nEN', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp', options: { aux: '1', layer: '1' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_layer_pinp_enabled', options: { aux: '1', layer: '1' }, style: { bgcolor: c.layer_on } },
		],
	}
	presets['aux1_pinp1_on'] = {
		type: 'button',
		category: 'AUX 1',
		name: 'AUX1 PiP1 AlwOn',
		style: { text: 'PiP 1\nALW ON', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp_always_on', options: { aux: '1', layer: '1' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_layer_pinp_always_on', options: { aux: '1', layer: '1' }, style: { bgcolor: c.teal_on } },
		],
	}
	presets['aux1_pinp2_en'] = {
		type: 'button',
		category: 'AUX 1',
		name: 'AUX1 PiP2 En',
		style: { text: 'PiP 2\nEN', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp', options: { aux: '1', layer: '2' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_layer_pinp_enabled', options: { aux: '1', layer: '2' }, style: { bgcolor: c.layer_on } },
		],
	}
	presets['aux1_pinp2_on'] = {
		type: 'button',
		category: 'AUX 1',
		name: 'AUX1 PiP2 AlwOn',
		style: { text: 'PiP 2\nALW ON', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp_always_on', options: { aux: '1', layer: '2' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_layer_pinp_always_on', options: { aux: '1', layer: '2' }, style: { bgcolor: c.teal_on } },
		],
	}
	presets['aux1_pinp1_layout'] = {
		type: 'button',
		category: 'AUX 1',
		name: 'AUX1 PiP1 Layout',
		style: { text: 'PiP1\nLAYOUT', size: sz, color: c.white, bgcolor: c.pinp, show_topbar: false },
		steps: [{ down: pinpTemplateActions(1), up: [] }],
		feedbacks: [],
	}
	presets['aux1_pinp2_layout'] = {
		type: 'button',
		category: 'AUX 1',
		name: 'AUX1 PiP2 Layout',
		style: { text: 'PiP2\nLAYOUT', size: sz, color: c.white, bgcolor: c.pinp, show_topbar: false },
		steps: [{ down: pinpTemplateActions(2), up: [] }],
		feedbacks: [],
	}

	// ── AUX 2 ─────────────────────────────────────────────────────────────────
	for (let i = 1; i <= 8; i++) {
		presets[`aux2_${i}`] = {
			type: 'button',
			category: 'AUX 2',
			name: `AUX2 ${i}`,
			style: { text: `AUX2\n${i}`, size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
			steps: [{ down: [{ actionId: 'set_aux_source', options: { aux: '2', source: `input_${i}` } }], up: [] }],
			feedbacks: [{ feedbackId: 'aux_input_active', options: { aux: 2, input: i }, style: { bgcolor: c.aux_on } }],
		}
	}
	presets['aux2_pinp1_en'] = {
		type: 'button',
		category: 'AUX 2',
		name: 'AUX2 PiP1 En',
		style: { text: 'PiP 1\nEN', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp', options: { aux: '2', layer: '1' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_layer_pinp_enabled', options: { aux: '2', layer: '1' }, style: { bgcolor: c.layer_on } },
		],
	}
	presets['aux2_pinp1_on'] = {
		type: 'button',
		category: 'AUX 2',
		name: 'AUX2 PiP1 AlwOn',
		style: { text: 'PiP 1\nALW ON', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp_always_on', options: { aux: '2', layer: '1' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_layer_pinp_always_on', options: { aux: '2', layer: '1' }, style: { bgcolor: c.teal_on } },
		],
	}
	presets['aux2_pinp2_en'] = {
		type: 'button',
		category: 'AUX 2',
		name: 'AUX2 PiP2 En',
		style: { text: 'PiP 2\nEN', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp', options: { aux: '2', layer: '2' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_layer_pinp_enabled', options: { aux: '2', layer: '2' }, style: { bgcolor: c.layer_on } },
		],
	}
	presets['aux2_pinp2_on'] = {
		type: 'button',
		category: 'AUX 2',
		name: 'AUX2 PiP2 AlwOn',
		style: { text: 'PiP 2\nALW ON', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp_always_on', options: { aux: '2', layer: '2' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_layer_pinp_always_on', options: { aux: '2', layer: '2' }, style: { bgcolor: c.teal_on } },
		],
	}
	presets['aux2_pinp1_layout'] = {
		type: 'button',
		category: 'AUX 2',
		name: 'AUX2 PiP1 Layout',
		style: { text: 'PiP1\nLAYOUT', size: sz, color: c.white, bgcolor: c.pinp, show_topbar: false },
		steps: [{ down: pinpTemplateActions(1), up: [] }],
		feedbacks: [],
	}
	presets['aux2_pinp2_layout'] = {
		type: 'button',
		category: 'AUX 2',
		name: 'AUX2 PiP2 Layout',
		style: { text: 'PiP2\nLAYOUT', size: sz, color: c.white, bgcolor: c.pinp, show_topbar: false },
		steps: [{ down: pinpTemplateActions(2), up: [] }],
		feedbacks: [],
	}

	// ── AUX Link ──────────────────────────────────────────────────────────────
	// Two things, in order. The MODE (020114) gates everything: with it Off there is no AUX
	// link at all and the FOLLOW buttons do nothing. Set the mode first, then choose which
	// buses follow with 020115 / 020116.
	//
	// Auto Link and Manual Link behave identically until the link is broken by selecting an
	// AUX source by hand. Auto restores the link at the next transition; Manual keeps your
	// selection until you re-select it. Manual is usually what you want when Companion is
	// ── AUX Link ──────────────────────────────────────────────────────────────
	// Two things, in order. The MODE (020114) gates everything: with it Off there is no
	// AUX link at all and the FOLLOW buttons do nothing. Set a mode first, then choose
	// which buses follow with 020115 / 020116.
	//
	// AUTO and MANUAL each toggle: press to select, press again to return to Off. OFF is
	// its own button so the mode can always be cleared in one press.
	//
	// Auto and Manual behave identically until the link is broken by selecting an AUX
	// source by hand. Auto restores the link at the next transition; Manual keeps your
	// selection until you re-select it. Manual is usually what you want when Companion is
	// driving AUX sources.
	presets['aux_link_off'] = {
		type: 'button',
		category: 'AUX Link',
		name: 'AUX Link Off',
		style: { text: 'AUX LINK\nOFF', size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
		steps: [{ down: [{ actionId: 'set_aux_linked_pgm', options: { mode: '0' } }], up: [] }],
		feedbacks: [{ feedbackId: 'aux_linked_pgm_active', options: { mode: '0' }, style: { bgcolor: c.util } }],
	}
	presets['aux_link_auto'] = {
		type: 'button',
		category: 'AUX Link',
		name: 'AUX Link Auto (toggle)',
		style: { text: 'AUX LINK\nAUTO', size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_linked_pgm_mode', options: { mode: '1' } }], up: [] }],
		feedbacks: [{ feedbackId: 'aux_linked_pgm_active', options: { mode: '1' }, style: { bgcolor: c.aux_on } }],
	}
	presets['aux_link_manual'] = {
		type: 'button',
		category: 'AUX Link',
		name: 'AUX Link Manual (toggle)',
		style: { text: 'AUX LINK\nMANUAL', size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_linked_pgm_mode', options: { mode: '2' } }], up: [] }],
		feedbacks: [{ feedbackId: 'aux_linked_pgm_active', options: { mode: '2' }, style: { bgcolor: c.teal_on } }],
	}
	for (const aux of [1, 2]) {
		presets[`aux${aux}_link_follow`] = {
			type: 'button',
			category: 'AUX Link',
			name: `AUX ${aux} follows PGM (toggle)`,
			style: { text: `AUX ${aux}\nFOLLOW`, size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
			steps: [{ down: [{ actionId: 'toggle_aux_linked_pgm_bus', options: { aux: String(aux) } }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'aux_linked_pgm_bus_active',
					options: { aux: String(aux) },
					style: { bgcolor: c.aux_on },
				},
			],
		}
	}

	// ── PinP & Key ────────────────────────────────────────────────────────────
	for (let layer = 1; layer <= 2; layer++) {
		presets[`pinp${layer}_pgm`] = {
			type: 'button',
			category: 'PinP & Key',
			name: `PinP${layer} PGM`,
			style: { text: `PiP${layer}\nPGM`, size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
			steps: [{ down: [{ actionId: 'pinp_pgm_toggle', options: { layer } }], up: [] }],
			feedbacks: [{ feedbackId: 'pinp_pgm_active', options: { layer }, style: { bgcolor: c.layer_on } }],
		}
		presets[`pinp${layer}_pvw`] = {
			type: 'button',
			category: 'PinP & Key',
			name: `PinP${layer} PVW`,
			style: { text: `PiP${layer}\nPVW`, size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
			steps: [{ down: [{ actionId: 'pinp_pvw_toggle', options: { layer } }], up: [] }],
			feedbacks: [{ feedbackId: 'pinp_pvw_active', options: { layer }, style: { bgcolor: c.pvw_on } }],
		}
	}
	// PinP layout templates also in PinP & Key category
	presets['pinp1_layout'] = {
		type: 'button',
		category: 'PinP & Key',
		name: 'PiP1 Layout',
		style: { text: 'PiP1\nLAYOUT', size: sz, color: c.white, bgcolor: c.pinp, show_topbar: false },
		steps: [{ down: pinpTemplateActions(1), up: [] }],
		feedbacks: [],
	}
	presets['pinp2_layout'] = {
		type: 'button',
		category: 'PinP & Key',
		name: 'PiP2 Layout',
		style: { text: 'PiP2\nLAYOUT', size: sz, color: c.white, bgcolor: c.pinp, show_topbar: false },
		steps: [{ down: pinpTemplateActions(2), up: [] }],
		feedbacks: [],
	}

	// ── DSK ───────────────────────────────────────────────────────────────────
	presets['dsk_pgm'] = {
		type: 'button',
		category: 'DSK',
		name: 'DSK PGM',
		style: { text: 'DSK\nPGM', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'dsk_pgm_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'dsk_pgm_active', options: {}, style: { bgcolor: c.layer_on } }],
	}
	presets['dsk_pvw'] = {
		type: 'button',
		category: 'DSK',
		name: 'DSK PVW',
		style: { text: 'DSK\nPVW', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'dsk_pvw_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'dsk_pvw_active', options: {}, style: { bgcolor: c.pvw_on } }],
	}

	// ── Split ─────────────────────────────────────────────────────────────────
	presets['split1'] = {
		type: 'button',
		category: 'Split',
		name: 'Split 1',
		style: { text: 'SPLIT\n1', size: sz, color: c.white, bgcolor: c.trans, show_topbar: false },
		steps: [{ down: [{ actionId: 'split1_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'split1_active', options: {}, style: { bgcolor: c.trans_on } }],
	}
	presets['split2'] = {
		type: 'button',
		category: 'Split',
		name: 'Split 2',
		style: { text: 'SPLIT\n2', size: sz, color: c.white, bgcolor: c.trans, show_topbar: false },
		steps: [{ down: [{ actionId: 'split2_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'split2_active', options: {}, style: { bgcolor: c.trans_on } }],
	}

	// ── Audio ─────────────────────────────────────────────────────────────────
	presets['main_mute'] = {
		type: 'button',
		category: 'Audio',
		name: 'Main Mute',
		style: { text: 'MAIN\nMUTE', size: sz, color: c.white, bgcolor: c.audio, show_topbar: false },
		steps: [{ down: [{ actionId: 'main_bus_mute_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'main_bus_muted', options: {}, style: { bgcolor: c.audio_on, color: c.black } }],
	}
	presets['aux1_mute'] = {
		type: 'button',
		category: 'Audio',
		name: 'AUX1 Mute',
		style: { text: 'AUX1\nMUTE', size: sz, color: c.white, bgcolor: c.audio, show_topbar: false },
		steps: [{ down: [{ actionId: 'aux_bus_mute_toggle', options: { aux: '1' } }], up: [] }],
		feedbacks: [{ feedbackId: 'aux_bus_muted', options: { aux: 1 }, style: { bgcolor: c.audio_on, color: c.black } }],
	}
	presets['aux2_mute'] = {
		type: 'button',
		category: 'Audio',
		name: 'AUX2 Mute',
		style: { text: 'AUX2\nMUTE', size: sz, color: c.white, bgcolor: c.audio, show_topbar: false },
		steps: [{ down: [{ actionId: 'aux_bus_mute_toggle', options: { aux: '2' } }], up: [] }],
		feedbacks: [{ feedbackId: 'aux_bus_muted', options: { aux: 2 }, style: { bgcolor: c.audio_on, color: c.black } }],
	}

	// ── Freeze ────────────────────────────────────────────────────────────────
	presets['freeze_all'] = {
		type: 'button',
		category: 'Freeze',
		name: 'Enable Freezes',
		style: { text: 'Enable\nFreezes', size: sz, color: c.white, bgcolor: c.util, show_topbar: false },
		steps: [{ down: [{ actionId: 'freeze_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'freeze_active', options: {}, style: { bgcolor: c.aux_on } }],
	}
	const freezeInputs = [
		{ key: 'hdmi_1', label: 'HDMI 1' },
		{ key: 'hdmi_2', label: 'HDMI 2' },
		{ key: 'hdmi_3', label: 'HDMI 3' },
		{ key: 'hdmi_4', label: 'HDMI 4' },
		{ key: 'sdi_1', label: 'SDI 1' },
		{ key: 'sdi_2', label: 'SDI 2' },
		{ key: 'sdi_3', label: 'SDI 3' },
		{ key: 'sdi_4', label: 'SDI 4' },
	]
	for (const fi of freezeInputs) {
		presets[`freeze_${fi.key}`] = {
			type: 'button',
			category: 'Freeze',
			name: `Freeze ${fi.label}`,
			style: { text: `FRZ\n${fi.label}`, size: sz, color: c.white, bgcolor: c.util, show_topbar: false },
			steps: [{ down: [{ actionId: 'input_freeze_toggle', options: { input: fi.key } }], up: [] }],
			feedbacks: [{ feedbackId: 'input_freeze_active', options: { input: fi.key }, style: { bgcolor: c.teal_on } }],
		}
	}

	// ── Stream & Record ───────────────────────────────────────────────────────
	// One trigger drives livestreaming and recording together on this unit, so a single
	// toggle is the honest control. Amber marks the brief Starting/Stopping states the
	presets['tp_off'] = {
		type: 'button',
		category: 'Test Patterns',
		name: 'Test Pattern Off',
		style: { text: 'TEST\nPATTERN\nOFF', size: sz, color: c.white, bgcolor: c.util, show_topbar: false },
		steps: [{ down: [{ actionId: 'test_pattern_off', options: {} }], up: [] }],
		feedbacks: [],
	}
	for (const p of TEST_PATTERNS) {
		presets[`tp_${p.id}`] = {
			type: 'button',
			category: 'Test Patterns',
			name: p.label,
			style: { text: p.label.replace(' ', '\n'), size: sz, color: c.white, bgcolor: c.tp, show_topbar: false },
			steps: [{ down: [{ actionId: 'test_pattern', options: { pattern: p.id } }], up: [] }],
			feedbacks: [{ feedbackId: 'test_pattern_active', options: { pattern: p.id }, style: { bgcolor: c.tp_on } }],
		}
	}

	// ── Image Capture — suspended ─────────────────────────────────────────────
	// presets['capture_...'] = { ... }

	// device reports before it settles.
	presets['stream_record_start'] = {
		type: 'button',
		category: 'Stream & Record',
		name: 'Stream & Record Start',
		style: { text: 'STREAM\nSTART', size: sz, color: c.white, bgcolor: c.pgm, show_topbar: false },
		steps: [{ down: [{ actionId: 'stream_record_start', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'stream_record_active', options: {}, style: { bgcolor: c.pgm_on } }],
	}
	presets['stream_record_stop'] = {
		type: 'button',
		category: 'Stream & Record',
		name: 'Stream & Record Stop',
		style: { text: 'STREAM\nSTOP', size: sz, color: c.white, bgcolor: c.pgm, show_topbar: false },
		steps: [{ down: [{ actionId: 'stream_record_stop', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'stream_record_active', options: {}, style: { bgcolor: c.pgm_on } }],
	}

	// ── Image Capture ─────────────────────────────────────────────────────────
	// Still 1-8 from HDMI In 1 as a starting point; change the source on the button.
	// A capture takes about 1.5s and overwrites the slot without asking.
	for (let slot = 1; slot <= 8; slot++) {
		presets[`capture_still_${slot}`] = {
			type: 'button',
			category: 'Image Capture',
			name: `Capture to Still ${slot}`,
			style: { text: `CAP\n${slot}`, size: sz, color: c.white, bgcolor: c.mem, show_topbar: false },
			steps: [{ down: [{ actionId: 'capture_image', options: { slot, source: 'hdmi_1' } }], up: [] }],
			feedbacks: [],
		}
	}

	// ── Tally ─────────────────────────────────────────────────────────────────
	// One button per physical input, reporting what the switcher itself says is on air.
	// Red for PGM, green for PST. Needs no tally cable.
	for (const ti of TALLY_PRESET_INPUTS) {
		presets[`tally_${ti.id}`] = {
			type: 'button',
			category: 'Tally',
			name: `Tally ${ti.label}`,
			style: { text: ti.short, size: sz, color: c.white, bgcolor: c.util, show_topbar: false },
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{ feedbackId: 'tally_pgm', options: { input: ti.id }, style: { bgcolor: c.pgm_on, color: c.white } },
				{ feedbackId: 'tally_pvw', options: { input: ti.id }, style: { bgcolor: c.pvw_on, color: c.black } },
			],
		}
	}

	// ── Input Assign ──────────────────────────────────────────────────────────
	presets['input_assign_default'] = {
		type: 'button',
		category: 'Input Assign',
		name: 'Default Input Map',
		style: { text: 'INPUT\nMAP\nDEFAULT', size: sz, color: c.white, bgcolor: c.util, show_topbar: false },
		steps: [
			{
				down: [
					{ actionId: 'input_assign_source', options: { slot: 1, source: 'hdmi_1' } },
					{ actionId: 'input_assign_source', options: { slot: 2, source: 'hdmi_2' } },
					{ actionId: 'input_assign_source', options: { slot: 3, source: 'hdmi_3' } },
					{ actionId: 'input_assign_source', options: { slot: 4, source: 'hdmi_4' } },
					{ actionId: 'input_assign_source', options: { slot: 5, source: 'sdi_1' } },
					{ actionId: 'input_assign_source', options: { slot: 6, source: 'sdi_2' } },
					{ actionId: 'input_assign_source', options: { slot: 7, source: 'still_1' } },
					{ actionId: 'input_assign_source', options: { slot: 8, source: 'still_2' } },
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	self.setPresetDefinitions(presets)
}

// PinP layout template — all 8 window actions with sensible defaults
// Cropping defaults to 100% (fully open — 0% would be fully cropped/invisible)
function pinpTemplateActions(layer: number) {
	return [
		{ actionId: 'pinp_window_position_h', options: { layer, pct: 0 } },
		{ actionId: 'pinp_window_position_v', options: { layer, pct: 0 } },
		{ actionId: 'pinp_window_size', options: { layer, pct: 25 } },
		{ actionId: 'pinp_window_cropping_h', options: { layer, pct: 100 } },
		{ actionId: 'pinp_window_cropping_v', options: { layer, pct: 100 } },
		{ actionId: 'pinp_view_position_h', options: { layer, pct: 0 } },
		{ actionId: 'pinp_view_position_v', options: { layer, pct: 0 } },
		{ actionId: 'pinp_view_zoom', options: { layer, pct: 100 } },
	]
}
