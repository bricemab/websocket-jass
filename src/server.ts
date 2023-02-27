import WebSocket from "ws";
import { createPool } from "mysql2";
import WebSocketManager from "./modules/WebSocket/WebSocketManager";
import Utils from "./utils/Utils";
import config from "./config/config";
import GlobalStore from "./utils/GlobalStore";
import { WebSocketState } from "./modules/WebSocket/WebsocketTypes";
import { DatabaseSettings } from "./utils/Types";

const main = async () => {
  const pool = await createPool({
    host: config.database.host,
    user: config.database.user,
    database: config.database.database,
    password: config.database.password,
    waitForConnections: true,
    connectionLimit: 20,
    namedPlaceholders: true,
    queueLimit: 0
  });

  const promisePool = await pool.promise();
  GlobalStore.addItem("dbConnection", promisePool);
  const dbSettings = Utils.castMysqlRecordsToArray<
    DatabaseSettings
    >(
    await Utils.getMysqlPool().execute(
      "SELECT * FROM settings"
    )
  );

  console.log(dbSettings)
  GlobalStore.addItem("dbSettings", dbSettings)
  const wss = new WebSocket.Server({ port: config.server.port });
  const wsManager = new WebSocketManager(wss);
  wss.on("connection", wsManager.onNewConnection);
  wss.on("close", function close() {
    clearInterval(wsManager.intervalInstance);
    wsManager.state = WebSocketState.DISCONNECTED;
  });
};

main().catch(reason => {
  console.error("AN ERROR HAS OCCURRED IN MAIN PROCESS");
  console.error(reason);
  Utils.debug(reason);
});
