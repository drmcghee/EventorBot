const https = require('https');
var $myStates = {} // could be hardcoded but best to read dynamically
var $myOrgs = "" // keep the list of all organisations
const { CardFactory } = require("botbuilder");
var dateFormat = require('dateformat');

async function eventSearchDay(state, day)
{
    shortday = day.toISOString().substring(0,10);
  
    return eventSearch(shortday, shortday, state)
}

async function eventSearchWeek(state, week)
{
    fromDate = week.start.toISOString().substring(0,10);
    toDate =  week.end.toISOString().substring(0,10);

    fromDate = week.start.toISOString().substring(0,10);
    toDate = week.end.toISOString().substring(0,10);

    return eventSearch(fromDate, toDate, state)
}

// Accepts a Date object or date string that is recognized by the Date.parse() method
function getDayOfWeek(date) {
    var dayOfWeek = new Date(date).getDay();    
    return isNaN(dayOfWeek) ? null : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
}


function defineWeek(week)
{    
    var dt = new Date();

    var weekDay = dt.getDay();
    var lessDays = weekDay == 0 ? 6 : weekDay - 1;
    var start = new Date(dt.setDate(dt.getDate() - lessDays));
    var end = new Date(new Date(start).setDate(start.getDate() + 6));
    
    return { start, end }
}

async function eventSearch (fromDate, toDate, state)
{
    stateId = $myStates[state]

    query = `/api/events?fromDate=${fromDate}&toDate=${toDate}&OrganisationIds=${stateId}`;//&includeAttributes=true
    var result = await eventorRequest(query);
    return result;
}

function getOrganisationName(OrganisationId)
{
    orgs = $myOrgs.OrganisationList.Organisation;

    for(var i = 0; i < orgs.length; i++) {
        var checkOrg = orgs[i];
        if (checkOrg.OrganisationId == OrganisationId)
            return checkOrg.Name
    }
    return "Missing Name";
}

async function listSubOrganisations(OrganisationId)
{
    // get states and organisations
    myStates = {};
    query = '/api/organisations';
    var result = await eventorRequest(query);
    $myOrgs = result
 
    // Look for all children of organisation
        //OrganisationList / OrganisationId / ParentOrganisationId
    orgs = result.OrganisationList.Organisation;
    
    for(var i = 0; i < orgs.length; i++)
    {
        var checkOrg = orgs[i];

        if (checkOrg.hasOwnProperty("ParentOrganisation") ) {
            var parentOrg = checkOrg.ParentOrganisation.OrganisationId;

            if (parentOrg ==OrganisationId){
                $myStates[`${checkOrg.ShortName}`] = checkOrg.OrganisationId
            }
        }
    }
}

function eventorRequest (path) {
   // need to wrap this in a promise to block until processed
   return new Promise(resolve => {
    console.log(`eventor request path = ${path}`);

       var options = {
           host: 'eventor.orienteering.asn.au',
           port: 443,
           path: path,
           method: 'GET',
           headers: {
               'User-Agent': 'eventor-bot',
               'ApiKey': process.env.EventorAPIKey
           }
       };

       var request =  https.request(options, function (response) {
           var xml = '';
           response.on('data', function (chunk) { xml += chunk; });
           response.on('end', async function () {
               //console.log('xml data =%s', xml);

               // resolve xml parse
               var json = await xml2json(xml)
               console.log(`eventor json response =${json}`);
               resolve(json)
           });
       });
       request.end();


   });
}

function xml2json (xml)  {
    return  new Promise((resolve, reject) => {
        var xml2js = require('xml2js');
        var parser = new xml2js.Parser({explicitArray : false});

        parser.parseString(xml, function (err, json) {
            if (err)
                reject(err)
            else
                resolve(json)
        }); 
    });   
}

// function getMonday( date ) {
//     var day = date.getDay() || 7;  
//     if( day !== 1 ) 
//         date.setHours(-24 * (day - 1)); 
//     return date;
// }

