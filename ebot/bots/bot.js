// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { ActivityHandler } = require('botbuilder');

class EventorBot extends ActivityHandler {
    constructor() {
        super();

        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {

            const text = context.activity.text;
            
            // ??? how to catch the correct words and call the right dialog?
            await context.sendActivity(`You said '${ text }'`);

            // Create an array with the valid options
            const validOptions = ['list', 'help'];

            // If the `text` is in the Array, a valid color was selected and send agreement.
            var choice = "";
            if (validOptions.includes(text)) 
            {
                for (var option in validOptions) 
                {
                    if (option.indexOf(text) !== -1)
                    {
                        switch(option){
                            case 'list':
                                choice = option;
                                await this.dialog.run(context, this.dialogState);
                                break;
                            case 'help':
                                choice = option;
                                await context.sendActivity(`HELP!!`);
                                break;
                        }
                    }
                }
            } 
            
            if (choice =='') 
            {
                await context.sendActivity("I'm sorry, I dont understand. Please try 'help' for a list of commands");
            }


            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Hello and welcome!');
                    await context.sendActivity("What would you like to do?")
                    await context.sendActivity("* list - You can list upcoming events in the next week")
                    await context.sendActivity("* help - See the list of available commands")
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });
    }
}

module.exports.EventorBot = EventorBot;
