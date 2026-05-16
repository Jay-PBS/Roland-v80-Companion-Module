// src/api.ts — Roland V-80HD v0.3.2
import { InstanceStatus, TCPHelper } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { POLL_INTERVAL_MS } from './config.js'

export const SRC_HDMI1   = 0x00
export const SRC_HDMI4   = 0x03
export const SRC_SDI1    = 0x04
export const SRC_SDI4    = 0x07
export const SRC_STILL1  = 0x08
export const SRC_STILL32 = 0x27
export const SRC_VPLAYER = 0x28
export const SRC_INPUT1  = 0x29
export const SRC_INPUT16 = 0x38

export const AUDIO_CH: Record<string, number> = {
	'audio_in_1': 0x01, 'audio_in_2': 0x02, 'audio_in_34': 0x03,
	'usb_in': 0x04, 'bluetooth_in': 0x05, 'audio_player': 0x06,
	'hdmi_in_1': 0x07, 'hdmi_in_2': 0x08, 'hdmi_in_3': 0x09, 'hdmi_in_4': 0x0A,
	'sdi_in_1': 0x0B, 'sdi_in_2': 0x0C, 'sdi_in_3': 0x0D, 'sdi_in_4': 0x0E,
	'video_player': 0x0F,
}

export const TEST_PATTERNS: { id: string; label: string; value: number }[] = [
	{ id: 'bars75',    label: 'Color Bars 75%',  value: 0x01 },
	{ id: 'bars100',   label: 'Color Bars 100%', value: 0x02 },
	{ id: 'ramp',      label: 'Ramp',            value: 0x03 },
	{ id: 'step',      label: 'Step',            value: 0x04 },
	{ id: 'hatch',     label: 'Hatch',           value: 0x05 },
	{ id: 'diamond',   label: 'Diamond',         value: 0x06 },
	{ id: 'circle',    label: 'Circle',          value: 0x07 },
	{ id: 'bars75sp',  label: 'Bars 75%-SP',     value: 0x08 },
	{ id: 'bars100sp', label: 'Bars 100%-SP',    value: 0x09 },
	{ id: 'rampsp',    label: 'Ramp-SP',         value: 0x0A },
	{ id: 'stepsp',    label: 'Step-SP',         value: 0x0B },
	{ id: 'hatchsp',   label: 'Hatch-SP',        value: 0x0C },
]

export const SOURCE_CHOICES = [
	{ id: 'input_1', label: 'Input 1' }, { id: 'input_2', label: 'Input 2' },
	{ id: 'input_3', label: 'Input 3' }, { id: 'input_4', label: 'Input 4' },
	{ id: 'input_5', label: 'Input 5' }, { id: 'input_6', label: 'Input 6' },
	{ id: 'input_7', label: 'Input 7' }, { id: 'input_8', label: 'Input 8' },
	{ id: 'hdmi_1',  label: 'HDMI In 1' }, { id: 'hdmi_2', label: 'HDMI In 2' },
	{ id: 'hdmi_3',  label: 'HDMI In 3' }, { id: 'hdmi_4', label: 'HDMI In 4' },
	{ id: 'sdi_1',   label: 'SDI In 1'  }, { id: 'sdi_2',  label: 'SDI In 2'  },
	{ id: 'sdi_3',   label: 'SDI In 3'  }, { id: 'sdi_4',  label: 'SDI In 4'  },
	{ id: 'still_1',  label: 'Still 1'  }, { id: 'still_2',  label: 'Still 2'  },
	{ id: 'still_3',  label: 'Still 3'  }, { id: 'still_4',  label: 'Still 4'  },
	{ id: 'still_5',  label: 'Still 5'  }, { id: 'still_6',  label: 'Still 6'  },
	{ id: 'still_7',  label: 'Still 7'  }, { id: 'still_8',  label: 'Still 8'  },
	{ id: 'still_9',  label: 'Still 9'  }, { id: 'still_10', label: 'Still 10' },
	{ id: 'still_11', label: 'Still 11' }, { id: 'still_12', label: 'Still 12' },
	{ id: 'still_13', label: 'Still 13' }, { id: 'still_14', label: 'Still 14' },
	{ id: 'still_15', label: 'Still 15' }, { id: 'still_16', label: 'Still 16' },
	{ id: 'still_17', label: 'Still 17' }, { id: 'still_18', label: 'Still 18' },
	{ id: 'still_19', label: 'Still 19' }, { id: 'still_20', label: 'Still 20' },
	{ id: 'still_21', label: 'Still 21' }, { id: 'still_22', label: 'Still 22' },
	{ id: 'still_23', label: 'Still 23' }, { id: 'still_24', label: 'Still 24' },
	{ id: 'still_25', label: 'Still 25' }, { id: 'still_26', label: 'Still 26' },
	{ id: 'still_27', label: 'Still 27' }, { id: 'still_28', label: 'Still 28' },
	{ id: 'still_29', label: 'Still 29' }, { id: 'still_30', label: 'Still 30' },
	{ id: 'still_31', label: 'Still 31' }, { id: 'still_32', label: 'Still 32' },
	{ id: 'video_player', label: 'Video Player / SRT In' },
]

