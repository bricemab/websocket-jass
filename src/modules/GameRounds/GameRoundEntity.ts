import MysqlAbstractEntity from "../../Global/MysqlAbstractEntity";
import Utils from "../../utils/Utils";
import {GeneralErrors} from "../../Global/BackendErrors";
import {DataBaseGameMessage, DataBaseGameRound} from "../../utils/Types";
import moment, {Moment} from "moment";
import GameUsersManager from "../GameUsers/GameUsersManager";
import {TrumpsType} from "../../Global/CardsType";

export default class GameRoundEntity extends MysqlAbstractEntity<boolean> {
  public id: number | null;
  public gameId: number;
  public round: number;
  public trumpUserId: number;
  public trumpSecondUserId: number | null;
  public trump: TrumpsType | null;
  public isFinished: boolean;

  constructor(
    id: number | null,
    gameId: number,
    round: number,
    trumpUserId: number,
    trumpSecondUserId: number | null,
    trump: TrumpsType | null,
    isFinished: boolean
  ) {
    super();
    this.id = id;
    this.gameId = gameId;
    this.round = round;
    this.trumpUserId = trumpUserId;
    this.trumpSecondUserId = trumpSecondUserId;
    this.trump = trump;
    this.isFinished = isFinished;
  }

  async save () {
    try {
      let responseData;
      if (!this.existsInDataBase) {
        responseData = await Utils.executeMysqlRequest(
          Utils.getMysqlPool().execute(
            "INSERT INTO `game_rounds` (`game_id`, `round`, `trump_user_id`, `trump_second_user_id`, `trump`, `is_finished`) VALUES (:gameId, :round, :trumpUserId, :trumpSecondUserId, :trump, :isFinished)",
            {
              gameId: this.gameId,
              round: this.round,
              trumpUserId: this.trumpUserId,
              trumpSecondUserId: this.trumpSecondUserId,
              trump: this.trump,
              isFinished: this.isFinished
            }
          )
        );

        this.id = responseData.insertId;
      } else {
        responseData = await Utils.executeMysqlRequest(
          Utils.getMysqlPool().execute(
            "UPDATE `game_rounds` SET `game_id`= :gameId, `round`= :round, `trump_user_id`= :trumpUserId, `trump_second_user_id`= :trumpSecondUserId, `trump`=:trump, `is_finished`=:isFinished WHERE `id`= :id",
            {
              id: this.id,
              gameId: this.gameId,
              round: this.round,
              trumpUserId: this.trumpUserId,
              trumpSecondUserId: this.trumpSecondUserId,
              trump: this.trump,
              isFinished: this.isFinished
            }
          )
        );
      }
      if (responseData.affectedRows === 0) {
        return {
          success: false,
          error: {
            code: GeneralErrors.DATABASE_REQUEST_ERROR,
            message: "The game_messages has not been persisted in the database"
          }
        };
      }
      return {
        success: true,
        data: {
          gameRound: this
        }
      };
    } catch (e) {
      Utils.manageError(e);
      return {
        success: false,
        error: {
          code: GeneralErrors.DATABASE_REQUEST_ERROR,
          message: "An error has occurred while saving data"
        }
      };
    }
  }

  static fromDatabaseObject(databaseObject: DataBaseGameRound) {
    const gameRound = new GameRoundEntity(
      databaseObject.id,
      databaseObject.game_id,
      databaseObject.round,
      databaseObject.trump_user_id,
      databaseObject.trump_second_user_id,
      databaseObject.trump,
      databaseObject.is_finished.toString() === "1"
    );

    gameRound.existsInDataBase = true;
    return gameRound;
  }

  toJSON(): Object {
    return {
      id: this.id,
      gameId: this.gameId,
      round: this.round,
      trumpUserId: this.trumpUserId,
      trumpSecondUserId: this.trumpSecondUserId,
      trump: this.trump
    };
  }

}
