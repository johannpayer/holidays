/* eslint-disable no-var */
/* eslint-disable no-unused-vars */
const usaColors = [
  'ad001e',
  'f5f5f5',
  'ffffff',
  '2578B2',
];
var holidays = [
  [ 'new years', 1, 1, null, [
    '03172f',
    '062844',
    '093657',
    'fff7b6',
    'efd466',
    'd7b030',
  ] ],
  [ `valentine's day`, 2, 14, null, [
    'fa7ba8',
    'f38fb3',
    'f0a2bc',
    'f3bed0',
    'f8d8e3',
    'fdf2f6',
  ] ],
  [ `saint patrick's day`, 3, 17, null, [
    '254519',
    '386b25',
    '4c9231',
    '5fba3d',
    '7ccb5e',
  ] ],
  [ 'easter', null, null, (year) => {
    let c = Math.floor(year / 100);
    let n = year - Math.floor(year / 19) * 19;
    let k = Math.floor((c - 17) / 25);
    let i = c - Math.floor(c / 4) - Math.floor((c - k) / 3) + n * 19 + 15;
    i -= Math.floor(i / 30) * 30;
    i -= Math.floor(i / 28) * (1 - Math.floor(i / 28) * Math.floor(29 / (i + 1)) * Math.floor((21 - n) / 11));
    let j = year + Math.floor(year / 4) + i + 2 - c + Math.floor(c / 4);
    j -= Math.floor(j / 7) * 7;
    let l = i - j;
    let month = Math.floor((l + 40) / 44) + 3;

    return [ month, l + 28 - (Math.floor(month / 4) * 31) ];
  }, [
    '5374a0',
    'a3c3e9',
    'f1f0f4',
    '9c6140',
    'dc9c4d',
    '789429',
  ] ],
  [ `mother's day`, null, null, (year) => {
    const month = 5;
    const day = (new Date(year, month - 1, 1)).getDay();
    return [ month, 8 + (7 - day) ];
  }, [
    'f14472',
    'f17db6',
    'fed40c',
    'b8c500',
    '85af4b',
  ] ],
  [ 'the fourth of july', 6, 4, null, usaColors ],
  [ `father's day`, null, null, (year) => {
    const month = 6;
    const day = (new Date(year, month - 1, 1)).getDay();
    return [ month, 15 + (7 - day) ];
  }, [
    'Caac3e',
    '4f4c47',
    '7ac3bc',
    'e6e7a3',
    'eb7140',
  ] ],
  [ 'halloween', 10, 31, null, [
    '512888',
    '7349ac',
    'eb6123',
    'da4200',
  ] ],
  [ 'veterans day', 11, 11, null, usaColors ],
  [ 'thanksgiving', null, null, (year) => {
    const month = 11;
    const day = (new Date(year, month - 1, 30)).getDay();
    return [ month, (day >= 4 ? 34 : 27) - day ];
  }, [
    '70362a',
    'a17c22',
    'debf7e',
    'd5673b',
    'be5634',
    'b5ad15',
  ] ],
  [ 'christmas', 12, 25, null, [
    '348228',
    '469a47',
    'daf7ff',
    'fffafa',
    'eb2029',
    'd70816',
  ] ],
].map((x) => ({ name : x[0], month : x[1], day : x[2], dateFunc : x[3], colors : x[4] }));
