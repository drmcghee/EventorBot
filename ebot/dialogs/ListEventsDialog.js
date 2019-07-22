//const eventorClient = require('../eventorClient');
const  helpers = require('../helpers');
// const util = require('util');
const util = require('moment');

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

        this.self = this;
        //something = this;
        
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
        // bring back the sub orgs  -- at a later date this should be moved
        if (helpers.isEmpty(helpers.$mystate))
            await helpers.listSubOrganisations(2)

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
            choices: ChoiceFactory.toChoices(['Today', 'This Week', 'This Month', 'Next Week', 'Next Month'])
        });
    }   

    async listStep(step) {

        var result;
        switch (step.result.value) {
            case "Today":
                result  = await helpers.eventSearchToday(step.values.state)
                break;
            case "This Week":
                result  = await helpers.eventSearchWeek(step.values.state)
                break;
            case "This Month":
                console.log("Not implemented");
        }

        var eventmessage = `Result: ${result}!`;
        console.log(eventmessage);

        //todo: Order the events by day - add URL for eventor and put into an adaptive card
        if (typeof(result.EventList["Event"]) == "undefined") {
            return step.context.sendActivity(`No events found in ${step.values.state} ${step.result.value}`);
        } else { 
            var len = result.EventList["Event"].length;
            eventmessage = `Found ${len} Events!`;
            console.log(eventmessage);
            step.context.sendActivity(eventmessage);
            for(var i = 0; i <result.EventList["Event"].length; i++)
                step.context.sendActivity(`[${result.EventList["Event"][i].Name}](${result.EventList["Event"][i].WebURL})`);
            return;
        }
    }
}

module.exports.ListEventsDialog = ListEventsDialog;