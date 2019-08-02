//@ts-check

const {ConversationState, MemoryStorage, TestAdapter} = require("botbuilder")
const {DialogSet, DialogTurnStatus, WaterfallDialog } = require("botbuilder-dialogs")
const {ListEventsDialog} = require("../dialogs/ListEventsDialog")
var dateFormat = require('dateformat');
const  helpers = require('../helpers');
var assert = require('assert');

// environment info
const dotenv = require('dotenv');
const path = require('path');
const ENV_FE = path.join(__dirname, '..//.env');
dotenv.config({ path: ENV_FILE });

describe('Eventor API - Get Events',  async() => {
  describe('#For one week',  async() => {
    it('should return events',  async () => {

        console.log("ENV_FILE=" + ENV_FILE)
        var d = new Date("August 1, 2019")
        var week = helpers.defineWeek(d)
        var result  = await helpers.eventSearchWeek("NSW", week)
        assert.equal(result.hasOwnProperty("EventList"), true);
    });
  });
});



// describe("First dialog tests", function() {

//     this.timeout(5000);
//     it("should call dialog", async () => {
//         const conversationState = new ConversationState(new MemoryStorage());
//         const dialogState = conversationState.createProperty("dialogState");
//         const dialogs = new DialogSet(dialogState);

//         // Adds a waterfall dialog that prompts users for the top level menu to the dialog set
//         dialogs.add(new ListEventsDialog("listevents"));
//         const adapter = new TestAdapter(async(context) => {
//             const dc = await dialogs.createContext(context);
//             const result = await dc.continueDialog();
//             if (result.status == DialogTurnStatus.empty){
//                 await dc.beginDialog("listevents") // , "What is the answer this question?")
//             }
//         })

//         await adapter.test("Hello","What is the answer this question?")
//     })
//});
