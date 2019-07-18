// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { ActivityHandler } = require('botbuilder');
const { DialogSet, ChoicePrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { ListEventsDialog } = require('../dialogs/ListEventsDialog');

const MENU_DIALOG = 'menuDialog';
const MENU_PROMPT = 'menuPrompt';
const LIST_EVENTS_DIALOG = 'ListEventsDialog';

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

        // Adds a waterfall dialog that prompts users for the top level menu to the dialog set
        this.dialogs.add(new WaterfallDialog(MENU_DIALOG, [
            this.promptForMenu,
            this.handleMenuResult,
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
        

        //     const text = context.activity.text;
            
        //     // ??? how to catch the correct words and call the right dialog?
        //     await context.sendActivity(`Helping you '${ text }'`);

        //     // Create an array with the valid options
        //     const validOptions = ['list', 'help'];

        //     // If the `text` is in the Array, a valid color was selected and send agreement.
        //     var choice = "";
        //     if (validOptions.includes(text)) 
        //     {
        //         for (var option in validOptions) 
        //         {
        //             if (option.indexOf(text) !== -1)
        //             {
        //                 switch(option){
        //                     case 'list':
        //                         choice = option;
        //                         await this.dialog.run(context, this.dialogState);
        //                         break;
        //                     case 'help':
        //                         choice = option;
        //                         await context.sendActivity(`HELP!!`);
        //                         break;
        //                 }
        //             }
        //         }
        //     } 
            
        //     if (choice =='') 
        //     {
        //         await context.sendActivity("I'm sorry, I dont understand. Please try 'help' for a list of commands");
        //     }


        //     // By calling next() you ensure that the next BotHandler is run.
        //     await next();
        // });

        this.onMembersAdded(async (context, next) => {
            const dialogContext = await this.dialogs.createContext(context);
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity("Hello and welcome to the Eventor Australia bot!")
                    await dialogContext.beginDialog(MENU_DIALOG);
                }
            }

            await this.conversationState.saveChanges(context);
            // By calling next() you ensure that the next BotHandler is run.
            //await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            //await this.conversationState.saveChanges(context, false);
            //await this.userState.saveChanges(context, false);
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
            choices: ["List Events", "Event Detail", "Help"],
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
        // const text = context.activity.text;
        // await context.sendActivity(`Helping you '${ text }'`);

        switch (step.result.value) {
            case "List Events":
                return step.beginDialog(LIST_EVENTS_DIALOG);
        }
        return step.next();
    }

}

module.exports.EventorBot = EventorBot;
