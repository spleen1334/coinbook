export function CoinScatter({ tick }) {
  const coins = [
    { key: 'cluster' },
    { key: 'a', cls: 'cb-coin-a', delay: 0.05 },
    { key: 'b', cls: 'cb-coin-b', delay: 0.12 },
    { key: 'c', cls: 'cb-coin-c', delay: 0.18 },
    { key: 'd', cls: 'cb-coin-d', delay: 0.24 }
  ];
  return (
    <>
      <div
        key={'cluster' + tick}
        className="cb-coin-cluster"
        style={{ animation: 'cbCoinBurst 0.6s cubic-bezier(.3,.6,.3,1)' }}
      >
        <div className="cb-coin cb-coin-1" />
        <div className="cb-coin cb-coin-2" />
        <div className="cb-coin cb-coin-3">
          <span className="cb-coin-letter">C</span>
        </div>
      </div>
      {coins.slice(1).map((c) => (
        <div
          key={c.key + tick}
          className={'cb-coin-scatter ' + c.cls}
          style={{ animation: `cbCoinBurst 0.6s cubic-bezier(.3,.6,.3,1) ${c.delay}s both` }}
        >
          <div className={'cb-coin cb-coin-solo-' + c.key} />
        </div>
      ))}
    </>
  );
}