export const INPUT_ASSIGN_SOURCE_CHOICES = [
	{ id: 'hdmi_1',  label: 'HDMI In 1' }, { id: 'hdmi_2', label: 'HDMI In 2' },
	{ id: 'hdmi_3',  label: 'HDMI In 3' }, { id: 'hdmi_4', label: 'HDMI In 4' },
	{ id: 'sdi_1',   label: 'SDI In 1'  }, { id: 'sdi_2',  label: 'SDI In 2'  },
	{ id: 'sdi_3',   label: 'SDI In 3'  }, { id: 'sdi_4',  label: 'SDI In 4'  },
	{ id: 'still_1',  label: 'Still 1'  }, { id: 'still_2',  label: 'Still 2'  },
	{ id: 'still_3',  label: 'Still 3'  }, { id: 'still_4',  label: 'Still 4'  },
	{ id: 'still_5',  label: 'Still 5'  }, { id: 'still_6',  label: 'Still 6'  },
	{ id: 'still_7',  label: 'Still 7'  }, { id: 'still_8',  label: 'Still 8'  },
	{ id: 'still_9',  label: 'Still 9'  }, { id: 'still_10', label: 'Still 10' },
	{ id: 'still_11', label: 'Still 11' }, { id: 'still_12', label: 'Still 12' },
	{ id: 'still_13', label: 'Still 13' }, { id: 'still_14', label: 'Still 14' },
	{ id: 'still_15', label: 'Still 15' }, { id: 'still_16', label: 'Still 16' },
	{ id: 'still_17', label: 'Still 17' }, { id: 'still_18', label: 'Still 18' },
	{ id: 'still_19', label: 'Still 19' }, { id: 'still_20', label: 'Still 20' },
	{ id: 'still_21', label: 'Still 21' }, { id: 'still_22', label: 'Still 22' },
	{ id: 'still_23', label: 'Still 23' }, { id: 'still_24', label: 'Still 24' },
	{ id: 'still_25', label: 'Still 25' }, { id: 'still_26', label: 'Still 26' },
	{ id: 'still_27', label: 'Still 27' }, { id: 'still_28', label: 'Still 28' },
	{ id: 'still_29', label: 'Still 29' }, { id: 'still_30', label: 'Still 30' },
	{ id: 'still_31', label: 'Still 31' }, { id: 'still_32', label: 'Still 32' },
	{ id: 'video_player', label: 'Video Player / SRT In' },
]

export type AuxId   = 1 | 2
export type LayerId = 1 | 2

export function sourceIdToByte(id: string): number | undefined {
	if (id.startsWith('input_')) { const n = parseInt(id.slice(6)); if (n >= 1 && n <= 8)  return SRC_INPUT1  + n - 1 }
	if (id.startsWith('hdmi_'))  { const n = parseInt(id.slice(5)); if (n >= 1 && n <= 4)  return n - 1 }
	if (id.startsWith('sdi_'))   { const n = parseInt(id.slice(4)); if (n >= 1 && n <= 4)  return SRC_SDI1   + n - 1 }
	if (id.startsWith('still_')) { const n = parseInt(id.slice(6)); if (n >= 1 && n <= 32) return SRC_STILL1 + n - 1 }
	if (id === 'video_player') return SRC_VPLAYER
	return undefined
}

