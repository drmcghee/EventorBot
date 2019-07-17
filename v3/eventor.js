var builder = require('botbuilder');
var restify = require('restify');
var eventorClient = require('./eventor-client.js');

var connector = new builder.ChatConnector();
var bot = new builder.UniversalBot(connector);

var dialog = new builder.IntentDialog();
dialog.matches(/^search/i, [
    function (session, args, next) {
        if (session.message.text.toLowerCase() == 'search') {
            builder.Prompts.text(session, 'Who are you looking for?');
        } else {
            var query = session.message.text.substring(7);
            // move to next inthe waterfall
            next({ response: query });
        }
    },
    function (session, result, next) {
        var query = result.response;
        if (!query) {
            session.endDialog('Request cancelled');
        } else {
            eventorClient.executeSearch(query, function (profiles) {
                var totalCount = profiles.total_count;
                if (totalCount == 0) {
                    session.endDialog('Sorry, no results found.');
                }
                else if (totalCount == 1){
                    // how do I hand over the profile found to the next function?
                    //query=profiles[0];
                    //.response.entity = profiles[0].name; 
                    next({ response: query });
                }
                else if (totalCount > 10) {
                    session.endDialog('More than 10 results were found. Please provide a more restrictive query.');
                } else {
                    session.dialogData.property = null;
                    var usernames = profiles.items.map(function (item) { return item.login });
                    builder.Prompts.choice(session, 'What user do you want to load?', usernames,  {listStyle:builder.ListStyle.button});
                }
            });
        }
    }, function (session, result, next) {
        var username = result.response.entity;
        
        // if there isnt a chosen entity (choice?) then use the last provided text
        if (!username)
            username = result.response;

        //tell the user that something is happening
        session.sendTyping();
        
        console.log(`LOAD PROFILE %s!!!!!`, username);

        // gte the github profile
        githubClient.loadProfile(username, function (profile) {
            var card = new builder.ThumbnailCard(session);

            card.title(profile.login);

            card.images([builder.CardImage.create(session, profile.avatar_url)]);

            if (profile.name) card.subtitle(profile.name);

            var text = '';
            if (profile.company) text += profile.company + ' \n\n';
            if (profile.email) text += profile.email + ' \n\n';
            if (profile.bio) text += profile.bio;
            card.text(text);
            
            // when the card is tapped it opens the profile url
            card.tap(new builder.CardAction.openUrl(session, profile.html_url));
            
            var message = new builder.Message(session).attachments([card]);
            session.endConversation(message);
        });
    }
]);

bot.dialog('/', dialog);


const server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(
    process.env.PORT || 3978,
    () => console.log('Server Up!!')
)

//var server = restify.createServer();
//console.log('port %s PORT %s', process.env.port , process.env.PORT );
//server.listen(process.env.port || process.env.PORT || 3978, function () {
//    console.log('%s listening to %s', server.name, server.url);
//});
//server.post('/api/messages', connector.listen());