interface WebDBSetup {
  objectStores: {
    name: string;
    options?: IDBObjectStoreParameters;
    configs?: {
      recreate?: boolean;
      indexes?: {
        name: string;
        keyPath: string;
        options?: IDBIndexParameters;
      }[];
    };
  }[];

  handlers?: {
    onBlocked?: (event: IDBVersionChangeEvent) => void;
    onVersionChange?: (
      db: IDBDatabase,
      oldVersion: number,
      newVersion: number | undefined
    ) => void;
    onError?: (error: DOMException | undefined) => void;
  };
}

/**
 * Minimal Promise wrapper for the IndexedDB API.
 */
export class WebDB {
  private _database;
  private _setup;
  private _name;
  private _version;

  constructor(name: string, version: number, setup: WebDBSetup);

  /**
   * Initializes the database.
   */
  async init(): Promise<void>;

  /**
   * Starts a transaction.
   *
   * @param storeNames Object stores in the transaction scope.
   * @param mode Transaction mode.
   */
  transaction(
    storeNames: string | string[],
    mode?: IDBTransactionMode
  ): IDBTransaction;

  /**
   * Retrieves a value from an Object Store.
   */
  async get<T>(
    storeName: string,
    query: IDBValidKey | IDBKeyRange,
    index?: string
  ): Promise<T>;

  /**
   * Retrives all the data from an Object Store.
   */
  async getAll<T>(
    storeName: string,
    query?: IDBValidKey | IDBKeyRange,
    index?: string
  ): Promise<T[]>;

  /**
   * Abstracts `IDBObjectStore.add()`.
   */
  async add<T>(
    storeName: string,
    data: T,
    key?: IDBValidKey
  ): Promise<IDBValidKey>;

  /**
   * Abstracts `IDBObjectStore.put()`.
   */
  async put<T>(
    storeName: string,
    data: T,
    key?: IDBValidKey
  ): Promise<IDBValidKey>;

  /**
   * Abstracts `IDBObjectStore.delete()`.
   */
  async delete(
    storeName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<undefined>;

  /**
   * Abstracts `IDBObjectStore.clear()`.
   */
  async clear(storeNames: string | string[]): Promise<undefined>;

  private _handleUpgradeNeeded(databaseRequest: IDBOpenDBRequest): void;

  private async _handleSuccess(
    databaseRequest: IDBOpenDBRequest
  ): Promise<IDBDatabase>;

  private _handleError(databaseRequest: IDBOpenDBRequest): void;

  private _handleBlocked(databaseRequest: IDBOpenDBRequest): void;
}
