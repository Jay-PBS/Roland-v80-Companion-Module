// src/api.ts — Roland V-80HD
import { InstanceStatus, TCPHelper } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { POLL_INTERVAL_MS } from './config.js'

export const SRC_HDMI1 = 0x00
export const SRC_HDMI4 = 0x03
export const SRC_SDI1 = 0x04
export const SRC_SDI4 = 0x07
export const SRC_STILL1 = 0x08
export const SRC_STILL32 = 0x27
export const SRC_VPLAYER = 0x28
export const SRC_INPUT1 = 0x29
export const SRC_INPUT16 = 0x38

// The panel [CAPTURE IMAGE] switch, in the undocumented 0B00xx panel-switch region. Confirmed
// by packet capture on 2026-09-08 against RCS over 16 open/close cycles: RCS sends this exact
// press/release pair to both open and close the still-capture screen, and the device answers
// 0A0504,01 or 0A0504,00 within ~60ms every time. It is a toggle, not a close - firing it
// while the screen is shut opens it. Never send it ungated.
const CAPTURE_MODE_SW = '0B002A'

// The eight physical inputs in panel order. Canonical: the freeze and tally address maps, the
// freeze and tally dropdowns, the capture source list and the freeze and tally presets all key
// off this one list. `short` is the button-label form used by the presets.
export const PHYSICAL_INPUTS = [
	{ id: 'hdmi_1', label: 'HDMI In 1', short: 'HDMI 1' },
	{ id: 'hdmi_2', label: 'HDMI In 2', short: 'HDMI 2' },
	{ id: 'hdmi_3', label: 'HDMI In 3', short: 'HDMI 3' },
	{ id: 'hdmi_4', label: 'HDMI In 4', short: 'HDMI 4' },
	{ id: 'sdi_1', label: 'SDI In 1', short: 'SDI 1' },
	{ id: 'sdi_2', label: 'SDI In 2', short: 'SDI 2' },
	{ id: 'sdi_3', label: 'SDI In 3', short: 'SDI 3' },
	{ id: 'sdi_4', label: 'SDI In 4', short: 'SDI 4' },
] as const
export type PhysicalInputId = (typeof PHYSICAL_INPUTS)[number]['id']
export const PHYSICAL_INPUT_CHOICES = PHYSICAL_INPUTS.map(({ id, label }) => ({ id, label }))

// The address maps below are written out rather than generated: these are protocol constants
// and they need to stay readable against the control specification. The `satisfies` clause is
// what removes the duplication risk - miss an input, or add one to PHYSICAL_INPUTS without an
// address here, and the build fails rather than the feature silently going missing.
export const INPUT_FREEZE_IDX: Record<string, number> = {
	hdmi_1: 0x02,
	hdmi_2: 0x03,
	hdmi_3: 0x04,
	hdmi_4: 0x05,
	sdi_1: 0x06,
	sdi_2: 0x07,
	sdi_3: 0x08,
	sdi_4: 0x09,
} satisfies Record<PhysicalInputId, number>

// Tally Parameter Area. Read-only: the switcher reports its own on-air state here, which is
// unrelated to the physical tally port. Values are 0 = Off, 1 = PGM, 2 = PST.
export const TALLY_IDX: Record<string, number> = {
	hdmi_1: 0x00,
	hdmi_2: 0x01,
	hdmi_3: 0x02,
	hdmi_4: 0x03,
	sdi_1: 0x04,
	sdi_2: 0x05,
	sdi_3: 0x06,
	sdi_4: 0x07,
} satisfies Record<PhysicalInputId, number>

const VIDEO_PLAYER_LABEL = 'Video Player / SRT In'

// The 15 mixer input channels, with the labels the user sees. Actions and feedbacks both read
// this list, so the same channel cannot end up named two different ways in the two dropdowns.
const AUDIO_CHANNEL_DEFS = [
	{ id: 'audio_in_1', label: 'Audio In 1' },
	{ id: 'audio_in_2', label: 'Audio In 2' },
	{ id: 'audio_in_34', label: 'Audio In 3/4' },
	{ id: 'usb_in', label: 'USB In' },
	{ id: 'bluetooth_in', label: 'Bluetooth In' },
	{ id: 'audio_player', label: 'Audio Player' },
	{ id: 'hdmi_in_1', label: 'HDMI In 1' },
	{ id: 'hdmi_in_2', label: 'HDMI In 2' },
	{ id: 'hdmi_in_3', label: 'HDMI In 3' },
	{ id: 'hdmi_in_4', label: 'HDMI In 4' },
	{ id: 'sdi_in_1', label: 'SDI In 1' },
	{ id: 'sdi_in_2', label: 'SDI In 2' },
	{ id: 'sdi_in_3', label: 'SDI In 3' },
	{ id: 'sdi_in_4', label: 'SDI In 4' },
	{ id: 'video_player', label: VIDEO_PLAYER_LABEL },
] as const
export type AudioChannelId = (typeof AUDIO_CHANNEL_DEFS)[number]['id']
export const AUDIO_CHANNEL_CHOICES = AUDIO_CHANNEL_DEFS.map(({ id, label }) => ({ id, label }))

export const AUDIO_CH: Record<string, number> = {
	audio_in_1: 0x01,
	audio_in_2: 0x02,
	audio_in_34: 0x03,
	usb_in: 0x04,
	bluetooth_in: 0x05,
	audio_player: 0x06,
	hdmi_in_1: 0x07,
	hdmi_in_2: 0x08,
	hdmi_in_3: 0x09,
	hdmi_in_4: 0x0a,
	sdi_in_1: 0x0b,
	sdi_in_2: 0x0c,
	sdi_in_3: 0x0d,
	sdi_in_4: 0x0e,
	video_player: 0x0f,
} satisfies Record<AudioChannelId, number>

// Image capture can take any physical input, plus the video player.
export const CAPTURE_SOURCE_CHOICES = [...PHYSICAL_INPUT_CHOICES, { id: 'video_player', label: VIDEO_PLAYER_LABEL }]
type CaptureSourceId = PhysicalInputId | 'video_player'

export const CAPTURE_SRC: Record<string, number> = {
	hdmi_1: 0x00,
	hdmi_2: 0x01,
	hdmi_3: 0x02,
	hdmi_4: 0x03,
	sdi_1: 0x04,
	sdi_2: 0x05,
	sdi_3: 0x06,
	sdi_4: 0x07,
	video_player: 0x08,
} satisfies Record<CaptureSourceId, number>

