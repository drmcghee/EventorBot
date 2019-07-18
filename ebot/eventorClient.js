var querystring = require('querystring');
var https = require('https');

module.exports = {
    executeSearch: function (query, callback) {
        this.loadData('/api/events?q=fromDate=2019-01-01&toDate=2019-01-30',callback); 

       //this.loadData('/api/events?q=' + querystring.escape(query), callback);
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
            var data = '';
            response.on('data', function (chunk) { data += chunk; });
            response.on('end', function () {
                console.log('data =%s', data);
                callback(JSON.parse(data));
            });
        });
        request.end();
    }
}