export enum TrumpsType {
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES',
  HEARTS = 'HEARTS'
}

export interface CardObjectType {
  key: string;
  path: string;
  value: number;
  trumpValue: number;
}

export const CARDS = [
    {
      trump: TrumpsType.CLUBS,
      coefficient: 1,
      cards: [
        {

          key: 'SIX_OF_CLUBS',
          path: '6_of_clubs.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'SEVEN_OF_CLUBS',
          path: '7_of_clubs.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'EIGHT_OF_CLUBS',
          path: '8_of_clubs.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'NINE_OF_CLUBS',
          path: '9_of_clubs.png',
          value: 0,
          trumpValue: 14
        },
        {
          key: 'TEN_OF_CLUBS',
          path: '10_of_clubs.png',
          value: 10,
          trumpValue: 10
        },
        {
          key: 'JACK_OF_CLUBS',
          path: 'jack_of_clubs.png',
          value: 2,
          trumpValue: 20
        },
        {
          key: 'QUEEN_OF_CLUBS',
          path: 'queen_of_clubs.png',
          value: 3,
          trumpValue: 3
        },
        {
          key: 'KING_OF_CLUBS',
          path: 'king_of_clubs.png',
          value: 4,
          trumpValue: 4
        },
        {
          key: 'ACE_OF_CLUBS',
          path: 'ace_of_clubs.png',
          value: 11,
          trumpValue: 11
        }
      ]
    },
    {
      trump: TrumpsType.DIAMONDS,
      coefficient: 1,
      cards: [
        {
          key: 'SIX_OF_DIAMONDS',
          path: '6_of_diamonds.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'SEVEN_OF_DIAMONDS',
          path: '7_of_diamonds.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'EIGHT_OF_DIAMONDS',
          path: '8_of_diamonds.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'NINE_OF_DIAMONDS',
          path: '9_of_diamonds.png',
          value: 0,
          trumpValue: 14
        },
        {
          key: 'TEN_OF_DIAMONDS',
          path: '10_of_diamonds.png',
          value: 10,
          trumpValue: 10
        },
        {
          key: 'JACK_OF_DIAMONDS',
          path: 'jack_of_diamonds.png',
          value: 2,
          trumpValue: 20
        },
        {
          key: 'QUEEN_OF_DIAMONDS',
          path: 'queen_of_diamonds.png',
          value: 3,
          trumpValue: 3
        },
        {
          key: 'KING_OF_DIAMONDS',
          path: 'king_of_diamonds.png',
          value: 4,
          trumpValue: 4
        },
        {
          key: 'ACE_OF_DIAMONDS',
          path: 'ace_of_diamonds.png',
          value: 11,
          trumpValue: 11
        }

      ]
    },
    {
      trump: TrumpsType.HEARTS,
      coefficient: 1,
      cards: [
        {
          key: 'SIX_OF_HEARTS',
          path: '6_of_hearts.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'SEVEN_OF_HEARTS',
          path: '7_of_hearts.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'EIGHT_OF_HEARTS',
          path: '8_of_hearts.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'NINE_OF_HEARTS',
          path: '9_of_hearts.png',
          value: 0,
          trumpValue: 14
        },
        {
          key: 'TEN_OF_HEARTS',
          path: '10_of_hearts.png',
          value: 10,
          trumpValue: 10
        },
        {
          key: 'JACK_OF_HEARTS',
          path: 'jack_of_hearts.png',
          value: 2,
          trumpValue: 20
        },
        {
          key: 'QUEEN_OF_HEARTS',
          path: 'queen_of_hearts.png',
          value: 3,
          trumpValue: 3
        },
        {
          key: 'KING_OF_HEARTS',
          path: 'king_of_hearts.png',
          value: 4,
          trumpValue: 4
        },
        {
          key: 'ACE_OF_HEARTS',
          path: 'ace_of_hearts.png',
          value: 11,
          trumpValue: 11
        }
      ]
    },
    {
      trump: TrumpsType.SPADES,
      coefficient: 2,
      cards: [
        {
          key: 'SIX_OF_SPADES',
          path: '6_of_spades.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'SEVEN_OF_SPADES',
          path: '7_of_spades.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'EIGHT_OF_SPADES',
          path: '8_of_spades.png',
          value: 0,
          trumpValue: 0
        },
        {
          key: 'NINE_OF_SPADES',
          path: '9_of_spades.png',
          value: 0,
          trumpValue: 14
        },
        {
          key: 'TEN_OF_SPADES',
          path: '10_of_spades.png',
          value: 10,
          trumpValue: 10
        },
        {
          key: 'JACK_OF_SPADES',
          path: 'jack_of_spades.png',
          value: 2,
          trumpValue: 20
        },
        {
          key: 'QUEEN_OF_SPADES',
          path: 'queen_of_spades.png',
          value: 3,
          trumpValue: 3
        },
        {
          key: 'KING_OF_SPADES',
          path: 'king_of_spades.png',
          value: 4,
          trumpValue: 4
        },
        {
          key: 'ACE_OF_SPADES',
          path: 'ace_of_spades.png',
          value: 11,
          trumpValue: 11
        }
      ]
    }
  ]
;
