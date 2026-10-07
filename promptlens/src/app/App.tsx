import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { FR } from '../copy/fr';
import { todayIsoDate } from '../domain/asset';
import { CataloguePanel } from '../features/catalogue/CataloguePanel';
import { InventoryPanel } from '../features/inventory/InventoryPanel';
import { useAssets } from '../features/inventory/useAssets';

type View = 'catalogue' | 'inventory';

const VIEWS: readonly View[] = ['catalogue', 'inventory'];

export function App() {
  const [view, setView] = useState<View>('catalogue');
  const [prefillModelId, setPrefillModelId] = useState<string | null>(null);
  const inventory = useAssets();
  const tabRefs = useRef<Record<View, HTMLButtonElement | null>>({ catalogue: null, inventory: null });

  function selectView(next: View) {
    // A plain tab switch never carries over a catalogue prefill.
    setPrefillModelId(null);
    setView(next);
  }

  function addFromCatalogue(modelId: string) {
    setPrefillModelId(modelId);
    setView('inventory');
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = VIEWS.indexOf(view);
    let next: View | undefined;
    if (event.key === 'ArrowRight') next = VIEWS[(index + 1) % VIEWS.length];
    if (event.key === 'ArrowLeft') next = VIEWS[(index - 1 + VIEWS.length) % VIEWS.length];
    if (!next) return;
    event.preventDefault();
    selectView(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">
            <span className="app__prompt" aria-hidden="true">
              &gt;_
            </span>{' '}
            {FR.appName}
          </h1>
          <p className="app__tagline">{FR.appTagline}</p>
        </div>
        <time className="app__date" dateTime={todayIsoDate()}>
          {FR.formatLongDate(new Date())}
        </time>
      </header>

      <main>
        <div role="tablist" aria-label={FR.tabs.ariaLabel} className="tabs">
          {VIEWS.map((value) => (
            <button
              key={value}
              ref={(element) => {
                tabRefs.current[value] = element;
              }}
              type="button"
              role="tab"
              id={`tab-${value}`}
              aria-selected={view === value}
              aria-controls={`panel-${value}`}
              tabIndex={view === value ? 0 : -1}
              className="tab"
              onClick={() => selectView(value)}
              onKeyDown={handleTabKeyDown}
            >
              {FR.tabs[value]}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`}>
          {view === 'catalogue' ? (
            <CataloguePanel onAddToInventory={addFromCatalogue} />
          ) : (
            <InventoryPanel
              inventory={inventory}
              prefillModelId={prefillModelId}
              onOpenCatalogue={() => selectView('catalogue')}
            />
          )}
        </div>
      </main>

      <footer className="app__footer">{FR.footer}</footer>
    </div>
  );
}
