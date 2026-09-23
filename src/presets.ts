// src/presets.ts — Roland V-80HD
import type { ModuleInstance } from './main.js'
import { CompanionPresetDefinitions, combineRgb } from '@companion-module/base'
import { TEST_PATTERNS, PHYSICAL_INPUTS } from './api.js'

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}
	// Legacy point size. Companion's layered-button editor shows Text Size as a percentage of the
	// button height and scales a preset's number by about 5/3 on the way in - 0.9.1 sent 24 and the
	// editor showed 40. 14 lands at about 23, the size chosen by eye in the editor on 2026-09-23.
	const sz = 14

	// Corporate colour palette - deep = inactive button bg, bright = active feedback.
	// The deeps are the bright colours scaled down in RGB, so hue is preserved exactly and an
	// inactive button still reads as "the red one". Each pair sits at ~4:1 background contrast,
	// measured by WCAG relative luminance - the 700/500 pairing used until 0.8.4 was only
	// 1.7-2.3:1 and active was hard to tell from inactive on the panel.
	// Active states carry black text: white fails on every bright colour here (1.53-3.96
	// against a 4.5 threshold), so a lit button used to be harder to read, not easier.
	// Exception, 0.9.1: a muted bus is lavender with dark red text, a deliberate choice
	// rather than the contrast rule - #990000 on #8080FF is about 2.7:1.
	const c = {
		// Reds
		pgm: combineRgb(0x4e, 0x0c, 0x0c), // Red Deep    #4E0C0C — PGM / Record / Stream
		pgm_on: combineRgb(0xef, 0x44, 0x44), // Red Bright  #EF4444
		// Greens
		pvw: combineRgb(0x0e, 0x53, 0x28), // Green Deep  #0E5328
		pvw_on: combineRgb(0x22, 0xc5, 0x5e), // Green Bright #22C55E
		// Blues
		aux: combineRgb(0x0d, 0x22, 0x5f), // Blue Deep   #0D225F
		aux_on: combineRgb(0x3b, 0x82, 0xf6), // Blue Bright #3B82F6
		// Purples
		trans: combineRgb(0x32, 0x0e, 0x52), // Purple Deep  #320E52
		trans_on: combineRgb(0xa8, 0x55, 0xf7), // Purple Bright #A855F7
		// Oranges
		layer: combineRgb(0x69, 0x23, 0x06), // Orange Deep  #692306
		layer_on: combineRgb(0xf9, 0x73, 0x16), // Orange Bright #F97316
		// Ambers
		tp: combineRgb(0x77, 0x51, 0x02), // Amber Deep   #775102
		tp_on: combineRgb(0xfa, 0xcc, 0x15), // Amber Bright #FACC15
		// Cyans
		teal: combineRgb(0x0a, 0x4c, 0x46), // Teal Deep    #0A4C46
		teal_on: combineRgb(0x06, 0xb6, 0xd4), // Cyan Bright  #06B6D4
		// PinP on the AUX bus
		pinp: combineRgb(0x0a, 0x4c, 0x46), // Teal Deep
		pinp_on: combineRgb(0x06, 0xb6, 0xd4), // Cyan Bright
		// Audio - bus mutes only; per-channel input mutes are not in the presets
		audio: combineRgb(0x0d, 0x22, 0x5f), // Blue Deep
		audio_on: combineRgb(0x80, 0x80, 0xff), // Lavender #8080FF (bus muted)
		audio_on_text: combineRgb(0x99, 0x00, 0x00), // Dark Red #990000
		// Memory / Utility
		mem: combineRgb(0x77, 0x51, 0x02), // Amber Deep
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
		// Both feedbacks, and the order matters: Companion applies them in sequence and the last
		// one to match wins, so engaged is placed second and takes the button whenever it is true.
		//
		// In practice they do not overlap. During a fade, ftb_active is true and ftb_engaged holds
		// its previous value until QFTB settles on ON or OFF - so the button shows orange while the
		// fade runs, then red once the output is actually black. What an operator needs from this
		// button is "is the output black", which is engaged; the orange is there so the button does
		// not look inert for the second it takes to get there. Red is reserved for the real thing.
		feedbacks: [
			{ feedbackId: 'ftb_active', options: {}, style: { bgcolor: c.layer_on, color: c.black } },
			{ feedbackId: 'ftb_engaged', options: {}, style: { bgcolor: c.pgm_on, color: c.black } },
		],
	}
	presets['trans_mix'] = {
		type: 'button',
		category: 'Transitions',
		name: 'MIX',
		style: { text: 'MIX', size: sz, color: c.white, bgcolor: c.trans, show_topbar: false },
		steps: [{ down: [{ actionId: 'set_transition_type', options: { type: 'mix' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'transition_type_active',
				options: { type: 'mix' },
				style: { bgcolor: c.trans_on, color: c.black },
			},
		],
	}
	presets['trans_wipe'] = {
		type: 'button',
		category: 'Transitions',
		name: 'WIPE',
		style: { text: 'WIPE', size: sz, color: c.white, bgcolor: c.trans, show_topbar: false },
		steps: [{ down: [{ actionId: 'set_transition_type', options: { type: 'wipe' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'transition_type_active',
				options: { type: 'wipe' },
				style: { bgcolor: c.trans_on, color: c.black },
			},
		],
	}

	// ── Program 1–8 ───────────────────────────────────────────────────────────
	for (let i = 1; i <= 8; i++) {
		presets[`pgm_${i}`] = {
			type: 'button',
			category: 'Program',
			name: `PGM ${i}`,
			style: { text: `PGM\n${i}`, size: sz, color: c.white, bgcolor: c.pgm, show_topbar: false },
			steps: [{ down: [{ actionId: 'set_program_source', options: { source: `input_${i}` } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'program_input_active', options: { input: i }, style: { bgcolor: c.pgm_on, color: c.black } },
			],
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
			feedbacks: [
				{ feedbackId: 'preview_input_active', options: { input: i }, style: { bgcolor: c.pvw_on, color: c.black } },
			],
		}
	}

	// ── AUX 1 ─────────────────────────────────────────────────────────────────
	for (let i = 1; i <= 8; i++) {
		presets[`aux1_${i}`] = {
			type: 'button',
			category: 'Aux 1',
			name: `AUX1 ${i}`,
			style: { text: `AUX1\n${i}`, size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
			steps: [{ down: [{ actionId: 'set_aux_source', options: { aux: '1', source: `input_${i}` } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'aux_input_active', options: { aux: 1, input: i }, style: { bgcolor: c.aux_on, color: c.black } },
			],
		}
	}
	presets['aux1_pinp1_en'] = {
		type: 'button',
		category: 'Aux 1',
		name: 'AUX1 PiP 1 Toggle',
		style: { text: 'PiP 1\nTOGGLE', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp', options: { aux: '1', layer: '1' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'aux_layer_pinp_enabled',
				options: { aux: '1', layer: '1' },
				style: { bgcolor: c.layer_on, color: c.black },
			},
		],
	}
	presets['aux1_pinp1_on'] = {
		type: 'button',
		category: 'Aux 1',
		name: 'AUX1 PiP 1 Always On',
		style: { text: 'PiP 1\nALW ON', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp_always_on', options: { aux: '1', layer: '1' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'aux_layer_pinp_always_on',
				options: { aux: '1', layer: '1' },
				style: { bgcolor: c.teal_on, color: c.black },
			},
		],
	}
	presets['aux1_pinp2_en'] = {
		type: 'button',
		category: 'Aux 1',
		name: 'AUX1 PiP 2 Toggle',
		style: { text: 'PiP 2\nTOGGLE', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp', options: { aux: '1', layer: '2' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'aux_layer_pinp_enabled',
				options: { aux: '1', layer: '2' },
				style: { bgcolor: c.layer_on, color: c.black },
			},
		],
	}
	presets['aux1_pinp2_on'] = {
		type: 'button',
		category: 'Aux 1',
		name: 'AUX1 PiP 2 Always On',
		style: { text: 'PiP 2\nALW ON', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp_always_on', options: { aux: '1', layer: '2' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'aux_layer_pinp_always_on',
				options: { aux: '1', layer: '2' },
				style: { bgcolor: c.teal_on, color: c.black },
			},
		],
	}

	// ── AUX 2 ─────────────────────────────────────────────────────────────────
	for (let i = 1; i <= 8; i++) {
		presets[`aux2_${i}`] = {
			type: 'button',
			category: 'Aux 2',
			name: `AUX2 ${i}`,
			style: { text: `AUX2\n${i}`, size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
			steps: [{ down: [{ actionId: 'set_aux_source', options: { aux: '2', source: `input_${i}` } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'aux_input_active', options: { aux: 2, input: i }, style: { bgcolor: c.aux_on, color: c.black } },
			],
		}
	}
	presets['aux2_pinp1_en'] = {
		type: 'button',
		category: 'Aux 2',
		name: 'AUX2 PiP 1 Toggle',
		style: { text: 'PiP 1\nTOGGLE', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp', options: { aux: '2', layer: '1' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'aux_layer_pinp_enabled',
				options: { aux: '2', layer: '1' },
				style: { bgcolor: c.layer_on, color: c.black },
			},
		],
	}
	presets['aux2_pinp1_on'] = {
		type: 'button',
		category: 'Aux 2',
		name: 'AUX2 PiP 1 Always On',
		style: { text: 'PiP 1\nALW ON', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp_always_on', options: { aux: '2', layer: '1' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'aux_layer_pinp_always_on',
				options: { aux: '2', layer: '1' },
				style: { bgcolor: c.teal_on, color: c.black },
			},
		],
	}
	presets['aux2_pinp2_en'] = {
		type: 'button',
		category: 'Aux 2',
		name: 'AUX2 PiP 2 Toggle',
		style: { text: 'PiP 2\nTOGGLE', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp', options: { aux: '2', layer: '2' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'aux_layer_pinp_enabled',
				options: { aux: '2', layer: '2' },
				style: { bgcolor: c.layer_on, color: c.black },
			},
		],
	}
	presets['aux2_pinp2_on'] = {
		type: 'button',
		category: 'Aux 2',
		name: 'AUX2 PiP 2 Always On',
		style: { text: 'PiP 2\nALW ON', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_layer_pinp_always_on', options: { aux: '2', layer: '2' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'aux_layer_pinp_always_on',
				options: { aux: '2', layer: '2' },
				style: { bgcolor: c.teal_on, color: c.black },
			},
		],
	}

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
		category: 'Aux Link',
		name: 'AUX Link Off',
		style: { text: 'AUX LINK\nOFF', size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
		steps: [{ down: [{ actionId: 'set_aux_linked_pgm', options: { mode: '0' } }], up: [] }],
		feedbacks: [{ feedbackId: 'aux_linked_pgm_active', options: { mode: '0' }, style: { bgcolor: c.util } }],
	}
	presets['aux_link_auto'] = {
		type: 'button',
		category: 'Aux Link',
		name: 'AUX Link Auto (toggle)',
		style: { text: 'AUX LINK\nAUTO', size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_linked_pgm_mode', options: { mode: '1' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_linked_pgm_active', options: { mode: '1' }, style: { bgcolor: c.aux_on, color: c.black } },
		],
	}
	presets['aux_link_manual'] = {
		type: 'button',
		category: 'Aux Link',
		name: 'AUX Link Manual (toggle)',
		style: { text: 'AUX LINK\nMANUAL', size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
		steps: [{ down: [{ actionId: 'toggle_aux_linked_pgm_mode', options: { mode: '2' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_linked_pgm_active', options: { mode: '2' }, style: { bgcolor: c.teal_on, color: c.black } },
		],
	}
	for (const aux of [1, 2]) {
		presets[`aux${aux}_link_follow`] = {
			type: 'button',
			category: 'Aux Link',
			name: `AUX ${aux} follows PGM (toggle)`,
			style: { text: `AUX ${aux}\nFOLLOW`, size: sz, color: c.white, bgcolor: c.aux, show_topbar: false },
			steps: [{ down: [{ actionId: 'toggle_aux_linked_pgm_bus', options: { aux: String(aux) } }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'aux_linked_pgm_bus_active',
					options: { aux: String(aux) },
					style: { bgcolor: c.aux_on, color: c.black },
				},
			],
		}
	}

	// ── PinP & Key ────────────────────────────────────────────────────────────
	for (let layer = 1; layer <= 2; layer++) {
		presets[`pinp${layer}_pgm`] = {
			type: 'button',
			category: 'PinP & Key',
			name: `PiP ${layer} PGM`,
			style: { text: `PiP ${layer}\nPGM`, size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
			steps: [{ down: [{ actionId: 'pinp_pgm_toggle', options: { layer } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'pinp_pgm_active', options: { layer }, style: { bgcolor: c.layer_on, color: c.black } },
			],
		}
		presets[`pinp${layer}_pvw`] = {
			type: 'button',
			category: 'PinP & Key',
			name: `PiP ${layer} PVW`,
			style: { text: `PiP ${layer}\nPVW`, size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
			steps: [{ down: [{ actionId: 'pinp_pvw_toggle', options: { layer } }], up: [] }],
			feedbacks: [{ feedbackId: 'pinp_pvw_active', options: { layer }, style: { bgcolor: c.pvw_on, color: c.black } }],
		}
	}
	// Geometry reset, one per PinP layer. Named Reset rather than Layout because the device has no
	// layout store to recall from - this writes eight fixed geometry values and nothing more.
	//
	// Four AUX-scoped copies of these used to sit in the Aux 1 and Aux 2 categories, emitting
	// byte-for-byte identical commands: PinP geometry belongs to the layer, and there is no
	// per-AUX geometry in the protocol at all.
	presets['pinp1_reset'] = {
		type: 'button',
		category: 'PinP & Key',
		name: 'PiP 1 Reset',
		style: { text: 'PiP 1\nRESET', size: sz, color: c.white, bgcolor: c.pinp, show_topbar: false },
		steps: [{ down: pinpResetActions(1), up: [] }],
		feedbacks: [],
	}
	presets['pinp2_reset'] = {
		type: 'button',
		category: 'PinP & Key',
		name: 'PiP 2 Reset',
		style: { text: 'PiP 2\nRESET', size: sz, color: c.white, bgcolor: c.pinp, show_topbar: false },
		steps: [{ down: pinpResetActions(2), up: [] }],
		feedbacks: [],
	}

	// ── DSK ───────────────────────────────────────────────────────────────────
	presets['dsk_pgm'] = {
		type: 'button',
		category: 'DSK',
		name: 'DSK PGM',
		style: { text: 'DSK\nPGM', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'dsk_pgm_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'dsk_pgm_active', options: {}, style: { bgcolor: c.layer_on, color: c.black } }],
	}
	presets['dsk_pvw'] = {
		type: 'button',
		category: 'DSK',
		name: 'DSK PVW',
		style: { text: 'DSK\nPVW', size: sz, color: c.white, bgcolor: c.layer, show_topbar: false },
		steps: [{ down: [{ actionId: 'dsk_pvw_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'dsk_pvw_active', options: {}, style: { bgcolor: c.pvw_on, color: c.black } }],
	}

	// ── Split ─────────────────────────────────────────────────────────────────
	presets['split1'] = {
		type: 'button',
		category: 'Split',
		name: 'Split 1 – Vertical',
		style: { text: 'SPLIT\nVERT', size: sz, color: c.white, bgcolor: c.trans, show_topbar: false },
		steps: [{ down: [{ actionId: 'split1_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'split1_active', options: {}, style: { bgcolor: c.trans_on, color: c.black } }],
	}
	presets['split2'] = {
		type: 'button',
		category: 'Split',
		name: 'Split 2 – Horizontal',
		style: { text: 'SPLIT\nHORZ', size: sz, color: c.white, bgcolor: c.trans, show_topbar: false },
		steps: [{ down: [{ actionId: 'split2_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'split2_active', options: {}, style: { bgcolor: c.trans_on, color: c.black } }],
	}

	// ── Audio ─────────────────────────────────────────────────────────────────
	presets['main_mute'] = {
		type: 'button',
		category: 'Audio',
		name: 'Main Mute',
		style: { text: 'MAIN\nMUTED', size: sz, color: c.white, bgcolor: c.audio, show_topbar: false },
		steps: [{ down: [{ actionId: 'main_bus_mute_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'main_bus_muted', options: {}, style: { bgcolor: c.audio_on, color: c.audio_on_text } }],
	}
	presets['aux1_mute'] = {
		type: 'button',
		category: 'Audio',
		name: 'AUX1 Mute',
		style: { text: 'AUX1\nMUTED', size: sz, color: c.white, bgcolor: c.audio, show_topbar: false },
		steps: [{ down: [{ actionId: 'aux_bus_mute_toggle', options: { aux: '1' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_bus_muted', options: { aux: 1 }, style: { bgcolor: c.audio_on, color: c.audio_on_text } },
		],
	}
	presets['aux2_mute'] = {
		type: 'button',
		category: 'Audio',
		name: 'AUX2 Mute',
		style: { text: 'AUX2\nMUTED', size: sz, color: c.white, bgcolor: c.audio, show_topbar: false },
		steps: [{ down: [{ actionId: 'aux_bus_mute_toggle', options: { aux: '2' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'aux_bus_muted', options: { aux: 2 }, style: { bgcolor: c.audio_on, color: c.audio_on_text } },
		],
	}

	// ── Freeze ────────────────────────────────────────────────────────────────
	presets['freeze_all'] = {
		type: 'button',
		category: 'Freeze',
		name: 'Enable Freezes',
		style: { text: 'Enable\nFreezes', size: sz, color: c.white, bgcolor: c.util, show_topbar: false },
		steps: [{ down: [{ actionId: 'freeze_toggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'freeze_active', options: {}, style: { bgcolor: c.aux_on, color: c.black } }],
	}
	for (const fi of PHYSICAL_INPUTS) {
		presets[`freeze_${fi.id}`] = {
			type: 'button',
			category: 'Freeze',
			name: `Freeze ${fi.short}`,
			style: { text: `FRZ\n${fi.short}`, size: sz, color: c.white, bgcolor: c.util, show_topbar: false },
			steps: [{ down: [{ actionId: 'input_freeze_toggle', options: { input: fi.id } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'input_freeze_active', options: { input: fi.id }, style: { bgcolor: c.teal_on, color: c.black } },
			],
		}
	}

	// ── Test Patterns ─────────────────────────────────────────────────────────
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
			feedbacks: [
				{ feedbackId: 'test_pattern_active', options: { pattern: p.id }, style: { bgcolor: c.tp_on, color: c.black } },
			],
		}
	}

	// ── Stream & Record ───────────────────────────────────────────────────────
	// One trigger (0A0800) drives livestreaming and recording together on this unit, so
	// Start and Stop each act on whichever of Live Streaming, Video Rec and Audio Rec are
	// enabled on the device. Both buttons light from the device's own reported state
	// rather than from what was sent, so they also track the panel and the RCS software.
	presets['stream_record_start'] = {
		type: 'button',
		category: 'Stream & Record',
		name: 'Record & Stream Start',
		style: { text: 'REC &\nSTREAM\nSTART', size: sz, color: c.white, bgcolor: c.pgm, show_topbar: false },
		steps: [{ down: [{ actionId: 'stream_record_start', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'stream_record_active', options: {}, style: { bgcolor: c.pgm_on, color: c.black } }],
	}
	presets['stream_record_stop'] = {
		type: 'button',
		category: 'Stream & Record',
		name: 'Record & Stream Stop',
		style: { text: 'REC &\nSTREAM\nSTOP', size: sz, color: c.white, bgcolor: c.pgm, show_topbar: false },
		steps: [{ down: [{ actionId: 'stream_record_stop', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'stream_record_active', options: {}, style: { bgcolor: c.pgm_on, color: c.black } }],
	}

	// ── Image Capture ─────────────────────────────────────────────────────────
	// Still 1-8 from HDMI In 1 as a starting point; change the source on the button.
	// A capture takes about 10 seconds and overwrites the slot without asking - most of that
	// is the 7s hold before the capture screen is dismissed. See cmdCaptureImage.
	for (let slot = 1; slot <= 8; slot++) {
		presets[`capture_still_${slot}`] = {
			type: 'button',
			category: 'Image Capture',
			name: `Capture to Still ${slot}`,
			style: { text: `Capture\n${slot}`, size: sz, color: c.white, bgcolor: c.mem, show_topbar: false },
			steps: [{ down: [{ actionId: 'capture_image', options: { slot, source: 'hdmi_1' } }], up: [] }],
			feedbacks: [],
		}
	}

	// ── Tally ─────────────────────────────────────────────────────────────────
	// One button per physical input, reporting what the switcher itself says is on air.
	// Red for PGM, green for PST. Needs no tally cable.
	for (const ti of PHYSICAL_INPUTS) {
		presets[`tally_${ti.id}`] = {
			type: 'button',
			category: 'Tally',
			name: `Tally ${ti.label}`,
			style: { text: ti.short.replace(' ', '\n'), size: sz, color: c.white, bgcolor: c.util, show_topbar: false },
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{ feedbackId: 'tally_pgm', options: { input: ti.id }, style: { bgcolor: c.pgm_on, color: c.black } },
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

	// ── Advanced ──────────────────────────────────────────────────────────────
	// Expert use only, and alone in its own category on purpose so it cannot be dropped onto a
	// page while browsing the ordinary ones. The button ships with an empty command string —
	// fill it in on the button itself — and "Allow advanced actions" has to be ticked in the
	// connection config or the action refuses to send and logs a warning instead.
	presets['raw_command'] = {
		type: 'button',
		category: 'Advanced',
		name: 'Send raw LAN command',
		style: { text: 'RAW\nLAN\nCMD', size: sz, color: c.white, bgcolor: c.util, show_topbar: false },
		steps: [{ down: [{ actionId: 'raw_command', options: { cmd: '' } }], up: [] }],
		feedbacks: [],
	}

	self.setPresetDefinitions(presets)
}

// Resets one PinP layer's geometry to a default box: all eight geometry parameters at fixed
// values. Takes only the layer, because that is the only thing PinP geometry is scoped to.
// Cropping defaults to 100%, which is fully open - 0% would crop the window out of existence.
function pinpResetActions(layer: number) {
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
