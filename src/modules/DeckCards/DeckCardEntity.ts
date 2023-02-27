import MysqlAbstractEntity from "../../Global/MysqlAbstractEntity";
import Utils from "../../utils/Utils";
import {GeneralErrors} from "../../Global/BackendErrors";
import {DataBaseDeckCards} from "../../utils/Types";

export default class DeckCardEntity extends MysqlAbstractEntity<boolean>{
  public id: number | null;
  public userId: number;
  public card: string;
  public gameRoundId: number;
  public gameId: number;
  public isPlayed: boolean;

  constructor(
    id: number | null,
    userId: number,
    card: string,
    gameRoundId: number,
    gameId: number,
    isPlayed: boolean
  ) {
    super();
    this.id = id;
    this.userId = userId;
    this.card = card;
    this.gameRoundId = gameRoundId;
    this.gameId = gameId;
    this.isPlayed = isPlayed;
  }

  async save () {
    try {
      let responseData;
      if (!this.existsInDataBase) {
        responseData = await Utils.executeMysqlRequest(
          Utils.getMysqlPool().execute(
            "INSERT INTO `deck_cards` (`user_id`, `card`, `game_round_id`, `game_id`, `is_played`) VALUES (:userId, :card, :gameRoundId, :gameId, :isPlayed)",
            {
              userId: this.userId,
              card: this.card,
              gameId: this.gameId,
              isPlayed: this.isPlayed,
              gameRoundId: this .gameRoundId
            }
          )
        );

        this.id = responseData.insertId;
      } else {
        responseData = await Utils.executeMysqlRequest(
          Utils.getMysqlPool().execute(
            "UPDATE `deck_cards` SET `user_id`= :userId, `card`= :card, `game_id`= :gameId, `game_round_id`= :gameRoundId, `is_played`=:isPlayed WHERE `id`= :id",
            {
              id: this.id,
              userId: this.userId,
              card: this.card,
              gameId: this.gameId,
              isPlayed: this.isPlayed,
              gameRoundId: this.gameRoundId
            }
          )
        );
      }
      if (responseData.affectedRows === 0) {
        return {
          success: false,
          error: {
            code: GeneralErrors.DATABASE_REQUEST_ERROR,
            message: "The deck_cards has not been persisted in the database"
          }
        };
      }
      return {
        success: true,
        data: {
          deckCard: this
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

  static fromDatabaseObject(databaseObject: DataBaseDeckCards) {
    const deck = new DeckCardEntity(
      databaseObject.id,
      databaseObject.user_id,
      databaseObject.card,
      databaseObject.game_round_id,
      databaseObject.game_id,
      databaseObject.is_played.toString() === "1"
    );

    deck.existsInDataBase = true;
    return deck;
  }

  toJSON(): Object {
    return {
      id: this.id,
      userId: this.userId,
      card: this.card,
      gameId: this.gameId,
      gameRoundId: this.gameRoundId,
      isPlayed: this.isPlayed
    };
  }
}