export class V80Api {
	private readonly self: ModuleInstance
	private tcp?: TCPHelper
	private rxBuffer = ''
	private pollingTimer?: NodeJS.Timeout
	private debounceTimer?: NodeJS.Timeout
	private isConnected = false

	constructor(self: ModuleInstance) { this.self = self }

	public initTcp(): void {
		if (!this.self.config.host || !this.self.config.port) {
			this.self.updateStatus(InstanceStatus.BadConfig, 'Missing host/port'); return
		}
		this.self.updateStatus(InstanceStatus.Connecting)
		this.isConnected = false; this.rxBuffer = ''
		this.tcp = new TCPHelper(this.self.config.host, this.self.config.port, { reconnect: true })
		this.tcp.on('status_change', (status, message) => {
			this.self.updateStatus(status, message)
			if (status !== InstanceStatus.Ok) {
				this.isConnected = false
				this.stopPolling()
			}
		})
		this.tcp.on('error', (err) => {
			this.self.log('error', `TCP error: ${err.message}`)
			this.isConnected = false
			this.stopPolling()
		})
		this.tcp.on('connect', () => {
			this.self.log('info', `Connected to ${this.self.config.host}:${this.self.config.port}`)
			this.isConnected = true; this.rxBuffer = ''
			const pw = (this.self.config.password ?? '').trim()
			if (pw) {
				this.tcp?.send(pw + '\r\n')
				this.self.updateStatus(InstanceStatus.Connecting, 'Authenticating')
			} else {
				this.onAuthenticated()
			}
		})
		this.tcp.on('data', (data: Buffer) => this.handleIncoming(data))
	}

	public destroyTcp(): void {
		this.stopPolling()
		this.stopDebounce()
		try { this.tcp?.destroy() } catch { /* ignore */ }
		this.tcp = undefined; this.rxBuffer = ''; this.isConnected = false
	}

	private handleIncoming(data: Buffer): void {
		if (this.self.config.debug) {
			this.self.log('debug', `RX RAW [${data.length}b]: ${[...data].map(b => b.toString(16).padStart(2,'0')).join(' ')}`)
		}
		this.rxBuffer += data.toString('binary')

		if (/enter password/i.test(this.rxBuffer)) {
			this.rxBuffer = ''
			this.tcp?.send((this.self.config.password ?? '') + '\r\n')
			return
		}

		while (this.rxBuffer.length > 0) {
			const semi = this.rxBuffer.indexOf(';')
			const nl   = this.rxBuffer.indexOf('\n')
			if (semi < 0 && nl < 0) break
			const useSemi = semi >= 0 && (nl < 0 || semi < nl)
			const cutPos  = useSemi ? semi : nl
			const part    = this.rxBuffer.slice(0, cutPos + 1)
				.replace(/^[\x02\x11\x13\r\n\s]+/, '')
				.replace(/[\r\n;]+$/, '')
				.trim()
			this.rxBuffer = this.rxBuffer.slice(cutPos + 1)
			if (!part) continue
			if (this.self.config.debug) this.self.log('debug', `RX ${useSemi ? 'FRAME' : 'LINE'}: ${part}`)
			if (useSemi) this.parseFrame(part)
			else this.handleTextLine(part)
		}
		if (this.rxBuffer.length > 8192) this.rxBuffer = this.rxBuffer.slice(-4096)
	}

	private handleTextLine(line: string): void {
		if (!line) return
		if (/enter password/i.test(line))        { this.tcp?.send((this.self.config.password ?? '') + '\r\n'); return }
		if (/^Authentication error/i.test(line)) {
			this.self.log('error', 'Authentication failed')
			this.isConnected = false; this.stopPolling()
			this.self.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed'); return
		}
		if (/^Wait a moment/i.test(line)) return
		if (/^Welcome to /i.test(line))   { this.onAuthenticated(); return }
		if (/^VER:/i.test(line))          { this.self.log('info', `Device: ${line}`); this.onAuthenticated(); return }
	}

