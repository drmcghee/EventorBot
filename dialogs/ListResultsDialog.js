//@ts-check
const  helpers = require('../helpers');
var dateFormat = require('dateformat');
const { AdaptiveCard, CardFactory, MessageFactory } = require("botbuilder");

const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    //ConfirmPrompt,
    //DialogSet,
    //DialogTurnStatus,
    //NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');


//const { UserProfile } = require('../userProfile');

const STATE_PROMPT = 'STATE_PROMPT';
const TIME_PROMPT = 'TIME_PROMPT';
//const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
//const NUMBER_PROMPT = 'NUMBER_PROMPT';
//const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class ListEventsDialog extends ComponentDialog {
    constructor(userState) {
        super('ListEventsDialog');

        this.self = this;
        //something = this;
        
        this.addDialog(new TextPrompt(NAME_PROMPT))
        this.addDialog(new ChoicePrompt(STATE_PROMPT));
        this.addDialog(new ChoicePrompt(TIME_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep,
            this.stateStep,
            this.timeStep,
            this.listStep
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async nameStep(step) {
        return await step.prompt(NAME_PROMPT, {
            prompt: 'Which name?'
        });
    }

     async stateStep(step) {
        step.values.name = step.result.value;

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        return await step.prompt( STATE_PROMPT, {
            prompt: 'List results for which state?',
            choices: ChoiceFactory.toChoices(['NSW', 'QLD', 'VIC', 'SA', 'WA', 'NT', 'ACT'])
        });
    } 

    async timeStep(step) {
        step.values.state = step.result.value;

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        return await step.prompt(TIME_PROMPT, {
            prompt:`List \r${step.values.state}\r results for what time period?`,
            choices: ChoiceFactory.toChoices(['Last Week', 'This Month'])
         });
    }   

    async listStep(step) {

        var result;
        var week;
        var dt = new Date(); // current date of week

        // search for events based on time step
        switch (step.result.value) {
            case "Last Week":
                dt.setDate(dt.getDate() - 7)
                week = helpers.defineWeek(dt)
                result  = await helpers.eventSearchWeek(step.values.state, week)
                break;``
            case "This Month":
                week = helpers.defineMonth(dt)
                result  = await helpers.eventSearchMonth(step.values.state, week)
                break;
        }

        // from the results, get the eventids and the query each event 
        // ie. /EventList/Event/EventId
        //url = "https://eventor.orienteering.asn.au/api/results/event?eventid={0}".format(eventId)

        // With each result find the surname matching!
        // /ResultList/ClassResult/PersonResult

        // better to GET a list all peoplea a find a specific person
        // GET https://eventor.orienteering.asn.au/api/persons/organisations/{organisationId} 

        // Need to find my personid
        // ask for password
        /// GET https://eventor.orienteering.org/api/authenticatePerson

        // maybe in past month
        // Returns results for a person in a number of events.
        // GET https://eventor.orienteering.org/api/results/person
        // returns ResultListList

        // Get the  competitor status 
        //      <CompetitorStatus value="MisPunch"/>
        // Get the time 
        //      <Time>1:19:57</Time>
        // Get the result position
        //      <ResultPosition>10</ResultPosition>


        // if results found or not
        // if (typeof(result.EventList["Event"]) == "undefined") {
        //     var eventmessage = `No events found in ${step.values.state} ${step.result.value.toLowerCase()} ${eventaddendum}`;
        //     return step.context.sendActivity(eventmessage);
        // } else { 
        //     var events = result.EventList["Event"]
        //     var eventmessage = `Found ${events.length} events in ${step.values.state} ${step.result.value.toLowerCase()} ${eventaddendum} :`;
        //     await step.context.sendActivity(eventmessage);


        //     if (step.context.activity.channelId == "facebook") {
        //         var mdtable = helpers.createEventMarkdownTable(events);
        //         await step.context.sendActivity(mdtable);
        //     }
        //     else {
        //         var attachments = helpers.createEventAttachments(events);
        //         //await step.context.sendActivity(MessageFactory.list(attachments));
        //         await step.context.sendActivity(MessageFactory.carousel(attachments));
        //     }
        //     return step.endDialog()
        // }

        await step.context.sendActivity("This feature is still being built");
    }
}

function createHeroEventAttachments(events)
{
    events = helpers.orderEvents(events)
    var attachments = [];

    // display the cards
    for(var i = 0; i < events.length; i++){

        var displayEvent = events[i];

        // get the organisation id
        var eventOrganiserId = displayEvent.Organiser.OrganisationId;
        var eventOrganiserName = helpers.getOrganisationName(eventOrganiserId);

        //  Change the event card
        var title = `${displayEvent.EventId}: ${helpers.getDayOfWeek(displayEvent.StartDate.Date)}, ${displayEvent.StartDate.Date} ${displayEvent.Name}`;
        var eventurl = `https://eventor.orienteering.asn.au/Events/Show/${displayEvent.EventId}`;
        var imageurl = `https://eventor.orienteering.asn.au/Organisation/Logotype/${eventOrganiserId}?type=SmallIcon`;

        
        var heroEventCard =  CardFactory.heroCard(
            `${title}`,
            null,
             CardFactory.actions([
                {
                    displayText: `${title}`,
                    type: 'openUrl',
                    title: 'Goto Event',
                    value: `'${eventurl}'`
                }
            ])
        );

        // push the completed card into 
        attachments.push(heroEventCard)
    }
    return attachments;
}


module.exports.ListResultsDialog = ListResultsDialog;
module.exports.createHeroEventAttachments = createHeroEventAttachments;
