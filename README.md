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
- Add button and function to make a backup of settings

- Show a list of scheduled changes
    - add search function with date ranges

- Add a cron function to deploy scheduled changes
    - Use an api call every 15 minutes to check schedule table and perform the theme change
    - Make all the calls async to prevent await for every deployment
    
- Throwing errors breaks app, return with error message

- Add disclaimer that the app overwrites every and all settings when an update occurs

- Return schedules by date descending