	private onAuthenticated(): void {
		this.self.log('info', 'Connection ready – requesting initial state')
		this.self.updateStatus(InstanceStatus.Ok)
		this.requestCoreState(); this.startPolling()
	}

	private parseFrame(frame: string): void {
		if (!frame) return
		if (/^ACK$/i.test(frame)) return
		if (/^ERR:/i.test(frame)) { this.self.log('warn', `Device error: ${frame}`); return }
		const m = /^DTH:([0-9A-Fa-f]{6}),([0-9A-Fa-f]*)$/i.exec(frame)
		if (!m) { if (this.self.config.debug) this.self.log('debug', `UNMATCHED: ${frame}`); return }
		this.parseDth(m[1].toUpperCase(), m[2].toUpperCase())
	}

	private parseDth(addr: string, hex: string): void {
		if (!hex || hex.length < 2) return
		const val = parseInt(hex.slice(0, 2), 16)
		if (this.self.config.debug) this.self.log('debug', `DTH ${addr}=${val}`)
		switch (addr) {
			case '001500': this.self.programSource = val; this.self.programInput = this.sourceToInput(val); break
			case '001501': this.self.previewSource  = val; this.self.previewInput  = this.sourceToInput(val); break
			case '000018': this.self.aux1Source = val; this.self.aux1Input = this.sourceToInput(val); break
			case '000019': this.self.aux2Source = val; this.self.aux2Input = this.sourceToInput(val); break
			case '000F00': this.self.transitionType = val === 0 ? 'mix' : 'wipe'; break
			case '000F02': this.self.mixTime = val; break
			case '000F03': this.self.wipeType = val; break
			case '000F05': this.self.wipeDirection = val; break
			case '001203': this.self.pinp1Source = val; break
			case '001303': this.self.pinp2Source = val; break
			case '001201': this.self.pinp1Pgm = val === 1; break
			case '001202': this.self.pinp1Pvw = val === 1; break
			case '001301': this.self.pinp2Pgm = val === 1; break
			case '001302': this.self.pinp2Pvw = val === 1; break
			case '001404': this.self.dskSource = val; break
			case '001401': this.self.dskPgm = val === 1; break
			case '001402': this.self.dskPvw = val === 1; break
			case '001000': this.self.split1Active = val === 1; break
			case '001100': this.self.split2Active = val === 1; break
			case '020114': this.self.auxLinkedPgm = val; break
			case '012103': this.self.mainBusMute = val === 1; break
			case '012203': this.self.aux1BusMute = val === 1; break
			case '012403': this.self.aux2BusMute = val === 1; break
			case '020900': this.self.freezeActive = val === 1; break
			case '030207': this.self.ftbActive = val === 1; break
			case '02015E': this.self.testPattern = val; break
			case '000020': this.self.aux1Pinp1Layer = val; break
			case '000021': this.self.aux1Pinp2Layer = val; break
			case '000023': this.self.aux2Pinp1Layer = val; break
			case '000024': this.self.aux2Pinp2Layer = val; break
		}
		if (addr.startsWith('01') && addr.endsWith('06')) {
			this.self.audioInputMute[parseInt(addr.slice(2,4),16)] = val === 1
		}
		if (addr.startsWith('0209') && addr.length === 6) {
			const idx = parseInt(addr.slice(4,6),16)
			if (idx >= 0x02 && idx <= 0x09) this.self.inputFreezeEnabled[idx] = val === 1
		}
		this.scheduleDebounce()
	}

	private scheduleDebounce(): void {
		if (this.debounceTimer) { clearTimeout(this.debounceTimer); this.debounceTimer = undefined }
		this.debounceTimer = setTimeout(() => { this.debounceTimer = undefined; this.self.changedState() }, 40)
	}
	private stopDebounce(): void {
		if (this.debounceTimer) { clearTimeout(this.debounceTimer); this.debounceTimer = undefined }
	}

