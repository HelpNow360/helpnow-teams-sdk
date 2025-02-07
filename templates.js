exports.responseAdaptiveButton = async (value) => {

  return {
    type: "Action.Submit",
    title: value,
    data: {
      msteams: {
        type: "imBack",
        value
      }
    }
  }
}

exports.responseAdaptiveCard = async (body, actions) => {
  
  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.5",
    body,
    actions,
  }
}

exports.responseAdaptiveFactSet = async (facts) => {

  return {
    type: "FactSet",
    facts
  }
}

exports.responseAdaptiveShow = async (title, body) => {
  
  return {
    type: "Action.ShowCard",
    title,
    card: {
      type: "AdaptiveCard",
      body
    } 
  }
}

exports.responseAdaptiveText = async (text) => {
  
  return {
    type: "TextBlock",
    wrap: true,
    text
  }
}

exports.responseAdaptiveTextTitle = async (text) => {
  
  return {
    type: "TextBlock",
    wrap: true,
    weight: "bolder",
    text
  }
}

exports.responseAdaptiveUrlButton = async (title, url) => {

  return {
    type: "Action.OpenUrl",
    title,
    url
  }
}

exports.responseHeroButton = async (text, intent) => {

  return {
    type: "messageBack",
    title: text,
    displayText: text,
    value: { intent },
    mode: "secondary",
    text
  }
}

exports.responseHeroUrlButton = async (title, url) => {

  return {
    type: "openUrl",
    value: url,
    title
  }
}

exports.responseMedia = async (url) => {

  return { 
    type: "Media",
    sources: [
      {
        mimeType: "video/mp4",
        url: url
      }
    ]
  }
}

exports.responseMessage = async (text) => {

  return {
    type: "message",
    textFormat: "xml",
    text
  }
}

exports.responseImage = async (url, size = null) => {

  const imageObj = {
    type: "Image",
    url
  };

  if(size) imageObj.size = size;
  return imageObj
}

exports.responseColumnSet = async (textItems, imageItems) => {

  return {
    type: "ColumnSet",
    columns: [
      {
        type: "Column",
        items: textItems,
      },
      {
        type: "Column",
        items: imageItems,
      }
    ]
  }
}