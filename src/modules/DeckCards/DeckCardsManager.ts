import {ApplicationResponsePromise, DataBaseDeckCards} from "../../utils/Types";
import Utils from "../../utils/Utils";
import DeckCardEntity from "./DeckCardEntity";
import GameEntity from "../Games/GameEntity";
import GamesManager from "../Games/GamesManager";
import GameUsersManager from "../GameUsers/GameUsersManager";
import GameRoundsManager from "../GameRounds/GameRoundsManager";
import GameUserEntity from "../GameUsers/GameUserEntity";
import GameRoundEntity from "../GameRounds/GameRoundEntity";
import {GeneralErrors} from "../../Global/BackendErrors";

export interface UserDeckType {
  gameUser: GameUserEntity;
  deckCards: DeckCardEntity[]
}

export default class DeckCardsManager {
  static async getByUserRound (
    userId: number,
    gameRoundId: number,
    onlyNotPlayed = false
  ): ApplicationResponsePromise<{ deckCards: DeckCardEntity[] }> {
    let sql = "SELECT * FROM `deck_cards` WHERE `user_id` = :userId AND `game_round_id` = :gameRoundId";
    if (onlyNotPlayed) {
      sql += " AND `is_played` = 0"
    }
    const deckCardsDb = Utils.castMysqlRecordsToArray<DataBaseDeckCards>(
      await Utils.getMysqlPool().execute(sql, { userId, gameRoundId })
    );

    const deckCards = [];
    if (deckCardsDb) {
      for (const d of deckCardsDb) {
        deckCards.push(await DeckCardEntity.fromDatabaseObject(d));
      }
    }
    return {
      success: true,
      data: {
        deckCards
      }
    }
  }

  static async findCardByKeyGameRound(
    keyCard: string,
    gameRoundId: number
  ): ApplicationResponsePromise<{ deckCard: DeckCardEntity }> {
    let sql = "SELECT * FROM `deck_cards` WHERE `card` = :keyCard AND `game_round_id` = :gameRoundId";
    const deckCardDb = Utils.castMysqlRecordToObject<DataBaseDeckCards>(
      await Utils.getMysqlPool().execute(sql, { keyCard, gameRoundId })
    );

    if (deckCardDb) {
      return {
        success: true,
        data: {
          deckCard: DeckCardEntity.fromDatabaseObject(deckCardDb)
        }
      }
    }
    return {
      success: false,
      error: {
        code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
        message: "This deck_cards can't be found in database",
        details: {
          keyCard, gameRoundId
        }
      }
    };
  }

  static async shuffleCardsAndCreateGameDeck(
    gameToken: string
  ): Promise<UserDeckType[]> {
    const gameResponse = await GamesManager.findByToken(gameToken);
    const { game } = gameResponse.data!;
    const gameUsersResponse = await GameUsersManager.findUsersByGameToken(gameToken);
    const { gameUsers } = gameUsersResponse.data!;
    const gameRoundResponse = await GameRoundsManager.findLastRoundByGame(game.id!);
    const { gameRound } = gameRoundResponse.data!;
    const cards = Utils.getCardsShuffle();
    let lastSliceCard = 0;
    const userDecks: UserDeckType[] = [];
    for (const gameUser of gameUsers) {
      const userCards = cards.slice(lastSliceCard, lastSliceCard+GamesManager.NUMBER_CARDS_PER_DECK);
      lastSliceCard += GamesManager.NUMBER_CARDS_PER_DECK;
      let userDeck: UserDeckType = {
        gameUser,
        deckCards: []
      };
      for (const card of userCards) {
        const deckCard = new DeckCardEntity(null, gameUser.userId!, card.key, gameRound.id!, game.id!, false);
        await deckCard.save();
        userDeck.deckCards.push(deckCard);
      }
      userDecks.push(userDeck);
    }
    return userDecks;
  }
}
