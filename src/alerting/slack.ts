import axios from 'axios';
import { ChangeReport } from '../types';

/**
 * Send a Slack alert for packages with breaking changes.
 * Uses the Incoming Webhooks API — no bot token needed.
 */
export async function sendSlackAlert(
  webhookUrl: string,
  reports: ChangeReport[]
): Promise<void> {
  const breaking = reports.filter((r) => r.hasBreaking);
  if (breaking.length === 0) return;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚨 Vigil — Breaking Changes Detected',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${breaking.length} package${breaking.length > 1 ? 's' : ''} released breaking changes*`,
      },
    },
    { type: 'divider' },
    ...breaking.flatMap((report) => [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `*${report.package}* \`${report.version}\` — <${report.url}|Release notes>`,
            ...report.breaking.slice(0, 3).map((b) => `• ${b.summary}`),
            report.breaking.length > 3
              ? `_...and ${report.breaking.length - 3} more_`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      },
      { type: 'divider' },
    ]),
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Sent by <https://github.com/Tusharkshahi/vigil|Vigil> — self-healing changelog monitor`,
        },
      ],
    },
  ];

  await axios.post(webhookUrl, { blocks });
}
