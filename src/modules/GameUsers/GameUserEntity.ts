import MysqlAbstractEntity from "../../Global/MysqlAbstractEntity";
import {DataBaseGameUser, Teams} from "../../utils/Types";
import moment, {Moment} from "moment";
import {GeneralErrors} from "../../Global/BackendErrors";
import Utils from "../../utils/Utils";

export default class GameUserEntity extends MysqlAbstractEntity<boolean> {
  public id: number | null;
  public teamId: Teams | null;
  public userId: number;
  public joiningGameDate: Moment | null;
  public gameId: number;
  public position: number | null;
  public isFinished: boolean;

  constructor(
    id: number | null,
    teamId: Teams | null,
    userId: number,
    joiningGameDate: Moment | null,
    gameId: number,
    position: number | null,
    isFinished: boolean
  ) {
    super();
    this.id = id;
    this.teamId = teamId;
    this.userId = userId;
    this.joiningGameDate = joiningGameDate;
    this.gameId = gameId;
    this.position = position;
    this.isFinished = isFinished;
  }

  async save() {
    try {
      let responseData;
      if (!this.existsInDataBase) {
        responseData = await Utils.executeMysqlRequest(
          Utils.getMysqlPool().execute(
            "INSERT INTO `game_users` (`team_id`, `user_id`, `joining_game_date`, `game_id`, `position`, `is_finished`) VALUES (:teamId, :userId, :joiningGameDate, :gameId, :position, :isFinished)",
            {
              teamId: this.teamId,
              userId: this.userId,
              joiningGameDate: this.joiningGameDate ? this.joiningGameDate.format("YYYY-MM-DD HH:mm:ss") : null,
              gameId: this.gameId,
              position: this.position,
              isFinished: this.isFinished
            }
          )
        );

        this.id = responseData.insertId;
      } else {
        responseData = await Utils.executeMysqlRequest(
          Utils.getMysqlPool().execute(
            "UPDATE `game_users` SET `team_id`= :teamId, `user_id`= :userId, `joining_game_date`= :joiningGameDate, `game_id`= :gameId, `position`=:position, `is_finished`= :isFinished WHERE `id`= :id",
            {
              teamId: this.teamId,
              userId: this.userId,
              joiningGameDate: this.joiningGameDate ? this.joiningGameDate.format("YYYY-MM-DD HH:mm:ss") : null,
              gameId: this.gameId,
              isFinished: this.isFinished,
              position: this.position,
              id: this.id
            }
          )
        );
      }
      if (responseData.affectedRows === 0) {
        return {
          success: false,
          error: {
            code: GeneralErrors.DATABASE_REQUEST_ERROR,
            message: "The game_users has not been persisted in the database"
          }
        };
      }
      return {
        success: true,
        data: {
          gameUser: this
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

  static fromDatabaseObject(databaseObject: DataBaseGameUser) {
    const gameUser = new GameUserEntity(
      databaseObject.id,
      databaseObject.team_id,
      databaseObject.user_id,
      moment(databaseObject.joining_game_date),
      databaseObject.game_id,
      databaseObject.position,
      databaseObject.is_finished.toString() === '1'
    );

    gameUser.existsInDataBase = true;
    return gameUser;
  }

  toJSON(): Object {
    return {
      id: this.id,
      teamId: this.teamId,
      userId: this.userId,
      joiningGameDate: this.joiningGameDate ? this.joiningGameDate.format("YYYY-MM-DD HH:mm:ss") : null,
      gameId: this.gameId,
      position: this.position,
      isFinished: this.isFinished
    };
  }
}
