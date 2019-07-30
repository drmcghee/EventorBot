// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { ActivityHandler } = require('botbuilder');
const { DialogSet, ChoicePrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { ListEventsDialog } = require('../dialogs/ListEventsDialog');
const { EventDetailDialog } = require('../dialogs/EventDetailDialog');

const MENU_DIALOG = 'menuDialog';
const MENU_PROMPT = 'menuPrompt';
const LIST_EVENTS_DIALOG = 'ListEventsDialog';
const EVENT_DETAIL_DIALOG = 'EventDetailDialog';

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
        

        this.onMembersAdded(async (context, next) => {
            const dialogContext = await this.dialogs.createContext(context);
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {

                    var welcomeMessage = "Hello and welcome to the Eventor Australia bot!"
                    if (typeof(context.activity.from.Name) != "undefined") {
                        welcomemessage = `Hello ${context.activity.from.Name} and welcome to the Eventor Australia bot!`
                    }
                    if (typeof(context.channel) != "undefined") {
                        welcomemessage += `(${context.channel})`
                    }
                    await context.sendActivity(welcomeMessage);

                     // bring back the sub orgs  -- at a later date this should be moved
                    if (helpers.isEmpty(helpers.$mystate))
                        await helpers.listSubOrganisations(2)

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
        return step.prompt(MENU_PROMPT, {
            choices: ["List Events", "Event Detail"],
            prompt: "What event action do you want to take?",
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
