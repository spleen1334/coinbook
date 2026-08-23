const BANDS = [
  { id: 'white', max: 40000 },
  { id: 'blue', max: 80000 },
  { id: 'green', max: 100000 },
  { id: 'yellow', max: 125000 },
  { id: 'dark-red', max: 150000 },
  { id: 'bright-red', max: 200000 },
  { id: 'burgundy', max: Infinity }
];

// Stored expense amounts are RSD, so display currency and rates cannot alter this band.
export function getAmountBand(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 'white';
  return BANDS.find((band) => value <= band.max).id;
}

export function amountBandClass(amount) {
  return `cb-amount-band-${getAmountBand(amount)}`;
}