	public requestCoreState(): void {
		if (!this.isConnected) return
		// Core state addresses — all polled every 500ms
		for (const a of [
			'001500', '001501',         // Program, Preview source
			'000018', '000019',         // AUX 1, AUX 2 source
			'000F00', '000F02',         // Transition type, mix time
			'000F03', '000F05',         // Wipe type, wipe direction
			'001203', '001303',         // PinP 1, PinP 2 source
			'001201', '001202',         // PinP 1 PGM, PVW
			'001301', '001302',         // PinP 2 PGM, PVW
			'001404', '001401', '001402', // DSK source, PGM, PVW
			'001000', '001100',         // Split 1, Split 2
			'020114',                   // AUX Linked PGM
			'012103', '012203', '012403', // Main, AUX1, AUX2 bus mute
			'020900',                   // Global freeze
			'030207',                   // Fade To Black
			'02015E',                   // Test pattern
			'000020', '000021',         // AUX 1 PinP layer 1, 2
			'000023', '000024',         // AUX 2 PinP layer 1, 2
		]) this.sendCmd(this.rqh(a, '000001'))
		// Audio input mutes — all 15 channels
		for (let ch = 0x01; ch <= 0x0F; ch++) {
			this.sendCmd(this.rqh(`01${ch.toString(16).toUpperCase().padStart(2,'0')}06`, '000001'))
		}
		// Per-input freeze states — HDMI 1-4, SDI 1-4
		for (let i = 0x02; i <= 0x09; i++) {
			this.sendCmd(this.rqh(`0209${i.toString(16).toUpperCase().padStart(2,'0')}`, '000001'))
		}
	}

	private startPolling(): void {
		if (!this.self.config.polling || this.pollingTimer) return
		this.pollingTimer = setInterval(() => { if (this.isConnected) this.requestCoreState() }, POLL_INTERVAL_MS)
	}
	private stopPolling(): void { if (this.pollingTimer) { clearInterval(this.pollingTimer); this.pollingTimer = undefined } }

	private sendCmd(cmd: string): void {
		if (!this.tcp) { this.self.log('warn', 'Not connected'); return }
		if (this.self.config.debug) this.self.log('debug', `TX: ${cmd}`)
		this.tcp.send(cmd.endsWith('\r\n') ? cmd : cmd + '\r\n')
	}

	private dth(addr: string, v: string): string { return `DTH:${addr},${v};` }
	private rqh(addr: string, s: string): string  { return `RQH:${addr},${s};`  }
	private hb(n: number): string { return Math.max(0,Math.min(255,Math.round(n))).toString(16).toUpperCase().padStart(2,'0') }
	private encode2byte(value: number): string {
		const v = Math.max(0, Math.round(value))
		return Math.floor(v/128).toString(16).toUpperCase().padStart(2,'0') + (v%128).toString(16).toUpperCase().padStart(2,'0')
	}

	public sourceToInput(source: number): number {
		if (source >= SRC_INPUT1 && source <= SRC_INPUT16) return source - SRC_INPUT1 + 1
		if (source >= SRC_HDMI1  && source <= SRC_HDMI4)  return source + 1
		if (source >= SRC_SDI1   && source <= SRC_SDI4)   return source - SRC_SDI1 + 1
		return 1
	}

	public cmdCut():  void { this.sendCmd(this.dth('0B001B','01')); this.sendCmd(this.dth('0B001B','00')) }
	public cmdAuto(): void { this.sendCmd(this.dth('0B001C','01')); this.sendCmd(this.dth('0B001C','00')) }
	public cmdFadeToBlack(): void { this.sendCmd(this.dth('0B003C','01')); this.sendCmd(this.dth('0B003C','00')) }
	public cmdSetTransitionType(t: 'mix'|'wipe'): void { this.sendCmd(this.dth('000F00', t==='mix'?'00':'01')) }
	public cmdSetMixTime(tenths: number): void { this.sendCmd(this.dth('000F02', this.hb(Math.max(0,Math.min(0x28,Math.round(tenths)))))) }
	public cmdSetWipeType(type: number): void  { this.sendCmd(this.dth('000F03', this.hb(Math.max(0,Math.min(7,type))))) }
	public cmdSetWipeDirection(dir: number): void { this.sendCmd(this.dth('000F05', this.hb(Math.max(0,Math.min(2,dir))))) }

