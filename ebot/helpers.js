const eventorClient = require('./eventorClient.js');

const eventSearch = (fromDate, toDate, callback) => {
    eventorClient.eventSearch("2019-07-18", "2019-07-30", function(eventsFound)
        {
            //console.log('IN json result =%s',JSON.stringify(eventsFound))
            var len = eventsFound.EventList["Event"].length
            var eventmessage = `Found ${len} Events!`
            console.log(eventmessage)

            return  eventsFound
        })
}


module.exports.eventSearch = eventSearch;