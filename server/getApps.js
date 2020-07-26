const getApps = async (ctx, accessToken, shop) => {
  const query = JSON.stringify({
    query: `query {
             currentAppInstallation {
              app {
                id
                handle
              }
              activeSubscriptions {
                name
                status
              }
            }
          }`
  });

  console.log('shop', shop)
  console.log('accessToken', accessToken)

  const response = await fetch(`https://${shop}/admin/api/2019-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "X-Shopify-Access-Token": accessToken,
    },
    body: query
  })

  console.log('getApps response', response)

  const responseJson = await response.json();
  console.log('getApps responseJson', responseJson)

  return responseJson.data.currentAppInstallation.activeSubscriptions;
};

module.exports = getApps;