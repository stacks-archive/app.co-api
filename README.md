app.co
----

### Database Setup

We use the [sequelize](https://github.com/sequelize/sequelize) package for ORM and database connection. To setup the database, make sure you
have [PostgreSQL](https://www.postgresql.org/) installed and run:

```bash
yarn db:create
```

Then to run migrations:

```bash
yarn db:migrate
```

To seed your database with a bunch of app data, first create the file `.env` in the root of this project,
add the contents of the `App.co .env file` from 1Password.

### Environment setup

There are some ENV variables you should set before running the app. To get started, run `cp .env.sample .env` to create a `.env` file. Then, change the values in that file as appropriate.

### Running the app

Run `node server.js` to start the API server.

### Update Twitter Rankings

First, make sure you've setup Twitter API secrets in your `.env` file. Then, run:

~~~bash
node scripts/fetch-rankings.js
~~~

### Running tests

Make sure you have created a test database (you only need to run this once):

~~~bash
NODE_ENV=test yarn db:create
~~~

Then, run tests:

~~~bash
yarn test
~~~

Or, to automatically watch and re-run tests:

~~~bash
yarn test-watch
~~~