// src/actions.ts — Roland V-80HD v0.3.1
import type { ModuleInstance } from './main.js'
import { TEST_PATTERNS, SOURCE_CHOICES, INPUT_ASSIGN_SOURCE_CHOICES } from './api.js'

const AUDIO_CHANNELS = [
	{ id: 'audio_in_1',   label: 'Audio In 1' },     { id: 'audio_in_2',  label: 'Audio In 2' },
	{ id: 'audio_in_34',  label: 'Audio In 3/4' },   { id: 'usb_in',      label: 'USB In' },
	{ id: 'bluetooth_in', label: 'Bluetooth In' },   { id: 'audio_player',label: 'Audio Player' },
	{ id: 'hdmi_in_1',    label: 'HDMI In 1' },      { id: 'hdmi_in_2',   label: 'HDMI In 2' },
	{ id: 'hdmi_in_3',    label: 'HDMI In 3' },      { id: 'hdmi_in_4',   label: 'HDMI In 4' },
	{ id: 'sdi_in_1',     label: 'SDI In 1' },       { id: 'sdi_in_2',    label: 'SDI In 2' },
	{ id: 'sdi_in_3',     label: 'SDI In 3' },       { id: 'sdi_in_4',    label: 'SDI In 4' },
	{ id: 'video_player', label: 'Video Player / SRT In' },
]
const WIPE_TYPES = [
	{ id: '0', label: 'Horizontal' }, { id: '1', label: 'Vertical' },
	{ id: '2', label: 'Upper Left' }, { id: '3', label: 'Upper Right' },
	{ id: '4', label: 'Lower Left' }, { id: '5', label: 'Lower Right' },
	{ id: '6', label: 'H-Center' },  { id: '7', label: 'V-Center' },
]
const WIPE_DIRS    = [{ id: '0', label: 'Normal' }, { id: '1', label: 'Reverse' }, { id: '2', label: 'Round Trip' }]
const FREEZE_INPUTS = [
	{ id: 'hdmi_1', label: 'HDMI In 1' }, { id: 'hdmi_2', label: 'HDMI In 2' },
	{ id: 'hdmi_3', label: 'HDMI In 3' }, { id: 'hdmi_4', label: 'HDMI In 4' },
	{ id: 'sdi_1',  label: 'SDI In 1'  }, { id: 'sdi_2',  label: 'SDI In 2'  },
	{ id: 'sdi_3',  label: 'SDI In 3'  }, { id: 'sdi_4',  label: 'SDI In 4'  },
]
const AUX_CHOICES    = [{ id: '1', label: 'AUX 1' }, { id: '2', label: 'AUX 2' }]
const LAYER_OPT      = { id: 'layer', type: 'number' as const, label: 'Layer (1 or 2)', default: 1, min: 1, max: 2 }
const AUX_LAYER_MODE = [{ id: '0', label: 'Disable' }, { id: '1', label: 'Enable' }, { id: '2', label: 'Always On' }]
const AUX_LAYER_DD   = [{ id: '1', label: 'PinP & Key 1' }, { id: '2', label: 'PinP & Key 2' }]
const L = (e: any): 1 | 2 => Number(e.options.layer) === 2 ? 2 : 1

