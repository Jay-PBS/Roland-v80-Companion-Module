// src/main.ts — Roland V-80HD
import { InstanceBase, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig, type ModuleSecrets } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import {
	V80Api,
	AUDIO_CH,
	INPUT_FREEZE_IDX,
	TALLY_IDX,
	WIPE_TYPE_NAMES,
	WIPE_DIRECTION_NAMES,
	AUX_LINK_MODE_NAMES,
} from './api.js'

export class ModuleInstance extends InstanceBase<ModuleConfig, ModuleSecrets> {
	public config!: ModuleConfig
	public secrets!: ModuleSecrets
	public api!: V80Api

	public programSource = 0x29
	public programInput = 1
	public previewSource = 0x29
	public previewInput = 1
	public aux1Source = 0x29
	public aux1Input = 1
	public aux2Source = 0x29
	public aux2Input = 1
	public transitionType: 'mix' | 'wipe' = 'mix'
	public mixTime = 10
	public wipeType = 0
	public wipeDirection = 0
	public pinp1Source = 0x29
	public pinp2Source = 0x29
	public dskSource = 0x29
	public pinp1Pgm = false
	public pinp1Pvw = false
	public pinp2Pgm = false
	public pinp2Pvw = false
	public dskPgm = false
	public dskPvw = false
	public aux1Pinp1Layer = 0
	public aux1Pinp2Layer = 0
	public aux2Pinp1Layer = 0
	public aux2Pinp2Layer = 0
	public split1Active = false
	public split2Active = false
	public auxLinkedPgm = 0
	public aux1LinkedPgm = false
	public aux2LinkedPgm = false
	public audioInputMute: Record<number, boolean> = {}
	public mainBusMute = false
	public aux1BusMute = false
	public aux2BusMute = false
	// True only while a fade is running. The engaged state is not yet known - see working_doc.
	public ftbFading = false
	public freezeActive = false
	// Stream & Record. streamRecordState is the raw 030800 byte the device pushes:
	// 02 stopped, 03 stopping, 04 starting, 05 running. Defaults to stopped.
	public streamRecordState = 0x02
	public streamRecordActive = false
	public testPattern = 0
	public inputFreezeEnabled: Record<number, boolean> = {}
	// Keyed by TALLY_IDX byte. 0 = Off, 1 = PGM, 2 = PST.
	public tallyState: Record<number, number> = {}

	constructor(internal: unknown) {
		super(internal)
	}

	// The api is built before the definitions are registered, because the action callbacks
	// reach through to it directly and `api` is declared with a definite assignment.
	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets ?? { password: '' }
		this.api = new V80Api(this)
		this.setupModule()
		this.api.initTcp()
	}
	async destroy(): Promise<void> {
		this.api.destroyTcp()
	}
	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets ?? { password: '' }
		this.api.destroyTcp()
		this.api = new V80Api(this)
		this.setupModule()
		this.api.initTcp()
	}
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	private setupModule(): void {
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()
		this.updateAllVariables()
	}
	updateActions(): void {
		UpdateActions(this)
	}
	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}
	updatePresets(): void {
		UpdatePresets(this)
	}
	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}
	public changedState(): void {
		this.updateAllVariables()
		this.checkFeedbacks()
	}

	public updateAllVariables(): void {
		const tpName =
			[
				'Off',
				'Bars 75%',
				'Bars 100%',
				'Ramp',
				'Step',
				'Hatch',
				'Diamond',
				'Circle',
				'Bars 75%-SP',
				'Bars 100%-SP',
				'Ramp-SP',
				'Step-SP',
				'Hatch-SP',
			][this.testPattern] ?? 'Off'
		this.setVariableValues({
			program_input: `${this.programInput}`,
			preview_input: `${this.previewInput}`,
			program_source: this.programSource.toString(16).toUpperCase().padStart(2, '0'),
			preview_source: this.previewSource.toString(16).toUpperCase().padStart(2, '0'),
			aux1_input: `${this.aux1Input}`,
			aux2_input: `${this.aux2Input}`,
			aux1_source: this.aux1Source.toString(16).toUpperCase().padStart(2, '0'),
			aux2_source: this.aux2Source.toString(16).toUpperCase().padStart(2, '0'),
			transition_type: this.transitionType.toUpperCase(),
			mix_time: `${this.mixTime * 100}ms`,
			wipe_type: WIPE_TYPE_NAMES[this.wipeType] ?? `${this.wipeType}`,
			wipe_direction: WIPE_DIRECTION_NAMES[this.wipeDirection] ?? `${this.wipeDirection}`,
			pinp1_pgm: this.pinp1Pgm ? 'ON' : 'OFF',
			pinp1_pvw: this.pinp1Pvw ? 'ON' : 'OFF',
			pinp2_pgm: this.pinp2Pgm ? 'ON' : 'OFF',
			pinp2_pvw: this.pinp2Pvw ? 'ON' : 'OFF',
			dsk_pgm: this.dskPgm ? 'ON' : 'OFF',
			dsk_pvw: this.dskPvw ? 'ON' : 'OFF',
			split1: this.split1Active ? 'ON' : 'OFF',
			split2: this.split2Active ? 'ON' : 'OFF',
			aux_linked_pgm: AUX_LINK_MODE_NAMES[this.auxLinkedPgm] ?? 'Off',
			aux1_linked_pgm: this.aux1LinkedPgm ? 'ON' : 'OFF',
			aux2_linked_pgm: this.aux2LinkedPgm ? 'ON' : 'OFF',
			main_bus_mute: this.mainBusMute ? 'ON' : 'OFF',
			aux1_bus_mute: this.aux1BusMute ? 'ON' : 'OFF',
			aux2_bus_mute: this.aux2BusMute ? 'ON' : 'OFF',
			ftb: this.ftbFading ? 'FADING' : 'IDLE',
			freeze: this.freezeActive ? 'ON' : 'OFF',
			test_pattern: tpName,
			stream_record: this.streamRecordActive ? 'ON' : 'OFF',
			stream_record_state:
				{ 0x02: 'Stopped', 0x03: 'Stopping', 0x04: 'Starting', 0x05: 'Running' }[this.streamRecordState] ??
				`Unknown (${this.streamRecordState})`,
			...Object.fromEntries(
				Object.entries(AUDIO_CH).map(([k, ch]) => [`mute_${k}`, this.audioInputMute[ch] ? 'ON' : 'OFF']),
			),
			...Object.fromEntries(
				Object.entries(INPUT_FREEZE_IDX).map(([k, idx]) => [
					`freeze_${k}`,
					this.inputFreezeEnabled[idx] ? 'ON' : 'OFF',
				]),
			),
			...Object.fromEntries(
				Object.entries(TALLY_IDX).map(([k, idx]) => [
					`tally_${k}`,
					['OFF', 'PGM', 'PST'][this.tallyState[idx] ?? 0] ?? 'OFF',
				]),
			),
		})
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
