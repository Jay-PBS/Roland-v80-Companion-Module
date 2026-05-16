// src/main.ts — Roland V-80HD v0.3.1
import { InstanceBase, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { V80Api, type AuxId, type LayerId } from './api.js'

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	public config!: ModuleConfig
	public api!: V80Api

	public programSource = 0x29;  public programInput = 1
	public previewSource  = 0x29;  public previewInput  = 1
	public aux1Source     = 0x29;  public aux1Input     = 1
	public aux2Source     = 0x29;  public aux2Input     = 1
	public transitionType: 'mix' | 'wipe' = 'mix'
	public mixTime       = 10
	public wipeType      = 0
	public wipeDirection = 0
	public pinp1Source = 0x29;  public pinp2Source = 0x29
	public dskSource   = 0x29
	public pinp1Pgm = false;  public pinp1Pvw = false
	public pinp2Pgm = false;  public pinp2Pvw = false
	public dskPgm   = false;  public dskPvw   = false
	public aux1Pinp1Layer = 0;  public aux1Pinp2Layer = 0
	public aux2Pinp1Layer = 0;  public aux2Pinp2Layer = 0
	public split1Active = false;  public split2Active = false
	public auxLinkedPgm = 0
	public audioInputMute: Record<number, boolean> = {}
	public mainBusMute  = false;  public aux1BusMute = false;  public aux2BusMute = false
	public ftbActive    = false;  public freezeActive = false
	public testPattern  = 0
	public inputFreezeEnabled: Record<number, boolean> = {}

	constructor(internal: unknown) { super(internal) }

	async init(config: ModuleConfig): Promise<void> {
		this.config = config; this.setupModule()
		this.api = new V80Api(this); this.api.initTcp()
	}
	async destroy(): Promise<void> { this.api?.destroyTcp() }
	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config; this.setupModule()
		this.api?.destroyTcp(); this.api = new V80Api(this); this.api.initTcp()
	}
	getConfigFields(): SomeCompanionConfigField[] { return GetConfigFields() }

	private setupModule(): void {
		this.updateActions(); this.updateFeedbacks(); this.updatePresets()
		this.updateVariableDefinitions(); this.updateAllVariables()
	}
	updateActions():             void { UpdateActions(this) }
	updateFeedbacks():           void { UpdateFeedbacks(this) }
	updatePresets():             void { UpdatePresets(this) }
	updateVariableDefinitions(): void { UpdateVariableDefinitions(this) }
	public changedState(): void { this.updateAllVariables(); this.checkFeedbacks() }

	public updateAllVariables(): void {
		const wipeTypes = ['Horizontal','Vertical','Upper Left','Upper Right','Lower Left','Lower Right','H-Center','V-Center']
		const wipeDirs  = ['Normal','Reverse','Round Trip']
		const auxLinks  = ['Off','Auto Link','Manual Link']
		const tpName    = ['Off','Bars 75%','Bars 100%','Ramp','Step','Hatch','Diamond','Circle','Bars 75%-SP','Bars 100%-SP','Ramp-SP','Step-SP','Hatch-SP'][this.testPattern] ?? 'Off'
		this.setVariableValues({
			program_input:   `${this.programInput}`,
			preview_input:   `${this.previewInput}`,
			program_source:  this.programSource.toString(16).toUpperCase().padStart(2,'0'),
			preview_source:  this.previewSource.toString(16).toUpperCase().padStart(2,'0'),
			aux1_input:      `${this.aux1Input}`,
			aux2_input:      `${this.aux2Input}`,
			aux1_source:     this.aux1Source.toString(16).toUpperCase().padStart(2,'0'),
			aux2_source:     this.aux2Source.toString(16).toUpperCase().padStart(2,'0'),
			transition_type: this.transitionType.toUpperCase(),
			mix_time:        `${this.mixTime * 100}ms`,
			wipe_type:       wipeTypes[this.wipeType]     ?? `${this.wipeType}`,
			wipe_direction:  wipeDirs[this.wipeDirection]  ?? `${this.wipeDirection}`,
			pinp1_pgm: this.pinp1Pgm ? 'ON' : 'OFF',  pinp1_pvw: this.pinp1Pvw ? 'ON' : 'OFF',
			pinp2_pgm: this.pinp2Pgm ? 'ON' : 'OFF',  pinp2_pvw: this.pinp2Pvw ? 'ON' : 'OFF',
			dsk_pgm:   this.dskPgm   ? 'ON' : 'OFF',  dsk_pvw:   this.dskPvw   ? 'ON' : 'OFF',
			split1:    this.split1Active ? 'ON' : 'OFF',
			split2:    this.split2Active ? 'ON' : 'OFF',
			aux_linked_pgm: auxLinks[this.auxLinkedPgm] ?? 'Off',
			main_bus_mute:  this.mainBusMute  ? 'ON' : 'OFF',
			aux1_bus_mute:  this.aux1BusMute  ? 'ON' : 'OFF',
			aux2_bus_mute:  this.aux2BusMute  ? 'ON' : 'OFF',
			ftb:     this.ftbActive    ? 'ON' : 'OFF',
			freeze:  this.freezeActive ? 'ON' : 'OFF',
			test_pattern: tpName,
		})
	}

	public requestCoreState(): void { this.api?.requestCoreState() }
	public cmdCut():  void { this.api?.cmdCut() }
	public cmdAuto(): void { this.api?.cmdAuto() }
	public cmdFadeToBlack(): void { this.api?.cmdFadeToBlack() }
	public cmdSetTransitionType(t: 'mix'|'wipe'): void { this.api?.cmdSetTransitionType(t) }
	public cmdSetMixTime(tenths: number): void { this.api?.cmdSetMixTime(tenths) }
	public cmdSetWipeType(type: number): void { this.api?.cmdSetWipeType(type) }
	public cmdSetWipeDirection(dir: number): void { this.api?.cmdSetWipeDirection(dir) }
	public cmdSetProgramSource(sourceId: string): void { this.api?.cmdSetProgramSource(sourceId) }
	public cmdSetPreviewSource(sourceId: string): void { this.api?.cmdSetPreviewSource(sourceId) }
	public cmdSetInputAssignSource(slot: number, sourceId: string): void { this.api?.cmdSetInputAssignSource(slot, sourceId) }
	public cmdSetAuxSource(aux: AuxId, sourceId: string): void { this.api?.cmdSetAuxSource(aux, sourceId) }
	public cmdSetAuxLinkedPgm(mode: 0|1|2): void { this.api?.cmdSetAuxLinkedPgm(mode) }
	public cmdSetAuxLayerPinp(aux: AuxId, layer: LayerId, mode: 0|1|2): void { this.api?.cmdSetAuxLayerPinp(aux, layer, mode) }
	public cmdToggleAuxLayerPinp(aux: AuxId, layer: LayerId): void { this.api?.cmdToggleAuxLayerPinp(aux, layer) }
	public cmdToggleAuxLayerPinpAlwaysOn(aux: AuxId, layer: LayerId): void { this.api?.cmdToggleAuxLayerPinpAlwaysOn(aux, layer) }
	public cmdSplit1(on: boolean): void { this.api?.cmdSplit1(on) }
	public cmdSplit2(on: boolean): void { this.api?.cmdSplit2(on) }
	public cmdSplit1Toggle(): void { this.api?.cmdSplit1Toggle() }
	public cmdSplit2Toggle(): void { this.api?.cmdSplit2Toggle() }
	public cmdPinpSetSource(layer: LayerId, sourceId: string): void { this.api?.cmdPinpSetSource(layer, sourceId) }
	public cmdPinpPgm(layer: LayerId, on: boolean): void { this.api?.cmdPinpPgm(layer, on) }
	public cmdPinpPvw(layer: LayerId, on: boolean): void { this.api?.cmdPinpPvw(layer, on) }
	public cmdPinpPgmToggle(layer: LayerId): void { this.api?.cmdPinpPgmToggle(layer) }
	public cmdPinpPvwToggle(layer: LayerId): void { this.api?.cmdPinpPvwToggle(layer) }
	public cmdPinpPositionH(layer: LayerId, pct: number): void { this.api?.cmdPinpPositionH(layer, pct) }
	public cmdPinpPositionV(layer: LayerId, pct: number): void { this.api?.cmdPinpPositionV(layer, pct) }
	public cmdPinpSize(layer: LayerId, pct: number): void { this.api?.cmdPinpSize(layer, pct) }
	public cmdPinpCroppingH(layer: LayerId, pct: number): void { this.api?.cmdPinpCroppingH(layer, pct) }
	public cmdPinpCroppingV(layer: LayerId, pct: number): void { this.api?.cmdPinpCroppingV(layer, pct) }
	public cmdPinpViewPositionH(layer: LayerId, pct: number): void { this.api?.cmdPinpViewPositionH(layer, pct) }
	public cmdPinpViewPositionV(layer: LayerId, pct: number): void { this.api?.cmdPinpViewPositionV(layer, pct) }
	public cmdPinpViewZoom(layer: LayerId, pct: number): void { this.api?.cmdPinpViewZoom(layer, pct) }
	public cmdDskSetSource(sourceId: string): void { this.api?.cmdDskSetSource(sourceId) }
	public cmdDskPgm(on: boolean): void { this.api?.cmdDskPgm(on) }
	public cmdDskPvw(on: boolean): void { this.api?.cmdDskPvw(on) }
	public cmdDskPgmToggle(): void { this.api?.cmdDskPgmToggle() }
	public cmdDskPvwToggle(): void { this.api?.cmdDskPvwToggle() }
	public cmdAudioInputMute(ch: string, on: boolean): void { this.api?.cmdAudioInputMute(ch, on) }
	public cmdAudioInputMuteToggle(ch: string): void { this.api?.cmdAudioInputMuteToggle(ch) }
	public cmdMainBusMute(on: boolean): void { this.api?.cmdMainBusMute(on) }
	public cmdMainBusMuteToggle(): void { this.api?.cmdMainBusMuteToggle() }
	public cmdAuxBusMute(aux: AuxId, on: boolean): void { this.api?.cmdAuxBusMute(aux, on) }
	public cmdAuxBusMuteToggle(aux: AuxId): void { this.api?.cmdAuxBusMuteToggle(aux) }
	public cmdFreezeOn():     void { this.api?.cmdFreezeOn() }
	public cmdFreezeOff():    void { this.api?.cmdFreezeOff() }
	public cmdFreezeToggle(): void { this.api?.cmdFreezeToggle() }
	public cmdSetInputFreeze(key: string, on: boolean): void { this.api?.cmdSetInputFreeze(key, on) }
	public cmdSetInputFreezeToggle(key: string): void { this.api?.cmdSetInputFreezeToggle(key) }
	public cmdTestPattern(id: string): void { this.api?.cmdTestPattern(id) }
	public cmdTestPatternOff(): void { this.api?.cmdTestPatternOff() }
	public cmdRaw(cmd: string): void { this.api?.cmdRaw(cmd) }
}

runEntrypoint(ModuleInstance, UpgradeScripts)
