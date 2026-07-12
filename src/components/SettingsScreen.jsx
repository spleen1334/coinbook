export function SettingsScreen({ app, s, v, t }) {
  return (
    <div className="cb-settings-anim">
      <div className="cb-settings-title">{t.settingsTitle}</div>

      <div className="cb-section-label">{t.language}</div>
      <div className="cb-choice-row" style={{ marginBottom: 18 }}>
        {v.languageOptions.map((lo) => (
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
        {v.currencyOptions.map((co) => (
          <div
            key={co.id}
            className="cb-choice hover-lift"
            onClick={co.select}
            style={{ background: co.bg, color: co.fg }}
          >
            {co.label}
          </div>
        ))}
      </div>

      <div className="cb-section-label">{t.numberFormat}</div>
      <div className="cb-panel" style={{ marginBottom: 18 }}>
        <div className="cb-panel-row">
          <div className="cb-panel-label">{t.thousandsSep}</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {v.thousandsToggle.map((opt) => (
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
        {v.numberFormat.thousands && (
          <div className="cb-panel-row">
            <div className="cb-panel-label">{t.thousandsChar}</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {v.thousandsCharOptions.map((opt) => (
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
            {v.decimalsOptions.map((opt) => (
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
        {v.numberFormat.decimals > 0 && (
          <div className="cb-panel-row">
            <div className="cb-panel-label">{t.decimalChar}</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {v.decimalCharOptions.map((opt) => (
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
          {t.preview}: {v.numberFormatPreview}
        </div>
      </div>

      <div className="cb-section-label">{t.conversionRate}</div>
      <div className="cb-panel" style={{ marginBottom: 22 }}>
        <div className="cb-rate-row">
          <div className="cb-rate-label">{t.perUsd} EUR</div>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={s.rates.EUR}
            onChange={(e) => app.setRate('EUR', e)}
            className="cb-input"
          />
        </div>
        <div className="cb-rate-row">
          <div className="cb-rate-label">{t.perUsd} RSD</div>
          <input
            type="number"
            step="0.01"
            min="0"
            value={s.rates.RSD}
            onChange={(e) => app.setRate('RSD', e)}
            className="cb-input"
          />
        </div>
      </div>

      <div className="cb-section-label">{t.data}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
        {s.canInstallApp && (
          <div className="cb-btn-solid hover-lift press-96" onClick={app.installApp}>
            {t.installApp}
          </div>
        )}
        <div className="cb-btn-outline hover-lift" onClick={app.exportJson}>
          {t.exportJson}
        </div>
        <div className="cb-btn-outline hover-lift" onClick={app.exportCsv}>
          {t.exportCsv}
        </div>
        <label className="cb-btn-outline cb-btn-dashed hover-lift">
          {t.importJson}
          <input
            type="file"
            accept="application/json,.json"
            onChange={app.onImportJsonFile}
            style={{ display: 'none' }}
          />
        </label>
        <label className="cb-btn-outline cb-btn-dashed hover-lift">
          {t.importCsv}
          <input type="file" accept="text/csv,.csv" onChange={app.onImportCsvFile} style={{ display: 'none' }} />
        </label>
      </div>

      <div className="cb-btn-solid hover-lift press-96" onClick={app.goHome} style={{ marginBottom: 12 }}>
        {t.done}
      </div>

      <div className="cb-danger-zone">
        <div className="cb-danger-label">{t.dangerZone}</div>
        <div className="cb-btn-danger hover-danger" onClick={app.openDeleteAll}>
          {t.deleteAll}
        </div>
      </div>
    </div>
  );
}
