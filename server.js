require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const koaBody = require('koa-body');
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');

dotenv.config();
const Router = require('koa-router');
const {receiveWebhook, registerWebhook} = require('@shopify/koa-shopify-webhooks');
const { default: graphQLProxy } = require('@shopify/koa-shopify-graphql-proxy');
const { ApiVersion } = require('@shopify/koa-shopify-graphql-proxy');
const getSubscriptionUrl = require('./server/getSubscriptionUrl');
const getShopEmail = require('./server/getShopEmail');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const {
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_API_KEY,
  HOST,
  BACKEND_ADDRESS
} = process.env;

const BACKEND = {
  ADDRESS: BACKEND_ADDRESS
};

app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();
  server.use(koaBody());
  server.use(session({ secure: true, sameSite: 'none' }, server));
  server.keys = [SHOPIFY_API_SECRET_KEY];

  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: ['read_themes', 'write_themes'],
      async afterAuth(ctx) {
        const { shop, accessToken } = ctx.session;

        ctx.cookies.set('shopOrigin', shop, {
          httpOnly: false,
          secure: true,
          sameSite: 'none'
        });

        const bodyObj = {
          storeAddress: shop,
          accessToken: accessToken
        };

        const response = await fetch(`${BACKEND.ADDRESS}/account/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify(bodyObj)
        })

        const responseJson = await response.json();

        console.log(responseJson);

        // const registration = await registerWebhook({
        //   address: `${HOST}/webhooks/products/create`,
        //   topic: 'PRODUCTS_CREATE',
        //   accessToken,
        //   shop,
        //   apiVersion: ApiVersion.October19
        // });
        //
        // if (registration.success) {
        //   console.log('Successfully registered webhook!');
        // } else {
        //   console.log('Failed to register webhook', registration.result);
        // }

        // const registration = await registerWebhook({
        //   address: `${HOST}/webhooks/themes/update`,
        //   topic: 'THEMES_UPDATE',
        //   accessToken,
        //   shop,
        //   apiVersion: ApiVersion.October19
        // });
        //
        // if (registration.success) {
        //   console.log('Successfully registered webhook!');
        // } else {
        //   console.log('Failed to register webhook', registration.result);
        // }

        await getSubscriptionUrl(ctx, accessToken, shop);
      },
    }),
  );

  const webhook = receiveWebhook({secret: SHOPIFY_API_SECRET_KEY});

  router.post('/webhooks/themes/update', webhook, (ctx) => {
    console.log('received webhook: ', ctx.state.webhook);
  });

  server.use(graphQLProxy({version: ApiVersion.October19}))

  router.get('/api/:object', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    try {

      const fetchURL = "https://" + shop + "/admin/api/2019-04/" + ctx.params.object + ".json";

      const results = await fetch(fetchURL, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
        },
      })
        .then(response => response.json())
        .then(json => json);

      ctx.body = {
        status: 'success',
        data: results,
      };
    } catch (err) {
      console.log(err);
    }
  })

  router.get('/api/themes/:id/config', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    try {
      const fetchURL = "https://" + shop + "/admin/api/2019-04/themes/" + ctx.params.id + "/assets.json?asset[key]=config/settings_data.json";

      const results = await fetch(fetchURL, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
        },
      })
        .then(response => response.json())
        .then(json => json);

      results.themeId = ctx.params.id;

      ctx.body = {
        status: 'success',
        data: results,
      };
    } catch (err) {
      console.log(err);
    }
  })

  router.put('/api/themes/:id/config', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    const asset = ctx.request.body;

    try {
      const fetchURL = "https://" + shop + "/admin/api/2019-04/themes/" + ctx.params.id + "/assets.json";

      const results = await fetch(fetchURL, {
        method: "PUT",
        body: asset,
        headers: {
          "X-Shopify-Access-Token": accessToken,
          'Content-Type': 'application/json',
        },
      })
        .then(response => response);

      ctx.body = {
        status: 'success',
        data: results,
      };

    } catch (err) {
      console.log(err);
    }

  })

  router.get('/api/themes/schedules', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    let page = 1;
    if (ctx.request.query.page) {
      page = ctx.request.query.page;
    }

    if (page < 1) {
      page = 1;
    }

    let deployed = "no";
    if (ctx.request.query.deployed) {
      if (ctx.request.query.deployed === "yes" || ctx.request.query.deployed === "no") {
        deployed = ctx.request.query.deployed;
      }
    }

    let description = "";
    if (ctx.request.query.description) {
      description = ctx.request.query.description;
    }

    try {

      const response = await fetch(`${BACKEND.ADDRESS}/theme/schedules?page=${page}&deployed=${deployed}&description=${description}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          "X-Shopify-Access-Token": accessToken,
          "store-address": shop,
        }
      })

      const responseJson = await response.json();

      ctx.body = {
        status: 'success',
        themeSchedules: responseJson.themeSchedules,
      };

    } catch (err) {
      console.log(err);
    }

  })

  router.post('/api/themes/schedule/delete', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    const body = ctx.request.body;
    const bodyObj = JSON.parse(body);

    try {

      const response = await fetch(`${BACKEND.ADDRESS}/theme/schedule/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "X-Shopify-Access-Token": accessToken,
          "store-address": shop,
        },
        body: JSON.stringify({
          scheduleId: bodyObj.scheduleId,
        })
      })

      const responseJson = await response.json();

      ctx.body = {
        status: 'success',
        data: responseJson,
      };

    } catch (err) {
      console.log(err);
    }

  })

  router.post('/api/themes/schedule/update', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    const body = ctx.request.body;
    const bodyObj = JSON.parse(body);

    try {

      const response = await fetch(`${BACKEND.ADDRESS}/theme/schedule/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "X-Shopify-Access-Token": accessToken,
          "store-address": shop,
        },
        body: JSON.stringify({
          scheduleId: bodyObj.id,
          scheduleAt: bodyObj.scheduleAt,
          fileKey: bodyObj.fileKey,
          fileValue: bodyObj.fileValue,
          description: bodyObj.description,
          deployed: bodyObj.deployed
        })
      })

      const responseJson = await response.json();

      ctx.body = {
        status: 'success',
        data: responseJson,
      };

    } catch (err) {
      console.log(err);
    }

  })


  router.post('/api/themes/:id/schedule', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    const body = ctx.request.body;
    const bodyObj = JSON.parse(body);

    try {

      const response = await fetch(`${BACKEND.ADDRESS}/theme/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          storeAddress: shop,
          scheduleAt: bodyObj.date,
          fileKey: bodyObj.asset.key,
          fileValue: bodyObj.asset.value,
          backupId: bodyObj.backupId,
          description: bodyObj.description
        })
      })

      const responseJson = await response.json();

      ctx.body = {
        status: 'success',
        data: responseJson,
      };

    } catch (err) {
      console.log(err);
    }

  })

  router.post('/api/themes/:id/backup', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    const body = ctx.request.body;
    const bodyObj = JSON.parse(body);

    try {

      const response = await fetch(`${BACKEND.ADDRESS}/theme/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          storeAddress: shop,
          fileKey: bodyObj.key,
          fileValue: bodyObj.value,
          themeId: ctx.params.id
        })
      })

      const responseJson = await response.json();

      ctx.body = {
        status: 'success',
        data: responseJson,
      };

    } catch (err) {
      console.log(err);
    }

  })

  router.get('/api/themes/:id/backup', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    const id = ctx.params.id;

    try {

      const response = await fetch(`${BACKEND.ADDRESS}/theme/backup/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          "X-Shopify-Access-Token": accessToken,
          "store-address": shop,
        },
      })

      const responseJson = await response.json();

      ctx.body = {
        status: 'success',
        data: responseJson,
      };

    } catch (err) {
      console.log(err);
    }

  })

  router.post('/api/account/staging', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    const body = ctx.request.body;
    const bodyObj = JSON.parse(body);

    try {

      const response = await fetch(`${BACKEND.ADDRESS}/account/staging`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          storeAddress: shop,
          stagingThemeName: bodyObj.stagingThemeName
        })
      })

      const responseJson = await response.json();

      ctx.body = {
        status: 'success',
        data: responseJson,
      };

    } catch (err) {
      console.log(err);
    }

  })

  router.get('/api/account/staging', async (ctx) => {
    const { shop, accessToken } = ctx.session;

    const body = ctx.request.body;

    try {

      const response = await fetch(`${BACKEND.ADDRESS}/account/staging`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          "X-Shopify-Access-Token": accessToken,
          "store-address": shop,
        }
      })

      const responseJson = await response.json();

      ctx.body = {
        status: 'success',
        stagingThemeName: responseJson.account.stagingThemeName
      };

    } catch (err) {
      console.log(err);
    }

  })

  router.get('*', verifyRequest(), async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });

  server.use(router.allowedMethods());
  server.use(router.routes());



  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});