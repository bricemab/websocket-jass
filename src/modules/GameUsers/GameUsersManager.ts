import {ApplicationResponsePromise, DataBaseGame, DataBaseGameUser, Teams} from "../../utils/Types";
import Utils from "../../utils/Utils";
import GameUserEntity from "./GameUserEntity";
import {GeneralErrors} from "../../Global/BackendErrors";
import GamesManager from "../Games/GamesManager";
import GameEntity from "../Games/GameEntity";

export interface AvailableTeamPlace {
  teamId: Teams;
  nbrUsers: number;
  places: {pseudo: string; position: number, selectable: boolean}[];
  isFull: boolean;
}

export default class GameUsersManager {
  public static async findByUserId(
    userId: number,
    mode: "ANY" | "FINISHED" | "NOT_FINISHED" = "ANY",
    positionNull = true
  ): ApplicationResponsePromise<{ gameUser: GameUserEntity }> {
    let isFinish = -1;
    if (mode === "FINISHED") {
      isFinish = 0;
    } else if (mode === "NOT_FINISHED") {
      isFinish = 1;
    }
    let sql = "SELECT * FROM `game_users` WHERE `user_id` = :userId AND `is_finished` <> :isFinish";
    if (positionNull) {
      sql += " AND `position` IS NULL"
    }
    const gameUser = Utils.castMysqlRecordToObject<DataBaseGameUser>(
      await Utils.getMysqlPool().execute(
        sql, {userId, isFinish}
      )
    );

    if (gameUser) {
      return {
        success: true,
        data: {
          gameUser: await GameUserEntity.fromDatabaseObject(gameUser)
        }
      }
    }
    return {
      success: false,
      error: {
        code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
        message: "This gameUser can't be found in database",
        details: {
          userId
        }
      }
    };
  }

  public static async findAvailableTeamPlace(
    gameId: number,
  ): ApplicationResponsePromise<{ availableTeamPlaces: AvailableTeamPlace[] }> {
    const teams = Utils.castMysqlRecordsToArray<{
      teamId: Teams;
      pseudo: string;
      position: number;
    }>(
      await Utils.getMysqlPool().execute(
        "SELECT `team_id` AS `teamId`, pseudo, position FROM `game_users` LEFT JOIN users U on U.id = user_id WHERE `game_id` = :gameId AND `is_finished` = 0 AND position IS NOT NULL",
        {gameId, teamId: Teams.TEAM_BLUE}
      )
    );
    const response: AvailableTeamPlace[] = [{
      teamId: Teams.TEAM_RED,
      nbrUsers: 0,
      places: [],
      isFull: false
    },{
      teamId: Teams.TEAM_BLUE,
      nbrUsers: 0,
      places: [],
      isFull: false
    }];
    teams!.forEach(t => {
      if (t.teamId === Teams.TEAM_RED) {
        response[0].nbrUsers++;
        response[0].places.push({
          position: t.position,
          pseudo: t.pseudo,
          selectable: false
        });
        if (GamesManager.MAX_USERS_PER_TEAM === response[0].places.length) {
          response[0].isFull = true;
        }
      } else {
        response[1].nbrUsers++;
        response[0].places.push({
          position: t.position,
          pseudo: t.pseudo,
          selectable: false
        });
        if (GamesManager.MAX_USERS_PER_TEAM === response[1].places.length) {
          response[1].isFull = true;
        }
      }
    });

    return {
      success: true,
      data: {
        availableTeamPlaces: response
      }
    }
  }

  public static async findUsersByGameToken(
    token: string
  ): ApplicationResponsePromise<{ gameUsers: GameUserEntity[] }> {
    const gameUsers = Utils.castMysqlRecordsToArray<DataBaseGameUser>(
      await Utils.getMysqlPool().execute(
        "SELECT GU.* FROM `game_users` GU LEFT JOIN `games` G ON G.id = GU.game_id WHERE G.token = :token AND GU.`is_finished` = '0'",
        {token}
      )
    );

    if (gameUsers) {
      return {
        success: true,
        data: {
          gameUsers: gameUsers.map(value =>
            GameUserEntity.fromDatabaseObject(value)
          )
        }
      }
    }
    return {
      success: false,
      error: {
        code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
        message: "This gameUser can't be found in database",
        details: {
          token
        }
      }
    };
  }

  public static async checkGameIsFullPlayers(
    gameId: number
  ): ApplicationResponsePromise<{ nbrUsers: number, gameUsers: GameUserEntity[] }> {
    const gameUsersDb = Utils.castMysqlRecordsToArray<DataBaseGameUser>(
      await Utils.getMysqlPool().execute(
        "SELECT * FROM `game_users` WHERE `game_id` = :gameId AND `is_finished` = 0",
        { gameId }
      )
    );

    const gameUsers = [];
    if (gameUsersDb) {
      for (const gu of gameUsersDb) {
        gameUsers.push(GameUserEntity.fromDatabaseObject(gu))
      }
    }

    return {
      success: true,
      data: {
        nbrUsers: gameUsersDb ? gameUsersDb.length : 0,
        gameUsers
      }
    }
  }
}
