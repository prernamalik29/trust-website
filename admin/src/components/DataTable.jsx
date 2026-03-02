import { useState, useMemo } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './DataTable.css';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Enhanced DataTable with search, column-filter, pagination, and export toolbar.
 *
 * @param {Object}   props
 * @param {Array}    props.columns          - [{key, label, render?, filterable?}]
 * @param {Array}    props.data             - raw data array
 * @param {boolean}  props.loading
 * @param {Function} [props.onEdit]         - called with row — shows pencil button
 * @param {Function} [props.onDelete]       - called with row — shows trash button
 * @param {Array}    [props.extraActions]   - [{label, icon, className, onClick}] per-row extras
 * @param {Function} [props.onExportPDF]    - called with filteredRows
 * @param {Function} [props.onExportWord]   - called with filteredRows
 * @param {Array}    [props.filterFields]   - [{key, label, options:[{value,label}]}] for top dropdowns
 */
export default function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  extraActions = [],
  loading,
  onExportPDF,
  onExportWord,
  filterFields = [],
}) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---------- filter logic ----------
  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = [...data];

    // search across all string fields
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        columns.some((col) => {
          const v = row[col.key];
          return v && String(v).toLowerCase().includes(q);
        })
      );
    }

    // dropdown filters
    Object.entries(filters).forEach(([key, val]) => {
      if (val) {
        rows = rows.filter((row) => String(row[key] ?? '') === val);
      }
    });

    return rows;
  }, [data, search, filters, columns]);

  // ---------- pagination ----------
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleFilterChange(key, val) {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setPage(1);
  }

  function handleSearch(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  if (loading) {
    return (
      <div className="table-loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <i className="fas fa-inbox"></i>
        <p>No data found</p>
      </div>
    );
  }

  const hasActions = onEdit || onDelete || extraActions.length > 0;

  return (
    <div className="dt-container">
      {/* ---- Toolbar ---- */}
      <div className="dt-toolbar">
        <div className="dt-toolbar-left">
          <div className="dt-search-wrap">
            <i className="fas fa-search"></i>
            <input
              type="text"
              className="dt-search"
              placeholder="Search all fields..."
              value={search}
              onChange={handleSearch}
            />
            {search && (
              <button className="dt-search-clear" onClick={() => { setSearch(''); setPage(1); }} title="Clear">
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          {filterFields.map((ff) => (
            <select
              key={ff.key}
              className="dt-filter-select"
              value={filters[ff.key] || ''}
              onChange={(e) => handleFilterChange(ff.key, e.target.value)}
            >
              <option value="">{ff.label}: All</option>
              {ff.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
        </div>

        <div className="dt-toolbar-right">
          <span className="dt-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          {onExportPDF && (
            <button className="btn btn-export btn-pdf" onClick={() => onExportPDF(filtered)} title="Export PDF">
              <i className="fas fa-file-pdf"></i> PDF
            </button>
          )}
          {onExportWord && (
            <button className="btn btn-export btn-word" onClick={() => onExportWord(filtered)} title="Export Word">
              <i className="fas fa-file-word"></i> Word
            </button>
          )}
        </div>
      </div>

      {/* ---- Table ---- */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {hasActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="dt-no-results">
                  <i className="fas fa-search-minus"></i> No records match your search
                </td>
              </tr>
            ) : (
              pageData.map((item) => (
                <tr key={item.id}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(item) : (item[col.key] ?? '—')}
                    </td>
                  ))}
                  {hasActions && (
                    <td>
                      <div className="table-actions">
                        {onEdit && (
                          <button className="action-btn edit-btn" onClick={() => onEdit(item)} title="Edit / View">
                            <i className="fas fa-eye"></i>
                          </button>
                        )}
                        {extraActions.map((act, i) => (
                          <button
                            key={i}
                            className={`action-btn ${act.className || ''}`}
                            onClick={() => act.onClick(item)}
                            title={act.label}
                          >
                            <i className={act.icon}></i>
                          </button>
                        ))}
                        {onDelete && (
                          <button className="action-btn delete-btn" onClick={() => onDelete(item)} title="Delete">
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Pagination ---- */}
      <div className="dt-pagination">
        <div className="dt-page-size">
          <label>Rows per page:</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="dt-page-nav">
          <button className="dt-page-btn" onClick={() => setPage(1)} disabled={safePage === 1} title="First">
            <i className="fas fa-angle-double-left"></i>
          </button>
          <button className="dt-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} title="Previous">
            <i className="fas fa-angle-left"></i>
          </button>
          <span className="dt-page-info">Page {safePage} of {totalPages}</span>
          <button className="dt-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} title="Next">
            <i className="fas fa-angle-right"></i>
          </button>
          <button className="dt-page-btn" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} title="Last">
            <i className="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
