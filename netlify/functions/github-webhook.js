exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const payload = JSON.parse(event.body);
  
  // Filter for new secret scanning alerts only
  if (payload.action !== 'created' || !payload.alert) {
    return { statusCode: 200, body: 'OK' };
  }

  const alertType = payload.alert.secret_type_display_name;
  const repoName = payload.repository.full_name;
  const alertUrl = payload.alert.html_url;
  const commitSha = payload.alert.most_recent_commit?.sha || 'unknown';

  const slackMessage = {
    text: '🚨 *New Secret Scanning Alert*',
    blocks: [{
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Type:*\n${alertType}` },
        { type: 'mrkdwn', text: `*Repo:*\n${repoName}` }
      ]
    }, {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Commit:* \`${commitSha}\`` }
    }, {
      type: 'actions',
      elements: [{ type: 'button', text: 'View Alert', url: alertUrl }]
    }]
  };

  // Send to Slack
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage)
  });

  return { statusCode: 200, body: 'Alert sent to Slack' };
};
