import MysqlAbstractEntity from "../../Global/MysqlAbstractEntity";
import moment, {Moment} from "moment";
import {DatabaseSettings, DatabaseUser} from "../../utils/Types";

export default class UserEntity extends MysqlAbstractEntity<boolean> {
  public id: number;
  public pseudo: string;
  public email: string;
  public password: string;
  public registrationDate: Moment;
  public lastConnexionDate: Moment;
  public wsToken: string;
  public isArchived: boolean

  constructor(id: number, pseudo: string, email: string, password: string, registrationDate: Moment, lastConnexionDate: Moment, wsToken: string, isArchived: boolean) {
    super();
    this.id = id;
    this.pseudo = pseudo;
    this.email = email;
    this.password = password;
    this.registrationDate = registrationDate;
    this.lastConnexionDate = lastConnexionDate;
    this.wsToken = wsToken;
    this.isArchived = isArchived;
  }

  async save() {
    // todo: save user
    console.log("todo")
  }

  static fromDatabaseObject(databaseObject: DatabaseUser) {
    const setting = new UserEntity(
      databaseObject.id,
      databaseObject.pseudo,
      databaseObject.email,
      databaseObject.password,
      moment(databaseObject.registration_date),
      moment(databaseObject.last_connexion_date),
      databaseObject.ws_token,
      databaseObject.is_archived
    );

    setting.existsInDataBase = true;
    return setting;
  }

  toJSON(): Object {
    return {
      id: this.id,
      pseudo: this.pseudo,
      email: this.email,
      password: this.password,
      registrationDate: this.registrationDate,
      lastConnexionDate: this.lastConnexionDate,
      wsToken: this.wsToken,
      isArchived: this.isArchived
    };
  }
}
