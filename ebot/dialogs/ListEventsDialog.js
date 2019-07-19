const eventorClient = require('../eventorClient');
const { eventSearch } = require('../helpers');

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
            choices: ChoiceFactory.toChoices(['This Week', 'This Month', 'Next Week', 'Next Month'])
        });
    }   

    async orgSearch() {
        eventorClient.orgSearch(query, function(orgsFound)
            {
                // var len = orgsFound.OrganisationList["Organisation"].length
                // var eventmessage = `Found ${len} Organisations!`
                // console.log(eventmessage)

                // // get a list of organisations that are in Australia only 
                // // ie. in XML this would be Organisation/ParentOrganisation/Organisation = 2

                // var orgs = orgsFound.OrganisationList["Organisation"]

                // // loop through orgs 
                // foreach org in orgs
                // {
                //     org.
                // }

                // // XPATH in node.JS?
                //list.filter(function (item) { return item.foo == 'bar'})

                // //obj.items.filter 
                // // npm PACKAGE UNDERSCORE 
                // var filtered = _.where(orgs, {ParentOrganisation{Organisation: "2"});

                // return orgsFound
            })
    }

    async searchByKey(key) {
        for (var i = 0, l = arr.length; i < l; i++){
          if (arr[i]['Key'] === key) {
            return arr[i]['Values'];
          }
        }
        return false;
      }

    async listStep(step) {
        //remember state slected
        step.values.state = step.result.value;

        // wait for event search to return and then updat the event message
        await eventorClient.eventSearch("2019-07-18", "2019-07-30", await function(eventsFound)
        {
            //console.log('IN json result =%s',JSON.stringify(eventsFound))
            var len = eventsFound.EventList["Event"].length
            var eventmessage = `Found ${len} Events!`
            console.log(eventmessage)

            console.log("sending message")
            step.context.sendActivity(eventmessage);
        })

        // looks like this is dying and therefore the step has gone!

    }
}

module.exports.ListEventsDialog = ListEventsDialog;