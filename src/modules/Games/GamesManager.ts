import {ApplicationResponsePromise, DatabaseSettings, DataBaseGame, DataBaseGameUser} from "../../utils/Types";
import Utils from "../../utils/Utils";
import GameEntity from "./GameEntity";
import {GeneralErrors} from "../../Global/BackendErrors";
import GameUserEntity from "../GameUsers/GameUserEntity";
import GameUsersManager from "../GameUsers/GameUsersManager";

export default class GamesManager {
  static readonly MAX_USERS_PER_TEAM = 2;
  static readonly MAX_USERS_PER_GAME = 4;
  static readonly NUMBER_CARDS_PER_DECK = 9;
  public static async findByToken(
    token: string
  ): ApplicationResponsePromise<{ game: GameEntity }> {
    const game = Utils.castMysqlRecordToObject<DataBaseGame>(
      await Utils.getMysqlPool().execute(
        "SELECT * FROM `games` WHERE `token` = :token",
        { token }
      )
    );

    if (game) {
      return {
        success: true,
        data: {
          game: await GameEntity.fromDatabaseObject(game)
        }
      }
    }
    return {
      success: false,
      error: {
        code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
        message: "This game can't be found in database",
        details: {
          token
        }
      }
    };
  }

  public static async findCurrentUserGame(
    userId: number
  ): ApplicationResponsePromise<{ game: GameEntity, gameUser: GameUserEntity }> {
    const gameUserDb = Utils.castMysqlRecordToObject<DataBaseGameUser>(
      await Utils.getMysqlPool().execute(
        "SELECT * FROM `game_users` WHERE `user_id` = :userId AND `is_finished` = 0 AND position IS NOT NULL",
        { userId }
      )
    );

    if (!gameUserDb) {
      return {
        success: false,
        error: {
          code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
          message: "This game_users can't be found in database",
          details: {
            userId
          }
        }
      };
    }

    const gameUser = await GameUserEntity.fromDatabaseObject(gameUserDb)
    const game = Utils.castMysqlRecordToObject<DataBaseGame>(
      await Utils.getMysqlPool().execute(
        "SELECT * FROM `games` WHERE `id` = :id AND `is_finished` = 0",
        { id: gameUser.gameId }
      )
    );

    if (game) {
      return {
        success: true,
        data: {
          game: await GameEntity.fromDatabaseObject(game),
          gameUser
        }
      }
    }

    return {
      success: false,
      error: {
        code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
        message: "This games can't be found in database",
        details: {
          userId
        }
      }
    };
  }

  public static async findAvailableGame(): ApplicationResponsePromise<{ game: GameEntity }> {
    const game = Utils.castMysqlRecordToObject<DataBaseGame>(
      await Utils.getMysqlPool().execute(
        "SELECT * FROM `games` WHERE `is_full` = 0 AND `is_finished` = 0",
        {}
      )
    );

    if (game) {
      return {
        success: true,
        data: {
          game: await GameEntity.fromDatabaseObject(game)
        }
      }
    }
    return {
      success: false,
      error: {
        code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
        message: "This games can't be found in database",
        details: {}
      }
    };
  }
}
