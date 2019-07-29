const https = require('https');
var $myStates = {} // could be hardcoded but best to read dynamically
var $myOrgs = "" // keep the list of all organisations

async function eventSearchToday(state)
{
    var dt = new Date(); // current date of week
    today = dt.toISOString().substring(0,10);
  
    return eventSearch(today, today, state)
}

async function eventSearchWeek(state)
{
    var dt = new Date(); // current date of week
    var currentWeekDay = dt.getDay();
    var lessDays = currentWeekDay == 0 ? 6 : currentWeekDay - 1;
    var wkStart = new Date(new Date(dt).setDate(dt.getDate() - lessDays));
    var wkEnd = new Date(new Date(wkStart).setDate(wkStart.getDate() + 6));

    fromDate = wkStart.toISOString().substring(0,10);
    toDate = wkEnd.toISOString().substring(0,10);

    return eventSearch(fromDate, toDate, state)
}

// Accepts a Date object or date string that is recognized by the Date.parse() method
function getDayOfWeek(date) {
    var dayOfWeek = new Date(date).getDay();    
    return isNaN(dayOfWeek) ? null : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
}

async function eventSearchWeekDate(state, dt)
{    
    var weekDay = dt.getDay();
    var lessDays = weekDay == 0 ? 6 : weekDay - 1;
    var wkStart = new Date(dt.setDate(dt.getDate() - lessDays));
    var wkEnd = new Date(new Date(wkStart).setDate(wkStart.getDate() + 6));

    fromDate = wkStart.toISOString().substring(0,10);
    toDate = wkEnd.toISOString().substring(0,10);

    return eventSearch(fromDate, toDate, state)
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

module.exports.eventorRequest = eventorRequest;
module.exports.eventSearch = eventSearch;
module.exports.xml2json = xml2json;
module.exports.eventSearchToday = eventSearchToday;
module.exports.eventSearchWeek = eventSearchWeek;
module.exports.eventSearchWeekDate = eventSearchWeekDate;
module.exports.listSubOrganisations = listSubOrganisations;
module.exports.getOrganisationName = getOrganisationName;
module.exports.isEmpty = isEmpty;
module.exports.getDayOfWeek = getDayOfWeek;