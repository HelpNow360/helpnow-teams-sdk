const { CardFactory } = require("botbuilder");
const helpNowTemplates = require("./templates");

exports.onMakingSimpleResponse = async (messages) => {

  try {
    return messages.simpleResponse[0].replace(/\n/g, '<br>');

  } catch(err) {
    throw err;
  }
};

exports.onMakingListResponse = async (messages) => {

  try {
    let listText = [];

    // Add an url if an image is present.
    if(messages.headerimageUri) {
      const cardImage = await helpNowTemplates.responseImage(messages.headerimageUri, "Auto");
      listText.push(cardImage);
    }

    if(messages.title) {
      const cardTitle = await helpNowTemplates.responseAdaptiveTextTitle(messages.title);
      listText.push(cardTitle);
    }

    if(messages.headerDescription) {
      const cardDesc = await helpNowTemplates.responseAdaptiveText(messages.headerDescription);
      listText.push(cardDesc);
    }
  
    // Generate text listed within.
    if(messages.items.length) {
      for(let i = 0; i < messages.items.length; i++) {
        const textItems = [];
        const imageItems = [];

        if(messages.items[i].itemTitle) {
          const title = await helpNowTemplates.responseAdaptiveTextTitle(messages.items[i].itemTitle);
          textItems.push(title);
        }

        if(messages.items[i].description) {
          const desc = await helpNowTemplates.responseAdaptiveText(messages.items[i].description);
          textItems.push(desc);
        }

        if(messages.items[i].imageUri) {
          const image = await helpNowTemplates.responseImage(messages.items[i].imageUri);
          imageItems.push(image);
        }

        const columnSet = await helpNowTemplates.responseColumnSet(textItems, imageItems);
        listText.push(columnSet);
      }
      
    }
  
    // Respond with a list card.
    return await helpNowTemplates.responseAdaptiveCard(listText);

  } catch(err) {
    throw err;
  }
};

exports.onMakingItemCardResponse = async (messages) => {

  try {
    let totalItemCard = [];

    // Create each item as an adaptive card.
    for(let i = 0; i < messages.content.length; i++) {
      
      let itemCardList = [];
      let itemCardFactSetList = [];
      let buttonList = [];

      // Create buttons.
      for(let j = 0; j < messages.content[i].buttonList.length; j++) {
        let buttonBody = null; 
        if(messages.content[i].buttonList[j].btnOuaUrl) {
          buttonBody = await helpNowTemplates.responseAdaptiveUrlButton(messages.content[i].buttonList[j].btnTitle, messages.content[i].buttonList[j].btnOuaUrl);
        } else {
          buttonBody = await helpNowTemplates.responseAdaptiveButton(messages.content[i].buttonList[j].btnTitle);
        }
        
        buttonList.push(buttonBody);
      }
  
      // Add an url if an image is present.
      if(messages.content[i].imageUrl) {
        const image = await helpNowTemplates.responseImage(messages.content[i].imageUrl);
        itemCardList.push(image);
      }
  
      // Include the title and detailed description in the item card.
      const cardTitle = await helpNowTemplates.responseAdaptiveTextTitle(messages.content[i].title);
      const cardDesc = await helpNowTemplates.responseAdaptiveText(messages.content[i].description);
      itemCardList.push(cardTitle, cardDesc);
  
      // Create sub-items for the item card.
      for(let j = 0; j < messages.content[i].itemList.length; j++) {
        itemCardFactSetList.push({
          "title": `${messages.content[i].itemList[j].title}`,
          "value": `${messages.content[i].itemList[j].description}`
        })
      }

      const cardFactSet = await helpNowTemplates.responseAdaptiveFactSet(itemCardFactSetList);
      itemCardList.push(cardFactSet);

      const itemCardBody = await helpNowTemplates.responseAdaptiveCard(itemCardList, buttonList);
      totalItemCard.push(CardFactory.adaptiveCard(itemCardBody));
    }

    return totalItemCard;
    
  } catch(err) {
    throw err;
  }
};

exports.onMakingCarouselCardResponse = async (messages, j) => {

  try {
    let buttonList = [];

    // Create buttons.
    if(messages.content[j].buttonList.length) {
      for(let k = 0; k < messages.content[j].buttonList.length; k++) {
        let buttonBody = null;
        if(messages.content[j].buttonList[k].btnOuaUrl) {
          buttonBody = await helpNowTemplates.responseAdaptiveUrlButton(messages.content[j].buttonList[k].btnTitle, messages.content[j].buttonList[k].btnOuaUrl);
        } else {
          buttonBody = await helpNowTemplates.responseAdaptiveButton(messages.content[j].buttonList[k].btnTitle);
        }
        buttonList.push(buttonBody);
      }
    }
  
    // Generate a title and additional description (add an image if present).
    let carouselText = [];
    if(messages.content[j].imageUrl) {
      const image = await helpNowTemplates.responseImage(messages.content[j].imageUrl);
      carouselText.push(image);
    }

    if(messages.content[j].title) {
      const cardTitle = await helpNowTemplates.responseAdaptiveTextTitle(messages.content[j].title);
      carouselText.push(cardTitle);
    }

    if(messages.content[j].description) {
      const cardDesc = await helpNowTemplates.responseAdaptiveText(messages.content[j].description);
      carouselText.push(cardDesc);
    }
    
    // Respond with a title, additional description, and a button all at once.
    return await helpNowTemplates.responseAdaptiveCard(carouselText, buttonList);

  } catch(err) {
    throw err;
  }
};

exports.onMakingSuggestionChipResponse = async (text, buttonList, intent = null) => {

  try {
    let buttonBody = await helpNowTemplates.responseHeroButton(text, intent);
    return buttonList.push(buttonBody);

  } catch(err) {
    throw err;
  }
};

exports.onMakingSuggestionChipResponseWithUrl = async (text, url, buttonList) => {

  try {
    let buttonBody = await helpNowTemplates.responseHeroUrlButton(text, url);
    return buttonList.push(buttonBody);

  } catch(err) {
    throw err;
  }
};

exports.onMakingMediaCardResponse = async (messages) => {
  
  try {
    let cardTitle = null;
    let cardDesc = null;
    let buttonBody = null;

    const cardBody = [];
    const buttonList = [];

    const contentUrl = messages.contentUrl;
    const mediaFactor = await helpNowTemplates.responseMedia(contentUrl);
    cardBody.push(mediaFactor);

    if(messages.name) {
      cardTitle = await helpNowTemplates.responseAdaptiveTextTitle(messages.name);
      cardBody.push(cardTitle);
    }

    if(messages.description) {
      cardDesc = await helpNowTemplates.responseAdaptiveText(messages.description);
      cardBody.push(cardDesc);
    }

    if(messages.buttonList.length) {
      if(messages.buttonList[0].btnUrl) buttonBody = await helpNowTemplates.responseAdaptiveUrlButton(messages.buttonList[0].btnTitle, messages.buttonList[0].btnUrl);
      else buttonBody = await helpNowTemplates.responseAdaptiveButton(messages.buttonList[0].btnTitle);
      buttonList.push(buttonBody);
    }

    return await helpNowTemplates.responseAdaptiveCard(cardBody, buttonList);

  } catch(err) {
    throw err;
  }
}