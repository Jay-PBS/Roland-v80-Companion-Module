// src/actions.ts — Roland V-80HD
import type { ModuleInstance } from './main.js'
import {
	TEST_PATTERNS,
	SOURCE_CHOICES,
	INPUT_ASSIGN_SOURCE_CHOICES,
	CAPTURE_SOURCE_CHOICES,
	AUDIO_CHANNEL_CHOICES,
	PHYSICAL_INPUT_CHOICES,
	WIPE_TYPE_CHOICES,
	WIPE_DIRECTION_CHOICES,
	AUX_LINK_MODE_CHOICES,
	AUX_CHOICES,
	AUX_LAYER_CHOICES,
	type LayerId,
	type AuxId,
} from './api.js'

const STREAM_RECORD_WARNING =
	"On the V-80HD livestreaming, video recording and audio recording share one trigger and cannot be started separately. Whichever of Live Streaming, Video Rec and Audio Rec are enabled in the unit's menu will start, so this WILL begin a livestream — including to YouTube, Facebook or Twitch — if Live Streaming is on. Check Stream&Record settings on the device before assigning this to a button."

const LAYER_OPT = { id: 'layer', type: 'number' as const, label: 'Layer (1 or 2)', default: 1, min: 1, max: 2 }
const AUX_LAYER_MODE = [
	{ id: '0', label: 'Disable' },
	{ id: '1', label: 'Enable' },
	{ id: '2', label: 'Always On' },
]
// The AUX and layer dropdowns are 1/2 strings, so every callback narrows the same way.
const L = (e: { options: Record<string, unknown> }): LayerId => (Number(e.options.layer) === 2 ? 2 : 1)
const A = (e: { options: Record<string, unknown> }): AuxId => (Number(e.options.aux) === 2 ? 2 : 1)

