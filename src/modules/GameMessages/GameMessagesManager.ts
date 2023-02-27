import {ApplicationResponsePromise, DataBaseGameMessage, DataBaseGameUser} from "../../utils/Types";
import GameUserEntity from "../GameUsers/GameUserEntity";
import Utils from "../../utils/Utils";
import {GeneralErrors} from "../../Global/BackendErrors";
import GameMessageEntity from "./GameMessageEntity";

export default class GameMessagesManager {
  public static async findByGame(
    gameId: number,
    mode: "TEAM_ALL" | "ALL" | "TEAM" = "TEAM_ALL",
    userPseudo = false
  ): ApplicationResponsePromise<{ gameMessages: GameMessageEntity[] }> {
    let sql = "SELECT * FROM `game_messages` M LEFT JOIN `users` U ON U.id = M.user_id WHERE `game_id` = :gameId";
    if (mode === "ALL") {
      sql += " AND `is_all` = 1";
    }
    if (mode === "TEAM") {
      sql += " AND `is_all` = 0";
    }
    const gameMessagesDb = Utils.castMysqlRecordsToArray<DataBaseGameMessage>(
      await Utils.getMysqlPool().execute(
        sql, {gameId}
      )
    );

    const gameMessages:GameMessageEntity[] = [];
    if (gameMessagesDb && gameMessagesDb.length > 0) {
      for (const g of gameMessagesDb) {
        gameMessages.push(await GameMessageEntity.fromDatabaseObject(g));
      }
    }
    return {
      success: true,
      data: {
        gameMessages
      }
    }
  }
}
