# WebDB

WebDB is a minimal promise wrapper for the IndexedDB API.

## Why?

The [IndexedDB API](https://w3c.github.io/IndexedDB/) works asynchronously, but it's event based. Because of it's event based nature, it can be hard to work with, as it is a complex API.

To make it simpler, WebDB wraps the event based API with [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). This is done in a very minimal way, meaning you get just what IndexedDB offers through a handful of methods, nothing more. If you need a 'raw' access to the IndexedDB API, WebDB let's you directly create `transactions` to communicate with the database.

# How to install

The library is made in pure Javascript, and provides type declarations.

To install it, run:

```bash
npm i @gabrielrq/webdb
```

# How to use

The library is pretty straigth-forward. Below is an example:

```js
import { WebDB } from "@gabrielrq/webdb";

// set up
const db = new WebDB("database", 1, {
  objectStores: [
    {
      name: "user",
      options: { autoIncrement: true, keyPath: "id" },
      configs: {
        indexes: [
          { name: "username-index", keyPath: "username" },
          { name: "email-index", keyPath: "email", options: { unique: true } },
        ],
      },
    },
    {
      name: "book",
      options: { autoIncrement: false, keyPath: "isbn" },
      configs: {
        indexes: [
          { name: "title-index", keyPath: "title", options: { unique: true } },
        ],
      },
    },
  ],
  handlers: {
    onVersionChange: (db, oldVersion, newVersion) => {
      console.log(
        `The database updated from version ${oldVersion} to version ${newVersion}`
      );
    },
    onBlocked: (event) => {
      console.log("The database is blocked.");
    },
  },
});

// Needs to await the database initialization
await db.init();

// Insert data into the database
db.add("user", { username: "James", email: "james@mail.com" }); // ID 1
db.add("user", { username: "Anne", email: "anne@mail.com" }); // ID 2
const key = await db.add("user", {
  id: 3,
  username: "Mr. Troll",
  email: "123@mail.com",
});
db.add("book", { title: "Alice's Adventures in Wonderland", isbn: 123456 });
db.add("book", { title: "White Night", isbn: 456123 });

// Update data in the database
db.put("book", { title: "White Nights", isbn: 456123 });

// Delete data from the database
db.delete("user", key);

// Or clear the database ⚠️⚠️⚠️
// db.clear()

// Retrieve data from the database
const anne = await db.get("user", 2);
console.log(anne);
// or using an index...
const james = await db.get("user", "james@mail.com", "email-index");
console.log(james);
// Or just retrieve all the data at once
const users = await db.getAll("book");
console.log(users);

// Otherwise, if you need more control over the database, you can use a transaction
const tx = db.transaction("user");
const store = tx.objectStore("user");
const request = store.getAll();

request.onsuccess = () => {
  console.log("Users: ", request.result);
};

request.onerror = () => {
  console.error("Error: ", request.error);
};
```
