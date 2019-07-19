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

    async orgSearch() {
        eventorClient.orgSearch(query, function(orgsFound)
            {
                var len = orgsFound.OrganisationList["Organisation"].length
                var eventmessage = `Found ${len} Organisations!`
                console.log(eventmessage)
            })
    }

    async eventSearch() {
        eventorClient.eventSearch("2019-07-18", "2019-07-30", function(eventsFound)
            {
                //console.log('IN json result =%s',JSON.stringify(eventsFound))
                var len = eventsFound.EventList["Event"].length
                var eventmessage = `Found ${len} Events!`
                console.log(eventmessage)

                return  eventsFound
            })
    }

    async listStep(step) {
        step.values.state = step.result.value;

        var events = this.eventSearch();
        var len = eventsFound.EventList["Event"].length
        var eventmessage = `Found ${len} Events!`
        step.context.sendActivity(eventmessage);
    }
}

module.exports.ListEventsDialog = ListEventsDialog;