export function UpdateActions(self: ModuleInstance): void {
	const actions: Parameters<typeof self.setActionDefinitions>[0] = {

		cut:  { name: 'CUT',  options: [], callback: async () => self.cmdCut()  },
		auto: { name: 'AUTO', options: [], callback: async () => self.cmdAuto() },
		fade_to_black: { name: 'Fade To Black (tap)', options: [], callback: async () => self.cmdFadeToBlack() },
		set_transition_type: {
			name: 'Set Transition Type',
			options: [{ id: 'type', type: 'dropdown', label: 'Type', default: 'mix', choices: [{ id: 'mix', label: 'Mix' }, { id: 'wipe', label: 'Wipe' }] }],
			callback: async (e) => self.cmdSetTransitionType(e.options.type as 'mix' | 'wipe'),
		},
		set_mix_time: {
			name: 'Set Mix/Wipe Time (0.0 to 4.0 seconds)',
			description: '0 = 0.0s, 10 = 1.0s, 20 = 2.0s, 40 = 4.0s',
			options: [{ id: 'tenths', type: 'number', label: 'Tenths of a second (0 to 40)', default: 10, min: 0, max: 40 }],
			callback: async (e) => self.cmdSetMixTime(Number(e.options.tenths)),
		},
		set_wipe_type: {
			name: 'Set Wipe Pattern',
			options: [{ id: 'type', type: 'dropdown', label: 'Pattern', default: '0', choices: WIPE_TYPES }],
			callback: async (e) => self.cmdSetWipeType(Number(e.options.type)),
		},
		set_wipe_direction: {
			name: 'Set Wipe Direction',
			options: [{ id: 'dir', type: 'dropdown', label: 'Direction', default: '0', choices: WIPE_DIRS }],
			callback: async (e) => self.cmdSetWipeDirection(Number(e.options.dir)),
		},

		set_program_source: {
			name: 'Set Program Source',
			options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 'input_1', choices: SOURCE_CHOICES }],
			callback: async (e) => self.cmdSetProgramSource(String(e.options.source)),
		},
		set_preview_source: {
			name: 'Set Preview Source',
			options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 'input_1', choices: SOURCE_CHOICES }],
			callback: async (e) => self.cmdSetPreviewSource(String(e.options.source)),
		},

		input_assign_source: {
			name: 'Input Assign – Set Source',
			options: [
				{ id: 'slot',   type: 'number',   label: 'Crosspoint Slot (1 to 8)', default: 1, min: 1, max: 8 },
				{ id: 'source', type: 'dropdown', label: 'Source', default: 'hdmi_1', choices: INPUT_ASSIGN_SOURCE_CHOICES },
			],
			callback: async (e) => self.cmdSetInputAssignSource(Number(e.options.slot), String(e.options.source)),
		},

		set_aux_source: {
			name: 'Set AUX Source',
			options: [
				{ id: 'aux',    type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES },
				{ id: 'source', type: 'dropdown', label: 'Source',  default: 'input_1', choices: SOURCE_CHOICES },
			],
			callback: async (e) => self.cmdSetAuxSource(Number(e.options.aux) === 2 ? 2 : 1, String(e.options.source)),
		},
		set_aux_linked_pgm: {
			name: 'Set AUX Linked PGM',
			options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: '0', choices: [{ id: '0', label: 'Off' }, { id: '1', label: 'Auto Link' }, { id: '2', label: 'Manual Link' }] }],
			callback: async (e) => self.cmdSetAuxLinkedPgm(Number(e.options.mode) as 0 | 1 | 2),
		},
		set_aux_layer_pinp: {
			name: 'Set AUX Layer – PinP and Key',
			description: 'Controls PinP overlay on the AUX bus output independently from PGM',
			options: [
				{ id: 'aux',   type: 'dropdown', label: 'AUX Bus',    default: '1', choices: AUX_CHOICES },
				{ id: 'layer', type: 'dropdown', label: 'PinP Layer', default: '1', choices: AUX_LAYER_DD },
				{ id: 'mode',  type: 'dropdown', label: 'Mode',       default: '1', choices: AUX_LAYER_MODE },
			],
			callback: async (e) => self.cmdSetAuxLayerPinp(Number(e.options.aux) === 2 ? 2 : 1, Number(e.options.layer) === 2 ? 2 : 1, Number(e.options.mode) as 0 | 1 | 2),
		},
		toggle_aux_layer_pinp: {
			name: 'Toggle AUX Layer – PinP and Key (Disable / Enable)',
			options: [
				{ id: 'aux',   type: 'dropdown', label: 'AUX Bus',    default: '1', choices: AUX_CHOICES },
				{ id: 'layer', type: 'dropdown', label: 'PinP Layer', default: '1', choices: AUX_LAYER_DD },
			],
			callback: async (e) => self.cmdToggleAuxLayerPinp(Number(e.options.aux) === 2 ? 2 : 1, Number(e.options.layer) === 2 ? 2 : 1),
		},
		toggle_aux_layer_pinp_always_on: {
			name: 'Toggle AUX Layer – PinP and Key (Disable / Always On)',
			options: [
				{ id: 'aux',   type: 'dropdown', label: 'AUX Bus',    default: '1', choices: AUX_CHOICES },
				{ id: 'layer', type: 'dropdown', label: 'PinP Layer', default: '1', choices: AUX_LAYER_DD },
			],
			callback: async (e) => self.cmdToggleAuxLayerPinpAlwaysOn(Number(e.options.aux) === 2 ? 2 : 1, Number(e.options.layer) === 2 ? 2 : 1),
		},

		split1_on: { name: 'Split 1 – On', options: [], callback: async () => self.cmdSplit1(true) },
		split1_off: { name: 'Split 1 – Off', options: [], callback: async () => self.cmdSplit1(false) },
		split1_toggle: { name: 'Split 1 – Toggle', options: [], callback: async () => self.cmdSplit1Toggle() },
		split2_on: { name: 'Split 2 – On', options: [], callback: async () => self.cmdSplit2(true) },
		split2_off: { name: 'Split 2 – Off', options: [], callback: async () => self.cmdSplit2(false) },
		split2_toggle: { name: 'Split 2 – Toggle', options: [], callback: async () => self.cmdSplit2Toggle() },

		pinp_set_source: {
			name: 'PinP and Key – Set Source',
			options: [LAYER_OPT, { id: 'source', type: 'dropdown', label: 'Source', default: 'input_1', choices: SOURCE_CHOICES }],
			callback: async (e) => self.cmdPinpSetSource(L(e), String(e.options.source)),
		},
		pinp_pgm_on:     { name: 'PinP and Key – PGM On',     options: [LAYER_OPT], callback: async (e) => self.cmdPinpPgm(L(e), true)  },
		pinp_pgm_off:    { name: 'PinP and Key – PGM Off',    options: [LAYER_OPT], callback: async (e) => self.cmdPinpPgm(L(e), false) },
		pinp_pgm_toggle: { name: 'PinP and Key – PGM Toggle', options: [LAYER_OPT], callback: async (e) => self.cmdPinpPgmToggle(L(e)) },
		pinp_pvw_on:     { name: 'PinP and Key – PVW On',     options: [LAYER_OPT], callback: async (e) => self.cmdPinpPvw(L(e), true)  },
		pinp_pvw_off:    { name: 'PinP and Key – PVW Off',    options: [LAYER_OPT], callback: async (e) => self.cmdPinpPvw(L(e), false) },
		pinp_pvw_toggle: { name: 'PinP and Key – PVW Toggle', options: [LAYER_OPT], callback: async (e) => self.cmdPinpPvwToggle(L(e)) },

		pinp_window_position_h: {
			name: 'PinP – Window Position H (-100 to +100%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Position %', default: 0, min: -100, max: 100 }],
			callback: async (e) => self.cmdPinpPositionH(L(e), Number(e.options.pct)),
		},
		pinp_window_position_v: {
			name: 'PinP – Window Position V (-100 to +100%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Position %', default: 0, min: -100, max: 100 }],
			callback: async (e) => self.cmdPinpPositionV(L(e), Number(e.options.pct)),
		},
		pinp_window_size: {
			name: 'PinP – Window Size (0 to 100%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Size %', default: 25, min: 0, max: 100 }],
			callback: async (e) => self.cmdPinpSize(L(e), Number(e.options.pct)),
		},
		pinp_window_cropping_h: {
			name: 'PinP – Window Cropping H (0 to 100%)',
			description: '100% = no crop (full width). 0% = fully cropped. Reduce to crop left and right edges.',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Cropping %', default: 100, min: 0, max: 100 }],
			callback: async (e) => self.cmdPinpCroppingH(L(e), Number(e.options.pct)),
		},
		pinp_window_cropping_v: {
			name: 'PinP – Window Cropping V (0 to 100%)',
			description: '100% = no crop (full height). 0% = fully cropped. Reduce to crop top and bottom edges.',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Cropping %', default: 100, min: 0, max: 100 }],
			callback: async (e) => self.cmdPinpCroppingV(L(e), Number(e.options.pct)),
		},
		pinp_view_position_h: {
			name: 'PinP – View Position H (-50 to +50%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Position %', default: 0, min: -50, max: 50 }],
			callback: async (e) => self.cmdPinpViewPositionH(L(e), Number(e.options.pct)),
		},
		pinp_view_position_v: {
			name: 'PinP – View Position V (-50 to +50%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Position %', default: 0, min: -50, max: 50 }],
			callback: async (e) => self.cmdPinpViewPositionV(L(e), Number(e.options.pct)),
		},
		pinp_view_zoom: {
			name: 'PinP – View Zoom (100 to 400%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Zoom %', default: 100, min: 100, max: 400 }],
			callback: async (e) => self.cmdPinpViewZoom(L(e), Number(e.options.pct)),
		},

		dsk_set_source: {
			name: 'DSK – Set Source',
			options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 'input_1', choices: SOURCE_CHOICES }],
			callback: async (e) => self.cmdDskSetSource(String(e.options.source)),
		},
		dsk_pgm_on:     { name: 'DSK – PGM On',     options: [], callback: async () => self.cmdDskPgm(true)   },
		dsk_pgm_off:    { name: 'DSK – PGM Off',    options: [], callback: async () => self.cmdDskPgm(false)  },
		dsk_pgm_toggle: { name: 'DSK – PGM Toggle', options: [], callback: async () => self.cmdDskPgmToggle() },
		dsk_pvw_on:     { name: 'DSK – PVW On',     options: [], callback: async () => self.cmdDskPvw(true)   },
		dsk_pvw_off:    { name: 'DSK – PVW Off',    options: [], callback: async () => self.cmdDskPvw(false)  },
		dsk_pvw_toggle: { name: 'DSK – PVW Toggle', options: [], callback: async () => self.cmdDskPvwToggle() },

		audio_input_mute_on:     { name: 'Audio Input – Mute On',     options: [{ id: 'ch', type: 'dropdown', label: 'Channel', default: 'audio_in_1', choices: AUDIO_CHANNELS }], callback: async (e) => self.cmdAudioInputMute(String(e.options.ch), true)  },
		audio_input_mute_off:    { name: 'Audio Input – Mute Off',    options: [{ id: 'ch', type: 'dropdown', label: 'Channel', default: 'audio_in_1', choices: AUDIO_CHANNELS }], callback: async (e) => self.cmdAudioInputMute(String(e.options.ch), false) },
		audio_input_mute_toggle: { name: 'Audio Input – Mute Toggle', options: [{ id: 'ch', type: 'dropdown', label: 'Channel', default: 'audio_in_1', choices: AUDIO_CHANNELS }], callback: async (e) => self.cmdAudioInputMuteToggle(String(e.options.ch)) },
		main_bus_mute_on:     { name: 'Main Bus – Mute On',     options: [], callback: async () => self.cmdMainBusMute(true)   },
		main_bus_mute_off:    { name: 'Main Bus – Mute Off',    options: [], callback: async () => self.cmdMainBusMute(false)  },
		main_bus_mute_toggle: { name: 'Main Bus – Mute Toggle', options: [], callback: async () => self.cmdMainBusMuteToggle() },
		aux_bus_mute_on:      { name: 'AUX Bus – Mute On',      options: [{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES }], callback: async (e) => self.cmdAuxBusMute(Number(e.options.aux) === 2 ? 2 : 1, true)  },
		aux_bus_mute_off:     { name: 'AUX Bus – Mute Off',     options: [{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES }], callback: async (e) => self.cmdAuxBusMute(Number(e.options.aux) === 2 ? 2 : 1, false) },
		aux_bus_mute_toggle:  { name: 'AUX Bus – Mute Toggle',  options: [{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES }], callback: async (e) => self.cmdAuxBusMuteToggle(Number(e.options.aux) === 2 ? 2 : 1)  },

		freeze_on:     { name: 'Freeze – On',     options: [], callback: async () => self.cmdFreezeOn()     },
		freeze_off:    { name: 'Freeze – Off',    options: [], callback: async () => self.cmdFreezeOff()    },
		freeze_toggle: { name: 'Freeze – Toggle', options: [], callback: async () => self.cmdFreezeToggle() },
		input_freeze_on:     { name: 'Input Freeze – On',     options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'hdmi_1', choices: FREEZE_INPUTS }], callback: async (e) => self.cmdSetInputFreeze(String(e.options.input), true)  },
		input_freeze_off:    { name: 'Input Freeze – Off',    options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'hdmi_1', choices: FREEZE_INPUTS }], callback: async (e) => self.cmdSetInputFreeze(String(e.options.input), false) },
		input_freeze_toggle: { name: 'Input Freeze – Toggle', options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'hdmi_1', choices: FREEZE_INPUTS }], callback: async (e) => self.cmdSetInputFreezeToggle(String(e.options.input)) },

		test_pattern: {
			name: 'Test Pattern All Outputs (toggle)',
			description: 'Pressing again while the same pattern is active turns it off',
			options: [{ id: 'pattern', type: 'dropdown', label: 'Pattern', default: 'bars75', choices: TEST_PATTERNS.map(p => ({ id: p.id, label: p.label })) }],
			callback: async (e) => self.cmdTestPattern(String(e.options.pattern)),
		},
		test_pattern_off: { name: 'Test Pattern Off', options: [], callback: async () => self.cmdTestPatternOff() },

		sync_now: { name: 'Sync state now', options: [], callback: async () => self.requestCoreState() },
	}

	if (self.config.showAdvanced) {
		actions['raw_command'] = {
			name: 'Send raw LAN command',
			description: 'Expert use only. Incorrect commands can overwrite mixer state. Example: DTH:001500,29; sets Program to Input 1.',
			options: [{ id: 'cmd', type: 'textinput', label: 'Command string', default: '' }],
			callback: async (e) => { const cmd = String(e.options.cmd ?? '').trim(); if (cmd) self.cmdRaw(cmd) },
		}
	}

	self.setActionDefinitions(actions)
}
