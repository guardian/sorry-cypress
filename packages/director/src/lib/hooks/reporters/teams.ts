import {
  HookEvent,
  isRunGroupSuccessful,
  ResultFilter,
  Run,
  RunGroupProgress,
  TeamsHook,
} from '@sorry-cypress/common';
import { getDashboardRunURL } from '@sorry-cypress/director/lib/urls';
import { getLogger } from '@sorry-cypress/logger';
import axios from 'axios';
import { truncate } from 'lodash';

interface TeamsReporterEventPayload {
  eventType: HookEvent;
  run: Run;
  groupId: string;
  groupProgress: RunGroupProgress;
  spec: string;
}

export async function reportToTeams(
  hook: TeamsHook,
  event: TeamsReporterEventPayload
) {
  if (
    !shouldReportTeamsHook(
      event.eventType,
      hook
    )
  ) {
    return;
  }
  const ciBuildId = event.run.meta.ciBuildId;
  let groupLabel = '';

  if (event.groupId !== event.run.meta.ciBuildId) {
    groupLabel = `, group ${event.groupId}`;
  }

  let title = '';
  let color = isRunGroupSuccessful(event.groupProgress)
    ? successColor
    : failureColor;

  switch (event.eventType) {
    case HookEvent.RUN_START:
      title = `:rocket: *Run started* (${ciBuildId}${groupLabel})`;
      break;
    case HookEvent.INSTANCE_START:
      title = `*Instance started* ${event.spec} (${ciBuildId}${groupLabel})`;
      break;
    case HookEvent.INSTANCE_FINISH:
      title = `*Instance finished* ${event.spec} (${ciBuildId}${groupLabel})`;
      break;
    case HookEvent.RUN_FINISH:
      title = `${
        isRunGroupSuccessful(event.groupProgress) ? '(happy)' : '(fail)'
      } *Run finished* (${ciBuildId}${groupLabel})`;
      break;
    case HookEvent.RUN_TIMEOUT:
      title = `:hourglass_flowing_sand: *Run timedout* (${ciBuildId})`;
      color = failureColor;
      break;
  }

  const {
    passes,
    pending,
    skipped,
    failures,
    retries,
  } = event.groupProgress.tests;

  const commitDescription =
    (event.run.meta.commit?.branch || event.run.meta.commit?.message) &&
    `*Branch:*\n${event.run.meta.commit.branch}\n\n*Commit:*\n${truncate(
      event.run.meta.commit.message,
      {
        length: 100,
      }
    )}`;

  axios({
    method: 'post',
    url: hook.url,
    data: {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0076D7",
      "summary": `${title}`,
      "sections": [{
          "activityTitle": `${title}`,
          "activitySubtitle": `${commitDescription}`,
          "activityImage": "https://teamsnodesample.azurewebsites.net/static/img/image5.png",
          "facts": [{
              "name": "Passed",
              "value": `${passes}`,
          }, {
              "name": "Failed or Skipped",
              "value": `${failures + skipped}`,
          }, {
              "name": "Retries",
              "value": `${retries}`,
          }],
          "markdown": true,
      }],
      "actions": [{
        "type": "openUrl",
        "title": "Tabs in Teams",
        "value": `${getDashboardRunURL}`,
      }],
    },
  }).catch((error) => {
    getLogger().error(
      { error, ...hook },
      `Error while posting hook to ${hook.url}`
    );
  });
}

export function shouldReportTeamsHook(
  event: HookEvent,
  hook: TeamsHook,
) {
  return (
    isTeamsEventFilterPassed(event, hook)
  );
}

export function isTeamsEventFilterPassed(event: HookEvent, hook: TeamsHook) {
  if (!hook.hookEvents || !hook.hookEvents.length) {
    return true;
  }

  return hook.hookEvents.includes(event);
}

const successColor = '#0E8A16';
const failureColor = '#AB1616';
