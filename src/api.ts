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

// How long after a capture starts before another one may. A second capture sent while the first
// was still finishing froze a V-80HD in capture mode on 2026-09-26, and only a power cycle
// recovered it. A capture's commands take about 1.3s and the screen closes at about 8.3s, so
// 10s leaves margin. The lock lives on ModuleInstance, not here, so a config save or reconnect
// mid-capture - which builds a new V80Api - cannot reset it.
export const CAPTURE_LOCK_MS = 10000

// Shown when the device refuses the password. The module does not retry on its own - see
// stopAfterAuthFailure - so the status says what the user has to do.
const AUTH_FAILED_STATUS = 'Authentication failed – check the password, then save the config'

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
	// Set by cmdRaw. While this is in the future, incoming data is echoed at info level so a
	// raw command's reply is visible in Companion's log - see cmdRaw.
	private rawEchoUntil = 0
	private debounceTimer?: NodeJS.Timeout
	private watchdogTimer?: NodeJS.Timeout
	private authSent = false
	private isConnected = false
	private isAuthenticated = false
	private lastRxTime = 0
	private cycleStartTime = 0
	// Connection messages already logged during the current outage - see logOncePerOutage.
	private outageMessages = new Set<string>()
	// Bumped whenever the connection to the device ends: destroyTcp(), a socket error, or
	// TCPHelper reporting any status but Ok, which covers its own reconnects as well as ours.
	// The capture sequence checks it after every wait - see waitSameSession.
	private session = 0

	constructor(self: ModuleInstance) {
		this.self = self
	}

	// A connection problem repeats for as long as it lasts. A switcher that is switched off fails
	// every reconnect attempt, and one held by the Roland RCS software ignores this session and
	// stalls every rebuild, indefinitely. Logged every time, that was an error every 2s and a
	// warning every 6-12s until it came back. The connection status already shows the outage
	// continuously, so each distinct message is logged once at its own level and repeats go to
	// debug. The set clears once a session authenticates, so the next outage is reported afresh.
	private logOncePerOutage(level: 'info' | 'warn' | 'error', message: string): void {
		const repeat = this.outageMessages.has(message)
		this.outageMessages.add(message)
		this.self.log(repeat ? 'debug' : level, message)
	}

	// The password lives in the secrets store from 0.7.0 on. The config fallback covers a
	// connection whose upgrade script has not run yet, so an existing setup keeps
	// authenticating instead of silently failing on the first connect after the update.
	private get password(): string {
		return (this.self.secrets?.password || this.self.config.password || '').trim()
	}

	// Trimmed, because a pasted address often carries a trailing space, and the connection error
	// that produces does not point at the cause.
	private get host(): string {
		return (this.self.config.host ?? '').trim()
	}

	public initTcp(): void {
		if (!this.host || !this.self.config.port) {
			this.self.updateStatus(InstanceStatus.BadConfig, 'Missing host/port')
			return
		}
		// The V-80HD accepts no LAN control until a network password is set on the unit (PROTOCOL.md
		// §1.1), so without one there is nothing to connect to. Connecting anyway used to mark the
		// session authenticated at once and poll straight into the device's password prompt - 65
		// lines every 500ms, each a candidate failed attempt towards the lockout.
		if (!this.password) {
			this.self.updateStatus(InstanceStatus.BadConfig, 'Enter the network password set on the device')
			return
		}
		this.self.updateStatus(InstanceStatus.Connecting)
		this.isConnected = false
		this.isAuthenticated = false
		this.rxBuffer = ''
		this.cycleStartTime = Date.now()
		this.tcp = new TCPHelper(this.host, this.self.config.port, { reconnect: true })
		this.tcp.on('status_change', (status, message) => {
			this.self.updateStatus(status, message)
			if (status !== InstanceStatus.Ok) {
				this.session++
				this.isConnected = false
				this.isAuthenticated = false
				this.stopPolling()
			}
		})
		this.tcp.on('error', (err) => {
			this.logOncePerOutage('error', `TCP error: ${err.message}`)
			this.session++
			this.isConnected = false
			this.stopPolling()
		})
		this.tcp.on('connect', () => {
			this.logOncePerOutage('info', `Connected to ${this.host}:${this.self.config.port}`)
			this.isConnected = true
			this.rxBuffer = ''
			this.authSent = false
			this.isAuthenticated = false
			this.lastRxTime = Date.now()
			this.cycleStartTime = Date.now()
			this.self.updateStatus(InstanceStatus.Connecting, 'Authenticating')
			// The device prompts "Enter password:" ~10ms after connect, and the password is sent
			// only in answer to it - see onPasswordPrompt. Sent unprompted, it is a stray line the
			// device parses as a command (observed ERR:0 on the wire, PROTOCOL.md §1.2).
			//
			// There used to be a 1.5s fallback that sent it anyway, for firmware that never
			// prompts. No V-80HD firmware is known to do that, and the fallback had a failure of
			// its own: a prompt arriving after it was read as a rejection of a correct password.
			// If no prompt comes at all - the device ignores a second control session - the
			// watchdog's authentication-stalled check rebuilds the connection.
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
		if (!this.tcp) return
		const now = Date.now()
		if (this.isConnected && this.isAuthenticated) {
			// Nudge the device if quiet, then give up. Poll replies normally arrive every 500ms,
			// so neither branch is reached; if they stop, the 1.5s nudge draws a reply that
			// resets the clock. Only a genuinely dead link reaches 4s.
			// Detection was 8s on a 2.5s tick (worst case 10.5s), which tested as too slow.
			if (now - this.lastRxTime > 1500) this.sendCmd(this.rqh('001500', '000001'))
			if (now - this.lastRxTime > 4000) this.forceReconnect('No response from device for 4s')
		} else if (this.isConnected) {
			// TCP is up but login never completed, and that is two different silences.
			//
			// Never prompted (authSent false): the device ignores a second control session, for
			// example while RCS holds it - it accepts the connection and sends nothing at all. A
			// fresh connection is the only way to retry, and it sends nothing until prompted.
			//
			// Prompted, answered, then silence (authSent true): the password went unanswered.
			// Rebuilding here used to answer the next prompt with the same password - one repeat
			// every ~6s, the loop stopAfterAuthFailure exists to prevent. The 2026-09-26 hardware
			// test saw wrong passwords draw no reply for 3s+, so treat it as a failed login.
			if (now - this.lastRxTime > 6000) {
				if (this.authSent) {
					this.stopAfterAuthFailure(
						'Authentication failed – no answer to the password within 6s',
						'No answer to the password – check it, then save the config',
					)
				} else {
					this.forceReconnect('Authentication stalled')
				}
			}
		} else {
			// Not connected: TCPHelper retries every 2s, but a connect attempt to an
			// unreachable host takes ~21s to time out on Windows. Recycling the socket every
			// 6s keeps attempts fresh without stacking timers.
			//
			// Was 12s until 1.0.3. Hardware test 2026-09-26: after a cable pull the link took up
			// to 12s to come back once the cable was restored, because a hung attempt waited out
			// the full cycle. 6s is safe because this branch only runs while no TCP connection
			// exists: faster attempts reach nothing, and nothing is ever sent to a switcher that
			// is up. Windows resends a connect after ~3s, so each cycle still makes two tries.
			if (now - Math.max(this.lastRxTime, this.cycleStartTime) > 6000) {
				this.forceReconnect('Still unreachable – retrying with a fresh connection')
			}
		}
	}

	private forceReconnect(reason: string): void {
		this.logOncePerOutage('warn', `Reconnecting: ${reason}`)
		this.destroyTcp()
		this.initTcp()
	}

	// `pushState` is false only from destroy(): the module is being removed, so there is nothing
	// left to update, and teardown should not be doing work. A reconnect or a config save still
	// pushes, so a fade flag cleared below reaches the buttons.
	public destroyTcp(pushState = true): void {
		this.session++
		this.stopPolling()
		this.stopDebounce()
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
		// Clear the fade flag, and only the fade flag.
		//
		// Nothing clears state on disconnect today: destroyTcp stops the timers, and
		// configUpdated builds a new V80Api around the same ModuleInstance, so every field
		// survives. For a fade that is plainly wrong - a fade is a one-second transient, so it
		// cannot still be running, and a link that dropped mid-fade left ftb_active lit and
		// $(ftb_fading) reading ON indefinitely.
		//
		// ftbEngaged is deliberately NOT cleared. The switcher keeps doing whatever it was
		// doing, so if the output was black when the link dropped it is still black, and the
		// last known value is more accurate than discarding it. Companion shows the connection
		// is down separately. It is re-read from QFTB within a cycle of reconnecting anyway.
		this.self.ftbFading = false
		if (pushState) this.self.changedState()
	}

	// A failed login ends this connection for good. Retrying cannot succeed - the password is the
	// one the device just refused - and every attempt counts towards the brute-force lockout, which
	// then refuses the correct password too (PROTOCOL.md §1.2). So close the socket, which also
	// stops the watchdog and TCPHelper's own reconnect, and stay closed. A retry comes from the
	// user: saving the config or re-enabling the connection builds a fresh V80Api.
	//
	// Before this, a failed login only stopped the watchdog. TCPHelper still reconnected after any
	// socket drop, and the new session answered the next prompt with the same wrong password.
	//
	// The status is set after destroyTcp() so nothing overwrites it. TCPHelper.destroy() removes
	// its listeners without emitting a status of its own.
	private stopAfterAuthFailure(logMessage: string, status: string): void {
		this.self.log('error', logMessage)
		this.destroyTcp()
		this.self.updateStatus(InstanceStatus.ConnectionFailure, status)
	}

	private sendPassword(): void {
		this.authSent = true
		this.tcp?.send(this.password + '\r\n').catch((err: Error) => this.self.log('debug', `TX failed: ${err.message}`))
	}

	private onPasswordPrompt(): void {
		if (this.authSent) {
			// Re-prompt after we already answered means the password was rejected. Do not
			// resend — answering every prompt with the same password loops until the device
			// locks out ("Wait a moment"), which then rejects even correct passwords.
			this.stopAfterAuthFailure('Authentication failed – device rejected the password', AUTH_FAILED_STATUS)
			return
		}
		// No empty-password branch: initTcp() refuses to connect without one, and the password
		// cannot change on this instance - a config save builds a new V80Api.
		this.sendPassword()
	}

	private handleIncoming(data: Buffer): void {
		this.lastRxTime = Date.now()
		if (Date.now() < this.rawEchoUntil) {
			// A raw command was sent in the last couple of seconds, so show what came back at info
			// level. Two things are deliberate here.
			//
			// The byte count comes first, because it is the only thing that distinguishes a real
			// multi-byte reply from a one-byte one - parseDth truncates every reply to its first
			// byte, so everything downstream of this line is blind to the difference. That is what
			// settled the block-read question on 2026-09-16.
			//
			// The frames are rendered readable rather than as raw hex. The first version logged hex
			// only, and a 242-byte segment of it is unreadable by eye - which is most of them, since
			// the device coalesces many replies into one segment. Control bytes are shown as their
			// names so the STX/LF framing stays visible.
			const readable = [...data]
				.map((b) => {
					if (b === 0x02) return '<STX>'
					if (b === 0x0a) return '<LF>'
					if (b === 0x0d) return '<CR>'
					if (b >= 0x20 && b <= 0x7e) return String.fromCharCode(b)
					return `<${b.toString(16).padStart(2, '0')}>`
				})
				.join('')
			this.self.log('info', `Raw RX [${data.length}b]: ${readable}`)
		}
		// No verbose TX/RX logging in released builds. There was an "Enable debug logging" checkbox
		// that logged every segment, frame and value at debug level, until 1.0.5. Companion 5
		// showed none of it, so the checkbox visibly did nothing, and locked on it would have been
		// 200+ lines a second for nobody. Diagnosis goes through the raw LAN command's info-level
		// echo above, or a packet capture. To put it back for a test build - never a release -
		// follow PROTOCOL.md §11.1, which lists every site it used.
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
			this.stopAfterAuthFailure('Authentication failed', AUTH_FAILED_STATUS)
			return
		}
		if (/^Wait a moment/i.test(line)) {
			// Device brute-force lockout — it will reject even the correct password until it
			// clears, and "the only remedy is to stop and wait" (PROTOCOL.md §1.2). This used to
			// set the status and carry on, so six seconds later the watchdog rebuilt the
			// connection and answered the next prompt with the password again, for as long as the
			// lockout lasted.
			this.stopAfterAuthFailure(
				'Device auth lockout active ("Wait a moment") – wait for it to clear, then disable and re-enable the connection',
				'Device auth lockout – wait, then disable and re-enable the connection',
			)
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
		// Idempotency guard. Two paths reach here - the "Welcome to" banner and the "VER:"
		// line - and the device sends both in one exchange, so without this the full 64-command
		// requestCoreState() burst goes out twice back to back and "Connection ready" is logged
		// twice. Safe because isAuthenticated is reset to false at every point a connection ends
		// or restarts, so a genuine re-authentication after a drop is never blocked.
		if (this.isAuthenticated) return
		this.isAuthenticated = true
		this.outageMessages.clear()
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
		// Reply to QFTB. This is the one command the module sends from Roland's other, mnemonic
		// command set - see cmdFadeToBlackQuery. Deliberately narrow: it matches FTB specifically
		// rather than opening a general parser for that language, because FTB is the only thing
		// we need from it and a loose parser would be a standing invitation to grow one.
		const ftb = /^FTB:(OFF|ON|FADEIN|FADEOUT)$/i.exec(frame)
		if (ftb) {
			this.onFtbState(ftb[1].toUpperCase())
			return
		}
		const m = /^DTH:([0-9A-Fa-f]{6}),([0-9A-Fa-f]*)$/i.exec(frame)
		if (!m) return
		this.parseDth(m[1].toUpperCase(), m[2].toUpperCase())
	}

	// The engaged Fade To Black state, which took until 2026-09-16 to find. It is not in the
	// DTH/RQH address map at all: three engage/hold/release cycles captured at the packet level
	// moved exactly one polled byte, 030207, and that is the fade-in-progress flag rather than
	// the state. Block reads return nothing and the device pushes nothing, so both obvious
	// search routes were exhausted. QFTB answers it directly.
	//
	// FADEIN and FADEOUT deliberately do not touch ftbEngaged. They report a transition in
	// flight, and which direction each name means is not documented unambiguously - so rather
	// than guess, the engaged state is left at whatever it was until the device settles on a
	// plain ON or OFF. ftbFading stays owned by 030207, which is polled as a byte and is the
	// faster of the two.
	private onFtbState(state: string): void {
		if (state === 'ON') this.self.ftbEngaged = true
		else if (state === 'OFF') this.self.ftbEngaged = false
		this.scheduleDebounce()
	}

	private parseDth(addr: string, hex: string): void {
		if (!hex || hex.length < 2) return
		const val = parseInt(hex.slice(0, 2), 16)
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
			// 00/01 pair is what tells us whether the screen is up. Nothing gates on it now
			// that the hand-driven close action is gone; it feeds the diagnostic log in
			// cmdCaptureImage and the 08 completion message below.
			case '0A0504':
				if (val === 0x00 || val === 0x01) this.self.captureModeOpen = val === 0x01
				if (val === 0x08) this.self.log('info', 'Image capture complete')
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
			// fade-in-progress flag, and it was the only polled byte that moved during that
			// capture. The engaged state is in no address at all - it is read with QFTB, see
			// onFtbState.
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
		// Fade To Black engaged state. The one command here from Roland's other, mnemonic command
		// set, and the only way to read this at all - it is in no DTH/RQH address, confirmed by
		// packet capture. Roland documents the two languages as usable on one connection and that
		// is now verified on hardware: QFTB answers correctly alongside 64 RQH per cycle.
		//
		// Not an RQH, so it cannot join the address array above - it goes on the end as itself.
		cmds.push('QFTB;')
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
		for (const cmd of cmds) {
			this.tcp.send(cmd + '\r\n').catch((err: Error) => this.self.log('debug', `TX failed: ${err.message}`))
		}
	}

	private startPolling(): void {
		if (this.pollingTimer) return
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
	//
	// Gated on the connection instead: `session` is the one the capture ran on, and the second
	// press is skipped if that connection has ended in the 300ms between them.
	public async cmdExitCaptureFunction(session: number): Promise<void> {
		this.cmdToggleCaptureMode()
		if (!(await this.waitSameSession(300, session))) {
			this.captureScreenMayBeOpen()
			return
		}
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

	// Freeze is a boolean the device holds until told otherwise, so it follows the optimistic
	// rule - the write updates local state and the feedback lights immediately, and the 500ms
	// poll corrects it if the device disagreed. Setting it here rather than in the three public
	// callers is what keeps On, Off and Toggle behaving identically: before this, only Toggle
	// updated state, so freeze_active behaved differently depending on which of the three
	// actions happened to be on the button. Input freeze already worked this way.
	public cmdSetFreeze(on: boolean): void {
		this.sendCmd(this.dth('020900', on ? '01' : '00'))
		this.self.freezeActive = on
		this.self.changedState()
	}
	public cmdFreezeOn(): void {
		this.cmdSetFreeze(true)
	}
	public cmdFreezeOff(): void {
		this.cmdSetFreeze(false)
	}
	public cmdFreezeToggle(): void {
		this.cmdSetFreeze(!this.self.freezeActive)
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

	// Waits, then reports whether the connection that was current when the wait began still is.
	// The capture sequence runs for about 8.5s in all, and a step that wakes after a disconnect,
	// a reconnect or a config change must not carry on: the device session it was driving has
	// gone. Worse, [CAPTURE IMAGE] is a toggle, so pressing it blind on a new session could
	// open the capture screen on the live multiview instead of closing it. Stopping leaves at
	// worst a capture screen up, which the log says to close on the unit.
	private async waitSameSession(ms: number, session: number): Promise<boolean> {
		await this.delay(ms)
		return session === this.session
	}
	private captureStopped(stillSlot: number): void {
		this.self.log(
			'warn',
			`Capture to Still ${stillSlot} stopped - the connection dropped part-way. Check the still, and close the capture screen on the unit if it is open.`,
		)
	}
	private captureScreenMayBeOpen(): void {
		this.self.log(
			'warn',
			'Capture screen not closed - the connection dropped first. Close it on the unit if it is still open.',
		)
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
		// Refused rather than queued while the previous capture is still finishing - see
		// CAPTURE_LOCK_MS. The press does nothing on the wire, and the capture_wait feedback
		// shows WAIT ! on the button until the lock ends.
		const lockedFor = this.self.captureLockedUntil - Date.now()
		if (lockedFor > 0) {
			this.self.log(
				'warn',
				`Capture ignored - the previous capture is still finishing. Try again in ${Math.ceil(lockedFor / 1000)}s.`,
			)
			this.self.refuseCapture()
			return
		}
		// Without a session every command below would be dropped one by one, each with its own
		// warning, and the lock would start for a capture that never happened.
		if (!this.isAuthenticated) {
			this.self.log('warn', 'Capture not started - not connected to the device')
			return
		}
		this.self.startCaptureLock()
		const slotHex = this.hb(Math.max(0, Math.min(31, Math.round(stillSlot) - 1)))
		const session = this.session

		// Each step is a command and the wait after it. Every wait checks the connection is still
		// the one the capture started on - see waitSameSession.
		const steps: [cmd: string, waitMs: number][] = [
			[this.dth('0A0501', slotHex), 250], // select still slot
			// The device needs roughly 560ms to answer 04 (ready) after arming. Waiting longer
			// than observed rather than racing it, since a premature execute is silent.
			[this.dth('0A0504', '03'), 800], // arm
			[this.dth('0A0500', this.hb(srcByte)), 250], // select source
		]
		for (const [cmd, waitMs] of steps) {
			this.sendCmd(cmd)
			if (!(await this.waitSameSession(waitMs, session))) {
				this.captureStopped(stillSlot)
				return
			}
		}
		this.sendCmd(this.dth('0A0504', '07')) // execute
		this.self.log('info', `Capture requested: Still ${stillSlot} <- ${sourceKey}`)
		// Capture mode leaves its screen up on the monitor, so dismiss it once the still is
		// written - but not a moment before. The device needs far longer than its own
		// 0A0504,08 (done) reply suggests: 0.8.0 closed at 500ms and broke the capture
		// outright, 0.8.1 at 1200ms was still too early on hardware. 7000ms is the tested
		// figure.
		//
		// Deliberately NOT awaited. Companion times an action out well before 7s, so awaiting
		// the dismissal made every capture log "Error executing action: Error: Call timed out"
		// and a stack trace - observed on hardware 2026-09-15, with the capture itself
		// completing correctly either side of it. The action now returns once the execute is
		// away, in about 1.3s, and the dismissal finishes on its own. Device behaviour is
		// unchanged; only the promise boundary moved.
		//
		// The close is cmdExitCaptureFunction, which is deliberately ungated on the screen state -
		// see the comment on it - but is skipped if the connection ends during the wait. A second
		// capture cannot start inside that wait: the capture lock covers it with margin.
		void this.dismissCaptureScreen(session)
	}

	// Split out of cmdCaptureImage so the action can resolve without waiting on it. Nothing
	// awaits this, so it has to swallow nothing: any failure is logged here or it is invisible.
	private async dismissCaptureScreen(session: number): Promise<void> {
		try {
			if (!(await this.waitSameSession(7000, session))) {
				this.captureScreenMayBeOpen()
				return
			}
			// Logged so a hardware run shows whether this fired and what the device thought the
			// screen was doing, without needing another packet capture.
			this.self.log(
				'info',
				`Exiting capture function (screen reported ${this.self.captureModeOpen ? 'open' : 'closed'})`,
			)
			await this.cmdExitCaptureFunction(session)
		} catch (err) {
			this.self.log('warn', `Capture screen dismissal failed: ${err instanceof Error ? err.message : String(err)}`)
		}
	}

	// The raw command action is an expert tool behind its own config gate, and the only reason
	// to reach for it is to see what the device actually does. So it reports both directions at
	// info level rather than debug: relying on the debug flag meant a reply could be invisible
	// because of a config checkbox or a log-level filter, which cost two hardware sessions on
	// 2026-09-15. If the send is refused, sendCmd logs its own warn immediately after this line.
	public cmdRaw(cmd: string): void {
		this.self.log('info', `Raw TX: ${cmd}`)
		this.rawEchoUntil = Date.now() + 2000
		this.sendCmd(cmd)
	}
}
