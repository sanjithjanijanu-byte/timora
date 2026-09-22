import { useState } from 'react';

export default function DataTable({ columns, data, onEdit, onDelete, emptyMessage = 'No data available' }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortCol === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(key);
      setSortDir('asc');
    }
  };

  let filtered = data;
  if (search) {
    const q = search.toLowerCase();
    filtered = data.filter((row) =>
      columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(q))
    );
  }

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? '';
      const vb = b[sortCol] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-sm border border-border rounded bg-white focus:outline-none focus:border-steel transition-colors"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ice">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide cursor-pointer select-none hover:bg-blue-50 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortCol === col.key && (
                      <span className="text-steel">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-4 py-8 text-center text-mid text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.id || i}
                  className={`border-t border-border ${i % 2 === 1 ? 'bg-ghost' : 'bg-white'} hover:bg-ice transition-colors`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-navy">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="text-xs px-2 py-1 rounded bg-steel text-white hover:bg-steel-dark transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Delete
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
      <p className="text-xs text-mid mt-2">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
}
