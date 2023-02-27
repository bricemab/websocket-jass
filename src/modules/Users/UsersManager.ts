import {ApplicationResponsePromise, DatabaseSettings, DatabaseUser} from "../../utils/Types";
import UserEntity from "./UserEntity";
import SettingEntity from "../Settings/SettingEntity";
import Utils from "../../utils/Utils";
import {GeneralErrors} from "../../Global/BackendErrors";

export default class UsersManager {
  public static async findByWsToken(
    token: string
  ): ApplicationResponsePromise<{user: UserEntity}> {
    const user = Utils.castMysqlRecordToObject<DatabaseUser>(
      await Utils.getMysqlPool().execute(
        "SELECT * FROM users WHERE ws_token = :wsToken",
        { wsToken: token }
      )
    );

    if (user) {
      return {
        success: true,
        data: {
          user: await UserEntity.fromDatabaseObject(user)
        }
      }
    }
    return {
      success: false,
      error: {
        code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
        message: "This setting can't be found in database",
        details: {
          token
        }
      }
    };
  }

  public static async findById(
    id: number
  ): ApplicationResponsePromise<{user: UserEntity}> {
    const user = Utils.castMysqlRecordToObject<DatabaseUser>(
      await Utils.getMysqlPool().execute(
        "SELECT * FROM users WHERE id = :id",
        { id }
      )
    );

    if (user) {
      return {
        success: true,
        data: {
          user: await UserEntity.fromDatabaseObject(user)
        }
      }
    }
    return {
      success: false,
      error: {
        code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
        message: "This setting can't be found in database",
        details: {
          token
        }
      }
    };
  }
}