export const TEST_PATTERNS: { id: string; label: string; value: number }[] = [
	{ id: 'bars75', label: 'Color Bars 75%', value: 0x01 },
	{ id: 'bars100', label: 'Color Bars 100%', value: 0x02 },
	{ id: 'ramp', label: 'Ramp', value: 0x03 },
	{ id: 'step', label: 'Step', value: 0x04 },
	{ id: 'hatch', label: 'Hatch', value: 0x05 },
	{ id: 'diamond', label: 'Diamond', value: 0x06 },
	{ id: 'circle', label: 'Circle', value: 0x07 },
	{ id: 'bars75sp', label: 'Bars 75%-SP', value: 0x08 },
	{ id: 'bars100sp', label: 'Bars 100%-SP', value: 0x09 },
	{ id: 'rampsp', label: 'Ramp-SP', value: 0x0a },
	{ id: 'stepsp', label: 'Step-SP', value: 0x0b },
	{ id: 'hatchsp', label: 'Hatch-SP', value: 0x0c },
]

// Wipe patterns and directions. The names are indexed by the device's own byte value, so the
// *_NAMES arrays double as the variable text and the *_CHOICES arrays as the dropdown options.
export const WIPE_TYPE_NAMES = [
	'Horizontal',
	'Vertical',
	'Upper Left',
	'Upper Right',
	'Lower Left',
	'Lower Right',
	'H-Center',
	'V-Center',
]
export const WIPE_DIRECTION_NAMES = ['Normal', 'Reverse', 'Round Trip']
export const AUX_LINK_MODE_NAMES = ['Off', 'Auto Link', 'Manual Link']

const byIndex = (names: string[]) => names.map((label, i) => ({ id: String(i), label }))
export const WIPE_TYPE_CHOICES = byIndex(WIPE_TYPE_NAMES)
export const WIPE_DIRECTION_CHOICES = byIndex(WIPE_DIRECTION_NAMES)
export const AUX_LINK_MODE_CHOICES = byIndex(AUX_LINK_MODE_NAMES)

export const AUX_CHOICES = [
	{ id: '1', label: 'AUX 1' },
	{ id: '2', label: 'AUX 2' },
]
export const AUX_LAYER_CHOICES = [
	{ id: '1', label: 'PinP & Key 1' },
	{ id: '2', label: 'PinP & Key 2' },
]

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1)
const STILL_COUNT = SRC_STILL32 - SRC_STILL1 + 1
const CROSSPOINT_COUNT = 8

// Everything the PGM, PVW and AUX buses, PinP and DSK will accept, in panel order. The eight
// crosspoint inputs come first because they are what most buttons select.
export const SOURCE_CHOICES = [
	...range(CROSSPOINT_COUNT).map((n) => ({ id: `input_${n}`, label: `Input ${n}` })),
	...PHYSICAL_INPUT_CHOICES,
	...range(STILL_COUNT).map((n) => ({ id: `still_${n}`, label: `Still ${n}` })),
	{ id: 'video_player', label: VIDEO_PLAYER_LABEL },
]

// Input Assign fills the crosspoints, so it offers everything except the crosspoints themselves.
export const INPUT_ASSIGN_SOURCE_CHOICES = SOURCE_CHOICES.filter((c) => !c.id.startsWith('input_'))

export type AuxId = 1 | 2
export type LayerId = 1 | 2

export function sourceIdToByte(id: string): number | undefined {
	if (id.startsWith('input_')) {
		const n = parseInt(id.slice(6))
		if (n >= 1 && n <= CROSSPOINT_COUNT) return SRC_INPUT1 + n - 1
	}
	if (id.startsWith('hdmi_')) {
		const n = parseInt(id.slice(5))
		if (n >= 1 && n <= SRC_HDMI4 - SRC_HDMI1 + 1) return SRC_HDMI1 + n - 1
	}
	if (id.startsWith('sdi_')) {
		const n = parseInt(id.slice(4))
		if (n >= 1 && n <= SRC_SDI4 - SRC_SDI1 + 1) return SRC_SDI1 + n - 1
	}
	if (id.startsWith('still_')) {
		const n = parseInt(id.slice(6))
		if (n >= 1 && n <= SRC_STILL32 - SRC_STILL1 + 1) return SRC_STILL1 + n - 1
	}
	if (id === 'video_player') return SRC_VPLAYER
	return undefined
}

export class V80Api {
	private readonly self: ModuleInstance
	private tcp?: TCPHelper
	private rxBuffer = ''
	private pollingTimer?: NodeJS.Timeout
	private debounceTimer?: NodeJS.Timeout
	private authTimer?: NodeJS.Timeout
	private watchdogTimer?: NodeJS.Timeout
	private authSent = false
	private authFailed = false
	private isConnected = false
	private isAuthenticated = false
	private lastRxTime = 0
	private cycleStartTime = 0

	constructor(self: ModuleInstance) {
		this.self = self
	}

	// The password lives in the secrets store from 0.7.0 on. The config fallback covers a
	// connection whose upgrade script has not run yet, so an existing setup keeps
	// authenticating instead of silently failing on the first connect after the update.
	private get password(): string {
		return (this.self.secrets?.password || this.self.config.password || '').trim()
	}

