var querystring = require('querystring');
var https = require('https');


module.exports = {
    eventSearch: function (query, callback) {
        this.loadData('/api/events?fromDate=2019-01-01&toDate=2019-01-30',callback); 
    },
    stateSearch: function(query, callback) {
        var orgs = this.loadData('/api/organisations', callback)
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
        var profile;
        var request = https.request(options, function (response) {
            var xml = '';
            response.on('data', function (chunk) { xml += chunk; });
            response.on('end', function () {
                //console.log('xml data =%s', xml);

                var xml2js = require('xml2js');
                var parser = new xml2js.Parser({explicitArray : false});

                result = parser.parseString(xml, function (err, result) {
                    //console.log('json result =%s',JSON.stringify(result));
                    callback(result);
                });

            
                // TODO: XML parrse
                //callback(JSON.stringify(result));
                //callback(result)
            });
        });
        request.end();
    }

    
}