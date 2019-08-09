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
    //TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');


const STATE_PROMPT = 'STATE_PROMPT';
const TIME_PROMPT = 'TIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class ClosingEventsDialog extends ComponentDialog {
    constructor(userState) {
        super('ClosingEventsDialog');

        this.self = this;
        //something = this;
        
        this.addDialog(new ChoicePrompt(STATE_PROMPT));
        this.addDialog(new ChoicePrompt(TIME_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.stateStep,
            this.listStep
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

     async stateStep(step) {

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        return await step.prompt( STATE_PROMPT, {
            prompt: 'Closing events for which state?',
            choices: ChoiceFactory.toChoices(['NSW', 'QLD', 'VIC', 'SA', 'WA', 'NT', 'ACT'])
        });
    } 

    async listStep(step) {
        var searchDays = 60;
        var closingDays = 14;
        var today = new Date();
        var closingEvents = [];
        var closingDate = helpers.addDays(today, closingDays)

        step.values.state = step.result.value;

        // get all events for the state in next 2 months
        var result = await helpers.eventSearchDays(step.values.state, searchDays);
        var events = result.EventList["Event"];
        events = helpers.orderEvents(events);
        
        // filter out those closing in next weeks
        for(var i = 0; i < events.length; i++) {
            var event = events[i];
            //var entryBreakType = typeof(event.EntryBreak)

            if (event.hasOwnProperty("EntryBreak")){
                if (event.EntryBreak.hasOwnProperty("length")){
                   for(var eb = 0; eb < event.EntryBreak.length; eb++) {
                       var eventBreak = event.EntryBreak[eb];
                       if (eventBreak.hasOwnProperty("ValidToDate"))
                       {
                            var closingDate = eventBreak.ValidToDate.Date;
                            //var closingTime = event.EntryBreak[eb].ValidToDate.Clock

                            //Check if the closing date is within next closing days
                            if (eventValidTo <closingDate) {
                                closingEvents.push(event);
                                break;
                            }
                        }
                   }
                }
                else
                {
                    var eventValidTo = event.EntryBreak.ValidToDate.Date
                    var closingTime = event.EntryBreak.ValidToDate.Clock

                    //Check if the closing date is within next closing days
                    if (eventValidTo <closingDate) {
                        closingEvents.push(event);
                        break;
                    }
                }
            }
        }

        // if results found or not
        if (closingEvents.length==0) {
            var eventmessage = `No closing events found in ${step.values.state} in the next ${closingDays} days (search of ${searchDays} days)`;
            return step.context.sendActivity(eventmessage);
        } else { 
            var eventmessage = `Found ${closingEvents.length} closing events in ${step.values.state} in the next ${closingDays} days (searched events upto ${searchDays} days ahead) :`;
            await step.context.sendActivity(eventmessage);

            if (step.context.activity.channelId == "facebook") {
                var mdtable = helpers.createEventMarkdownTable(closingEvents);
                await step.context.sendActivity(mdtable);
            }
            else {
                var attachments = helpers.createEventAttachments(closingEvents);
                //await step.context.sendActivity(MessageFactory.list(attachments));
                await step.context.sendActivity(MessageFactory.carousel(attachments));
            }
            return step.endDialog()
        }
    }
}

module.exports.ClosingEventsDialog = ClosingEventsDialog;
