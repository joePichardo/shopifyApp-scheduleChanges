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
    - add alert on delete and revert backup functions to prevent accidental changes
    - Show history of scheduled change
    - make pagination for scheduled changes
    - add search function with date ranges
    
- Add notifications
    - Add a loading spinner when fetching (loading button state,)
    - Add a success banner on success
    - Add an error banner on error

- Add a cron function to deploy scheduled changes
    - Use an api call every 15 minutes to check schedule table and perform the theme change
    - Make all the calls async to prevent await for every deployment
    
- Error Handling
    - prevent user to choose a time that has passed when creating a new schedule, show a thoughtful error
     