// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

//@ts-check
const dotenv = require('dotenv');
const path = require('path');
const restify = require('restify');

//const appInsights = require('applicationinsights');
//appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start();

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
//const { BotFrameworkAdapter } = require('botbuilder');
const { BotFrameworkAdapter, UserState, MemoryStorage, ActivityHandler, ConversationState } = require('botbuilder');

// Import our custom bot class that provides a turn handling function.
const { EventorBot } = require('./bots/bot');

// Import required bot configuration.
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

// Create adapter - See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
    // appId: null,
    // appPassword: null
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong!`);
    // Clear out state
    await conversationState.clear(context);
    // Save state changes.
    await conversationState.saveChanges(context);
};

// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.
let conversationState, userState;

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
conversationState = new ConversationState(memoryStorage);
userState = new UserState(memoryStorage);

// Create the main dialog.
//const dialog = new ListEventsDialog(userState);
const bot = new EventorBot(conversationState);

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open the emulator select "Open Bot"`);
});

// Listen for incoming requests. forwards to bot logic
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await bot.run(context);
    });
});