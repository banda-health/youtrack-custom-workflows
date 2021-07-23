/**
 * This is a template for an on-change rule. This rule defines what
 * happens when a change is applied to an issue.
 *
 * For details, read the Quick Start Guide:
 * https://www.jetbrains.com/help/youtrack/standalone/2021.3/Quick-Start-Guide-Workflows-JS.html
 */

const entities = require('@jetbrains/youtrack-scripting-api/entities');
const bandaHealthBoardName = 'Banda Health';

const isCurrentSprint = (sprint) => sprint.finish >= new Date().getTime() && sprint.start <= new Date().getTime();
const isNextSprint = (sprint) =>
	sprint.finish >= new Date().setDate(new Date().getDate() + 14) &&
	sprint.start <= new Date().setDate(new Date().getDate() + 14);
const getBandaBoardCurrentSprint = () =>
	entities.Agile.findByName(bandaHealthBoardName)?.sprints.entries().find(isCurrentSprint);
const getBandaBoardNextSprint = () =>
	entities.Agile.findByName(bandaHealthBoardName)?.sprints.entries().find(isNextSprint);

exports.rule = entities.Issue.onChange({
	title: 'Update Banda Health Board Sprint and Discussion Type',
	guard: (ctx) => {
		// Only run this if:
		// 1. The discussion type changes
		// 2. The sprint changes (and the type isn't a bug)
		// 3. The state changes to "done"
		return (
			ctx.issue.fields.isChanged(ctx.DiscussionType.name) ||
			(ctx.issue.fields.isChanged('Sprint') && ctx.issue.fields.Type !== ctx.Type.bug) ||
			(ctx.issue.fields.isChanged(ctx.State.name) && ctx.issue.fields.State === ctx.State.done)
		);
	},
	action: (ctx) => {
		const issueFields = ctx.issue.fields;
		const currentSprint = getBandaBoardCurrentSprint();
		const nextSprint = getBandaBoardNextSprint();

		// If the discussion type changed, we need to update the sprint
		if (issueFields.isChanged(ctx.DiscussionType.name)) {
			// Since the discussion type changed, we're going to clear all sprint assignments
			issueFields.Sprint.clear();

			if (issueFields.DiscussionType === ctx.DiscussionType.thisSprint) {
				// The current sprint needs to be assigned because that's what the discussion type was changed to
				issueFields.Sprint.add(currentSprint);
			} else if (issueFields.DiscussionType === ctx.DiscussionType.nextSprint && nextSprint) {
				// The next sprint needs to be assigned because that's what the discussion type was changed to
				issueFields.Sprint.add(nextSprint);
			}
		} else if (issueFields.isChanged('Sprint')) {
			// Since the sprint changed, we need to update the discussion type value (potentially)
			if (issueFields.Sprint.entries().find((sprint) => sprint === currentSprint) && issueFields.DiscussionType !== ctx.DiscussionType.thisSprint) {
				// Since the issue was added to the current sprint, assign the correct discussion type
				issueFields.DiscussionType = ctx.DiscussionType.thisSprint;
			} else if (
				nextSprint &&
				issueFields.Sprint.entries().find((sprint) => sprint === nextSprint) &&
				issueFields.DiscussionType !== ctx.DiscussionType.nextSprint
			) {
				// The sprint was assigned to the next sprint, so add it to the correct discussion type
				issueFields.DiscussionType = ctx.DiscussionType.nextSprint;
			} else {
				// Otherwise, just put the issue in the "later" column
				issueFields.DiscussionType = ctx.DiscussionType.later;
			}
		}
	},
	requirements: {
		DiscussionType: {
			type: entities.EnumField.fieldType,
			name: 'Discussion Type',
			nextSprint: {
				name: 'Push to developers for NEXT SPRINT',
			},
			thisSprint: {
				name: 'Developers doing THIS SPRINT',
			},
			later: {
				name: 'Later > 1 year',
			},
			done: {
				name: 'Done',
			},
		},
		Type: {
			type: entities.EnumField.fieldType,
			bug: {
				name: 'Bug',
			},
		},
		State: {
			type: entities.State.fieldType,
			done: {
				name: 'Done',
			},
		},
		Sprint: {
			type: entities.ProjectVersion.fieldType,
			multi: true,
		},
	},
});
