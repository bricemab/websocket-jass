import MysqlAbstractEntity from "../../Global/MysqlAbstractEntity";
import Utils from "../../utils/Utils";
import {GeneralErrors} from "../../Global/BackendErrors";
import {DataBaseGameMessage} from "../../utils/Types";
import moment, {Moment} from "moment";
import GameUsersManager from "../GameUsers/GameUsersManager";

export default class GameMessageEntity extends MysqlAbstractEntity<boolean> {
  public id: number | null;
  public text: string;
  public userId: number;
  public gameId: number;
  public date: Moment;
  public isAll: boolean;

  constructor(
    id: number | null,
    text: string,
    userId: number,
    gameId: number,
    date: Moment,
    isAll: boolean
  ) {
    super();
    this.id = id;
    this.text = text;
    this.userId = userId;
    this.gameId = gameId;
    this.date = date;
    this.isAll = isAll;
  }

  async save () {
    try {
      let responseData;
      if (!this.existsInDataBase) {
        responseData = await Utils.executeMysqlRequest(
          Utils.getMysqlPool().execute(
            "INSERT INTO `game_messages` (`text`, `user_id`, `game_id`, `date`, `is_all`) VALUES (:text, :userId, :gameId, :date, :isAll)",
            {
              id: this.id,
              text: this.text,
              userId: this.userId,
              gameId: this.gameId,
              date: this.date.format("YYYY-MM-DD HH:mm:ss"),
              isAll: this.isAll
            }
          )
        );

        this.id = responseData.insertId;
      } else {
        responseData = await Utils.executeMysqlRequest(
          Utils.getMysqlPool().execute(
            "UPDATE `game_messages` SET `text`= :text, `user_id`= :userId, `game_id`= :gameId, `date`= :date, `is_all`=:isAll WHERE `id`= :id",
            {
              id: this.id,
              text: this.text,
              userId: this.userId,
              gameId: this.gameId,
              date: this.date.format("YYYY-MM-DD HH:mm:ss"),
              isAll: this.isAll
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
          gameMessage: this
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

  static fromDatabaseObject(databaseObject: DataBaseGameMessage) {
    const gameMessage = new GameMessageEntity(
      databaseObject.id,
      databaseObject.text,
      databaseObject.user_id,
      databaseObject.game_id,
      moment(databaseObject.date),
      databaseObject.is_all.toString() === '1'
    );

    gameMessage.existsInDataBase = true;
    return gameMessage;
  }

  toJSON(): Object {
    return {
      id: this.id,
      text: this.text,
      userId: this.userId,
      gameId: this.gameId,
      date: this.date.format("YYYY-MM-DD HH:mm:ss"),
      isAll: this.isAll
    };
  }

}
