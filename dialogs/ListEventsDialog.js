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
            choices: ChoiceFactory.toChoices(['Today', 'This Week', 'Next Week'])
        });
    }   

    async listStep(step) {

        var result;
        switch (step.result.value) {
            case "Today":
                result  = await helpers.eventSearchToday(step.values.state)
                break;
            case "This Week":
                result  = await helpers.eventSearchWeekDate(step.values.state, new Date())
                break;
            case "Next Week":
                var dt = new Date();
                dt.setDate(dt.getDate() + 7)
                result  = await helpers.eventSearchWeekDate(step.values.state, dt)
                break;
        }

        if (typeof(result.EventList["Event"]) == "undefined") {
            return step.context.sendActivity(`No events found in ${step.values.state} ${step.result.value}`);
        } else { 
            var events = result.EventList["Event"]
            var eventmessage = `Found ${events.length} events in ${step.values.state} ${step.result.value}:`;
            step.context.sendActivity(eventmessage);

            if (step.context.channel == "messenger") {
                var mdtable = createEventTable(events);
                await step.context.sendActivity(mdtable);
            }
            else {
                //var attachments = createEventAttachments(events);
                //await step.context.sendActivity(MessageFactory.list(attachments));
                //await step.context.sendActivity(MessageFactory.carousel(attachments));
            }
            return step.endDialog()
        }
    }
}

function findFirst(events)
{
    var first = 0;
    var check = events[first];

    // loop through the events and order by date
    for(var i = 1; i < events.length-1; i++){
        // if the event start date is after the next event, make a note of who is now first 
        if (events[i].StartDate.Date<check.StartDate.Date)
        {
            first=i;
            check = events[first];
        }
    }

    return first;
}

function orderEvents(events)
{
    // order the events
    var orderedEvents = []
    eventsCopy = JSON.parse(JSON.stringify(events));
    for(var i = 0; i < events.length; i++){
        var first = findFirst(eventsCopy);
        // push the copy to new events
        orderedEvents.push(eventsCopy[first]);
        // remove the event from the copy
        eventsCopy.splice(first, 1);
    }

    return orderedEvents;
}

function createEventTable(events)
{
    events = orderEvents(events)

    // display the cards
    var eventMarkdown = "| | | | |\n|-|-|-|-|\n";
    for(var i = 0; i < events.length; i++){

        var displayEvent = events[i];

        // get the organisation id
        var eventOrganiserId = displayEvent.Organiser.OrganisationId;
        var eventOrganiserName = helpers.getOrganisationName(eventOrganiserId);

        //  Change the event card
        var title = `${displayEvent.EventId}: ${helpers.getDayOfWeek(displayEvent.StartDate.Date)}, ${displayEvent.StartDate.Date} ${displayEvent.Name}`;
        var eventurl = `https://eventor.orienteering.asn.au/Events/Show/${displayEvent.EventId}`;
        var imageurl = `https://eventor.orienteering.asn.au/Organisation/Logotype/${eventOrganiserId}?type=SmallIcon`;
        var nicedate = dateFormat(displayEvent.StartDate.Date, "d mmm")
        var niceday = helpers.getDayOfWeek(displayEvent.StartDate.Date).substring(0,3)

        var name = displayEvent.Name
        if (displayEvent.Name.length>40){
            name  = name.substring(0,37) + "..."
        }

        eventMarkdown += `|__${displayEvent.EventId}__| ${niceday}, ${nicedate} | ${name} | [link](${eventurl})|\n`;
    }
    return eventMarkdown
}

function createHeroEventAttachments(events)
{
    events = orderEvents(events)
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

function createEventAttachments(events)
{
    events = orderEvents(events)
    var attachments = [];

    // display the cards
    for(var i = 0; i < events.length; i++){

        var sourceEventCard = require('../resources/eventCard.json');
        
        // create clone of adaptive card
        //var displayEventCard = Object.assign({}, sourceEventCard);
        var displayEventCard =JSON.parse(JSON.stringify(sourceEventCard));
        
        var displayEvent = events[i];

        // get the organisation id
        var eventOrganiserId = displayEvent.Organiser.OrganisationId;
        var eventOrganiserName = helpers.getOrganisationName(eventOrganiserId);
        var body =  displayEventCard.body[0]

        //  Change the event card
        body.columns[0].items[0].text = displayEvent.EventId // Event Number
        body.columns[0].items[1].text = displayEvent.Name // Event name
        body.columns[0].items[2].text = eventOrganiserName // Organiser
        body.columns[0].items[3].text = helpers.getDayOfWeek(displayEvent.StartDate.Date) + " " + displayEvent.StartDate.Date // Event Date

        // Logo
        body.columns[1].items[0].url = `https://eventor.orienteering.asn.au/Organisation/Logotype/${eventOrganiserId}?type=LargeIcon`

        // button url
        displayEventCard.actions[0].url = `https://eventor.orienteering.asn.au/Events/Show/${displayEvent.EventId}`
        
        var eventAdaptiveCard = CardFactory.adaptiveCard(displayEventCard);

        // push the completed card into 
        attachments.push(eventAdaptiveCard)
    }
    return attachments;
}

module.exports.ListEventsDialog = ListEventsDialog;
module.exports.createEventAttachments = createEventAttachments;
module.exports.createHeroEventAttachments = createHeroEventAttachments;
module.exports.createEventTable = createEventTable;
