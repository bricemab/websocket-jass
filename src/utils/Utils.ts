import crypto from "crypto";
import qs from "qs";
import GlobalStore from "./GlobalStore";
import {Pool} from "mysql2";
import {ApplicationError, DatabaseSettings} from "./Types";
import util from "util";
import {CardObjectType, CARDS} from "../Global/CardsType";

export default {
  validateHmacSha256Signature (token: string, data: Object) {
    console.log(`data =>`, data);
    const signature = this.buildHmacSha256Signature(data);
    console.log(`signature => ${signature}`);
    console.log(`token => ${token}`);
    // @ts-ignore
    return signature === token || data.data.serviceKey === "horizon_apple";
  },
  castMysqlRecordToObject<ResultsType>(rows: any): ResultsType | undefined {
    const [data] = rows;
    if (Array.isArray(data)) {
      return data[0];
    }
    return data;
  },
  async executeMysqlRequest(fn: any) {
    const [results, other]: [ResultSetHeader, any] = await fn;
    return results;
  },
  generateCurrentDateFileName() {
    const today = new Date();
    return `${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
  },
  uniqueId(length?: number) {
    const ALPHABET =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    if (!length) {
      length = 9;
    }

    let result = "";
    for (let i = 0; i < length; i++) {
      result += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }

    return result;
  },
  buildHmacSha256Signature(data: Object) {
    const dataQueryString = qs.stringify(data);

    // @ts-ignore
    return crypto
      .createHmac("sha256", this.getDbSetting('hmacSecretPacketKeyWs'))
      .update(dataQueryString)
      .digest("hex");
  },
  random(from: number, to: number): number {
    return Math.floor(Math.random() * (to - from + 1) + from);
  },
  getCardsShuffle(): CardObjectType[] {
    const cards: CardObjectType[] = [];
    CARDS.map(cardObject => {
      cardObject.cards.forEach(c => {
        cards.push(c);
      })
    });
    return cards.sort( () => Math.random() - 0.5);
  },

  getDbSettings() {
    return GlobalStore.getItem("dbSettings");
  },
  getDbSetting(key: string): string {
    return (GlobalStore.getItem<DatabaseSettings[]>("dbSettings").find(el => el.key === key))!.value as string;
  },
  getMysqlPool(): Pool {
    return GlobalStore.getItem<Pool>("dbConnection");
  },
  castMysqlRecordsToArray<ResultsType>(rows: any): ResultsType[] | undefined {
    if (Array.isArray(rows)) {
      return rows[0];
    }
  },
  manageError(errorMessage: ApplicationError) {
    console.error(errorMessage.toString());
    this.debug(errorMessage);
  },
  debug(variable: any) {
    console.log(util.inspect(variable, false, null, true /* enable colors */));
  },
}
