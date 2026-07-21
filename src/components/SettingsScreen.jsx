import { CurrencyBadge } from './CurrencyBadge.jsx';

export function SettingsScreen({
  t,
  languageOptions,
  currencyOptions,
  numberFormat,
  thousandsToggle,
  thousandsCharOptions,
  decimalsOptions,
  decimalCharOptions,
  numberFormatPreview,
  rateOptions = [],
  canInstallApp,
  onInstallApp,
  onExportJson,
  onExportCsv,
  onImportJsonFile,
  onImportCsvFile,
  onDone,
  onOpenDeleteAll
}) {
  return (
    <div className="cb-settings-anim">
      <div className="cb-settings-title">{t.settingsTitle}</div>

      <div className="cb-section-label">{t.language}</div>
      <div className="cb-choice-row" style={{ marginBottom: 18 }}>
        {languageOptions.map((lo) => (
          <div
            key={lo.id}
            className="cb-choice hover-lift"
            onClick={lo.select}
            style={{ background: lo.bg, color: lo.fg }}
          >
            {lo.label}
          </div>
        ))}
      </div>

      <div className="cb-section-label">{t.currency}</div>
      <div className="cb-choice-row" style={{ marginBottom: 22 }}>
        {currencyOptions.map((co) => (
          <div
            key={co.id}
            className="cb-choice cb-choice-currency hover-lift"
            onClick={co.select}
            style={{ background: co.bg, color: co.fg }}
          >
            <CurrencyBadge currency={co.id} size="lg" />
          </div>
        ))}
      </div>

      <div className="cb-section-label">{t.numberFormat}</div>
      <div className="cb-panel" style={{ marginBottom: 18 }}>
        <div className="cb-panel-row">
          <div className="cb-panel-label">{t.thousandsSep}</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {thousandsToggle.map((opt) => (
              <div
                key={String(opt.id)}
                className="cb-toggle hover-lift press-96"
                onClick={opt.select}
                style={{ background: opt.bg, color: opt.fg }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
        {numberFormat.thousands && (
          <div className="cb-panel-row">
            <div className="cb-panel-label">{t.thousandsChar}</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {thousandsCharOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="cb-toggle hover-lift press-96"
                  onClick={opt.select}
                  style={{ background: opt.bg, color: opt.fg }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="cb-panel-row">
          <div className="cb-panel-label">{t.decimalPlaces}</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {decimalsOptions.map((opt) => (
              <div
                key={opt.id}
                className="cb-toggle hover-lift press-96"
                onClick={opt.select}
                style={{ background: opt.bg, color: opt.fg }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
        {numberFormat.decimals > 0 && (
          <div className="cb-panel-row">
            <div className="cb-panel-label">{t.decimalChar}</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {decimalCharOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="cb-toggle hover-lift press-96"
                  onClick={opt.select}
                  style={{ background: opt.bg, color: opt.fg }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ fontSize: 11, color: '#8a7355', textAlign: 'right' }}>
          {t.preview}: {numberFormatPreview}
        </div>
      </div>

      <div className="cb-section-label">{t.conversionRate}</div>
      <div className="cb-panel" style={{ marginBottom: 22 }}>
        {rateOptions.map((rate) => (
          <div className="cb-rate-row" key={rate.code}>
            <label className="cb-rate-label" htmlFor={`cb-rate-${rate.code}`}>
              1 {rate.code} =
            </label>
            <div className="cb-rate-input-wrap">
              <input
                id={`cb-rate-${rate.code}`}
                type="text"
                inputMode="decimal"
                step="0.0001"
                min="0"
                value={rate.value ?? ''}
                onChange={rate.onChange}
                onBlur={rate.onBlur}
                className="cb-input"
                aria-label={`RSD per ${rate.code}`}
              />
              <span className="cb-rate-unit">RSD</span>
            </div>
          </div>
        ))}
      </div>

      {canInstallApp && (
        <>
          <div className="cb-section-label">{t.app}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
            <div className="cb-btn-solid hover-lift press-96" onClick={onInstallApp}>
              {t.installApp}
            </div>
          </div>
        </>
      )}

      <section className="cb-data-section" aria-labelledby="cb-data-heading">
        <div id="cb-data-heading" className="cb-section-label">
          {t.data}
        </div>
        <div className="cb-transfer-grid">
          <div className="cb-transfer-card">
            <div className="cb-transfer-heading">JSON</div>
            <div className="cb-transfer-actions">
              <div className="cb-btn-outline hover-lift" onClick={onExportJson}>
                {t.exportJson}
              </div>
              <label className="cb-btn-outline cb-btn-dashed hover-lift">
                {t.importJson}
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={onImportJsonFile}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
          <div className="cb-transfer-card">
            <div className="cb-transfer-heading">CSV</div>
            <div className="cb-transfer-actions">
              <div className="cb-btn-outline hover-lift" onClick={onExportCsv}>
                {t.exportCsv}
              </div>
              <label className="cb-btn-outline cb-btn-dashed hover-lift">
                {t.importCsv}
                <input type="file" accept="text/csv,.csv" onChange={onImportCsvFile} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="cb-btn-solid hover-lift press-96" onClick={onDone} style={{ marginBottom: 12 }}>
        {t.done}
      </div>

      <div className="cb-danger-zone">
        <div className="cb-danger-label">{t.dangerZone}</div>
        <div className="cb-btn-danger hover-danger" onClick={onOpenDeleteAll}>
          {t.deleteAll}
        </div>
      </div>
    </div>
  );
}
