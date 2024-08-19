import { useEffect, useState } from "react";
import "./App.css";
import { getDatabase, closeDB, loadUsers, dbSize } from "./db";

function App() {
  const [names, setNames] = useState<string[]>([]);
  const [size, setSize] = useState<number | null>(null);

  useEffect(() => {
    getDatabase().then((db) => {
      db.exec("CREATE TABLE IF NOT EXISTS users(id INTEGER, name TEXT)");
      loadUsers().then((users) => setNames(users.map((u) => u.name)));
      dbSize().then((s) => setSize(s));
    });
    return () => {
      // clean up
      closeDB();
    };
  }, []);

  const executeQuery = async () => {
    const db = await getDatabase();
    const select_max = "SELECT max(id) as max_count FROM users";
    const max = (db.selectValue(select_max) as number) ?? 0;
    console.log(`row count: ${max}`);

    // 行追加(exec)
    db.exec({
      sql: "insert into users values(?,?)",
      bind: [max + 1, `Alice${max + 1}`],
    });

    // 行追加(prepare & bind)
    const stmt = db.prepare("insert into users values(?, ?)");
    stmt.bind([max + 2, `Bob${max + 2}`]).stepReset();
    stmt.finalize();

    // 結果出力
    const values = db.exec({
      sql: "SELECT * FROM users",
      rowMode: "object",
      returnValue: "resultRows",
    });
    console.log(values);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setNames(values.map((v: any) => v.name));
    setSize(await dbSize());
  };

  return (
    <>
      <div>
        <button id="exec" onClick={() => executeQuery()}>
          SQLite Wasm実行
        </button>
        <p>実行結果はDevToolsのConsoleに出力されます。</p>
        <ul style={{ listStyle: "none" }}>
          {names.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
        <p>DBサイズ: {size ?? "不明"} bytes</p>
      </div>
    </>
  );
}

export default App;
