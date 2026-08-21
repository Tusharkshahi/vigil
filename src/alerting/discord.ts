import axios from 'axios';
import { ChangeReport } from '../types';

/**
 * Send a Discord alert for packages with breaking changes.
 * Uses Discord's Incoming Webhooks with embeds.
 */
export async function sendDiscordAlert(
  webhookUrl: string,
  reports: ChangeReport[]
): Promise<void> {
  const breaking = reports.filter((r) => r.hasBreaking);
  if (breaking.length === 0) return;

  const embeds = breaking.slice(0, 10).map((report) => ({
    title: `${report.package} ${report.version}`,
    url: report.url,
    color: 0xff4444, // red
    description: report.breaking
      .slice(0, 5)
      .map((b) => `• ${b.summary}`)
      .join('\n'),
    footer: {
      text: `Released: ${report.date}`,
    },
  }));

  await axios.post(webhookUrl, {
    username: 'Vigil',
    avatar_url: 'https://raw.githubusercontent.com/Tusharkshahi/vigil/main/assets/vigil-logo.png',
    content: `🚨 **${breaking.length} breaking change${breaking.length > 1 ? 's' : ''} detected** in your stack`,
    embeds,
  });
}