	public cmdSetProgramSource(sourceId: string): void {
		const b = sourceIdToByte(sourceId); if (b===undefined){this.self.log('warn',`Unknown source: ${sourceId}`);return}
		this.sendCmd(this.dth('001500', this.hb(b)))
	}
	public cmdSetPreviewSource(sourceId: string): void {
		const b = sourceIdToByte(sourceId); if (b===undefined){this.self.log('warn',`Unknown source: ${sourceId}`);return}
		this.sendCmd(this.dth('001501', this.hb(b)))
	}
	public cmdSetInputAssignSource(slot: number, sourceId: string): void {
		const b = sourceIdToByte(sourceId); if (b===undefined){this.self.log('warn',`Unknown source: ${sourceId}`);return}
		const s = (Math.max(1,Math.min(8,Math.round(slot)))-1).toString(16).toUpperCase().padStart(2,'0')
		this.sendCmd(this.dth(`0000${s}`, this.hb(Math.max(0,Math.min(0x38,b)))))
	}
	public cmdSetAuxSource(aux: AuxId, sourceId: string): void {
		const b = sourceIdToByte(sourceId); if (b===undefined){this.self.log('warn',`Unknown source: ${sourceId}`);return}
		this.sendCmd(this.dth(aux===1?'000018':'000019', this.hb(b)))
	}
	public cmdSetAuxLinkedPgm(mode: 0|1|2): void {
		this.sendCmd(this.dth('020114',this.hb(mode))); this.self.auxLinkedPgm=mode; this.self.changedState()
	}
	public cmdSetAuxLayerPinp(aux: AuxId, layer: LayerId, mode: 0|1|2): void {
		const addr = ({1:{1:'000020',2:'000021'},2:{1:'000023',2:'000024'}} as any)[aux][layer]
		if (!addr) return
		this.sendCmd(this.dth(addr, this.hb(mode)))
		if (aux===1&&layer===1) this.self.aux1Pinp1Layer=mode
		else if (aux===1&&layer===2) this.self.aux1Pinp2Layer=mode
		else if (aux===2&&layer===1) this.self.aux2Pinp1Layer=mode
		else if (aux===2&&layer===2) this.self.aux2Pinp2Layer=mode
		this.self.changedState()
	}
	public cmdToggleAuxLayerPinp(aux: AuxId, layer: LayerId): void {
		const cur = aux===1?(layer===1?this.self.aux1Pinp1Layer:this.self.aux1Pinp2Layer):(layer===1?this.self.aux2Pinp1Layer:this.self.aux2Pinp2Layer)
		this.cmdSetAuxLayerPinp(aux, layer, cur===0?1:0)
	}
	public cmdToggleAuxLayerPinpAlwaysOn(aux: AuxId, layer: LayerId): void {
		const cur = aux===1?(layer===1?this.self.aux1Pinp1Layer:this.self.aux1Pinp2Layer):(layer===1?this.self.aux2Pinp1Layer:this.self.aux2Pinp2Layer)
		this.cmdSetAuxLayerPinp(aux, layer, cur===0?2:0)
	}
	public cmdSplit1(on: boolean): void { this.sendCmd(this.dth('001000',on?'01':'00')); this.self.split1Active=on; this.self.changedState() }
	public cmdSplit2(on: boolean): void { this.sendCmd(this.dth('001100',on?'01':'00')); this.self.split2Active=on; this.self.changedState() }
	public cmdSplit1Toggle(): void { this.cmdSplit1(!this.self.split1Active) }
	public cmdSplit2Toggle(): void { this.cmdSplit2(!this.self.split2Active) }

