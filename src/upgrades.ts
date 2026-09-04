// src/upgrades.ts — Roland V-80HD
import type {
	CompanionMigrationAction,
	CompanionMigrationFeedback,
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { ModuleConfig } from './config.js'

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = [
	// v0.2.4+: Remap old split action IDs to consolidated source actions
	function (
		_context: CompanionUpgradeContext<ModuleConfig>,
		props: CompanionStaticUpgradeProps<ModuleConfig>,
	): CompanionStaticUpgradeResult<ModuleConfig> {
		const changes: CompanionMigrationAction[] = []
		for (const action of props.actions) {
			if (action.actionId === 'set_program_input') {
				action.actionId = 'set_program_source'
				action.options = { source: `input_${action.options.input ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'set_program_sdi') {
				action.actionId = 'set_program_source'
				action.options = { source: `sdi_${action.options.sdi ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'set_preview_input') {
				action.actionId = 'set_preview_source'
				action.options = { source: `input_${action.options.input ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'set_preview_sdi') {
				action.actionId = 'set_preview_source'
				action.options = { source: `sdi_${action.options.sdi ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'set_aux_input') {
				action.actionId = 'set_aux_source'
				action.options = { aux: String(action.options.aux ?? 1), source: `input_${action.options.input ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'set_aux_hdmi') {
				action.actionId = 'set_aux_source'
				action.options = { aux: String(action.options.aux ?? 1), source: `hdmi_${action.options.hdmi ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'set_aux_sdi') {
				action.actionId = 'set_aux_source'
				action.options = { aux: String(action.options.aux ?? 1), source: `sdi_${action.options.sdi ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'input_assign_hdmi') {
				action.actionId = 'input_assign_source'
				action.options = { slot: action.options.slot ?? 1, source: `hdmi_${action.options.hdmi ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'input_assign_sdi') {
				action.actionId = 'input_assign_source'
				action.options = { slot: action.options.slot ?? 1, source: `sdi_${action.options.sdi ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'input_assign_still') {
				action.actionId = 'input_assign_source'
				action.options = { slot: action.options.slot ?? 1, source: `still_${action.options.still ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'pinp_source_input') {
				action.actionId = 'pinp_set_source'
				action.options = { layer: action.options.layer ?? 1, source: `input_${action.options.input ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'pinp_source_hdmi') {
				action.actionId = 'pinp_set_source'
				action.options = { layer: action.options.layer ?? 1, source: `hdmi_${action.options.hdmi ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'pinp_source_sdi') {
				action.actionId = 'pinp_set_source'
				action.options = { layer: action.options.layer ?? 1, source: `sdi_${action.options.sdi ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'dsk_source_input') {
				action.actionId = 'dsk_set_source'
				action.options = { source: `input_${action.options.input ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'dsk_source_hdmi') {
				action.actionId = 'dsk_set_source'
				action.options = { source: `hdmi_${action.options.hdmi ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'dsk_source_sdi') {
				action.actionId = 'dsk_set_source'
				action.options = { source: `sdi_${action.options.sdi ?? 1}` }
				changes.push(action)
			}
			if (action.actionId === 'pinp_crop_h') {
				action.actionId = 'pinp_window_cropping_h'
				changes.push(action)
			}
			if (action.actionId === 'pinp_crop_v') {
				action.actionId = 'pinp_window_cropping_v'
				changes.push(action)
			}
			if (action.actionId === 'pinp_position_h') {
				action.actionId = 'pinp_window_position_h'
				changes.push(action)
			}
			if (action.actionId === 'pinp_position_v') {
				action.actionId = 'pinp_window_position_v'
				changes.push(action)
			}
			if (action.actionId === 'pinp_size') {
				action.actionId = 'pinp_window_size'
				changes.push(action)
			}
		}
		return { updatedConfig: null, updatedActions: changes, updatedFeedbacks: [] }
	},

	// 0.6.4: record_* renamed to stream_record_*. The 2026-09-04 packet capture showed the
	// trigger is 0A0800 and that it drives livestreaming and recording together, so the old
	// "Record" naming was wrong as well as pointing at the wrong address (03020F).
	function (
		_context: CompanionUpgradeContext<ModuleConfig>,
		props: CompanionStaticUpgradeProps<ModuleConfig>,
	): CompanionStaticUpgradeResult<ModuleConfig> {
		// record_toggle is deliberately absent: the toggle action was removed, so an old
		// record_toggle button has nothing sensible to migrate to. Start and Stop remain.
		const actionMap: Record<string, string> = {
			record_on: 'stream_record_start',
			record_off: 'stream_record_stop',
		}
		const changedActions: CompanionMigrationAction[] = []
		for (const action of props.actions) {
			const next = actionMap[action.actionId]
			if (next) {
				action.actionId = next
				changedActions.push(action)
			}
		}
		const changedFeedbacks: CompanionMigrationFeedback[] = []
		for (const feedback of props.feedbacks) {
			if (feedback.feedbackId === 'record_active') {
				feedback.feedbackId = 'stream_record_active'
				changedFeedbacks.push(feedback)
			}
		}
		return { updatedConfig: null, updatedActions: changedActions, updatedFeedbacks: changedFeedbacks }
	},
]
