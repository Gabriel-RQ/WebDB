/// <reference path="../types/webdb.d.ts" />

export class WebDB {
  #_database = null;
  #_setup;
  #_name;
  #_version;

  constructor(name, version, setup) {
    this.#_setup = setup;
    this.#_name = name;
    this.#_version = version;
  }

  async init() {
    const databaseRequest = indexedDB.open(this.#_name, this.#_version);
    if ("handlers" in this.#_setup) {
      this.#_handleBlocked(databaseRequest);
      this.#_handleError(databaseRequest);
    }

    this.#_handleUpgradeNeeded(databaseRequest);
    this.#_database = await this.#_handleSuccess(databaseRequest);
  }

  #_handleUpgradeNeeded(databaseRequest) {
    databaseRequest.onupgradeneeded = () => {
      // retrieve database
      this.#_database = databaseRequest.result;

      if ("objectStores" in this.#_setup) {
        for (const { name, options, configs } of this.#_setup.objectStores) {
          // verify if need to recreate object stores (to delete them first)
          if (
            configs &&
            "recreate" in configs &&
            configs.recreate &&
            this.#_database.objectStoreNames.contains(name)
          ) {
            this.#_database.deleteObjectStore(name);
          }

          // create object stores
          if (!this.#_database.objectStoreNames.contains(name)) {
            const store = this.#_database.createObjectStore(name, options);

            // create the indexes for the object store, if any
            if (configs && "indexes" in configs) {
              configs.indexes.forEach((idx) =>
                store.createIndex(idx.name, idx.keyPath, idx.options)
              );
            }
          }
        }
      }
    };
  }

  async #_handleSuccess(databaseRequest) {
    return new Promise((resolve, reject) => {
      databaseRequest.onsuccess = () => {
        const db = databaseRequest.result;

        if (
          "handlers" in this.#_setup &&
          this.#_setup.handlers.onVersionChange !== undefined
        ) {
          db.onversionchange = (event) => {
            this.#_setup.handlers.onVersionChange(
              db,
              event.oldVersion,
              event.newVersion
            );
          };
        }

        resolve(db);
      };
    });
  }

  #_handleError(databaseRequest) {
    if (this.#_setup.handlers.onError !== undefined) {
      databaseRequest.onerror = () => {
        this.#_setup.handlers.onError(this.databaseRequest.error);
      };
    }
  }

  #_handleBlocked(databaseRequest) {
    if (this.#_setup.handlers.onBlocked !== undefined) {
      databaseRequest.onblocked = this.#_setup.handlers.onBlocked;
    }
  }

  transaction(storeNames, mode) {
    return this.#_database.transaction(storeNames, mode);
  }

  async get(storeName, query, index) {
    const tx = this.transaction(storeName);
    const store = tx.objectStore(storeName);
    const idx = index ? store.index(index) : null;

    return new Promise((resolve, reject) => {
      const request = idx ? idx.get(query) : store.get(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, query, index) {
    const tx = this.transaction(storeName);
    const store = tx.objectStore(storeName);
    const idx = index ? store.index(index) : null;

    return new Promise((resolve, reject) => {
      const request = idx ? idx.getAll(query) : store.getAll(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, data, key) {
    const tx = this.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.add(data, key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data, key) {
    const tx = this.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data, key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, query) {
    const tx = this.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeNames) {
    const tx = this.transaction(storeNames, "readwrite");

    if (Array.isArray(storeNames)) {
      storeNames.forEach((name) => {
        store = tx.objectStore(name);
        store.clear();
      });
    } else {
      tx.objectStore(storeNames).clear();
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => reject(tx.error);
    });
  }
}