	public cmdPinpSetSource(layer: LayerId, sourceId: string): void {
		const b = sourceIdToByte(sourceId); if (b===undefined){this.self.log('warn',`Unknown source: ${sourceId}`);return}
		this.sendCmd(this.dth(layer===1?'001203':'001303', this.hb(Math.max(0,Math.min(0x38,b)))))
	}
	public cmdPinpPgm(layer: LayerId, on: boolean): void {
		this.sendCmd(this.dth(layer===1?'001201':'001301', on?'01':'00'))
		if (layer===1) this.self.pinp1Pgm=on; else this.self.pinp2Pgm=on; this.self.changedState()
	}
	public cmdPinpPvw(layer: LayerId, on: boolean): void {
		this.sendCmd(this.dth(layer===1?'001202':'001302', on?'01':'00'))
		if (layer===1) this.self.pinp1Pvw=on; else this.self.pinp2Pvw=on; this.self.changedState()
	}
	public cmdPinpPgmToggle(layer: LayerId): void { this.cmdPinpPgm(layer, layer===1?!this.self.pinp1Pgm:!this.self.pinp2Pgm) }
	public cmdPinpPvwToggle(layer: LayerId): void { this.cmdPinpPvw(layer, layer===1?!this.self.pinp1Pvw:!this.self.pinp2Pvw) }

	private pinpAddr(layer: LayerId, offset: string): string { return `00${layer===1?'12':'13'}${offset}` }
	private encodePinpSigned(pct: number, pctMax: number, maxRaw: number): string {
		const c = Math.max(-maxRaw, Math.min(maxRaw, Math.round((pct/pctMax)*maxRaw)))
		return this.encode2byte(c>=0?c:(128*128)+c)
	}
	private encodePinp0to100(pct: number): string { return this.encode2byte(Math.round((Math.max(0,Math.min(100,pct))/100)*1000)) }

	public cmdPinpPositionH(layer: LayerId, pct: number): void { this.sendCmd(`DTH:${this.pinpAddr(layer,'05')},${this.encodePinpSigned(pct,100,1000)};`) }
	public cmdPinpPositionV(layer: LayerId, pct: number): void { this.sendCmd(`DTH:${this.pinpAddr(layer,'07')},${this.encodePinpSigned(pct,100,1000)};`) }
	public cmdPinpSize(layer: LayerId, pct: number): void      { this.sendCmd(`DTH:${this.pinpAddr(layer,'09')},${this.encodePinp0to100(pct)};`) }
	public cmdPinpCroppingH(layer: LayerId, pct: number): void { this.sendCmd(`DTH:${this.pinpAddr(layer,'0B')},${this.encodePinp0to100(pct)};`) }
	public cmdPinpCroppingV(layer: LayerId, pct: number): void { this.sendCmd(`DTH:${this.pinpAddr(layer,'0D')},${this.encodePinp0to100(pct)};`) }
	public cmdPinpViewPositionH(layer: LayerId, pct: number): void { this.sendCmd(`DTH:${this.pinpAddr(layer,'18')},${this.encodePinpSigned(pct,50,500)};`) }
	public cmdPinpViewPositionV(layer: LayerId, pct: number): void { this.sendCmd(`DTH:${this.pinpAddr(layer,'1A')},${this.encodePinpSigned(pct,50,500)};`) }
	public cmdPinpViewZoom(layer: LayerId, pct: number): void { this.sendCmd(`DTH:${this.pinpAddr(layer,'1C')},${this.encode2byte(Math.round(Math.max(100,Math.min(400,pct))))};`) }

	public cmdDskSetSource(sourceId: string): void {
		const b = sourceIdToByte(sourceId); if (b===undefined){this.self.log('warn',`Unknown source: ${sourceId}`);return}
		this.sendCmd(this.dth('001404', this.hb(Math.max(0,Math.min(0x38,b)))))
	}
	public cmdDskPgm(on: boolean): void { this.sendCmd(this.dth('001401',on?'01':'00')); this.self.dskPgm=on; this.self.changedState() }
	public cmdDskPvw(on: boolean): void { this.sendCmd(this.dth('001402',on?'01':'00')); this.self.dskPvw=on; this.self.changedState() }
	public cmdDskPgmToggle(): void { this.cmdDskPgm(!this.self.dskPgm) }
	public cmdDskPvwToggle(): void { this.cmdDskPvw(!this.self.dskPvw) }

