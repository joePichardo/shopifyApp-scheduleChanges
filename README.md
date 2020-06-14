# Schedule Changes App

- Made from `https://shopify.dev/tutorials/build-a-shopify-app-with-node-and-react`

Installation needed
- `npm install ngrok -g`

To start server
- Add and update `.env` and `next.config.js` to root folder 
- `npm run dev`
- `ngrok http 3000`

## Todo List

- Add `stagingThemeName` to account table to keep track of users themes

- Show a list of scheduled changes
    - User can delete a scheduled change
    - User can revert to a backup from a scheduled change
    - Show history of scheduled change
    - make pagination for scheduled changes
    - add search function with date ranges
