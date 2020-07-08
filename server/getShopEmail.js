const getShopEmail = async (ctx, accessToken, shop) => {
  const query = JSON.stringify({
    query: `query {
              shop {
                contactEmail
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

  return await response.json();
};

module.exports = getShopEmail;