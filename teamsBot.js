const { TeamsActivityHandler, TurnContext, CardFactory, AttachmentLayoutTypes, ActivityTypes } = require("botbuilder");
const helpNowApis = require("./apis.js");
const helpNowComponents = require("./components.js");
const config = require("./config.js");

class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {

      try {
        // Enable the typing indicator.
        await context.sendActivities([{ type: ActivityTypes.Typing }]);

        const removedMentionText = TurnContext.removeRecipientMention(context.activity);
        const txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
        const HOST = config.HELPNOW_AGENT;
        const ID_INFO = TurnContext.getConversationReference(context.activity);
        let requestBody = {
          conversationId: `${ID_INFO.conversation.id}`,
          query: txt
        };

        // If there is an intent within the suggestion chip.
        if(context.activity.value) {
          if(context.activity.value.intent) {
            const checkIntent = context.activity.value.intent;
            if(checkIntent) {
              requestBody = {
                conversationId: `${ID_INFO.conversation.id}`,
                intent: checkIntent,
                query: context.activity.text
              };
            }
          }
        }

        const resJson = await helpNowApis.postUserQuery(HOST, requestBody);
        const messages = JSON.parse(resJson.messages);

        // Required when calling the GenAI API.
        let promptId = null;
        let genAIContext = null;
        
        // Required when logging GenAI-related activity.
        let genAIKind = null;
        let previousMsg = [];
        
        // For things that should follow after the GenAI response exists.
        let isGenAI = false;

        let suggestionChipList = [];
        let carouselCardList = null;

        for(let i = 0; i < messages.length; i++) {
          // Separate and handle responses related to the GenAI response together.
          previousMsg.push(messages[i]);
          
          let type = messages[i].type.toUpperCase();
          if(type === "SIMPLE_RESPONSE") {
            const simpleResponse = await helpNowComponents.onMakingSimpleResponse(messages[i]);
            if(simpleResponse) {
              if(!isGenAI) await context.sendActivity(simpleResponse);
            }
          }

          if(type === "LIST") {
            const listResponse = await helpNowComponents.onMakingListResponse(messages[i]);
            if(!isGenAI) await context.sendActivity({ attachments: [CardFactory.adaptiveCard(listResponse)] });
          }

          if(type === "ITEM_CARD") {
            const itemCardResponse = await helpNowComponents.onMakingItemCardResponse(messages[i]);
            if(!isGenAI) await context.sendActivity({ attachments: itemCardResponse, attachmentLayout: AttachmentLayoutTypes.Carousel});
          }

          if(type === "CAROUSEL_CARD") {
            carouselCardList = [];

            for(let j = 0; j < messages[i].content.length; j++) {
              const carouselCardResponse = await helpNowComponents.onMakingCarouselCardResponse(messages[i], j);
              carouselCardList.push(CardFactory.adaptiveCard(carouselCardResponse)); // Apply carousel functionality.
            }
            
            if(!isGenAI) await context.sendActivity({ attachments: carouselCardList, attachmentLayout: AttachmentLayoutTypes.Carousel}); // Apply carousel functionality.
          }

          if(type === "MEDIA_CONTENT") {
            const mediaResponse = await helpNowComponents.onMakingMediaCardResponse(messages[i]);
            if(!isGenAI) await context.sendActivity({ attachments: [CardFactory.adaptiveCard(mediaResponse)] });
          }

          if(type === "SUGGESTION_CHIPS") {
            if(messages[i].url) {
              if(!isGenAI) await helpNowComponents.onMakingSuggestionChipResponseWithUrl(messages[i].message, messages[i].url, suggestionChipList);
            } else if(messages[i].linkedIntentNm) {
              if(!isGenAI) await helpNowComponents.onMakingSuggestionChipResponse(messages[i].message, suggestionChipList, messages[i].linkedIntentNm);
            } else {
              if(!isGenAI) await helpNowComponents.onMakingSuggestionChipResponse(messages[i].message, suggestionChipList);
            }
          }
          
          if(type === 'AI_RESPONSE') {
            isGenAI = true;
            promptId = {
              stringValue: messages[i]["prompt_id"],
              kind: "stringValue"
            };
            genAIContext = {
              stringValue: resJson["genAI_context"],
              kind: "stringValue"
            };
            genAIKind = {
              stringValue: resJson["genAI_kind"],
              kind: "stringValue"
            };
          }
        }

        // Response of GenAI
        if(resJson.req_ai_response === true) {
          await context.sendActivities([{ type: ActivityTypes.Typing }]);

          requestBody.req_ai_response = true;
          requestBody.promptId = promptId;
          requestBody.genAIContext = genAIContext;
          requestBody.genAIKind = genAIKind;
          requestBody.previousMsg = JSON.stringify(previousMsg);

          const resJsonOfGenAi = await helpNowApis.postUserQuery(HOST, requestBody);
          const messagesOfGenAi = JSON.parse(resJsonOfGenAi.messages);

          for(let i = 0; i < messagesOfGenAi.length; i++) {
            let type = messagesOfGenAi[i].type.toUpperCase();
            
            if(type === "SIMPLE_RESPONSE") {
              let simpleResponse = await helpNowComponents.onMakingSimpleResponse(messagesOfGenAi[i]);
              if(simpleResponse) await context.sendActivity(simpleResponse);
            }

            if(type === "LIST") {
              const listResponse = await helpNowComponents.onMakingListResponse(messagesOfGenAi[i]);
              await context.sendActivity({ attachments: [CardFactory.adaptiveCard(listResponse)] });
            }

            if(type === "ITEM_CARD") {
              const itemCardResponse = await helpNowComponents.onMakingItemCardResponse(messagesOfGenAi[i]);
              await context.sendActivity({ attachments: itemCardResponse, attachmentLayout: AttachmentLayoutTypes.Carousel});
            }

            if(type === "CAROUSEL_CARD") {
              carouselCardList = [];

              for(let j = 0; j < messagesOfGenAi[i].content.length; j++) {
                const carouselCardResponse = await helpNowComponents.onMakingCarouselCardResponse(messagesOfGenAi[i], j);
                carouselCardList.push(CardFactory.adaptiveCard(carouselCardResponse));
              }

              await context.sendActivity({ attachments: carouselCardList, attachmentLayout: AttachmentLayoutTypes.Carousel});
            }

            if(type === "MEDIA_CONTENT") {
              const mediaResponse = await helpNowComponents.onMakingMediaCardResponse(messages[i]);
              await context.sendActivity({ attachments: [CardFactory.adaptiveCard(mediaResponse)] });
            }

            if(type === "SUGGESTION_CHIPS") {              
              if(messagesOfGenAi[i].url) {
                await helpNowComponents.onMakingSuggestionChipResponseWithUrl(messagesOfGenAi[i].message, messagesOfGenAi[i].url, suggestionChipList);
              } else if(messagesOfGenAi[i].linkedIntentNm) {
                await helpNowComponents.onMakingSuggestionChipResponse(messagesOfGenAi[i].message, suggestionChipList, messagesOfGenAi[i].linkedIntentNm);
              } else {
                await helpNowComponents.onMakingSuggestionChipResponse(messagesOfGenAi[i].message, suggestionChipList);
              }
            }
          }
        }

        // Display the suggestion chip response at the very end.
        if(suggestionChipList.length) {
          await context.sendActivity({ attachments: [CardFactory.heroCard('', [], suggestionChipList)] });
        }
      } catch(err) {
        console.error(err);
      }
      
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    // Listen to MembersAdded event, view https://docs.microsoft.com/en-us/microsoftteams/platform/resources/bot-v3/bots-notifications for more events
    this.onMembersAdded(async (context, next) => {

      // Enable the typing indicator.
      await context.sendActivities([{ type: ActivityTypes.Typing }]);

      const membersAdded = context.activity.membersAdded;
      for(let cnt = 0; cnt < membersAdded.length; cnt++) {
        if(membersAdded[cnt].id) {
          const HOST = config.HELPNOW_AGENT;
          const ID_INFO = TurnContext.getConversationReference(context.activity);
          const requestBody = {
            query: "처음으로",
            conversationId: `${ID_INFO.conversation.id}`,
            userId: `${ID_INFO.user.id}`
          };

          // Trigger command by IM text
          try {
            const resJson = await helpNowApis.postUserQuery(HOST, requestBody);
            const messages = JSON.parse(resJson.messages);

            let suggestionChipList = [];
            let carouselCardList = null;
    
            for(let i = 0; i < messages.length; i++) {
    
              let type = messages[i].type.toUpperCase();
    
              if(type === "SIMPLE_RESPONSE") {
                const simpleResponse = await helpNowComponents.onMakingSimpleResponse(messages[i]);
                if(simpleResponse) {
                  await context.sendActivity(simpleResponse);
                }
              }
    
              if(type === "LIST") {
                const listResponse = await helpNowComponents.onMakingListResponse(messages[i]);
                await context.sendActivity({ attachments: [CardFactory.adaptiveCard(listResponse)] });
              }
    
              if(type === "ITEM_CARD") {
                const itemCardResponse = await helpNowComponents.onMakingItemCardResponse(messages[i]);
                await context.sendActivity({ attachments: itemCardResponse, attachmentLayout: AttachmentLayoutTypes.Carousel});
              }
    
              if(type === "CAROUSEL_CARD") {
                carouselCardList = [];
    
                for(let j = 0; j < messages[i].content.length; j++) {
                  const carouselCardResponse = await helpNowComponents.onMakingCarouselCardResponse(messages[i], j);
                  carouselCardList.push(CardFactory.adaptiveCard(carouselCardResponse)); // Apply carousel functionality.
                }
                
                await context.sendActivity({ attachments: carouselCardList, attachmentLayout: AttachmentLayoutTypes.Carousel}); // Apply carousel functionality.
              }
    
              if(type === "MEDIA_CONTENT") {
                const mediaResponse = await helpNowComponents.onMakingMediaCardResponse(messages[i]);
                await context.sendActivity({ attachments: [CardFactory.adaptiveCard(mediaResponse)] });
              }
    
              if(type === "SUGGESTION_CHIPS") {
                  if(messages[i].linkedIntentNm) {
                    await helpNowComponents.onMakingSuggestionChipResponse(messages[i].message, suggestionChipList, messages[i].linkedIntentNm);
                  } else if(messages[i].url) {
                    await helpNowComponents.onMakingSuggestionChipResponseWithUrl(messages[i].message, messages[i].url, suggestionChipList);
                  } else {
                    await helpNowComponents.onMakingSuggestionChipResponse(messages[i].message, suggestionChipList);
                  }
              }
            }
    
            if(suggestionChipList.length) {
              await context.sendActivity({ attachments: [CardFactory.heroCard('', [], suggestionChipList)] });
            }

          } catch (error) {
            console.error(error);
          }
          break;
        }
      }
      await next();
    });
  }
}

module.exports.TeamsBot = TeamsBot;
