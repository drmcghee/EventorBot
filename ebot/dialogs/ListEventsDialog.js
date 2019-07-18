var eventorClient = require('../eventorClient.js');

const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    //ConfirmPrompt,
    //DialogSet,
    //DialogTurnStatus,
    //NumberPrompt,
    //TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');

//const { UserProfile } = require('../userProfile');

const STATE_PROMPT = 'STATE_PROMPT';
const TIME_PROMPT = 'TIME_PROMPT';
//const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
//const NAME_PROMPT = 'NAME_PROMPT';
//const NUMBER_PROMPT = 'NUMBER_PROMPT';
//const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class ListEventsDialog extends ComponentDialog {
    constructor(userState) {
        super('ListEventsDialog');

        this.addDialog(new ChoicePrompt(STATE_PROMPT));
        this.addDialog(new ChoicePrompt(TIME_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.stateStep,
            this.timeStep,
            this.listStep
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async stateStep(step) {
        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        return await step.prompt( STATE_PROMPT, {
            prompt: 'List events for which state?',
            choices: ChoiceFactory.toChoices(['NSW', 'QLD', 'VIC', 'SA', 'WA', 'NT', 'ACT'])
        });
    }


    async timeStep(step) {
        step.values.state = step.result.value;

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        return await step.prompt(TIME_PROMPT, {
            prompt:`List \r${step.values.state}\r events for what time period?`,
            choices: ChoiceFactory.toChoices(['This Week', 'This Month', 'Next Week', 'Next Month'])
        });
    }   


    async listStep(step) {
        step.values.state = step.result.value;

        var query = step.result.response;
        eventorClient.executeSearch(query, function(eventsFound)
            {
                results(eventsFound)
            })


        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
    }

    async results(eventsFound)
    {
        return step.context.sendActivity("Results!!!!");
    }
}

module.exports.ListEventsDialog = ListEventsDialog;