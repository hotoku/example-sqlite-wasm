import sqlite3InitModule, {
  Database,
  Sqlite3Static,
} from "@sqlite.org/sqlite-wasm";

const log = (...args: any[]) => console.log(...args); // eslint-disable-line
const error = (...args: any[]) => console.error(...args); // eslint-disable-line

let db: Database | null = null;

/**
 * sqlite3に接続してDBを作成
 * ・https://sqlite.org/wasm/doc/tip/api-oo1.md
 * @param sqlite3
 * @returns
 */
const connectDB = (sqlite3: Sqlite3Static) => {
  log("Running SQLite3 version", sqlite3.version.libVersion);

  // localStorageに保存(永続化)
  // (c: DBがなければ作成する, t: 実行したクエリをConsoleへ出力(trace on))
  db = new sqlite3.oo1.DB("file:local?vfs=kvvfs", "ct");

  // DBサイズ(CスタイルのAPI経由)
  console.log(`DB size: ${sqlite3.capi.sqlite3_js_kvvfs_size()}`);

  // 永続化しない場合
  // db = new sqlite3.oo1.DB('/mydb.sqlite3', 'ct');
  // JsStorageDb()はlocalStorageを簡単に利用できるが、SQLのトレースが利用できない
  // db = new sqlite3.oo1.JsStorageDb('local');
  return db;
};

export const dbSize = async (): Promise<number> => {
  const sqlite3 = await sqlite3InitModule({
    print: log,
    printErr: error,
  });
  return sqlite3.capi.sqlite3_js_kvvfs_size();
};

/**
 * DBが初期化済みであれば閉じる
 */
export const closeDB = () => {
  db?.close();
  db = null;
};

/**
 * DBの初期化と接続を行う
 * @returns Database
 */
export const getDatabase = async (): Promise<Database> => {
  if (db) {
    return db;
  }

  log("Loading and initializing SQLite3 module...");

  try {
    // sqlite3の初期化
    const sqlite3 = await sqlite3InitModule({
      print: log,
      printErr: error,
    });

    // DBに接続
    db = connectDB(sqlite3);

    return db;
  } catch (err: unknown) {
    if (err instanceof Error) {
      error(err.name, err.message);
      throw err;
    }
  }

  throw new Error("unknown error");
};

export type User = {
  id: number;
  name: string;
};

export const loadUsers = async (): Promise<User[]> => {
  const db = await getDatabase();
  const values = db.exec({
    sql: "SELECT id, name FROM users",
    rowMode: "object",
    returnValue: "resultRows",
  });
  return values as User[];
};
