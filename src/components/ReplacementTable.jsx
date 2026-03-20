import { useState, useRef } from 'react';
import { CATEGORY_COLORS } from './TextHighlighter';

/**
 * ReplacementTable — Interactieve omzettingstabel
 * 
 * Toont alle gevonden PII met voorgestelde vervangingen.
 * Features: rood kruisje (verwijderen), inline bewerken, nieuwe regel toevoegen.
 */

const CATEGORY_LABELS = {
  naam: 'Naam',
  email: 'E-mail',
  telefoon: 'Telefoon',
  postcode: 'Postcode',
  datum: 'Datum',
  iban: 'IBAN',
  bsn: 'BSN',
  url: 'URL',
  nummer: 'Nummer',
  plaats: 'Plaats',
};

export default function ReplacementTable({
  mappings,
  counts = {},
  totalReplacements = 0,
  onRemoveMapping,
  onUpdateMapping,
  onAddManualMapping,
}) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRowValue, setNewRowValue] = useState('');
  const newRowRef = useRef(null);
  const tableEndRef = useRef(null);

  function handleStartEdit(index, field) {
    setEditingCell({ index, field });
    setEditValue(mappings[index][field]);
  }

  function handleSaveEdit() {
    if (editingCell && editValue.trim()) {
      onUpdateMapping(editingCell.index, editingCell.field, editValue.trim());
    }
    setEditingCell(null);
    setEditValue('');
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  }

  function handleNewRowClick() {
    setShowNewRow(true);
    setTimeout(() => newRowRef.current?.focus(), 50);
  }

  function handleNewRowSubmit() {
    const val = newRowValue.trim();
    if (val) {
      onAddManualMapping(val);
      setNewRowValue('');
      setShowNewRow(false);
    }
  }

  function handleNewRowKeyDown(e) {
    if (e.key === 'Enter') {
      handleNewRowSubmit();
    } else if (e.key === 'Escape') {
      setShowNewRow(false);
      setNewRowValue('');
    }
  }

  if (!mappings || mappings.length === 0) {
    return (
      <div className="replacement-table replacement-table--empty">
        <div className="replacement-table__empty-message">
          Er zijn nog geen gegevens gevonden. Plak of sleep een tekst in het invoerveld.
        </div>
      </div>
    );
  }

  return (
    <div className="replacement-table">
      <div className="replacement-table__header">
        <div className="replacement-table__header-cell replacement-table__header-cell--original">Origineel</div>
        <div className="replacement-table__header-cell replacement-table__header-cell--category">Type</div>
        <div className="replacement-table__header-cell replacement-table__header-cell--count" title={`Totaal ${totalReplacements} woorden geselecteerd voor vervanging`}>
          Aantal <span className="replacement-table__total-badge">{totalReplacements}</span>
        </div>
        <div className="replacement-table__header-cell replacement-table__header-cell--replacement">Vervanging</div>
        <div className="replacement-table__header-cell replacement-table__header-cell--actions"></div>
      </div>

      <div className="replacement-table__body">
        {mappings.map((mapping, index) => {
          const colors = CATEGORY_COLORS[mapping.category] || { bg: 'rgba(156,163,175,0.25)', text: '#9ca3af' };
          const isHovered = hoveredRow === index;
          
          return (
            <div
              key={`${mapping.original}-${index}`}
              className={`replacement-table__row ${isHovered ? 'replacement-table__row--hovered' : ''}`}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Origineel */}
              <div className="replacement-table__cell replacement-table__cell--original">
                <span
                  className="replacement-table__badge"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {mapping.original}
                </span>
              </div>

              {/* Categorie */}
              <div className="replacement-table__cell replacement-table__cell--category">
                <span className="replacement-table__category-tag">
                  {CATEGORY_LABELS[mapping.category] || mapping.category}
                </span>
              </div>

              {/* Frequenties / Aantal */}
              <div className="replacement-table__cell replacement-table__cell--count" title={`${counts[mapping.original] || 0} keer gevonden in de tekst`}>
                <span className="replacement-table__count-badge">
                  {counts[mapping.original] || 0}
                </span>
              </div>

              {/* Vervanging (klikbaar om te bewerken) */}
              <div className="replacement-table__cell replacement-table__cell--replacement">
                {editingCell?.index === index && editingCell?.field === 'replacement' ? (
                  <input
                    className="replacement-table__edit-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                  />
                ) : (
                  <span
                    className="replacement-table__editable"
                    onClick={() => handleStartEdit(index, 'replacement')}
                    title="Klik om aan te passen"
                  >
                    {mapping.replacement}
                    <span className="replacement-table__edit-icon">✏️</span>
                  </span>
                )}
              </div>

              {/* Verwijder knop */}
              <div className="replacement-table__cell replacement-table__cell--actions">
                <button
                  className={`replacement-table__delete-btn ${isHovered ? 'replacement-table__delete-btn--visible' : ''}`}
                  onClick={() => onRemoveMapping(index)}
                  title="Verwijder deze regel"
                  aria-label="Verwijder regel"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        {/* Nieuwe regel toevoegen */}
        {showNewRow ? (
          <div className="replacement-table__row replacement-table__row--new">
            <div className="replacement-table__cell replacement-table__cell--new-input" style={{ gridColumn: 'span 4' }}>
              <input
                ref={newRowRef}
                className="replacement-table__new-input"
                value={newRowValue}
                onChange={(e) => setNewRowValue(e.target.value)}
                onKeyDown={handleNewRowKeyDown}
                onBlur={() => {
                  if (!newRowValue.trim()) {
                    setShowNewRow(false);
                  }
                }}
                placeholder="Typ de tekst die je wilt anonimiseren en druk op Enter…"
              />
            </div>
            <div className="replacement-table__cell replacement-table__cell--actions">
              <button
                className="replacement-table__confirm-btn"
                onClick={handleNewRowSubmit}
                title="Toevoegen"
              >
                ✓
              </button>
            </div>
          </div>
        ) : (
          <div
            className="replacement-table__add-row"
            onMouseEnter={() => setShowNewRow(false)}
            onClick={handleNewRowClick}
            ref={tableEndRef}
          >
            <span className="replacement-table__add-icon">+</span>
            <span className="replacement-table__add-text">Nieuwe regel toevoegen…</span>
          </div>
        )}
      </div>
    </div>
  );
}
