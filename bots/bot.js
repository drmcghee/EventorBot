// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { ActivityHandler } = require('botbuilder');
const { DialogSet, ChoicePrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { ListEventsDialog } = require('../dialogs/ListEventsDialog');
const { EventDetailDialog } = require('../dialogs/EventDetailDialog');
const { ClosingEventsDialog } = require('../dialogs/ClosingEventsDialog');

const MENU_DIALOG = 'menuDialog';
const MENU_PROMPT = 'menuPrompt';
const LIST_EVENTS_DIALOG = 'ListEventsDialog';
const EVENT_DETAIL_DIALOG = 'EventDetailDialog';
const CLOSING_EVENTS_DIALOG = 'ClosingEventsDialog';

const  helpers = require('../helpers');

class EventorBot extends ActivityHandler {
    constructor(conversationState) {
        super();

        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        // if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        // if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');
        this.conversationState = conversationState;

        this.dialogState = this.conversationState.createProperty('DialogState');
        this.dialogs = new DialogSet(this.dialogState);
        this.dialogs.add(new ChoicePrompt(MENU_PROMPT));
        this.dialogs.add(new ListEventsDialog(LIST_EVENTS_DIALOG));
        this.dialogs.add(new EventDetailDialog(EVENT_DETAIL_DIALOG));
        this.dialogs.add(new ClosingEventsDialog(CLOSING_EVENTS_DIALOG))

        // Adds a waterfall dialog that prompts users for the top level menu to the dialog set
        this.dialogs.add(new WaterfallDialog(MENU_DIALOG, [
            this.promptForMenu,
            this.handleMenuResult,
            this.handleEnd,
        ]));
        
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const dialogContext = await this.dialogs.createContext(context);

            //if (context.activity.type === ActivityTypes.Message) {
            if (dialogContext.activeDialog) {
                await dialogContext.continueDialog();
            } else {
                await dialogContext.beginDialog(MENU_DIALOG);
            }
            //} 
            // else if (context.activity.type === ActivityTypes.ConversationUpdate) {
            //     if (this.memberJoined(turnContext.activity)) {
            //         await context.sendActivity(`Hey there!`);
            //         await dialogContext.beginDialog(MENU_DIALOG);
            //     }
            // }
            await this.conversationState.saveChanges(context);
        });
        
        /// Note: Facebook Only when you connect to a new account for the first time, the OnMembersAddedAsync will be triggered. Hence, you cannot make the bot forget the previous conversation and start over on the facebook channel.
        this.onMembersAdded(async (context, next) => {
            const dialogContext = await this.dialogs.createContext(context);
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {

                    var welcomeMessage = `Hello and welcome to the Eventor Australia bot!`
                    if (typeof(context.activity.from.Name) != "undefined") {
                        welcomeMessage = `Hello ${context.activity.from.Name} and welcome to the Eventor Australia bot!`
                    }
                    if (process.env.Diagnostic == "true")
                         welcomeMessage += `\n (Bot Version=${process.env.BotVersion}, Channel=${context.activity.channelId})`;
                    await context.sendActivity(welcomeMessage);

                    await dialogContext.beginDialog(MENU_DIALOG);
                }
            }

            await this.conversationState.saveChanges(context);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            //await this.conversationState.saveChanges(context, false);
            //await this.userState.saveChanges(context, false);
            console.log("on message")
            await next();
        });

    }

    /**
     * The first function in our waterfall dialog prompts the user with  options
     * It uses the ChoicePrompt added in the contructor and referenced by the MENU_PROMPT string. The array of 
     * strings passed in as choices will be rendered as suggestedAction buttons which the user can then click. If the 
     * user types anything other than the button text, the choice prompt will reject it and reprompt using the retryPrompt
     * string. 
     * @param step Waterfall dialog step
     */
    async promptForMenu(step) {

        var message = "What event action do you want to take?"
        return step.prompt(MENU_PROMPT, {
            choices: ["List Events", "Event Detail", "Closing Events"],
            prompt: message,
            retryPrompt: "I'm sorry, that wasn't a valid response. Please select one of the options"
        });
    }

    /**
     * This step handles the result from the menu prompt above. It begins the appropriate dialog based on which button 
     * was clicked. 
     * @param step Waterfall Dialog Step 
     */
    async handleMenuResult(step) {
        switch (step.result.value) {
            case "List Events":
                return step.beginDialog(LIST_EVENTS_DIALOG);
            case "Event Detail":
                return step.beginDialog(EVENT_DETAIL_DIALOG);
            case "Closing Events":
                return step.beginDialog(CLOSING_EVENTS_DIALOG); 
        }
        
        console.log("unexpected menu item - end menu dialog")
        return step.endDialog();    
    }

    async handleEnd(step) {
        console.log("handling end of dialog")
        await step.endDialog();    
        //await step.beginDialog(MENU_DIALOG);
    }
}

module.exports.EventorBot = EventorBot;
