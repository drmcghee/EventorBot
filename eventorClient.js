var querystring = require('querystring');
var https = require('https');
var helpers  = require('./helpers.js');

module.exports = {

    anyfunc: function(hello){
        console.log(`hello ${hello}`)
    },

    eventSearch2: function(fromDate, toDate) {
        return new Promise(resolve => {
            eventSearch.on(fromDate, toDate, callback => resolve(callback));
        });
    },
     eventSearch: function (fromDate, toDate, callback) {
        query = `/api/events?fromDate=${fromDate}&toDate=${toDate}`
        this.loadData(query,callback); 
    },
    orgSearch: function(callback) {
        this.loadData('/api/organisations', callback)
    },

    loadData: function (path, callback) {
        // need some way to save the api key secretely
        // could use Azure Key vault but really just need something localy  

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
            response.on('end', function () {
                //console.log('xml data =%s', xml);

            
                // Xml to JSON object
                var xml2js = require('xml2js');
                var parser = new xml2js.Parser({explicitArray : false});

                result = parser.parseString(xml, function (err, result) {
                    //console.log('json result =%s',JSON.stringify(result));
                    callback(result);
                });

            });
        });
        request.end();
    },
}