export interface Athlete {
  id: string;
  name: string;
  username: string;
  sport: string;
  team: string;
  avatar: string;
}

export const MOCK_ATHLETES: Athlete[] = [
  {
    id: '1',
    name: 'LeBron James',
    username: '@kingjames',
    sport: 'Basketball',
    team: 'Los Angeles Lakers',
    avatar: 'https://example.com/lebron.jpg'
  },
  {
    id: '2',
    name: 'Serena Williams',
    username: '@serenaw',
    sport: 'Tennis',
    team: 'USA',
    avatar: 'https://example.com/serena.jpg'
  }
];
