
exports.postUserQuery = async (host, requestBody) => {

  try {
    const response = await fetch(host, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const resJson = await response.json();
    return resJson;

  } catch(err) {
    throw err;
  }
}