	public initTcp(): void {
		if (!this.self.config.host || !this.self.config.port) {
			this.self.updateStatus(InstanceStatus.BadConfig, 'Missing host/port')
			return
		}
		this.self.updateStatus(InstanceStatus.Connecting)
		this.isConnected = false
		this.isAuthenticated = false
		this.rxBuffer = ''
		this.cycleStartTime = Date.now()
		this.tcp = new TCPHelper(this.self.config.host, this.self.config.port, { reconnect: true })
		this.tcp.on('status_change', (status, message) => {
			this.self.updateStatus(status, message)
			if (status !== InstanceStatus.Ok) {
				this.isConnected = false
				this.isAuthenticated = false
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
			this.isConnected = true
			this.rxBuffer = ''
			this.authSent = false
			this.isAuthenticated = false
			this.lastRxTime = Date.now()
			this.cycleStartTime = Date.now()
			const pw = this.password
			if (pw) {
				this.self.updateStatus(InstanceStatus.Connecting, 'Authenticating')
				// The device prompts "Enter password:" ~10ms after connect. Wait for it so the
				// password is only sent once — sending it unprompted too leaves a stray line the
				// device parses as a command (observed ERR:0 on the wire). Fallback covers
				// firmware that opens the session without prompting.
				this.authTimer = setTimeout(() => {
					if (!this.authSent && this.isConnected) this.sendPassword()
				}, 1500)
			} else {
				this.onAuthenticated()
			}
		})
		this.tcp.on('data', (data: Buffer) => this.handleIncoming(data))
		this.startWatchdog()
	}

	// TCPHelper only reconnects on socket 'error'/'end'. A network path that dies without a
	// FIN/RST (Wi-Fi drop, cable pull, switch power-cycle) fires neither, and Windows TCP
	// keepalive would take ~2h to notice — so the connection looks Ok forever while dead.
	// The device answers every query within ms, so prolonged RX silence is a reliable death
	// signal; rebuild the connection from scratch when we see it.
	private startWatchdog(): void {
		this.stopWatchdog()
		this.watchdogTimer = setInterval(() => this.watchdogTick(), 1000)
	}
	private stopWatchdog(): void {
		if (this.watchdogTimer) {
			clearInterval(this.watchdogTimer)
			this.watchdogTimer = undefined
		}
	}

	private watchdogTick(): void {
		if (!this.tcp || this.authFailed) return
		const now = Date.now()
		if (this.isConnected && this.isAuthenticated) {
			// Nudge the device if quiet, then give up. With polling on, replies arrive every
			// 500ms so neither branch is ever reached; with polling off the 1.5s nudge draws a
			// reply that resets the clock. Only a genuinely dead link reaches 4s.
			// Detection was 8s on a 2.5s tick (worst case 10.5s), which tested as too slow.
			if (now - this.lastRxTime > 1500) this.sendCmd(this.rqh('001500', '000001'))
			if (now - this.lastRxTime > 4000) this.forceReconnect('No response from device for 4s')
		} else if (this.isConnected) {
			// TCP is up but auth never completed — e.g. the device silently ignores a second
			// control session (observed: it accepts the connection and sends nothing at all).
			// A fresh connection is the only way to retry.
			if (now - this.lastRxTime > 6000) this.forceReconnect('Authentication stalled')
		} else {
			// Not connected: TCPHelper retries every 2s, but a connect attempt to an
			// unreachable host takes ~21s to time out on Windows. Recycling the socket every
			// 12s keeps attempts fresh without stacking timers.
			if (now - Math.max(this.lastRxTime, this.cycleStartTime) > 12000) {
				this.forceReconnect('Still unreachable – retrying with a fresh connection')
			}
		}
	}

	private forceReconnect(reason: string): void {
		this.self.log('warn', `Reconnecting: ${reason}`)
		this.destroyTcp()
		this.initTcp()
	}

	public destroyTcp(): void {
		this.stopPolling()
		this.stopDebounce()
		this.stopAuthTimer()
		this.stopWatchdog()
		try {
			this.tcp?.destroy()
		} catch {
			/* ignore */
		}
		this.tcp = undefined
		this.rxBuffer = ''
		this.isConnected = false
		this.isAuthenticated = false
		this.authSent = false
	}

	private stopAuthTimer(): void {
		if (this.authTimer) {
			clearTimeout(this.authTimer)
			this.authTimer = undefined
		}
	}

	private sendPassword(): void {
		this.authSent = true
		this.tcp?.send(this.password + '\r\n').catch((err: Error) => this.self.log('debug', `TX failed: ${err.message}`))
	}

	private onPasswordPrompt(): void {
		this.stopAuthTimer()
		if (this.authSent) {
			// Re-prompt after we already answered means the password was rejected. Do not
			// resend — answering every prompt with the same password loops until the device
			// locks out ("Wait a moment"), which then rejects even correct passwords.
			this.self.log('error', 'Authentication failed – device rejected the password')
			this.authFailed = true
			this.stopPolling()
			this.self.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed – check password')
			return
		}
		const pw = this.password
		if (!pw) {
			this.self.updateStatus(InstanceStatus.BadConfig, 'Device requires a password but none is configured')
			return
		}
		this.sendPassword()
	}

	private handleIncoming(data: Buffer): void {
		this.lastRxTime = Date.now()
		if (this.self.config.debug) {
			this.self.log(
				'debug',
				`RX RAW [${data.length}b]: ${[...data].map((b) => b.toString(16).padStart(2, '0')).join(' ')}`,
			)
		}
		this.rxBuffer += data.toString('binary')

		// The prompt has no terminator (";" or newline), so it must be matched on the raw
		// buffer — the line splitter below would never emit it. Consume up to and including
		// the prompt and keep the rest: clearing the whole buffer discarded any framed data
		// that arrived in the same TCP segment behind the prompt, and would have destroyed
		// the buffer outright if the phrase ever appeared inside payload data.
		const prompt = /enter password:?[ \t]*/i.exec(this.rxBuffer)
		if (prompt) {
			this.rxBuffer = this.rxBuffer.slice(prompt.index + prompt[0].length)
			this.onPasswordPrompt()
		}

		while (this.rxBuffer.length > 0) {
			const semi = this.rxBuffer.indexOf(';')
			const nl = this.rxBuffer.indexOf('\n')
			if (semi < 0 && nl < 0) break
			const useSemi = semi >= 0 && (nl < 0 || semi < nl)
			const cutPos = useSemi ? semi : nl
			const part = this.rxBuffer
				.slice(0, cutPos + 1)
				// Device frames are wrapped in STX/XON/XOFF, so stripping them here is intentional
				// eslint-disable-next-line no-control-regex
				.replace(/^[\x02\x11\x13\r\n\s]+/, '')
				.replace(/[\r\n;]+$/, '')
				.trim()
			this.rxBuffer = this.rxBuffer.slice(cutPos + 1)
			if (!part) continue
			if (this.self.config.debug) this.self.log('debug', `RX ${useSemi ? 'FRAME' : 'LINE'}: ${part}`)
			if (useSemi) this.parseFrame(part)
			else this.handleTextLine(part)
		}
		// Everything left here is an incomplete frame - the loop above consumed every complete
		// one. Past 8KB it is not a frame at all, so keeping a 4KB tail would only hand the
		// parser a fragment cut through the middle of a value and produce one silently wrong
		// reading. Discard it and say so.
		if (this.rxBuffer.length > 8192) {
			this.self.log('warn', 'Receive buffer overflowed with no complete frame - discarding')
			this.rxBuffer = ''
		}
	}

	private handleTextLine(line: string): void {
		if (!line) return
		if (/enter password/i.test(line)) {
			this.onPasswordPrompt()
			return
		}
		if (/^Authentication error/i.test(line)) {
			this.self.log('error', 'Authentication failed')
			this.authFailed = true
			this.isConnected = false
			this.stopPolling()
			this.self.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed')
			return
		}
		if (/^Wait a moment/i.test(line)) {
			// Device brute-force lockout — it will reject even the correct password until it
			// clears. Surface it instead of silently retrying.
			this.self.log('error', 'Device auth lockout active ("Wait a moment") – pause before retrying')
			this.self.updateStatus(InstanceStatus.ConnectionFailure, 'Device auth lockout – wait and retry')
			return
		}
		if (/^Welcome to /i.test(line)) {
			this.onAuthenticated()
			return
		}
		if (/^VER:/i.test(line)) {
			this.self.log('info', `Device: ${line}`)
			this.onAuthenticated()
			return
		}
	}

	private onAuthenticated(): void {
		this.stopAuthTimer()
		this.isAuthenticated = true
		this.authFailed = false
		this.self.log('info', 'Connection ready – requesting initial state')
		this.self.updateStatus(InstanceStatus.Ok)
		this.requestCoreState()
		this.startPolling()
	}

	private parseFrame(frame: string): void {
		if (!frame) return
		if (/^ACK$/i.test(frame)) return
		if (/^ERR:/i.test(frame)) {
			this.self.log('warn', `Device error: ${frame}`)
			return
		}
		const m = /^DTH:([0-9A-Fa-f]{6}),([0-9A-Fa-f]*)$/i.exec(frame)
		if (!m) {
			if (this.self.config.debug) this.self.log('debug', `UNMATCHED: ${frame}`)
			return
		}
		this.parseDth(m[1].toUpperCase(), m[2].toUpperCase())
	}

	private parseDth(addr: string, hex: string): void {
		if (!hex || hex.length < 2) return
		const val = parseInt(hex.slice(0, 2), 16)
		if (this.self.config.debug) this.self.log('debug', `DTH ${addr}=${val}`)
		switch (addr) {
			case '001500':
				this.self.programSource = val
				this.self.programInput = this.sourceToInput(val)
				break
			case '001501':
				this.self.previewSource = val
				this.self.previewInput = this.sourceToInput(val)
				break
			case '000018':
				this.self.aux1Source = val
				this.self.aux1Input = this.sourceToInput(val)
				break
			case '000019':
				this.self.aux2Source = val
				this.self.aux2Input = this.sourceToInput(val)
				break
			case '000F00':
				this.self.transitionType = val === 0 ? 'mix' : 'wipe'
				break
			case '000F02':
				this.self.mixTime = val
				break
			case '000F03':
				this.self.wipeType = val
				break
			case '000F05':
				this.self.wipeDirection = val
				break
			case '001203':
				this.self.pinp1Source = val
				break
			case '001303':
				this.self.pinp2Source = val
				break
			case '001201':
				this.self.pinp1Pgm = val === 1
				break
			case '001202':
				this.self.pinp1Pvw = val === 1
				break
			case '001301':
				this.self.pinp2Pgm = val === 1
				break
			case '001302':
				this.self.pinp2Pvw = val === 1
				break
			case '001404':
				this.self.dskSource = val
				break
			case '001401':
				this.self.dskPgm = val === 1
				break
			case '001402':
				this.self.dskPvw = val === 1
				break
			case '001000':
				this.self.split1Active = val === 1
				break
			case '001100':
				this.self.split2Active = val === 1
				break
			case '020114':
				this.self.auxLinkedPgm = val
				break
			case '020115':
				this.self.aux1LinkedPgm = val === 1
				break
			case '020116':
				this.self.aux2LinkedPgm = val === 1
				break
			// Stream & Record status, pushed by the device without being asked.
			// 02 stopped, 03 stopping, 04 starting, 05 running.
			case '030800':
				this.self.streamRecordState = val
				this.self.streamRecordActive = val === 0x04 || val === 0x05
				break
			// Image capture, pushed by the device. 00 and 01 are the capture screen closing
			// and opening; 04 armed and ready, 08 capture done, 0A state refreshed. The
			// 00/01 pair is what tells us whether the screen is up, which is the only safe
			// gate on CAPTURE_MODE_SW - see cmdCloseCaptureScreen().
			case '0A0504':
				if (val === 0x00 || val === 0x01) this.self.captureModeOpen = val === 0x01
				if (val === 0x08) this.self.log('info', 'Image capture complete')
				else if (this.self.config.debug) this.self.log('debug', `Capture state ${val}`)
				break
			case '012103':
				this.self.mainBusMute = val === 1
				break
			case '012203':
				this.self.aux1BusMute = val === 1
				break
			case '012403':
				this.self.aux2BusMute = val === 1
				break
			case '020900':
				this.self.freezeActive = val === 1
				break
			// 030207 is NOT the Fade To Black state. Capture 2026-09-04: six FTB presses
			// produced twelve transitions of this byte, 00->01 while each fade ran and back to
			// 00 once it finished, whether the result was black or live. It is a
			// fade-in-progress flag. The steady FTB state is at an address not yet identified;
			// it was the only polled byte that moved during that capture.
			case '030207':
				this.self.ftbFading = val === 1
				break
			case '02015E':
				this.self.testPattern = val
				break
			case '000020':
				this.self.aux1Pinp1Layer = val
				break
			case '000021':
				this.self.aux1Pinp2Layer = val
				break
			case '000023':
				this.self.aux2Pinp1Layer = val
				break
			case '000024':
				this.self.aux2Pinp2Layer = val
				break
		}
		const audioMute = /^01(0[1-9A-F])06$/.exec(addr)
		if (audioMute) {
			this.self.audioInputMute[parseInt(audioMute[1], 16)] = val === 1
		}
		if (addr.startsWith('0209') && addr.length === 6) {
			const idx = parseInt(addr.slice(4, 6), 16)
			if (idx >= 0x02 && idx <= 0x09) this.self.inputFreezeEnabled[idx] = val === 1
		}
		if (addr.startsWith('0C00') && addr.length === 6) {
			const idx = parseInt(addr.slice(4, 6), 16)
			// 0 = Off, 1 = PGM, 2 = PST
			if (idx >= 0x00 && idx <= 0x07) this.self.tallyState[idx] = val
		}
		this.scheduleDebounce()
	}

	private scheduleDebounce(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
			this.debounceTimer = undefined
		}
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = undefined
			this.self.changedState()
		}, 40)
	}
	private stopDebounce(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
			this.debounceTimer = undefined
		}
	}

	public requestCoreState(): void {
		// Reachable from the user-facing sync_now action, so it needs the same authentication
		// gate as sendCmd rather than only checking the socket.
		if (!this.isConnected || !this.isAuthenticated) return
		const cmds: string[] = []
		// Core state addresses — all polled every 500ms
		for (const a of [
			'001500',
			'001501', // Program, Preview source
			'000018',
			'000019', // AUX 1, AUX 2 source
			'000F00',
			'000F02', // Transition type, mix time
			'000F03',
			'000F05', // Wipe type, wipe direction
			'001203',
			'001303', // PinP 1, PinP 2 source
			'001201',
			'001202', // PinP 1 PGM, PVW
			'001301',
			'001302', // PinP 2 PGM, PVW
			'001404',
			'001401',
			'001402', // DSK source, PGM, PVW
			'001000',
			'001100', // Split 1, Split 2
			'020114',
			'020115',
			'020116', // AUX Linked PGM mode, and per-bus follow for AUX 1 / AUX 2
			'012103',
			'012203',
			'012403', // Main, AUX1, AUX2 bus mute
			'020900', // Global freeze
			'030207', // Fade To Black - fade in progress, not the engaged state
			'02015E', // Test pattern
			'030800', // Stream & Record status. Pushed to the RCS session but not to ours,
			//           so poll it like everything else rather than waiting for a push.
			'000020',
			'000021', // AUX 1 PinP layer 1, 2
			'000023',
			'000024', // AUX 2 PinP layer 1, 2
		])
			cmds.push(this.rqh(a, '000001'))
		// Audio input mutes — all 15 channels
		for (let ch = 0x01; ch <= 0x0f; ch++) {
			cmds.push(this.rqh(`01${ch.toString(16).toUpperCase().padStart(2, '0')}06`, '000001'))
		}
		// Per-input freeze states — HDMI 1-4, SDI 1-4
		for (let i = 0x02; i <= 0x09; i++) {
			cmds.push(this.rqh(`0209${i.toString(16).toUpperCase().padStart(2, '0')}`, '000001'))
		}
		// Tally — HDMI 1-4, SDI 1-4. Eight single-byte reads, not one block read: parseDth
		// truncates every reply to its first byte, so a block reply would populate HDMI 1
		// and silently drop the other seven.
		for (let i = 0x00; i <= 0x07; i++) {
			cmds.push(this.rqh(`0C00${i.toString(16).toUpperCase().padStart(2, '0')}`, '000001'))
		}
		this.sendCmdBatch(cmds)
	}

	// One command per TCP write. Batching the whole cycle into a single write was introduced
	// in 0.6.0 as a traffic optimisation and silently broke every polled feedback: packet
	// capture on 2026-09-04 showed 17,220 RQH sent as 273 batched writes of 63 commands
	// returning 21 DTH replies in total - and all 21 were answers to the watchdog's separate
	// single-command nudge. The device returned nothing at all for a batched write, not even
	// an ACK. Single writes are answered normally.
	//
	// Do not reintroduce batching without capturing the result. If traffic ever needs
	// reducing, test a small chunk size on hardware first and find where the device stops
	// answering, rather than assuming it accepts an arbitrary number per packet.
	private sendCmdBatch(cmds: string[]): void {
		if (!this.tcp || cmds.length === 0) return
		if (this.self.config.debug) this.self.log('debug', `TX POLL: ${cmds.length} commands`)
		for (const cmd of cmds) {
			this.tcp.send(cmd + '\r\n').catch((err: Error) => this.self.log('debug', `TX failed: ${err.message}`))
		}
	}

	private startPolling(): void {
		if (!this.self.config.polling || this.pollingTimer) return
		this.pollingTimer = setInterval(() => {
			if (this.isConnected) this.requestCoreState()
		}, POLL_INTERVAL_MS)
	}
	private stopPolling(): void {
		if (this.pollingTimer) {
			clearInterval(this.pollingTimer)
			this.pollingTimer = undefined
		}
	}

	private sendCmd(cmd: string): void {
		if (!this.tcp) {
			this.self.log('warn', 'Not connected')
			return
		}
		// The socket is open for the whole authentication window, so without this a button
		// pressed while the status still reads "Connecting - Authenticating" would write a
		// command line into a session that is waiting for a password. The device parses that
		// as a command on an unauthenticated session - the same stray line that shows up as
		// ERR:0 on the wire - and it is a candidate for being counted as a failed attempt
		// toward the lockout that onPasswordPrompt works to avoid.
		//
		// Dropped rather than queued on purpose: this drives a live switcher, and replaying a
		// button press from several seconds ago once the link comes up could cut to the wrong
		// source mid-programme. Better to do nothing and say so.
		if (!this.isAuthenticated) {
			this.self.log('warn', `Not authenticated yet - command dropped: ${cmd}`)
			return
		}
		if (this.self.config.debug) this.self.log('debug', `TX: ${cmd}`)
		this.tcp
			.send(cmd.endsWith('\r\n') ? cmd : cmd + '\r\n')
			.catch((err: Error) => this.self.log('debug', `TX failed: ${err.message}`))
	}

	private dth(addr: string, v: string): string {
		return `DTH:${addr},${v};`
	}
	private rqh(addr: string, s: string): string {
		return `RQH:${addr},${s};`
	}
	private hb(n: number): string {
		return Math.max(0, Math.min(255, Math.round(n)))
			.toString(16)
			.toUpperCase()
			.padStart(2, '0')
	}
	private encode2byte(value: number): string {
		const v = Math.max(0, Math.round(value))
		return (
			Math.floor(v / 128)
				.toString(16)
				.toUpperCase()
				.padStart(2, '0') + (v % 128).toString(16).toUpperCase().padStart(2, '0')
		)
	}

	public sourceToInput(source: number): number {
		// Only numbered crosspoint inputs map to 1-8. Direct HDMI/SDI, stills and the video
		// player return 0 so "Input N" feedbacks don't light for a source that isn't Input N.
		if (source >= SRC_INPUT1 && source <= SRC_INPUT16) return source - SRC_INPUT1 + 1
		return 0
	}

	public cmdCut(): void {
		this.sendCmd(this.dth('0B001B', '01'))
		this.sendCmd(this.dth('0B001B', '00'))
	}
	public cmdAuto(): void {
		this.sendCmd(this.dth('0B001C', '01'))
		this.sendCmd(this.dth('0B001C', '00'))
	}
	public cmdFadeToBlack(): void {
		this.sendCmd(this.dth('0B003C', '01'))
		this.sendCmd(this.dth('0B003C', '00'))
	}
	// Close the still-capture screen, if it is actually showing.
	//
	// CAPTURE_MODE_SW is a toggle, so this is gated on the state the device pushes rather
	// than fired blind: with the screen already shut, sending it would open it. Gating on
	// the device's own report rather than on what we think we did means a screen opened
	// from the panel is closed correctly too, and a capture that never opened one is left
	// alone.
	//
	// There is no EXIT command. Roland documents no way to work the menu remotely: the LAN
	// interface is only DTH/RQH/VER over the SysEx map, and Panel Lock (020300-020347) is
	// lock state rather than presses, omitting MENU, EXIT, ENTER and the VALUE knob. This
	// closes the capture screen specifically; it is not a general menu dismissal.
	public cmdCloseCaptureScreen(): void {
		if (!this.self.captureModeOpen) return
		this.cmdToggleCaptureMode()
	}
	// The panel [CAPTURE IMAGE] button, press and release. Toggles the capture screen.
	public cmdToggleCaptureMode(): void {
		this.sendCmd(this.dth(CAPTURE_MODE_SW, '01'))
		this.sendCmd(this.dth(CAPTURE_MODE_SW, '00'))
	}
	// Two presses of [CAPTURE IMAGE], ungated, to back out of the capture function after a
	// capture has run.
	//
	// Deliberately not gated on captureModeOpen. Our own capture sequence gets 04/08/0A back
	// from the device, never the 00/01 the gate reads, so the gated close was almost
	// certainly a no-op in 0.8.1 and 0.8.2 - which matches 1200ms and 7000ms behaving
	// identically on hardware. One press was not enough either, so the post-capture screen
	// is evidently not the same single toggle RCS drives when idle.
	public async cmdExitCaptureFunction(): Promise<void> {
		this.cmdToggleCaptureMode()
		await this.delay(300)
		this.cmdToggleCaptureMode()
	}
	public cmdSetTransitionType(t: 'mix' | 'wipe'): void {
		this.sendCmd(this.dth('000F00', t === 'mix' ? '00' : '01'))
	}
	public cmdSetMixTime(tenths: number): void {
		this.sendCmd(this.dth('000F02', this.hb(Math.max(0, Math.min(0x28, Math.round(tenths))))))
	}
	public cmdSetWipeType(type: number): void {
		this.sendCmd(this.dth('000F03', this.hb(Math.max(0, Math.min(7, type)))))
	}
	public cmdSetWipeDirection(dir: number): void {
		this.sendCmd(this.dth('000F05', this.hb(Math.max(0, Math.min(2, dir)))))
	}

	public cmdSetProgramSource(sourceId: string): void {
		const b = sourceIdToByte(sourceId)
		if (b === undefined) {
			this.self.log('warn', `Unknown source: ${sourceId}`)
			return
		}
		this.sendCmd(this.dth('001500', this.hb(b)))
	}
	public cmdSetPreviewSource(sourceId: string): void {
		const b = sourceIdToByte(sourceId)
		if (b === undefined) {
			this.self.log('warn', `Unknown source: ${sourceId}`)
			return
		}
		this.sendCmd(this.dth('001501', this.hb(b)))
	}
	public cmdSetInputAssignSource(slot: number, sourceId: string): void {
		const b = sourceIdToByte(sourceId)
		if (b === undefined) {
			this.self.log('warn', `Unknown source: ${sourceId}`)
			return
		}
		const s = (Math.max(1, Math.min(8, Math.round(slot))) - 1).toString(16).toUpperCase().padStart(2, '0')
		this.sendCmd(this.dth(`0000${s}`, this.hb(Math.max(0, Math.min(0x38, b)))))
	}
	public cmdSetAuxSource(aux: AuxId, sourceId: string): void {
		const b = sourceIdToByte(sourceId)
		if (b === undefined) {
			this.self.log('warn', `Unknown source: ${sourceId}`)
			return
		}
		this.sendCmd(this.dth(aux === 1 ? '000018' : '000019', this.hb(b)))
	}
	public cmdSetAuxLinkedPgm(mode: 0 | 1 | 2): void {
		this.sendCmd(this.dth('020114', this.hb(mode)))
		this.self.auxLinkedPgm = mode
		this.self.changedState()
	}
	// 020115 / 020116 select which AUX buses follow PGM. These are what "Manual Link" mode
	// on 020114 actually configures - without them the mode is set but nothing is chosen.
	// Press the mode you want; press it again to go back to Off. Same idiom as the test
	// pattern toggle. The mode gates the per-bus follow settings, so this has to be set to
	// Auto or Manual before AUX 1/2 FOLLOW does anything at all.
	public cmdToggleAuxLinkedPgmMode(mode: 1 | 2): void {
		this.cmdSetAuxLinkedPgm(this.self.auxLinkedPgm === mode ? 0 : mode)
	}
	public cmdSetAuxLinkedPgmBus(aux: AuxId, on: boolean): void {
		// Deliberately no optimistic local update. 020115/020116 are polled, and the manual
		// describes AUX link as state the device changes on its own - selecting an AUX source
		// breaks the link, a transition or a re-press restores it. Assuming the write stuck
		// would make the feedback lie about a value the device may have ignored or overridden.
		this.sendCmd(this.dth(aux === 2 ? '020116' : '020115', on ? '01' : '00'))
	}
	public cmdToggleAuxLinkedPgmBus(aux: AuxId): void {
		this.cmdSetAuxLinkedPgmBus(aux, !(aux === 1 ? this.self.aux1LinkedPgm : this.self.aux2LinkedPgm))
	}
	public cmdSetAuxLayerPinp(aux: AuxId, layer: LayerId, mode: 0 | 1 | 2): void {
		// AuxId and LayerId are both 1 | 2, so this lookup is total - no undefined guard needed.
		const addrs: Record<AuxId, Record<LayerId, string>> = {
			1: { 1: '000020', 2: '000021' },
			2: { 1: '000023', 2: '000024' },
		}
		const addr = addrs[aux][layer]
		this.sendCmd(this.dth(addr, this.hb(mode)))
		if (aux === 1 && layer === 1) this.self.aux1Pinp1Layer = mode
		else if (aux === 1 && layer === 2) this.self.aux1Pinp2Layer = mode
		else if (aux === 2 && layer === 1) this.self.aux2Pinp1Layer = mode
		else if (aux === 2 && layer === 2) this.self.aux2Pinp2Layer = mode
		this.self.changedState()
	}
	public cmdToggleAuxLayerPinp(aux: AuxId, layer: LayerId): void {
		const cur =
			aux === 1
				? layer === 1
					? this.self.aux1Pinp1Layer
					: this.self.aux1Pinp2Layer
				: layer === 1
					? this.self.aux2Pinp1Layer
					: this.self.aux2Pinp2Layer
		this.cmdSetAuxLayerPinp(aux, layer, cur === 0 ? 1 : 0)
	}
	public cmdToggleAuxLayerPinpAlwaysOn(aux: AuxId, layer: LayerId): void {
		const cur =
			aux === 1
				? layer === 1
					? this.self.aux1Pinp1Layer
					: this.self.aux1Pinp2Layer
				: layer === 1
					? this.self.aux2Pinp1Layer
					: this.self.aux2Pinp2Layer
		this.cmdSetAuxLayerPinp(aux, layer, cur === 0 ? 2 : 0)
	}
	public cmdSplit1(on: boolean): void {
		this.sendCmd(this.dth('001000', on ? '01' : '00'))
		this.self.split1Active = on
		this.self.changedState()
	}
	public cmdSplit2(on: boolean): void {
		this.sendCmd(this.dth('001100', on ? '01' : '00'))
		this.self.split2Active = on
		this.self.changedState()
	}
	public cmdSplit1Toggle(): void {
		this.cmdSplit1(!this.self.split1Active)
	}
	public cmdSplit2Toggle(): void {
		this.cmdSplit2(!this.self.split2Active)
	}

	public cmdPinpSetSource(layer: LayerId, sourceId: string): void {
		const b = sourceIdToByte(sourceId)
		if (b === undefined) {
			this.self.log('warn', `Unknown source: ${sourceId}`)
			return
		}
		this.sendCmd(this.dth(layer === 1 ? '001203' : '001303', this.hb(Math.max(0, Math.min(0x38, b)))))
	}
	public cmdPinpPgm(layer: LayerId, on: boolean): void {
		this.sendCmd(this.dth(layer === 1 ? '001201' : '001301', on ? '01' : '00'))
		if (layer === 1) this.self.pinp1Pgm = on
		else this.self.pinp2Pgm = on
		this.self.changedState()
	}
	public cmdPinpPvw(layer: LayerId, on: boolean): void {
		this.sendCmd(this.dth(layer === 1 ? '001202' : '001302', on ? '01' : '00'))
		if (layer === 1) this.self.pinp1Pvw = on
		else this.self.pinp2Pvw = on
		this.self.changedState()
	}
	public cmdPinpPgmToggle(layer: LayerId): void {
		this.cmdPinpPgm(layer, layer === 1 ? !this.self.pinp1Pgm : !this.self.pinp2Pgm)
	}
	public cmdPinpPvwToggle(layer: LayerId): void {
		this.cmdPinpPvw(layer, layer === 1 ? !this.self.pinp1Pvw : !this.self.pinp2Pvw)
	}

	private pinpAddr(layer: LayerId, offset: string): string {
		return `00${layer === 1 ? '12' : '13'}${offset}`
	}
	private encodePinpSigned(pct: number, pctMax: number, maxRaw: number): string {
		const c = Math.max(-maxRaw, Math.min(maxRaw, Math.round((pct / pctMax) * maxRaw)))
		return this.encode2byte(c >= 0 ? c : 128 * 128 + c)
	}
	private encodePinp0to100(pct: number): string {
		return this.encode2byte(Math.round((Math.max(0, Math.min(100, pct)) / 100) * 1000))
	}

	public cmdPinpPositionH(layer: LayerId, pct: number): void {
		this.sendCmd(`DTH:${this.pinpAddr(layer, '05')},${this.encodePinpSigned(pct, 100, 1000)};`)
	}
	public cmdPinpPositionV(layer: LayerId, pct: number): void {
		this.sendCmd(`DTH:${this.pinpAddr(layer, '07')},${this.encodePinpSigned(pct, 100, 1000)};`)
	}
	public cmdPinpSize(layer: LayerId, pct: number): void {
		this.sendCmd(`DTH:${this.pinpAddr(layer, '09')},${this.encodePinp0to100(pct)};`)
	}
	public cmdPinpCroppingH(layer: LayerId, pct: number): void {
		this.sendCmd(`DTH:${this.pinpAddr(layer, '0B')},${this.encodePinp0to100(pct)};`)
	}
	public cmdPinpCroppingV(layer: LayerId, pct: number): void {
		this.sendCmd(`DTH:${this.pinpAddr(layer, '0D')},${this.encodePinp0to100(pct)};`)
	}
	public cmdPinpViewPositionH(layer: LayerId, pct: number): void {
		this.sendCmd(`DTH:${this.pinpAddr(layer, '18')},${this.encodePinpSigned(pct, 50, 500)};`)
	}
	public cmdPinpViewPositionV(layer: LayerId, pct: number): void {
		this.sendCmd(`DTH:${this.pinpAddr(layer, '1A')},${this.encodePinpSigned(pct, 50, 500)};`)
	}
	public cmdPinpViewZoom(layer: LayerId, pct: number): void {
		this.sendCmd(
			`DTH:${this.pinpAddr(layer, '1C')},${this.encode2byte(Math.round(Math.max(100, Math.min(400, pct))))};`,
		)
	}

	public cmdDskSetSource(sourceId: string): void {
		const b = sourceIdToByte(sourceId)
		if (b === undefined) {
			this.self.log('warn', `Unknown source: ${sourceId}`)
			return
		}
		this.sendCmd(this.dth('001404', this.hb(Math.max(0, Math.min(0x38, b)))))
	}
	public cmdDskPgm(on: boolean): void {
		this.sendCmd(this.dth('001401', on ? '01' : '00'))
		this.self.dskPgm = on
		this.self.changedState()
	}
	public cmdDskPvw(on: boolean): void {
		this.sendCmd(this.dth('001402', on ? '01' : '00'))
		this.self.dskPvw = on
		this.self.changedState()
	}
	public cmdDskPgmToggle(): void {
		this.cmdDskPgm(!this.self.dskPgm)
	}
	public cmdDskPvwToggle(): void {
		this.cmdDskPvw(!this.self.dskPvw)
	}

	public cmdAudioInputMute(channelKey: string, on: boolean): void {
		const ch = AUDIO_CH[channelKey]
		if (ch === undefined) {
			this.self.log('warn', `Unknown channel: ${channelKey}`)
			return
		}
		this.sendCmd(this.dth(`01${ch.toString(16).toUpperCase().padStart(2, '0')}06`, on ? '01' : '00'))
		this.self.audioInputMute[ch] = on
		this.self.changedState()
	}
	public cmdAudioInputMuteToggle(channelKey: string): void {
		const ch = AUDIO_CH[channelKey]
		if (ch === undefined) return
		this.cmdAudioInputMute(channelKey, !this.self.audioInputMute[ch])
	}
	public cmdMainBusMute(on: boolean): void {
		this.sendCmd(this.dth('012103', on ? '01' : '00'))
		this.self.mainBusMute = on
		this.self.changedState()
	}
	public cmdMainBusMuteToggle(): void {
		this.cmdMainBusMute(!this.self.mainBusMute)
	}
	public cmdAuxBusMute(aux: AuxId, on: boolean): void {
		this.sendCmd(this.dth(aux === 1 ? '012203' : '012403', on ? '01' : '00'))
		if (aux === 1) this.self.aux1BusMute = on
		else this.self.aux2BusMute = on
		this.self.changedState()
	}
	public cmdAuxBusMuteToggle(aux: AuxId): void {
		this.cmdAuxBusMute(aux, aux === 1 ? !this.self.aux1BusMute : !this.self.aux2BusMute)
	}

	public cmdSetFreeze(on: boolean): void {
		this.sendCmd(this.dth('020900', on ? '01' : '00'))
	}
	public cmdFreezeOn(): void {
		this.cmdSetFreeze(true)
	}
	public cmdFreezeOff(): void {
		this.cmdSetFreeze(false)
	}
	public cmdFreezeToggle(): void {
		const n = !this.self.freezeActive
		this.cmdSetFreeze(n)
		this.self.freezeActive = n
		this.self.changedState()
	}

	public cmdSetInputFreeze(inputKey: string, on: boolean): void {
		const idx = INPUT_FREEZE_IDX[inputKey]
		if (idx === undefined) {
			this.self.log('warn', `Unknown freeze input: ${inputKey}`)
			return
		}
		this.sendCmd(this.dth(`0209${idx.toString(16).toUpperCase().padStart(2, '0')}`, on ? '01' : '00'))
		this.self.inputFreezeEnabled[idx] = on
		this.self.changedState()
	}
	public cmdSetInputFreezeToggle(inputKey: string): void {
		const idx = INPUT_FREEZE_IDX[inputKey]
		if (idx === undefined) return
		this.cmdSetInputFreeze(inputKey, !this.self.inputFreezeEnabled[idx])
	}

	// Stream & Record. Confirmed by packet capture on 2026-09-04 against the Roland RCS
	// software over four clean on/off cycles: the client writes 0A0800 (01 start, 00 stop)
	// and the device reports 030800 status. It pushes that status to the RCS session, but not
	// to ours, so 030800 is polled with everything else. The parse branch still handles a
	// push if one ever arrives.
	//
	// This replaces 03020F, which earlier notes recorded as "record on/off". 03020F did not
	// appear once in the 2026-09-04 capture, so it was either a different function or has
	// changed with firmware. Do not reinstate it without a fresh capture.
	//
	// On this unit livestreaming and recording share one trigger and cannot be started
	// separately (Reference manual p. 67), so 0A0800 starts whichever of Live Streaming,
	// Video Rec and Audio Rec are enabled on the device.
	public cmdStreamRecordStart(): void {
		this.sendCmd(this.dth('0A0800', '01'))
	}
	public cmdStreamRecordStop(): void {
		this.sendCmd(this.dth('0A0800', '00'))
	}

	public cmdTestPattern(patternId: string): void {
		const p = TEST_PATTERNS.find((x) => x.id === patternId)
		if (!p) return
		if (this.self.testPattern === p.value) {
			this.sendCmd(this.dth('02015E', '00'))
			this.self.testPattern = 0
		} else {
			this.sendCmd(this.dth('02015E', this.hb(p.value)))
			this.self.testPattern = p.value
		}
		this.self.changedState()
	}
	public cmdTestPatternOff(): void {
		this.sendCmd(this.dth('02015E', '00'))
		this.self.testPattern = 0
		this.self.changedState()
	}

	private async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	// Capture a live input into a still memory slot.
	//
	// Sequence confirmed 2026-09-04 by capturing the Roland RCS software over six captures
	// (Still 3-8, HDMI 1 and SDI 1). RCS sends exactly four commands:
	//
	//   0A0501,<slot>   select still slot
	//   0A0504,03       arm       -> device replies 0A0504,04 when ready, ~560ms later
	//   0A0500,<source> select source
	//   0A0504,07       execute   -> device replies 0A0504,08 done, then 0A0504,0A refreshed
	//
	// Everything else in the older 14-command version (04, 05, 08, 0A, 00) is the device
	// talking back, not client commands. The original sequence was reconstructed from logs
	// that mixed both directions, so the module was replaying the device's own status at it.
	// Do not add those back.
	public async cmdCaptureImage(stillSlot: number, sourceKey: string): Promise<void> {
		const srcByte = CAPTURE_SRC[sourceKey]
		if (srcByte === undefined) {
			this.self.log('warn', `Unknown capture source: ${sourceKey}`)
			return
		}
		const slotHex = this.hb(Math.max(0, Math.min(31, Math.round(stillSlot) - 1)))

		this.sendCmd(this.dth('0A0501', slotHex))
		await this.delay(250)
		this.sendCmd(this.dth('0A0504', '03'))
		// The device needs roughly 560ms to answer 04 (ready) after arming. Waiting longer
		// than observed rather than racing it, since a premature execute is silent.
		await this.delay(800)
		this.sendCmd(this.dth('0A0500', this.hb(srcByte)))
		await this.delay(250)
		this.sendCmd(this.dth('0A0504', '07'))
		this.self.log('info', `Capture requested: Still ${stillSlot} <- ${sourceKey}`)
		// Capture mode leaves its screen up on the monitor, so dismiss it once the still is
		// written - but not a moment before. The device needs far longer than its own
		// 0A0504,08 (done) reply suggests: 0.8.0 closed at 500ms and broke the capture
		// outright, 0.8.1 at 1200ms was still too early on hardware. 7000ms is the tested
		// figure. It is a long time to hold, so it is deliberately the last thing in the
		// sequence and nothing waits on it.
		//
		// cmdCloseCaptureScreen is a no-op unless the device has told us the screen is
		// actually up, so a capture that leaves none is untouched. One consequence of the
		// long wait: starting a second capture inside 7s means the first close can land on
		// the second capture's screen. Firing captures that fast is not a real workflow, and
		// the gate keeps it to a closed screen rather than an opened one.
		await this.delay(7000)
		// Logged so the next hardware run shows whether this fired and what the device
		// thought the screen was doing, without needing another packet capture.
		this.self.log('info', `Exiting capture function (screen reported ${this.self.captureModeOpen ? 'open' : 'closed'})`)
		await this.cmdExitCaptureFunction()
	}

	public cmdRaw(cmd: string): void {
		this.sendCmd(cmd)
	}
}
