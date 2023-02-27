import MysqlAbstractEntity from "../../Global/MysqlAbstractEntity";
import {DataBaseGame, Teams} from "../../utils/Types";
import moment, {Moment} from "moment";
import {finished} from "stream";
import {GeneralErrors} from "../../Global/BackendErrors";
import Utils from "../../utils/Utils";

export default class GameEntity extends MysqlAbstractEntity<boolean> {
  public id: number | null;
  public token: string;
  public joiningKey: string;
  public startDate: Moment | null;
  public endDate: Moment | null;
  public winnerTeam: Teams | null;
  public isFinished: boolean;
  public isFull: boolean;

  constructor(
    id: number | null,
    token: string,
    joiningKey: string,
    startDate: Moment | null,
    endDate: Moment | null,
    winnerTeam: Teams | null,
    isFinished: boolean,
    isFull: boolean
  ) {
    super();
    this.id = id;
    this.token = token;
    this.joiningKey = joiningKey;
    this.startDate = startDate;
    this.endDate = endDate;
    this.winnerTeam = winnerTeam;
    this.isFinished = isFinished;
    this.isFull = isFull;
  }

  async save() {
    try {
      let responseData;
      if (!this.existsInDataBase) {
        responseData = await Utils.executeMysqlRequest(
          Utils.getMysqlPool().execute(
            "INSERT INTO `games` (`token`, `joining_key`, `start_date`, `end_date`, `winner_team`, `is_finished`, `is_full`) VALUES (:token, :joiningKey, :startDate, :endDate, :winnerTeam, :isFinished, :isFull)",
            {
              token: this.token,
              joiningKey: this.joiningKey,
              startDate: this.startDate ? this.startDate.format("YYYY-MM-DD HH:mm:ss") : null,
              endDate: this.endDate ? this.endDate.format("YYYY-MM-DD HH:mm:ss") : null,
              winnerTeam: this.winnerTeam ? this.winnerTeam : null,
              isFinished: this.isFinished,
              isFull: this.isFull
            }
          )
        );

        this.id = responseData.insertId;
      } else {
        responseData = await Utils.executeMysqlRequest(
          Utils.getMysqlPool().execute(
            "UPDATE `games` SET `token`= :token, `joining_key`= :joiningKey, `start_date`= :startDate, `end_date`= :endDate, `winner_team`= :winnerTeam, `is_finished`= :isFinished, `is_full` = :isFull WHERE `id`= :id",
            {
              token: this.token,
              joiningKey: this.joiningKey,
              startDate: this.startDate ? this.startDate.format("YYYY-MM-DD HH:mm:ss") : null,
              endDate: this.endDate ? this.endDate.format("YYYY-MM-DD HH:mm:ss") : null,
              winnerTeam: this.winnerTeam ? this.winnerTeam : null,
              isFinished: this.isFinished,
              isFull: this.isFull,
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
            message: "The game has not been persisted in the database"
          }
        };
      }
      return {
        success: true,
        data: {
          game: this
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

  static fromDatabaseObject(databaseObject: DataBaseGame) {
    const setting = new GameEntity(
      databaseObject.id,
      databaseObject.token,
      databaseObject.joining_key,
      databaseObject.start_date ? moment(databaseObject.start_date) : null,
      databaseObject.end_date ? moment(databaseObject.end_date) : null,
      databaseObject.winner_team,
      databaseObject.is_finished.toString() === '1',
      databaseObject.is_full.toString() === '1',
    );

    setting.existsInDataBase = true;
    return setting;
  }

  toJSON(): Object {
    return {
      id: this.id,
      token: this.token,
      joiningKey: this.joiningKey,
      startDate: this.startDate ? this.startDate.format("YYYY-MM-DD HH:mm:ss") : null,
      endDate: this.endDate ? this.endDate.format("YYYY-MM-DD HH:mm:ss") : null,
      winnerTeam: this.winnerTeam,
      isFinished: this.isFinished,
      isFull: this.isFull
    };
  }
}