export function UpdateActions(self: ModuleInstance): void {
	const actions: Parameters<typeof self.setActionDefinitions>[0] = {
		cut: { name: 'CUT', options: [], callback: async () => self.api.cmdCut() },
		auto: { name: 'AUTO', options: [], callback: async () => self.api.cmdAuto() },
		fade_to_black: { name: 'Fade To Black (tap)', options: [], callback: async () => self.api.cmdFadeToBlack() },
		capture_mode_toggle: {
			name: 'Capture Mode (toggle)',
			description:
				"Works the unit's [CAPTURE IMAGE] button, opening or closing the still-capture screen. It is a toggle, so it opens the screen if it is shut. Capture Image to Still already closes the screen on its own.",
			options: [],
			callback: async () => self.api.cmdToggleCaptureMode(),
		},
		capture_screen_close: {
			name: 'Capture Mode – close if open',
			description:
				'Closes the still-capture screen, and does nothing if it is not showing. Safer than the toggle for a blind button press.',
			options: [],
			callback: async () => self.api.cmdCloseCaptureScreen(),
		},
		set_transition_type: {
			name: 'Set Transition Type',
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
			callback: async (e) => self.api.cmdSetTransitionType(e.options.type as 'mix' | 'wipe'),
		},
		set_mix_time: {
			name: 'Set Mix/Wipe Time (0.0 to 4.0 seconds)',
			description: '0 = 0.0s, 10 = 1.0s, 20 = 2.0s, 40 = 4.0s',
			options: [{ id: 'tenths', type: 'number', label: 'Tenths of a second (0 to 40)', default: 10, min: 0, max: 40 }],
			callback: async (e) => self.api.cmdSetMixTime(Number(e.options.tenths)),
		},
		set_wipe_type: {
			name: 'Set Wipe Pattern',
			options: [{ id: 'type', type: 'dropdown', label: 'Pattern', default: '0', choices: WIPE_TYPE_CHOICES }],
			callback: async (e) => self.api.cmdSetWipeType(Number(e.options.type)),
		},
		set_wipe_direction: {
			name: 'Set Wipe Direction',
			options: [{ id: 'dir', type: 'dropdown', label: 'Direction', default: '0', choices: WIPE_DIRECTION_CHOICES }],
			callback: async (e) => self.api.cmdSetWipeDirection(Number(e.options.dir)),
		},

		set_program_source: {
			name: 'Set Program Source',
			options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 'input_1', choices: SOURCE_CHOICES }],
			callback: async (e) => self.api.cmdSetProgramSource(String(e.options.source)),
		},
		set_preview_source: {
			name: 'Set Preview Source',
			options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 'input_1', choices: SOURCE_CHOICES }],
			callback: async (e) => self.api.cmdSetPreviewSource(String(e.options.source)),
		},

		input_assign_source: {
			name: 'Input Assign – Set Source',
			options: [
				{ id: 'slot', type: 'number', label: 'Crosspoint Slot (1 to 8)', default: 1, min: 1, max: 8 },
				{ id: 'source', type: 'dropdown', label: 'Source', default: 'hdmi_1', choices: INPUT_ASSIGN_SOURCE_CHOICES },
			],
			callback: async (e) => self.api.cmdSetInputAssignSource(Number(e.options.slot), String(e.options.source)),
		},

		set_aux_source: {
			name: 'Set AUX Source',
			options: [
				{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES },
				{ id: 'source', type: 'dropdown', label: 'Source', default: 'input_1', choices: SOURCE_CHOICES },
			],
			callback: async (e) => self.api.cmdSetAuxSource(A(e), String(e.options.source)),
		},
		set_aux_linked_pgm: {
			name: 'Set AUX Linked PGM',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: '0',
					choices: AUX_LINK_MODE_CHOICES,
				},
			],
			callback: async (e) => self.api.cmdSetAuxLinkedPgm(Number(e.options.mode) as 0 | 1 | 2),
		},
		toggle_aux_linked_pgm_mode: {
			name: 'AUX Linked PGM mode (toggle)',
			description:
				'Sets the chosen mode, or returns to Off if it is already active. The mode must not be Off for the bus follow settings to do anything.',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: '1',
					// Off is not offered here: this action toggles a mode back to Off by itself.
					choices: AUX_LINK_MODE_CHOICES.filter((m) => m.id !== '0'),
				},
			],
			callback: async (e) => self.api.cmdToggleAuxLinkedPgmMode(Number(e.options.mode) === 2 ? 2 : 1),
		},
		set_aux_linked_pgm_bus: {
			name: 'Set AUX Linked PGM – bus follow',
			description: 'Chooses which AUX bus follows PGM. This is what Manual Link mode selects between.',
			options: [
				{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES },
				{
					id: 'state',
					type: 'dropdown',
					label: 'Follow PGM',
					default: '1',
					choices: [
						{ id: '1', label: 'On' },
						{ id: '0', label: 'Off' },
					],
				},
			],
			callback: async (e) => self.api.cmdSetAuxLinkedPgmBus(A(e), String(e.options.state) === '1'),
		},
		toggle_aux_linked_pgm_bus: {
			name: 'Toggle AUX Linked PGM – bus follow',
			options: [{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES }],
			callback: async (e) => self.api.cmdToggleAuxLinkedPgmBus(A(e)),
		},
		set_aux_layer_pinp: {
			name: 'Set AUX Layer – PinP and Key',
			description: 'Controls PinP overlay on the AUX bus output independently from PGM',
			options: [
				{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES },
				{ id: 'layer', type: 'dropdown', label: 'PinP Layer', default: '1', choices: AUX_LAYER_CHOICES },
				{ id: 'mode', type: 'dropdown', label: 'Mode', default: '1', choices: AUX_LAYER_MODE },
			],
			callback: async (e) => self.api.cmdSetAuxLayerPinp(A(e), L(e), Number(e.options.mode) as 0 | 1 | 2),
		},
		toggle_aux_layer_pinp: {
			name: 'Toggle AUX Layer – PinP and Key (Disable / Enable)',
			options: [
				{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES },
				{ id: 'layer', type: 'dropdown', label: 'PinP Layer', default: '1', choices: AUX_LAYER_CHOICES },
			],
			callback: async (e) => self.api.cmdToggleAuxLayerPinp(A(e), L(e)),
		},
		toggle_aux_layer_pinp_always_on: {
			name: 'Toggle AUX Layer – PinP and Key (Disable / Always On)',
			options: [
				{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES },
				{ id: 'layer', type: 'dropdown', label: 'PinP Layer', default: '1', choices: AUX_LAYER_CHOICES },
			],
			callback: async (e) => self.api.cmdToggleAuxLayerPinpAlwaysOn(A(e), L(e)),
		},

		pinp_set_source: {
			name: 'PinP and Key – Set Source',
			options: [
				LAYER_OPT,
				{ id: 'source', type: 'dropdown', label: 'Source', default: 'input_1', choices: SOURCE_CHOICES },
			],
			callback: async (e) => self.api.cmdPinpSetSource(L(e), String(e.options.source)),
		},
		pinp_pgm_on: {
			name: 'PinP and Key – PGM On',
			options: [LAYER_OPT],
			callback: async (e) => self.api.cmdPinpPgm(L(e), true),
		},
		pinp_pgm_off: {
			name: 'PinP and Key – PGM Off',
			options: [LAYER_OPT],
			callback: async (e) => self.api.cmdPinpPgm(L(e), false),
		},
		pinp_pgm_toggle: {
			name: 'PinP and Key – PGM Toggle',
			options: [LAYER_OPT],
			callback: async (e) => self.api.cmdPinpPgmToggle(L(e)),
		},
		pinp_pvw_on: {
			name: 'PinP and Key – PVW On',
			options: [LAYER_OPT],
			callback: async (e) => self.api.cmdPinpPvw(L(e), true),
		},
		pinp_pvw_off: {
			name: 'PinP and Key – PVW Off',
			options: [LAYER_OPT],
			callback: async (e) => self.api.cmdPinpPvw(L(e), false),
		},
		pinp_pvw_toggle: {
			name: 'PinP and Key – PVW Toggle',
			options: [LAYER_OPT],
			callback: async (e) => self.api.cmdPinpPvwToggle(L(e)),
		},

		pinp_window_position_h: {
			name: 'PinP – Window Position H (-100 to +100%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Position %', default: 0, min: -100, max: 100 }],
			callback: async (e) => self.api.cmdPinpPositionH(L(e), Number(e.options.pct)),
		},
		pinp_window_position_v: {
			name: 'PinP – Window Position V (-100 to +100%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Position %', default: 0, min: -100, max: 100 }],
			callback: async (e) => self.api.cmdPinpPositionV(L(e), Number(e.options.pct)),
		},
		pinp_window_size: {
			name: 'PinP – Window Size (0 to 100%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Size %', default: 25, min: 0, max: 100 }],
			callback: async (e) => self.api.cmdPinpSize(L(e), Number(e.options.pct)),
		},
		pinp_window_cropping_h: {
			name: 'PinP – Window Cropping H (0 to 100%)',
			description: '100% = no crop (full width). 0% = fully cropped. Reduce to crop left and right edges.',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Cropping %', default: 100, min: 0, max: 100 }],
			callback: async (e) => self.api.cmdPinpCroppingH(L(e), Number(e.options.pct)),
		},
		pinp_window_cropping_v: {
			name: 'PinP – Window Cropping V (0 to 100%)',
			description: '100% = no crop (full height). 0% = fully cropped. Reduce to crop top and bottom edges.',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Cropping %', default: 100, min: 0, max: 100 }],
			callback: async (e) => self.api.cmdPinpCroppingV(L(e), Number(e.options.pct)),
		},
		pinp_view_position_h: {
			name: 'PinP – View Position H (-50 to +50%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Position %', default: 0, min: -50, max: 50 }],
			callback: async (e) => self.api.cmdPinpViewPositionH(L(e), Number(e.options.pct)),
		},
		pinp_view_position_v: {
			name: 'PinP – View Position V (-50 to +50%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Position %', default: 0, min: -50, max: 50 }],
			callback: async (e) => self.api.cmdPinpViewPositionV(L(e), Number(e.options.pct)),
		},
		pinp_view_zoom: {
			name: 'PinP – View Zoom (100 to 400%)',
			options: [LAYER_OPT, { id: 'pct', type: 'number', label: 'Zoom %', default: 100, min: 100, max: 400 }],
			callback: async (e) => self.api.cmdPinpViewZoom(L(e), Number(e.options.pct)),
		},

		split1_on: { name: 'Split 1 – On', options: [], callback: async () => self.api.cmdSplit1(true) },
		split1_off: { name: 'Split 1 – Off', options: [], callback: async () => self.api.cmdSplit1(false) },
		split1_toggle: { name: 'Split 1 – Toggle', options: [], callback: async () => self.api.cmdSplit1Toggle() },
		split2_on: { name: 'Split 2 – On', options: [], callback: async () => self.api.cmdSplit2(true) },
		split2_off: { name: 'Split 2 – Off', options: [], callback: async () => self.api.cmdSplit2(false) },
		split2_toggle: { name: 'Split 2 – Toggle', options: [], callback: async () => self.api.cmdSplit2Toggle() },

		dsk_set_source: {
			name: 'DSK – Set Source',
			options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 'input_1', choices: SOURCE_CHOICES }],
			callback: async (e) => self.api.cmdDskSetSource(String(e.options.source)),
		},
		dsk_pgm_on: { name: 'DSK – PGM On', options: [], callback: async () => self.api.cmdDskPgm(true) },
		dsk_pgm_off: { name: 'DSK – PGM Off', options: [], callback: async () => self.api.cmdDskPgm(false) },
		dsk_pgm_toggle: { name: 'DSK – PGM Toggle', options: [], callback: async () => self.api.cmdDskPgmToggle() },
		dsk_pvw_on: { name: 'DSK – PVW On', options: [], callback: async () => self.api.cmdDskPvw(true) },
		dsk_pvw_off: { name: 'DSK – PVW Off', options: [], callback: async () => self.api.cmdDskPvw(false) },
		dsk_pvw_toggle: { name: 'DSK – PVW Toggle', options: [], callback: async () => self.api.cmdDskPvwToggle() },

		audio_input_mute_on: {
			name: 'Audio Input – Mute On',
			options: [
				{ id: 'ch', type: 'dropdown', label: 'Channel', default: 'audio_in_1', choices: AUDIO_CHANNEL_CHOICES },
			],
			callback: async (e) => self.api.cmdAudioInputMute(String(e.options.ch), true),
		},
		audio_input_mute_off: {
			name: 'Audio Input – Mute Off',
			options: [
				{ id: 'ch', type: 'dropdown', label: 'Channel', default: 'audio_in_1', choices: AUDIO_CHANNEL_CHOICES },
			],
			callback: async (e) => self.api.cmdAudioInputMute(String(e.options.ch), false),
		},
		audio_input_mute_toggle: {
			name: 'Audio Input – Mute Toggle',
			options: [
				{ id: 'ch', type: 'dropdown', label: 'Channel', default: 'audio_in_1', choices: AUDIO_CHANNEL_CHOICES },
			],
			callback: async (e) => self.api.cmdAudioInputMuteToggle(String(e.options.ch)),
		},
		main_bus_mute_on: { name: 'Main Bus – Mute On', options: [], callback: async () => self.api.cmdMainBusMute(true) },
		main_bus_mute_off: {
			name: 'Main Bus – Mute Off',
			options: [],
			callback: async () => self.api.cmdMainBusMute(false),
		},
		main_bus_mute_toggle: {
			name: 'Main Bus – Mute Toggle',
			options: [],
			callback: async () => self.api.cmdMainBusMuteToggle(),
		},
		aux_bus_mute_on: {
			name: 'AUX Bus – Mute On',
			options: [{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES }],
			callback: async (e) => self.api.cmdAuxBusMute(A(e), true),
		},
		aux_bus_mute_off: {
			name: 'AUX Bus – Mute Off',
			options: [{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES }],
			callback: async (e) => self.api.cmdAuxBusMute(A(e), false),
		},
		aux_bus_mute_toggle: {
			name: 'AUX Bus – Mute Toggle',
			options: [{ id: 'aux', type: 'dropdown', label: 'AUX Bus', default: '1', choices: AUX_CHOICES }],
			callback: async (e) => self.api.cmdAuxBusMuteToggle(A(e)),
		},

		freeze_on: { name: 'Freeze – On', options: [], callback: async () => self.api.cmdFreezeOn() },
		freeze_off: { name: 'Freeze – Off', options: [], callback: async () => self.api.cmdFreezeOff() },
		freeze_toggle: { name: 'Freeze – Toggle', options: [], callback: async () => self.api.cmdFreezeToggle() },
		input_freeze_on: {
			name: 'Input Freeze – On',
			options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'hdmi_1', choices: PHYSICAL_INPUT_CHOICES }],
			callback: async (e) => self.api.cmdSetInputFreeze(String(e.options.input), true),
		},
		input_freeze_off: {
			name: 'Input Freeze – Off',
			options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'hdmi_1', choices: PHYSICAL_INPUT_CHOICES }],
			callback: async (e) => self.api.cmdSetInputFreeze(String(e.options.input), false),
		},
		input_freeze_toggle: {
			name: 'Input Freeze – Toggle',
			options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'hdmi_1', choices: PHYSICAL_INPUT_CHOICES }],
			callback: async (e) => self.api.cmdSetInputFreezeToggle(String(e.options.input)),
		},

		test_pattern: {
			name: 'Test Pattern All Outputs (toggle)',
			description: 'Pressing again while the same pattern is active turns it off',
			options: [
				{
					id: 'pattern',
					type: 'dropdown',
					label: 'Pattern',
					default: 'bars75',
					choices: TEST_PATTERNS.map((p) => ({ id: p.id, label: p.label })),
				},
			],
			callback: async (e) => self.api.cmdTestPattern(String(e.options.pattern)),
		},
		test_pattern_off: { name: 'Test Pattern Off', options: [], callback: async () => self.api.cmdTestPatternOff() },

		stream_record_start: {
			name: 'Stream & Record - Start',
			description: STREAM_RECORD_WARNING,
			options: [],
			callback: async () => self.api.cmdStreamRecordStart(),
		},
		stream_record_stop: {
			name: 'Stream & Record - Stop',
			description: STREAM_RECORD_WARNING,
			options: [],
			callback: async () => self.api.cmdStreamRecordStop(),
		},

		capture_image: {
			name: 'Capture Image to Still',
			description: 'Captures the selected input into a still memory slot. Takes 10 seconds and overwrites the slot.',
			options: [
				{ id: 'slot', type: 'number', label: 'Still slot', default: 1, min: 1, max: 32 },
				{
					id: 'source',
					type: 'dropdown',
					label: 'Source',
					default: 'hdmi_1',
					choices: CAPTURE_SOURCE_CHOICES,
				},
			],
			callback: async (e) => await self.api.cmdCaptureImage(Number(e.options.slot), String(e.options.source)),
		},

		sync_now: { name: 'Sync state now', options: [], callback: async () => self.api.requestCoreState() },

		// Always defined, never conditionally registered. Registering this only when
		// showAdvanced was on meant turning the checkbox back off removed the definition
		// while existing buttons still referenced it, leaving them in an unknown-action
		// state. The checkbox now gates execution instead, so the safety catch remains and
		// a button that was already built keeps its identity either way.
		raw_command: {
			name: 'Send raw LAN command',
			description:
				'Expert use only. Requires "Allow advanced actions" in the connection config. Incorrect commands can overwrite mixer state. Example: DTH:001500,29; sets Program to Input 1.',
			options: [{ id: 'cmd', type: 'textinput', label: 'Command string', default: '' }],
			callback: async (e) => {
				if (!self.config.showAdvanced) {
					self.log('warn', 'Raw LAN command ignored - enable "Allow advanced actions" in the connection config')
					return
				}
				const cmd = String(e.options.cmd ?? '').trim()
				if (cmd) self.api.cmdRaw(cmd)
			},
		},
	}

	self.setActionDefinitions(actions)
}