// function getSunday( date ) {
//     var day = date.getDay() || 7;  
//     if( day !== 7 ) 
//         date.setHours(-24 * (day - 7)); 
//     return date;
// }

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function createEventAdaptiveCard(displayEvent) {
    var sourceEventCard = require('./resources/eventCard.json');

    // create clone of adaptive card
    var displayEventCard =JSON.parse(JSON.stringify(sourceEventCard));

    // get the organisation id
    var eventOrganiserId = displayEvent.Organiser.OrganisationId;
    var eventOrganiserName = getOrganisationName(eventOrganiserId)
    var body =  displayEventCard.body[0]

    //  Change the event card
    body.columns[0].items[0].text = displayEvent.EventId // Event Number
    body.columns[0].items[1].text = displayEvent.Name // Event name
    body.columns[0].items[2].text = eventOrganiserName // Organiser
    body.columns[0].items[3].text = getDayOfWeek(displayEvent.StartDate.Date) + " " + dateFormat(displayEvent.StartDate.Date, "d mmm");

    // Logo
    body.columns[1].items[0].url = `https://eventor.orienteering.asn.au/Organisation/Logotype/${eventOrganiserId}?type=LargeIcon`

    // buttonon url
    displayEventCard.actions[0].url = `https://eventor.orienteering.asn.au/Events/Show/${displayEvent.EventId}`
    eventAdaptiveCard = CardFactory.adaptiveCard(displayEventCard);

    return eventAdaptiveCard;
}
function findFirst(events)
{
    var first = 0;
    var checkEvent = events[first]; 

    // loop through the events and order by date (starting at second date for comparison)
    for(var i = 1; i < events.length; i++){
        // if the event start date is after the next event, make a note of who is now first 
        if (events[i].StartDate.Date<checkEvent.StartDate.Date)
        {
            first=i;
            checkEvent = events[first];
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

function createEventTableLine(displayEvent){
    // get the organisation id
    var eventOrganiserId = displayEvent.Organiser.OrganisationId;
    var eventOrganiserName = getOrganisationName(eventOrganiserId);

    //  Change the event card
    var title = `${displayEvent.EventId}: ${getDayOfWeek(displayEvent.StartDate.Date)}, ${displayEvent.StartDate.Date} ${displayEvent.Name}`;
    var eventurl = `https://eventor.orienteering.asn.au/Events/Show/${displayEvent.EventId}`;
    var imageurl = `https://eventor.orienteering.asn.au/Organisation/Logotype/${eventOrganiserId}?type=SmallIcon`;
    var nicedate = dateFormat(displayEvent.StartDate.Date, "d mmm")
    var niceday = getDayOfWeek(displayEvent.StartDate.Date).substring(0,3)

    var name = displayEvent.Name
    if (displayEvent.Name.length>40){
        name  = name.substring(0,37) + "..."
    }

    return `|__${displayEvent.EventId}__| ${niceday}, ${nicedate} | ${name} | [link](${eventurl})|\n`;
}

function createEventTable(events){
    events = orderEvents(events)

    // display the cards
    var eventMarkdown = "| | | | |\n|-|-|-|-|\n";
    for(var i = 0; i < events.length; i++){
        var displayEvent = events[i];
        eventMarkdown += createEventTableLine(displayEvent)
    }
    return eventMarkdown
}

function createSingleEntryEventTable(displayEvent){
    // display the cards
    var eventMarkdown = "| | | | |\n|-|-|-|-|\n";
    eventMarkdown += createEventTableLine(displayEvent)
    return eventMarkdown
}

function createEventAttachments(events)
{
    var events = orderEvents(events)
    var attachments = [];

    // display the cards
    for(var i = 0; i < events.length; i++){              
        attachments.push(createEventAdaptiveCard(events[i]))
    }
    return attachments;
}

module.exports.eventorRequest = eventorRequest;
module.exports.eventSearch = eventSearch;
module.exports.xml2json = xml2json;
module.exports.eventSearchDay = eventSearchDay;
module.exports.eventSearchWeek = eventSearchWeek;
module.exports.listSubOrganisations = listSubOrganisations;
module.exports.getOrganisationName = getOrganisationName;
module.exports.isEmpty = isEmpty;
module.exports.getDayOfWeek = getDayOfWeek;
module.exports.defineWeek = defineWeek;
module.exports.createEventTable = createEventTable;
module.exports.createSingleEntryEventTable = createSingleEntryEventTable;
module.exports.createEventAttachments =createEventAttachments;