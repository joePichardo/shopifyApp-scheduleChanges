const getShopEmail = require('./getShopEmail');
const {
  BACKEND_ADDRESS
} = process.env;

const returnSubscriptionLink = async (ctx, accessToken, shop) => {
  const query = JSON.stringify({
    query: `mutation {
      appSubscriptionCreate(
          name: "All-In-One Plan"
          trialDays: 14
          returnUrl: "${process.env.HOST}"
          test: true
          lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                  price: { amount: 4.99, currencyCode: USD }
              }
            }
          }
          ]
        ) {
            userErrors {
              field
              message
            }
            confirmationUrl
            appSubscription {
              id
            }
        }
    }`
  });

  const bodyObj = {
    storeAddress: shop,
    accessToken: accessToken
  };

  const responseEmail = await getShopEmail(ctx, accessToken, shop);

  if (responseEmail && responseEmail.data.shop.contactEmail) {
    bodyObj["email"] = responseEmail.data.shop.contactEmail;
  }

  const responseSignUp = await fetch(`${BACKEND_ADDRESS}/account/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify(bodyObj)
  })

  const response = await fetch(`https://${shop}/admin/api/2019-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "X-Shopify-Access-Token": accessToken,
    },
    body: query
  })

  const responseJson = await response.json();
  return responseJson.data.appSubscriptionCreate.confirmationUrl
};

module.exports = returnSubscriptionLink;