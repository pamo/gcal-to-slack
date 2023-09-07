import { APIGatewayEvent, Context, Callback } from "aws-lambda";
import { google } from "googleapis";
import { WebClient } from "@slack/web-api";

export async function handler(
  event: APIGatewayEvent,
  context: Context,
  callback: Callback,
): Promise<any> {
  try {
    // Load Google Calendar API credentials from environment variables
    const googleCreds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

    // Create a Google Calendar API client
    const auth = new google.auth.GoogleAuth({
      credentials: googleCreds,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });
    const calendar = google.calendar({ version: "v3", auth });

    // Specify the calendar ID you want to access
    const calendarId = "your-calendar-id@example.com";

    // Fetch upcoming events
    const events = await calendar.events.list({
      calendarId,
      timeMin: "2023-09-01T00:00:00Z",
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    // Prepare messages for Slack
    const slack = new WebClient(process.env.SLACK_API_TOKEN);
    const slackChannel = "#your-slack-channel";

    let message = "";
    if (!events.data.items || events.data.items.length === 0) {
      message = "No upcoming events found on your calendar.";
    } else {
      message = "Upcoming events on your calendar:\n";
      events.data.items.forEach((event: any) => {
        const start = event.start.dateTime || event.start.date;
        message += `- ${event.summary} at ${start}\n`;
      });
    }

    // Send the message to Slack
    await slack.chat.postMessage({
      channel: slackChannel,
      text: message,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify("Event notifications sent to Slack!"),
    };

    callback(null, response);
  } catch (error) {
    console.error("Error:", error);

    const response = {
      statusCode: 500,
      body: JSON.stringify("Error occurred while processing the request."),
    };

    callback(null, response);
  }
}