	public cmdAudioInputMute(channelKey: string, on: boolean): void {
		const ch = AUDIO_CH[channelKey]; if (ch===undefined){this.self.log('warn',`Unknown channel: ${channelKey}`);return}
		this.sendCmd(this.dth(`01${ch.toString(16).toUpperCase().padStart(2,'0')}06`, on?'01':'00'))
		this.self.audioInputMute[ch]=on; this.self.changedState()
	}
	public cmdAudioInputMuteToggle(channelKey: string): void {
		const ch = AUDIO_CH[channelKey]; if (ch===undefined) return
		this.cmdAudioInputMute(channelKey, !this.self.audioInputMute[ch])
	}
	public cmdMainBusMute(on: boolean): void { this.sendCmd(this.dth('012103',on?'01':'00')); this.self.mainBusMute=on; this.self.changedState() }
	public cmdMainBusMuteToggle(): void { this.cmdMainBusMute(!this.self.mainBusMute) }
	public cmdAuxBusMute(aux: AuxId, on: boolean): void {
		this.sendCmd(this.dth(aux===1?'012203':'012403', on?'01':'00'))
		if (aux===1) this.self.aux1BusMute=on; else this.self.aux2BusMute=on; this.self.changedState()
	}
	public cmdAuxBusMuteToggle(aux: AuxId): void { this.cmdAuxBusMute(aux, aux===1?!this.self.aux1BusMute:!this.self.aux2BusMute) }

	public cmdSetFreeze(on: boolean): void { this.sendCmd(this.dth('020900',on?'01':'00')) }
	public cmdFreezeOn():     void { this.cmdSetFreeze(true) }
	public cmdFreezeOff():    void { this.cmdSetFreeze(false) }
	public cmdFreezeToggle(): void { const n=!this.self.freezeActive; this.cmdSetFreeze(n); this.self.freezeActive=n; this.self.changedState() }

	public cmdSetInputFreeze(inputKey: string, on: boolean): void {
		const map: Record<string,string> = {
			'hdmi_1':'020902','hdmi_2':'020903','hdmi_3':'020904','hdmi_4':'020905',
			'sdi_1': '020906','sdi_2': '020907','sdi_3': '020908','sdi_4': '020909',
		}
		const addr = map[inputKey]; if (!addr){this.self.log('warn',`Unknown freeze input: ${inputKey}`);return}
		this.sendCmd(this.dth(addr, on?'01':'00'))
		this.self.inputFreezeEnabled[parseInt(addr.slice(4,6),16)]=on; this.self.changedState()
	}
	public cmdSetInputFreezeToggle(inputKey: string): void {
		const map: Record<string,number> = {
			'hdmi_1':0x02,'hdmi_2':0x03,'hdmi_3':0x04,'hdmi_4':0x05,
			'sdi_1': 0x06,'sdi_2': 0x07,'sdi_3': 0x08,'sdi_4': 0x09,
		}
		const idx = map[inputKey]; if (idx===undefined) return
		this.cmdSetInputFreeze(inputKey, !this.self.inputFreezeEnabled[idx])
	}

	public cmdTestPattern(patternId: string): void {
		const p = TEST_PATTERNS.find(x=>x.id===patternId); if (!p) return
		if (this.self.testPattern===p.value) { this.sendCmd(this.dth('02015E','00')); this.self.testPattern=0 }
		else { this.sendCmd(this.dth('02015E',this.hb(p.value))); this.self.testPattern=p.value }
		this.self.changedState()
	}
	public cmdTestPatternOff(): void { this.sendCmd(this.dth('02015E','00')); this.self.testPattern=0; this.self.changedState() }

	public cmdRaw(cmd: string): void { this.sendCmd(cmd) }
}
