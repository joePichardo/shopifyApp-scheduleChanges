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

  const response = await fetch(`https://${shop}/admin/api/2019-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "X-Shopify-Access-Token": accessToken,
    },
    body: query
  })

  const responseJson = await response.json();
  return responseJson.data.currentAppInstallation.activeSubscriptions;
};

module.exports = getApps;