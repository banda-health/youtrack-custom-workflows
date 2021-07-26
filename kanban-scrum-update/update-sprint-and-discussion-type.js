/**
 * This is a template for an on-change rule. This rule defines what
 * happens when a change is applied to an issue.
 *
 * For details, read the Quick Start Guide:
 * https://www.jetbrains.com/help/youtrack/standalone/2021.3/Quick-Start-Guide-Workflows-JS.html
 */

const entities = require('@jetbrains/youtrack-scripting-api/entities');
const bandaHealthBoardName = 'Banda Health';

const getSprints = () => {
	const sprints = [];
	entities.Agile.findByName(bandaHealthBoardName)
		.first()
		.sprints.forEach((sprint) => (!sprint.isArchived ? sprints.push(sprint) : null));
	// Sort the sprints by start date, then by name
	sprints.sort((sprintA, sprintB) =>
		sprintA.start < sprintB.start
			? -1
			: sprintA.start > sprintB.start
			? 1
			: sprintA.name < sprintB.name
			? -1
			: sprintA.name > sprintB.name
			? 1
			: 0,
	);
	let currentSprint, nextSprint;
	// If we have sprints, we'll figure this out
	if (sprints.length) {
		const today = new Date();

		// Find the index of the first sprint that starts after today
		const nextSprintIndex = sprints.findIndex((sprint) => sprint.start > today);

		// If we don't have a next, we'll say the current sprint is the last one
		if (nextSprintIndex === -1) {
			currentSprint = sprints[sprints.length - 1];
		} else {
			currentSprint = sprints[nextSprintIndex - 1];
			nextSprint = sprints[nextSprintIndex];
		}
	}

	return { currentSprint, nextSprint };
};

exports.rule = entities.Issue.onChange({
	title: 'Update Banda Health Board Sprint and Discussion Type',
	guard: (ctx) => {
		// Only run this if:
		// 1. The discussion type changes
		// 2. The sprint changes (and the type isn't a bug)
		// 3. The state changes to "done"
		return (
			ctx.issue.fields.isChanged(ctx.DiscussionType.name) ||
			(ctx.issue.fields.isChanged(ctx.Sprint.name) && ctx.issue.fields.Type !== ctx.Type.bug) ||
			(ctx.issue.fields.isChanged(ctx.State.name) && ctx.issue.fields.State.name === ctx.State.done.name)
		);
	},
	action: (ctx) => {
		const issueFields = ctx.issue.fields;
		const { currentSprint, nextSprint } = getSprints();

		// If the discussion type changed, we need to update the sprint
		if (issueFields.isChanged(ctx.DiscussionType.name)) {
			// Since the discussion type changed, we're going to clear all sprint assignments
			const issueCurrentSprintName = issueFields.Sprint?.name;

			if (issueFields.DiscussionType.name === ctx.DiscussionType.thisSprint.name && currentSprint) {
				if (issueCurrentSprintName !== currentSprint.name) {
					// The current sprint needs to be assigned because that's what the discussion type was changed to
					ctx.issue.applyCommand(`Board ${bandaHealthBoardName} ${currentSprint.name}`);
				}
			} else if (issueFields.DiscussionType.name === ctx.DiscussionType.nextSprint.name && nextSprint) {
				if (issueCurrentSprintName !== nextSprint.name) {
					// The next sprint needs to be assigned because that's what the discussion type was changed to
					ctx.issue.applyCommand(`Board ${bandaHealthBoardName} ${nextSprint.name}`);
				}
			} else {
				issueFields.Sprint = null;
			}
		} else if (issueFields.isChanged(ctx.Sprint.name)) {
			// Since the sprint changed, we need to update the discussion type value (potentially)
			if (currentSprint && issueFields.Sprint.name === currentSprint.name) {
				if (issueFields.DiscussionType.name !== ctx.DiscussionType.thisSprint.name) {
					// Since the issue was added to the current sprint, assign the correct discussion type
					issueFields.DiscussionType = ctx.DiscussionType.thisSprint;
				}
			} else if (nextSprint && issueFields.Sprint.name === nextSprint.name) {
				if (issueFields.DiscussionType.name !== ctx.DiscussionType.nextSprint.name) {
					// The sprint was assigned to the next sprint, so add it to the correct discussion type
					issueFields.DiscussionType = ctx.DiscussionType.nextSprint;
				}
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
			name: 'Sprint',
		},
	},
});
