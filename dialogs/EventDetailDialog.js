const  helpers = require('../helpers');
const { AdaptiveCard, CardFactory, MessageFactory } = require("botbuilder");

const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    //ConfirmPrompt,
    //DialogSet,
    //DialogTurnStatus,
    NumberPrompt,
    //TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');


//const { UserProfile } = require('../userProfile');
//const STATE_PROMPT = 'STATE_PROMPT';
//const TIME_PROMPT = 'TIME_PROMPT';
//const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
//const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
//const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class EventDetailDialog extends ComponentDialog {
    constructor(userState) {
        super('EventDetailDialog');

        this.self = this;
        //something = this;
        
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.numberStep,
            this.eventStep
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
 
    async numberStep(step) {
        return await step.prompt( NUMBER_PROMPT, {
            prompt: 'What is the event number?',
        });

    }
    
    async eventStep(step) {
        step.values.eventId = step.result.value;

        query = `/api/event/${step.result}`
        var result = await helpers.eventorRequest(query);
  
        //todo: Order the events by day - add URL for eventor and put into an adaptive card
        if (typeof(result) == "undefined") {
            return step.context.sendActivity(`No events found for id ${step.result.value}`);
        } else { 
            var sourceEventCard = require('../resources/eventCard.json');

            // create clone of adaptive card
            var displayEventCard =JSON.parse(JSON.stringify(sourceEventCard));
            var displayEvent = result.Event;

            // get the organisation id
            var eventOrganiserId = displayEvent.Organiser.Organisation.OrganisationId;
            var eventOrganiserName =  displayEvent.Organiser.Organisation.Name;
            var body =  displayEventCard.body[0]

            //  Change the event card
            body.columns[0].items[0].text = displayEvent.EventId // Event Number
            body.columns[0].items[1].text = displayEvent.Name // Event name
            body.columns[0].items[2].text = eventOrganiserName // Organiser
            body.columns[0].items[3].text = displayEvent.StartDate.Date // Event Date

            // Logo
            body.columns[1].items[0].url = `https://eventor.orienteering.asn.au/Organisation/Logotype/${eventOrganiserId}?type=LargeIcon`


            // buttonon url
            displayEventCard.actions[0].url = `https://eventor.orienteering.asn.au/Events/Show/${displayEvent.EventId}`
            
            await step.context.sendActivity({attachments: [CardFactory.adaptiveCard(displayEventCard)]});
            return step.endDialog()
        }
    }
}

module.exports.EventDetailDialog = EventDetailDialog;