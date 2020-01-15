# Eventor bot

A bot to be used with Eventor for the purposes of giving orienteers quick information about events and results.

This bot has been created using [Bot Framework](https://dev.botframework.com) which allows the delivery of the app to multiple chanbels.

## Prerequisites

For the generic web chanmel the result adpative cards were designed using the [AdaptiveCard Designer](https://adaptivecards.io/designer/)

##  Deployment

Some links, mostly for memory, on how this bot can be deployed:

[Deploy your bot](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-deploy-az-cli?view=azure-bot-service-4.0&tabs=csharp#set-up-continuous-deployment)
Note: The source code generated includes a deploymentTemplates folder that contains ARM templates

[Deploying to Azre App Service using Visual Studio Code](https://docs.microsoft.com/en-us/azure/javascript/tutorial-vscode-azure-app-service-node-01)

My test application targets Azure's Australia SouthEast and Linux F1 (Free Tier) - the only option in Australia at time of publication for App Service on Linux. 
Since the application is written in Node.Js having a Linux target endpoint means the application can be debugged from Visual Studio code

### Facebook

Thus application has been connected to Facebook on Eventor Bot test.
If you want to do this yourself you will need to follow this guide to  [Connect a bot to Facebook](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-channel-connect-facebook?view=azure-bot-service-4.0)